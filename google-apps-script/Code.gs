/**
 * Bullshido GTD roster backend.
 *
 * Paste this file into the Apps Script editor of the Google Sheet you
 * want to use as the roster (Extensions > Apps Script), save, then
 * deploy it as a Web App (Deploy > New deployment > Web app).
 * See ../README.md for the full step-by-step.
 *
 * Sheet layout (created automatically on first submission if missing):
 *   Column A: Handle
 *   Column B: Address
 *   Column C: Timestamp (ISO string)
 */

var HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
var ADDR_RE = /^0x[a-fA-F0-9]{40}$/;
var MAX_SPOTS = 500; // TODO: keep this in sync with CONFIG.maxSpots in js/main.js

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Handle", "Address", "Timestamp"]);
  }
  return sheet;
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function currentCount_(sheet) {
  var last = sheet.getLastRow();
  return last > 1 ? last - 1 : 0; // minus header row
}

function doGet(e) {
  var sheet = getSheet_();
  if (e && e.parameter && e.parameter.action === "count") {
    return jsonOut_({ ok: true, count: currentCount_(sheet) });
  }
  return jsonOut_({ ok: true, message: "Bullshido roster API is running." });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      return jsonOut_({ ok: false, error: "invalid_json" });
    }

    var handle = (body.handle || "").toString().trim().replace(/^@/, "");
    var address = (body.address || "").toString().trim();

    if (!HANDLE_RE.test(handle) || !ADDR_RE.test(address)) {
      return jsonOut_({ ok: false, error: "invalid" });
    }

    var count = currentCount_(sheet);
    if (count >= MAX_SPOTS) {
      return jsonOut_({ ok: false, error: "full", count: count });
    }

    // Duplicate check (case-insensitive) against existing rows.
    var data = sheet.getDataRange().getValues(); // includes header row
    var handleLower = handle.toLowerCase();
    var addrLower = address.toLowerCase();
    for (var i = 1; i < data.length; i++) {
      var existingHandle = (data[i][0] || "").toString().toLowerCase();
      var existingAddr = (data[i][1] || "").toString().toLowerCase();
      if (existingHandle === handleLower || existingAddr === addrLower) {
        return jsonOut_({ ok: false, error: "duplicate", count: count });
      }
    }

    sheet.appendRow([handle, address, new Date().toISOString()]);
    return jsonOut_({ ok: true, count: count + 1 });
  } finally {
    lock.releaseLock();
  }
}

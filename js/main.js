"use strict";

/* ---------------------------------------------------------------------
 * CONFIG -- fill these in, then redeploy (git push / vercel deploy).
 *
 * GOOGLE_SCRIPT_URL : the "Web app" URL you get after deploying
 *                      google-apps-script/Code.gs to your Google Sheet.
 *                      See README.md, step 2.
 * xProfileUrl        : your X profile, e.g. "https://x.com/YourHandle"
 * xPostUrl           : the enrollment post visitors must like/repost/comment on
 * maxSpots           : total GTD / free-mint spots
 * deadlineText       : shown under the progress bar, e.g. "Sept 1, 23:59 UTC"
 * ------------------------------------------------------------------- */
var CONFIG = {
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx0uFgokWzPYKibueXEMf6aID7kbEwg_VuT-B82c7BAFwPo5k81p4cZhlP8Iq7oZ27NFg/exec",
  xProfileUrl: "https://x.com/Bullshidooje",
  xPostUrl: "https://x.com/Bullshidooje/status/2093099196672852264",
  maxSpots: 600,
  deadlineText: "24 hours after the post goes live"
};

document.getElementById("btn-follow").href = CONFIG.xProfileUrl;
document.getElementById("btn-like").href = CONFIG.xPostUrl;
document.getElementById("btn-repost").href = CONFIG.xPostUrl;
document.getElementById("btn-comment").href = CONFIG.xPostUrl;
document.getElementById("status-note").textContent = "Enrollment closes: " + CONFIG.deadlineText;

var HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;
var ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

var form = document.getElementById("entry-form");
var submitBtn = document.getElementById("submit-btn");
var statusCount = document.getElementById("status-count");
var obiFill = document.getElementById("obi-fill");

function backendConfigured() {
  return !!CONFIG.GOOGLE_SCRIPT_URL;
}

function renderCount(count) {
  var max = CONFIG.maxSpots;
  statusCount.textContent = count + " / " + max;
  var pct = max > 0 ? Math.min(100, Math.round((count / max) * 100)) : 0;
  obiFill.style.width = pct + "%";
  var full = count >= max;
  submitBtn.disabled = full;
  if (full) submitBtn.textContent = "Roster Full";
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showMsg(kind, text) {
  var el = document.getElementById("form-msg");
  el.className = "form-msg show " + kind;
  el.textContent = text;
}
function clearMsg() {
  var el = document.getElementById("form-msg");
  el.className = "form-msg";
  el.textContent = "";
}

/* ---------------------------------------------------------------------
 * Talk to the Google Apps Script backend. We POST as text/plain (not
 * application/json) on purpose: that keeps it a CORS "simple request"
 * with no preflight OPTIONS call, which Apps Script Web Apps don't
 * handle. The body itself is still JSON text; Code.gs parses it with
 * JSON.parse(e.postData.contents).
 * ------------------------------------------------------------------- */
function callBackend(payload) {
  return fetch(CONFIG.GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).then(function (res) {
    return res.json();
  });
}

function fetchCount() {
  if (!backendConfigured()) {
    statusCount.textContent = "— / " + CONFIG.maxSpots;
    return;
  }
  fetch(CONFIG.GOOGLE_SCRIPT_URL + "?action=count")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && typeof data.count === "number") renderCount(data.count);
    })
    .catch(function () {
      /* leave the placeholder count showing; don't block the page on this */
    });
}

fetchCount();

form.addEventListener("submit", function (ev) {
  ev.preventDefault();
  clearMsg();
  document.getElementById("err-handle").textContent = "";
  document.getElementById("err-address").textContent = "";

  var handleRaw = document.getElementById("handle").value.trim().replace(/^@/, "");
  var address = document.getElementById("address").value.trim();
  var checks = ["c1", "c2", "c3", "c4"].map(function (n) {
    return document.querySelector('input[name="' + n + '"]').checked;
  });

  var ok = true;
  if (!HANDLE_RE.test(handleRaw)) {
    document.getElementById("err-handle").textContent = "Enter a valid X handle (letters, numbers, underscore).";
    ok = false;
  }
  if (!ADDR_RE.test(address)) {
    document.getElementById("err-address").textContent = "Enter a valid EVM address (0x + 40 hex characters).";
    ok = false;
  }
  if (!ok) return;

  if (checks.indexOf(false) !== -1) {
    showMsg("error", "Confirm all four steps before claiming a seat.");
    return;
  }

  if (!backendConfigured()) {
    showMsg("error", "The roster isn't connected yet — the site owner still needs to set GOOGLE_SCRIPT_URL in js/main.js.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Claiming...";

  callBackend({ handle: handleRaw, address: address, ts: Date.now() })
    .then(function (data) {
      if (data && data.ok) {
        showSuccess(handleRaw, address);
        renderCount(data.count);
      } else if (data && data.error === "duplicate") {
        showMsg("info", "This handle or wallet already holds a seat on the roster.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Claim Your Seat";
      } else if (data && data.error === "full") {
        showMsg("error", "The roster is full.");
        submitBtn.disabled = true;
        submitBtn.textContent = "Roster Full";
      } else {
        showMsg("error", "Couldn't save your seat right now. Please try again.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Claim Your Seat";
      }
    })
    .catch(function () {
      showMsg("error", "Couldn't reach the roster right now. Check your connection and try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Claim Your Seat";
    });
});

function showSuccess(handle, address) {
  form.style.display = "none";
  var view = document.getElementById("success-view");
  view.style.display = "block";
  view.innerHTML =
    '<div class="success-card">' +
      '<div class="success-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg></div>' +
      "<h3>Seat claimed</h3>" +
      "<p>Your entry is on the roster. It will be checked against the enrollment post before the gates open.</p>" +
      '<div class="receipt">' + esc(handle) + " &middot; " + esc(address) + "</div>" +
    "</div>";
}

# Bullshido Dojo — GTD roster site

Pravi, samostalni sajt (čist HTML/CSS/JS, bez build koraka) — otvoriš ga u
VS Code-u, hostuješ na Vercel-u, i povežeš na svoju domenu. Prijave (X handle
+ EVM adresa) se snimaju u tvoj Google Sheet preko besplatnog Apps Script
backenda.

```
bullshido-site/
├── index.html                    stranica
├── css/style.css                 dizajn
├── js/main.js                    logika forme + poziv ka backendu (CONFIG ovdje)
├── img/hero.jpg                  hero slika (Ultra Legendary bik)
├── google-apps-script/Code.gs    backend koji ide u Google Sheet
└── README.md                     ovo uputstvo
```

## 1. Otvori projekat u VS Code-u

Skini/prebaci ovaj folder na svoj računar i otvori ga u VS Code-u. Sve je
običan HTML/CSS/JS — možeš odmah otvoriti `index.html` preko "Live Server"
ekstenzije da vidiš izgled lokalno (forma neće raditi dok ne povežeš Google
Sheet iz koraka 2).

## 2. Poveži formu sa Google Sheet-om (skladište prijava)

1. Napravi novi Google Sheet (sheets.new).
2. `Extensions` → `Apps Script`.
3. Obriši sadržaj koji stoji tamo i zalijepi cijeli sadržaj fajla
   `google-apps-script/Code.gs` iz ovog projekta.
4. `Save` (disketa ikona), pa `Deploy` → `New deployment`.
5. Klikni na zupčanik pored "Select type" → `Web app`.
6. Podesi:
   - **Execute as:** Me
   - **Who has access:** Anyone
7. `Deploy`. Google će tražiti da autorizuješ skriptu (to je tvoj vlastiti
   sheet, dozvoli).
8. Kopiraj URL koji dobiješ (izgleda kao
   `https://script.google.com/macros/s/AKfycb.../exec`).
9. Otvori `js/main.js` u ovom projektu i zalijepi taj URL u:
   ```js
   GOOGLE_SCRIPT_URL: "OVDJE_TVOJ_URL",
   ```
10. Sačuvaj. Svaka prijava sad ide direktno u red u tom Google Sheet-u
    (kolone: Handle, Address, Timestamp) — otvoriš sheet kad god hoćeš da
    vidiš listu ili je izvezeš u CSV (`File` → `Download` → `.csv`).

**Napomena:** ovo je novi backend koji nisam mogao uživo testirati odavde
(nemam pristup tvom Google nalogu) — kod prati standardni, provjereni
obrazac za "forma → Google Sheet preko Apps Script-a", ali svakako pošalji
jednu probnu prijavu čim ga povežeš, prije nego pustiš link javno.

## 3. Postavi na Vercel

Najlakše preko GitHub-a:

1. Napravi novi (privatni ili javni) GitHub repo i ubaci ceo ovaj folder u
   njega (`git init`, `git add .`, `git commit`, `git push`).
2. Idi na vercel.com, uloguj se (može preko GitHub naloga), `Add New` →
   `Project`, izaberi taj repo.
3. Vercel prepoznaje da je čist statički sajt — ne treba nikakva build
   komanda, samo `Deploy`.
4. Za par sekundi dobijaš pravi radni link (`neki-naziv.vercel.app`).

Ili, bez GitHub-a: instaliraj Vercel CLI (`npm i -g vercel`), pa u folderu
projekta pokreneš `vercel` i pratiš uputstva u terminalu.

## 4. Kupi jeftinu domenu i poveži je

Registrari sa poštenim (at-cost) cijenama, bez skrivenih troškova pri
obnovi: **Porkbun**, **Cloudflare Registrar**, ili **Namecheap**. `.xyz` ili
`.wtf` domene su često par dolara godišnje — sasvim dovoljno da sajt
izgleda ozbiljno.

1. Kupi domenu (npr. `bullshido.xyz`) na registraru po izboru.
2. U Vercel projektu: `Settings` → `Domains` → upiši svoju domenu → `Add`.
3. Vercel ti pokaže tačno koje DNS zapise (obično jedan `A` zapis za
   root domenu i jedan `CNAME` za `www`) treba da dodaš.
4. Odeš na svoj registrar, u DNS podešavanja te domene, i dodaš te iste
   zapise.
5. Za par minuta do par sati (DNS propagacija) domena vodi na sajt.

## 5. Kad dobiješ pravi X post link, broj mjesta i rok

Otvori `js/main.js`, ažuriraj `CONFIG`:

```js
var CONFIG = {
  GOOGLE_SCRIPT_URL: "...",
  xProfileUrl: "https://x.com/TvojHandle",
  xPostUrl: "https://x.com/TvojHandle/status/...",
  maxSpots: 500,
  deadlineText: "1. septembar, 23:59 UTC"
};
```

Ako mijenjaš `maxSpots`, ažuriraj i `MAX_SPOTS` na vrhu
`google-apps-script/Code.gs` (u Apps Script editoru, pa opet `Deploy` →
`Manage deployments` → uredi postojeći deployment) da se brojevi poklapaju.

Zatim samo `git push` (ili ponovo pokreni `vercel`) — Vercel automatski
ponovo objavi sajt.

## Napomena o verifikaciji

Forma provjerava format X handle-a i EVM adrese, i da su sva 4 checkboxa
("pratim", "lajkovao sam", "repostovao sam", "komentarisao sam") čekirana
— ali stvarnu istinitost tih tvrdnji i dalje provjeravaš ti ručno, upoređujući
listu iz Google Sheet-a sa stvarnim lajkovima/repostovima/komentarima na X
postu, prije nego finalno potvrdiš GTD listu.

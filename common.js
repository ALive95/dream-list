// Shared helpers for the Dream list (index.html) and Behind the Scenes (bts.html).

const SCRYFALL = "https://api.scryfall.com";

// Languages as Scryfall codes them, with Cardmarket's language ids for the link filters.
const LANGUAGES = [
  { code: "en",  label: "English",             cm: 1 },
  { code: "it",  label: "Italian",             cm: 5 },
  { code: "fr",  label: "French",              cm: 2 },
  { code: "de",  label: "German",              cm: 3 },
  { code: "es",  label: "Spanish",             cm: 4 },
  { code: "pt",  label: "Portuguese",          cm: 8 },
  { code: "ja",  label: "Japanese",            cm: 7 },
  { code: "ko",  label: "Korean",              cm: 10 },
  { code: "ru",  label: "Russian",             cm: 9 },
  { code: "zhs", label: "Chinese (Simplified)",  cm: 6 },
  { code: "zht", label: "Chinese (Traditional)", cm: 11 },
  { code: "ph",  label: "Phyrexian",           cm: null },
];

// Cardmarket condition scale (minCondition id used in links).
const CONDITIONS = [
  { code: "MT", label: "Mint",          cm: 1 },
  { code: "NM", label: "Near Mint",     cm: 2 },
  { code: "EX", label: "Excellent",     cm: 3 },
  { code: "GD", label: "Good",          cm: 4 },
  { code: "LP", label: "Light Played",  cm: 5 },
  { code: "PL", label: "Played",        cm: 6 },
  { code: "PO", label: "Poor",          cm: 7 },
  { code: "ANY", label: "Any condition", cm: null },
];

const FINISHES = { nonfoil: "Non-foil", foil: "Foil", etched: "Etched foil" };

const langInfo = (code) => LANGUAGES.find((l) => l.code === code) || { code, label: code.toUpperCase(), cm: null };
const condInfo = (code) => CONDITIONS.find((c) => c.code === code) || CONDITIONS[CONDITIONS.length - 1];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Scryfall asks for ~10 requests/second at most: keep a small gap between calls.
let lastScryfallCall = 0;
async function scryfall(path, options = {}) {
  const wait = lastScryfallCall + 110 - Date.now();
  if (wait > 0) await sleep(wait);
  lastScryfallCall = Date.now();
  const res = await fetch(path.startsWith("http") ? path : SCRYFALL + path, {
    ...options,
    headers: { Accept: "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.details) || `Scryfall error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Fetch many cards by Scryfall id (75 per request, as the API allows).
async function fetchCollection(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 75) {
    const chunk = ids.slice(i, i + 75);
    const data = await scryfall("/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: chunk.map((id) => ({ id })) }),
    });
    for (const c of data.data) out.set(c.id, c);
  }
  return out;
}

// Image URLs for a card; double-faced cards return both faces.
function cardImages(card, size = "normal") {
  if (!card) return [];
  if (card.image_uris) return [card.image_uris[size]];
  if (card.card_faces) return card.card_faces.filter((f) => f.image_uris).map((f) => f.image_uris[size]);
  return [];
}

// Cardmarket: a plain link to the exact printing via its Cardmarket product id.
// No extra query parameters: Cardmarket's firewall blocked links with added filters.
// A link pasted in Behind the Scenes (entry.cardmarket_url) always wins.
function cardmarketUrl(entry, card) {
  if (entry.cardmarket_url) return entry.cardmarket_url;
  const id = (card && card.cardmarket_id) || entry.cardmarket_id;
  if (id) return `https://www.cardmarket.com/en/Magic/Products?idProduct=${id}`;
  if (card && card.purchase_uris && card.purchase_uris.cardmarket) return card.purchase_uris.cardmarket;
  return `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(entry.name)}`;
}

// CardTrader: /cards/<card-name>-<set-name> redirects to that exact printing
// (e.g. /cards/lightning-bolt-magic-2010). CardTrader names promo series without the year
// ("Judge Gift Cards", not "Judge Gift Cards 2014"), so the year is dropped for promo sets.
// A link pasted in Behind the Scenes always wins.
const ctSlug = (s) =>
  String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function cardtraderUrl(entry, card) {
  if (entry.cardtrader_url) return entry.cardtrader_url;
  const name = (card && card.name) || entry.name;
  let set = (card && card.set_name) || entry.set_name;
  const setType = (card && card.set_type) || entry.set_type;
  if (set && setType === "promo") set = set.replace(/\s+\d{4}$/, "");
  if (!set) return `https://www.cardtrader.com/search?q=${encodeURIComponent(name)}`;
  return `https://www.cardtrader.com/cards/${ctSlug(name)}-${ctSlug(set)}`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

/**
 * Dream List — bookings service (Google Apps Script)
 *
 * Paste this into Extensions → Apps Script of an EMPTY Google Sheet, then
 * Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Copy the web app URL into BOOKINGS_URL in common.js.
 *
 * The sheet only ever contains: card id | private cancel code | time.
 * Card ids are random codes, so a glance at the sheet does not reveal which cards are booked.
 */

function sheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function rows_() {
  const sh = sheet_();
  const n = sh.getLastRow();
  return n ? sh.getRange(1, 1, n, 3).getValues() : [];
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// GET: the list of booked card ids (never the codes)
function doGet() {
  return json_({ booked: rows_().map((r) => String(r[0])).filter(Boolean) });
}

// POST {action: "book", uid} → {ok, code}   |   POST {action: "cancel", uid, code} → {ok}
function doPost(e) {
  let req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: "bad request" });
  }
  const uid = String(req.uid || "");
  if (!/^[\w-]{1,64}$/.test(uid)) return json_({ ok: false, error: "bad card id" });

  const lock = LockService.getScriptLock();   // two people clicking at the same moment
  lock.waitLock(10000);
  try {
    const rows = rows_();
    const i = rows.findIndex((r) => String(r[0]) === uid);

    if (req.action === "book") {
      if (i >= 0) return json_({ ok: false, error: "already booked" });
      if (rows.length >= 1000) return json_({ ok: false, error: "full" });
      const code = Utilities.getUuid();
      sheet_().appendRow([uid, code, new Date()]);
      return json_({ ok: true, code: code });
    }

    if (req.action === "cancel") {
      if (i < 0) return json_({ ok: true });
      if (String(rows[i][1]) !== String(req.code || "")) return json_({ ok: false, error: "wrong code" });
      sheet_().deleteRow(i + 1);
      return json_({ ok: true });
    }

    return json_({ ok: false, error: "unknown action" });
  } finally {
    lock.releaseLock();
  }
}

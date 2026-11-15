/**
 * Bostin Jig: website enquiry form handler.
 *
 * Setup:
 * 1. Create a Google Sheet called "Bostin Jig Enquiries".
 * 2. Extensions > Apps Script, paste this file in, and save.
 * 3. Deploy > New deployment > Web app.
 *    Execute as: Me. Who has access: Anyone.
 * 4. Copy the web app URL into FORM_ENDPOINT in index.html.
 */

const NOTIFY_EMAIL = 'james@bostinjig.co.uk';
const SHEET_NAME = 'Enquiries';
const HEADERS = ['Received', 'Name', 'Company', 'Email', 'Phone', 'Message'];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Spam trap: real people never fill in the hidden "website" field.
  if (p.website) {
    return json_({ ok: true });
  }

  const name = clean_(p.name, 120);
  const company = clean_(p.company, 160);
  const email = clean_(p.email, 200);
  const phone = clean_(p.phone, 40);
  const message = clean_(p.message, 5000);

  if (!name || !company || !email || !message) {
    return json_({ ok: false, error: 'Missing fields' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    sheet.appendRow([new Date(), name, company, email, phone, message]);
  } finally {
    lock.releaseLock();
  }

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: email,
    subject: 'New Bostin Jig enquiry: ' + company,
    body:
      'Name: ' + name + '\n' +
      'Company: ' + company + '\n' +
      'Email: ' + email + '\n' +
      'Phone: ' + (phone || 'not given') + '\n\n' +
      message + '\n\n' +
      'Reply within 2 working days.'
  });

  return json_({ ok: true });
}

function doGet() {
  return json_({ ok: true, service: 'Bostin Jig enquiries' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function clean_(value, maxLength) {
  // Stop the sheet treating text like "=SUM(...)" or "+44..." as a formula.
  let text = String(value || '').trim().slice(0, maxLength);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// STARLINGS - APPROVAL WORKFLOW, FORMATTING, INSIGHTS
// ============================================================
// THIS FILE PARTIALLY MIRRORS THE REAL DEPLOYED "ApprovalWorkflow.gs"
// FILE. Reconstructed 2026-07-14 from what's actually deployed — see the
// note at the top of the sibling docs/backend/Code.gs.js for context on
// why the previous version of this documentation (gas-backend.js) was
// stale and untrustworthy.
//
// ⚠️ THIS FILE IS DELIBERATELY INCOMPLETE. It only reproduces the
// functions directly involved in the approve → move-to-Live workflow,
// which is what's been debugged and fixed here. The real live file also
// has (not reproduced below, exists only in the live Apps Script
// project): onOpen()'s full custom menu, polishSheet(), formatOneTab(),
// writeInfoBlock(), TAB_INFO / COLOR_KEY content, buildInstructionsTab(),
// openPublicSite(), goToInstructions(), approveCurrentRow(),
// reflagActiveTab(), findDuplicateIdsInActiveTab(),
// clearOldRejectedInActiveTab(), columnToLetter(). Don't assume this
// file is a complete copy of the live script — if you need one of those
// functions, pull it fresh from the live Apps Script editor rather than
// guessing from an old doc (that's exactly the mistake that made the
// previous version of this documentation useless).
//
// ------------------------------------------------------------------
// 2026-07-14 fixes applied here (see Code.gs.js for the other half):
//
// 1. DUPLICATE ROWS ON APPROVAL — Code.gs used to have its own onEdit(e)
//    that also moved rows on a literal "APPROVED" text edit to the status
//    column. Both it and this file's approvalOnEdit() fired on the same
//    edit, appending the row to Live twice. Fix: Code.gs's onEdit was
//    deleted entirely — approvalOnEdit() below is now the only handler.
//
// 2. REFLECTIONS HAD NO WORKING APPROVE — TAB_CONFIG below never had
//    entries for Pending_Reflections / Live_Reflections, so
//    approvalOnEdit() silently no-op'd no matter what was clicked on
//    that tab. Fixed by adding those two entries.
//
// 3. RESOURCES APPROVE STOPPED MOVING ROWS (found right after fix #1) —
//    moveRowToLive() / approvalOnEdit() / approveCheckedRows() used to
//    locate the "Approve" and "flagged" columns by doing math on
//    TAB_CONFIG's flaggedCol number (e.g. flaggedCol + 1). If the sheet's
//    columns ever shift (a column gets inserted/removed — e.g. when the
//    city/country/lat/lng location fields were added to Pending_Resources
//    at some point), that math silently points at the wrong column and
//    ticking the real Approve checkbox does nothing. Fixed by looking up
//    "Approve" / "status" by their actual header text every time
//    (findHeaderCol_), the same way this file's own formatOneTab()
//    already did for its own purposes. TAB_CONFIG's flaggedCol/liveCols
//    numbers are UNCHANGED and still used by formatOneTab() elsewhere in
//    the live file for conditional formatting — only the approval-moving
//    logic below was made header-driven.
//
// 4. STRAY BLANK "APPROVED" ROW WHEN APPROVING SEVERAL AT ONCE (reported
//    live 2026-07-29) — approvalOnEdit() used to move only the single row
//    the triggering edit fired on. Ticking checkboxes fast queues
//    multiple onEdit executions behind the LockService lock; a queued
//    execution can run AFTER an earlier one in the same batch already
//    deleteRow()'d a row above it, shifting everything below up — so the
//    stale row number captured by the queued execution no longer points
//    at what the user actually clicked. Fixed by having approvalOnEdit()
//    re-scan and move every currently-ticked row (bottom-to-top) instead
//    of trusting the single stale row — see moveAllCheckedRows_(), now
//    shared with approveCheckedRows() (the bulk menu button), which
//    always worked this way and never had the bug.
// ------------------------------------------------------------------

const INFO_GAP_ROWS = 3;
const INFO_START_OFFSET = 50;

// TAB CONFIG — flaggedCol/liveCols are still used by formatOneTab() (not
// reproduced here) for conditional formatting. moveRowToLive/approvalOnEdit
// below no longer rely on these numbers for locating Approve/status.
const TAB_CONFIG = {
  'Pending_Stories':      { flaggedCol: 11, kind: 'pending', pair: 'Live_Stories',      liveCols: 11 },
  'Live_Stories':         { flaggedCol: 11, kind: 'live',    pair: 'Pending_Stories' },
  'Pending_Resources':    { flaggedCol: 13, kind: 'pending', pair: 'Live_Resources',    liveCols: 13 },
  'Live_Resources':       { flaggedCol: 14, kind: 'live',    pair: 'Pending_Resources' },
  'Pending_QA':           { flaggedCol: 6,  kind: 'pending', pair: 'Live_QA',           liveCols: 6 },
  'Live_QA':              { flaggedCol: 6,  kind: 'live',    pair: 'Pending_QA' },
  // Added 2026-07-14 — these two entries didn't exist before, which is
  // why the Approve checkbox on Pending_Reflections never did anything.
  'Pending_Reflections':  { flaggedCol: 6,  kind: 'pending', pair: 'Live_Reflections',  liveCols: 6 },
  'Live_Reflections':     { flaggedCol: 6,  kind: 'live',    pair: 'Pending_Reflections' }
};

/** Finds a column by its exact header text (row 1), 1-based. -1 if not found. */
function findHeaderCol_(sheet, headerName) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return -1;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === headerName) return i + 1;
  }
  return -1;
}

// ============================================================
// CORE: MOVE ONE ROW FROM PENDING TO LIVE
// ============================================================
// Copies by header name (not fixed column position) between the Pending
// and Live sheet, so any past or future column drift between the two
// can't silently break or misalign the move. "Approve" is naturally
// skipped since Live sheets don't have that column header.
function moveRowToLive(pendingSheet, row) {
  var name = pendingSheet.getName();
  var cfg = TAB_CONFIG[name];
  if (!cfg || cfg.kind !== 'pending') return false;
  var ss = pendingSheet.getParent();
  var liveSheet = ss.getSheetByName(cfg.pair);
  if (!liveSheet) return false;

  var lastCol = pendingSheet.getLastColumn();
  var pendingHeaders = pendingSheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return String(h).trim(); });
  var rowValues = pendingSheet.getRange(row, 1, 1, lastCol).getValues()[0];

  // Defensive guard (added 2026-07-28): if this row is already blank, bail
  // out instead of copying an empty record into Live. This can happen when
  // several checkboxes are ticked in quick top-to-bottom succession —
  // deleteRow() below shifts every row beneath the approved one up by one,
  // so a checkbox click that's still "in flight" (queued behind
  // LockService, or fired while the sheet's on-screen row positions hadn't
  // caught up with an earlier shift yet) can end up addressing a row that
  // was already vacated by a previous move. Rather than silently write
  // junk to Live_*, no-op. If this is the cause of an approval that
  // "doesn't work," the real fix is approving bottom-to-top (or using the
  // "✅ Approve Checked Rows" menu action, which already sorts descending
  // for exactly this reason) instead of top-to-bottom individual clicks.
  var isBlank = rowValues.every(function (v) { return String(v).trim() === ''; });
  if (isBlank) return false;

  var statusIdx = pendingHeaders.indexOf('status');
  if (statusIdx >= 0) rowValues[statusIdx] = 'APPROVED';

  var byHeader = {};
  for (var i = 0; i < pendingHeaders.length; i++) {
    if (pendingHeaders[i]) byHeader[pendingHeaders[i]] = rowValues[i];
  }

  var liveLastCol = liveSheet.getLastColumn();
  var liveHeaders = liveSheet.getRange(1, 1, 1, liveLastCol).getValues()[0]
    .map(function (h) { return String(h).trim(); });
  var liveRow = liveHeaders.map(function (h) {
    if (h === 'status') return 'APPROVED';
    return byHeader.hasOwnProperty(h) ? byHeader[h] : '';
  });

  liveSheet.appendRow(liveRow);
  pendingSheet.deleteRow(row);
  return true;
}

// ============================================================
// SHARED: MOVE EVERY CURRENTLY-TICKED ROW ON A PENDING TAB
// ============================================================
// Re-reads the whole Approve column fresh and moves every row that's
// CURRENTLY ticked, bottom-to-top (so deleteRow() inside moveRowToLive
// never invalidates a not-yet-processed row's index). Returns the count
// actually moved. Shared by approveCheckedRows() (the bulk menu button)
// and, as of 2026-07-29, approvalOnEdit() (individual checkbox clicks) —
// see the comment on approvalOnEdit() for why unifying them matters.
function moveAllCheckedRows_(sheet, approveCol) {
  var lastRow = sheet.getLastRow();
  var searchEndRow = Math.min(lastRow, INFO_START_OFFSET - 1);
  if (searchEndRow < 2) return 0;
  var checks = sheet.getRange(2, approveCol, searchEndRow - 1, 1).getValues();

  var rowsToMove = [];
  for (var i = 0; i < checks.length; i++) {
    var cv = checks[i][0];
    if (cv === true || cv === 'TRUE' || cv === 'true') rowsToMove.push(i + 2);
  }
  if (rowsToMove.length === 0) return 0;

  rowsToMove.sort(function (a, b) { return b - a; });
  var moved = 0;
  rowsToMove.forEach(function (r) {
    if (moveRowToLive(sheet, r)) moved++;
  });
  return moved;
}

// ============================================================
// INSTALLABLE onEdit HOOK — registered by setupApprovalTrigger()
// ============================================================
function approvalOnEdit(e) {
  try {
    if (!e || !e.range) return;
    var sheet = e.range.getSheet();
    var name = sheet.getName();
    var cfg = TAB_CONFIG[name];
    if (!cfg || cfg.kind !== 'pending') return;
    var row = e.range.getRow();
    if (row < 2) return;
    if (row >= INFO_START_OFFSET) return; // don't fire in the info block

    var approveCol = findHeaderCol_(sheet, 'Approve');
    var statusCol = findHeaderCol_(sheet, 'status');
    var col = e.range.getColumn();

    if (approveCol > 0 && col === approveCol) {
      // 2026-07-29 fix (reported live: approving several rows in a row by
      // clicking individual checkboxes sometimes left a stray blank
      // "APPROVED" row in Live_* between two real approvals): this used to
      // just call moveRowToLive(sheet, row) for the ONE row this edit
      // fired on. But ticking several checkboxes quickly queues multiple
      // onEdit executions behind the LockService lock below — by the time
      // a queued execution actually acquires the lock and runs, an
      // EARLIER execution in the same batch may have already deleted a
      // row above it, shifting everything below up by one. The row
      // position captured in THIS event (e.range.getRow()) doesn't get
      // re-adjusted for that, so it can end up moving whatever now sits
      // at that stale position — sometimes a blank row, which
      // moveRowToLive's blank-row guard silently no-ops, but which could
      // also be a different real row.
      //
      // Fix: instead of trusting the single stale row number, re-scan and
      // move every row CURRENTLY ticked (bottom-to-top — see
      // moveAllCheckedRows_) whenever any Approve-column edit fires. This
      // makes individual clicks behave exactly like the safe
      // "✅ Approve Checked Rows" bulk button, and makes redundant queued
      // executions for the same rapid batch safely no-op (nothing left
      // ticked) instead of operating on a stale row.
      var lock = LockService.getDocumentLock();
      try { lock.waitLock(10000); } catch (lockErr) { return; }
      try {
        moveAllCheckedRows_(sheet, approveCol);
      } finally {
        lock.releaseLock();
      }
      return;
    }

    if (statusCol > 0 && col === statusCol) {
      var val2 = e.value;
      if (typeof val2 !== 'string' || val2.trim().toUpperCase() !== 'APPROVED') return;
      var lock2 = LockService.getDocumentLock();
      try { lock2.waitLock(10000); } catch (lockErr2) { return; }
      try {
        moveRowToLive(sheet, row);
      } finally {
        lock2.releaseLock();
      }
    }
  } catch (err) {
    console.error('approvalOnEdit error: ' + err.message);
  }
}

function setupApprovalTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'approvalOnEdit') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('approvalOnEdit')
    .forSpreadsheet(ss)
    .onEdit()
    .create();
}

// ============================================================
// BULK APPROVE FROM MENU (works on the active Pending tab)
// ============================================================
function approveCheckedRows() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var name = sheet.getName();
  var cfg = TAB_CONFIG[name];
  if (!cfg || cfg.kind !== 'pending') {
    SpreadsheetApp.getUi().alert('Run this from a Pending_* tab.');
    return;
  }

  var approveCol = findHeaderCol_(sheet, 'Approve');
  if (approveCol < 1) {
    SpreadsheetApp.getUi().alert('No "Approve" column found on this tab.');
    return;
  }

  // 2026-07-29: now shares moveAllCheckedRows_ with approvalOnEdit() —
  // same scan-and-move-bottom-to-top logic, just triggered from the menu
  // instead of a single checkbox edit.
  var moved = moveAllCheckedRows_(sheet, approveCol);
  if (moved === 0) {
    SpreadsheetApp.getUi().alert('No rows are ticked.');
    return;
  }

  SpreadsheetApp.getUi().alert(moved + ' row(s) approved and moved to ' + cfg.pair + '.');
}

// ============================================================
// SWEEP: catch any already-APPROVED rows that didn't move yet
// ============================================================
// NOTE: this one still assumes "status" is column C (index 3) — lower
// risk than the Approve-column drift bug since status is always the
// 3rd field written by doPost, but if this ever misbehaves the same way
// approveCheckedRows did, swap in findHeaderCol_(sheet, 'status') here too.
function sweepApproved() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var results = [];
  ['Pending_Stories', 'Pending_Resources', 'Pending_QA', 'Pending_Reflections'].forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) { results.push(name + ': MISSING'); return; }
    var cfg = TAB_CONFIG[name];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) { results.push(name + ': empty'); return; }
    var searchEndRow = Math.min(lastRow, INFO_START_OFFSET - 1);
    if (searchEndRow < 2) { results.push(name + ': only info block'); return; }
    var statuses = sheet.getRange(2, 3, searchEndRow - 1, 1).getValues();
    var rowsToMove = [];
    for (var i = 0; i < statuses.length; i++) {
      var v = (statuses[i][0] + '').toUpperCase();
      if (v === 'APPROVED') rowsToMove.push(i + 2);
    }
    rowsToMove.sort(function (a, b) { return b - a; });
    var moved = 0;
    rowsToMove.forEach(function (r) {
      if (moveRowToLive(sheet, r)) moved++;
    });
    results.push(name + ': moved ' + moved);
  });
  SpreadsheetApp.getUi().alert('Sweep complete.\n\n' + results.join('\n'));
}

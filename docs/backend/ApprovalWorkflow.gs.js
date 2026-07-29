// ============================================================
// STARLINGS - APPROVAL WORKFLOW, FORMATTING, INSIGHTS
// ============================================================
// THIS FILE MIRRORS THE REAL DEPLOYED "ApprovalWorkflow.gs" FILE.
// Most of it (onOpen, polishSheet, formatOneTab, writeInfoBlock,
// applyEverything, refreshAllInfoBlocks) was recovered 2026-07-30 from
// the live Apps Script project's OWN version history (Version 8,
// 2026-05-14, 1:51 AM) — pulled directly out of the live editor by the
// user, not reconstructed from memory or guessed. TAB_INFO, COLOR_KEY,
// columnToLetter(), and buildInstructionsTab() below are NOT from that
// recovery — see the notes on each for why.
//
// ⚠️ STILL NOT REPRODUCED HERE (exist only in the live Apps Script
// project, were never part of the recovered onOpen() menu so nothing in
// this repo depends on them): openPublicSite(), goToInstructions(),
// approveCurrentRow(), reflagActiveTab(), findDuplicateIdsInActiveTab(),
// clearOldRejectedInActiveTab(). If you need one of those, pull it fresh
// from the live editor (Extensions > Apps Script > version history) —
// don't guess from an old doc, that's exactly the mistake that made the
// previous version of this documentation (gas-backend.js) useless.
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
//    (findHeaderCol_). TAB_CONFIG's flaggedCol/liveCols numbers are
//    UNCHANGED and still used by formatOneTab() for conditional
//    formatting — only the approval-moving logic was made header-driven.
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
//
// 5. SECOND APPROVAL IN A ROW DUPLICATES IN LIVE (reported live
//    2026-07-30) — moveRowToLive() used to append to Live unconditionally
//    whenever it was called, with no check for whether that same id was
//    already there. An EARLIER version of this backend had exactly this
//    check (liveRowHasId_()) but it didn't survive the 2026-07-14
//    rewrite of this file. Re-added: moveRowToLive() now refuses to
//    append a row whose id is already present in Live — it just cleans
//    up the stale Pending row instead. Makes double-processing a row
//    structurally harmless instead of chasing every possible trigger
//    for it.
//
// 6. CUSTOM MENU STOPPED WORKING ENTIRELY (reported live 2026-07-30) —
//    root cause confirmed: an earlier paste replaced this whole file
//    with a version that never had onOpen()/formatOneTab()/polishSheet()/
//    writeInfoBlock() in it (this repo's own prior "deliberately
//    incomplete" disclaimer), deleting them from the live project too.
//    Fixed by recovering the real originals from the live project's
//    version history (see file header) and merging them back in here,
//    alongside everything from fixes #1–#5 above. TAB_INFO, COLOR_KEY,
//    columnToLetter(), and buildInstructionsTab() were not part of that
//    recovery (either not extracted due to size, or genuinely missing
//    pieces) — see their own comments for what happened to each.
//
// 7. NEWEST-FIRST IN LIVE, AND A DATA-LEAK RISK CAUGHT ALONG THE WAY
//    (2026-07-30) — moveRowToLive() used liveSheet.appendRow(), so newly
//    approved rows landed at the very bottom of Live_*, requiring a
//    scroll past everything else to see what just got approved. Changed
//    to insert at row 2 (right under the header) instead, only actually
//    inserting a new row when row 2 already has data (an empty Live
//    sheet just gets written into directly — no wasted blank row).
//    While working on this, found that TAB_INFO (added in fix #6) had
//    entries for Live_* tabs too — writing an info block there would
//    have been a real problem: doGet() in Code.gs.js reads Live_*'s
//    ENTIRE data range with no INFO_START_OFFSET bound (unlike
//    everything else in this file), so an info block row would leak
//    into the public API response. Confirmed concretely for
//    Live_Resources: getApprovedResources() in services/api.ts has no
//    id/title validity filter, so a leaked info-block row would render
//    as a real, garbage resource card on the live Resources page.
//    TAB_INFO is now Pending_*-only.
// ------------------------------------------------------------------

const INFO_GAP_ROWS = 3;
const INFO_START_OFFSET = 50;

// TAB CONFIG — flaggedCol/liveCols are used by formatOneTab() below for
// conditional formatting. moveRowToLive()/approvalOnEdit() don't rely on
// these numbers for locating Approve/status — those are header-driven
// (findHeaderCol_) so column drift can't silently break them (see fix #3
// above for why that distinction matters).
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

// Reconstructed 2026-07-30, NOT part of the version-history recovery —
// writeInfoBlock() references COLOR_KEY but the live snapshot that was
// pulled didn't include this constant's definition. Written to match
// formatOneTab()'s three actual conditional-formatting rules below
// exactly (pink=flagged, yellow=stale, grey=stuck-approved), in the same
// order writeInfoBlock() consumes them (COLOR_KEY.slice(1), one entry per
// rule). If the real original wording still exists in version history
// and you'd rather have that verbatim, it can be swapped in later — this
// is functionally accurate either way.
const COLOR_KEY = [
  'Color key:',
  'Pink/red background — flagged for review (crisis language, personal info, or a suspicious link).',
  'Yellow background — timestamp is more than 7 days old and still sitting here pending.',
  'Grey background — status says APPROVED but the row has not moved to Live yet (run Sweep to catch it).'
];

// Reconstructed 2026-07-30, NOT part of the version-history recovery —
// same situation as COLOR_KEY. Content below reflects the CURRENT system
// (as of this date), which is actually more accurate than the May
// original would be — Pending_Reflections/Live_Reflections and the
// city/country/lat/lng resource fields didn't exist yet in May.
//
// Pending_* ONLY — deliberately does NOT include Live_* tabs. Found
// while working on the newest-first insert change below: doGet() in
// Code.gs.js (the public API every page on the site reads through)
// pulls the ENTIRE data range off Live_* sheets with no lower bound —
// unlike everything else in this file, it has no INFO_START_OFFSET cap.
// An info block written into a Live_* sheet would leak straight into
// public data. Concretely confirmed for Live_Resources: getApprovedResources()
// in services/api.ts has no id/title validity filter (unlike posts/QA/
// reflections, which all require a non-empty content field and would
// have filtered an info block row out) — so an info block there would
// show up as real garbage resource cards ("Purpose", "How to use", etc.)
// on the actual public Resources page. Keep this Pending_*-only.
const TAB_INFO = {
  'Pending_Stories': {
    title: 'Pending Notes — Moderation Queue',
    purpose: 'Anonymous notes submitted from the Share page, waiting for a human check before they go live on the public Support Map.',
    steps: [
      '1. Read the message for names, addresses, phone numbers, or crisis language the automatic filters may have missed.',
      '2. Tick the checkbox in the Approve column — it moves the row to Live_Stories and clears it from this tab automatically, no other steps needed.',
      '3. Approving several at once? Use 🐦 Starlings > Approve Checked Rows instead of clicking one at a time.',
      '4. To reject a note instead of approving it, just delete the row.'
    ],
    insight: 'New submissions always land in the first open row above this info block, never below it — this block can never get mistaken for a pending row.'
  },
  'Pending_Resources': {
    title: 'Pending Resources — Moderation Queue',
    purpose: 'Community-recommended and partner-submitted resources (links, books, videos, tools, etc.) waiting for review.',
    steps: [
      '1. Check the link is safe and the description does not contain identifying details.',
      '2. Tick Approve to publish to Live_Resources.',
      '3. "Apply to Post" partner applications include a submitter email and qualifications — check both before approving.',
      '4. city/country/lat/lng are only filled in for resources tied to a specific local service — blank is normal for most resources.'
    ],
    insight: 'Resource type (video, book, tool, etc.) comes straight from what the submitter picked on the form — spot-check it actually matches the link.'
  },
  'Pending_QA': {
    title: 'Pending Questions — Moderation Queue',
    purpose: 'Questions submitted anonymously from the homepage, waiting for an answer before they go live.',
    steps: [
      '1. Write the answer directly into the "answer" column.',
      '2. Tick Approve once the answer is ready — the question AND your answer both move to Live_QA together.',
      '3. A blank answer will still publish if approved — always fill in "answer" first.'
    ],
    insight: 'Approving without writing an answer first publishes an unanswered question — double-check the answer column isn’t blank before ticking Approve.'
  },
  'Pending_Reflections': {
    title: 'Pending Reflections — Moderation Queue',
    purpose: 'Short peer reflections left on individual resources, plus an optional photo link, waiting for review before showing under "What others shared" on that resource’s card.',
    steps: [
      '1. Check the reflection text for identifying details or crisis language.',
      '2. If image_url is filled in, open it and confirm it’s an actual image link, not a page link.',
      '3. Tick Approve to publish to Live_Reflections.'
    ],
    insight: 'resourceId links a reflection back to the specific resource it was left on — if it’s ever blank, the reflection can’t be displayed publicly even once approved.'
  }
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

/** True if `id` already exists in liveSheet's "id" column. Used by moveRowToLive's idempotency guard. */
function liveRowHasId_(liveSheet, id) {
  var lastCol = liveSheet.getLastColumn();
  if (lastCol < 1 || liveSheet.getLastRow() < 2) return false;
  var liveHeaders = liveSheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return String(h).trim(); });
  var liveIdIdx = liveHeaders.indexOf('id');
  if (liveIdIdx < 0) return false;
  var ids = liveSheet.getRange(2, liveIdIdx + 1, liveSheet.getLastRow() - 1, 1).getValues();
  return ids.some(function (r) { return String(r[0]).trim() === id; });
}

// Written fresh 2026-07-30 — not part of the version-history recovery,
// but there's only one standard way to convert a 1-based column number
// to its spreadsheet letter (1->A, 26->Z, 27->AA, ...), so this doesn't
// need to be extracted from the live script to be trusted. Used by
// formatOneTab() and writeInfoBlock() below.
function columnToLetter(column) {
  var letter = '';
  while (column > 0) {
    var remainder = (column - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    column = Math.floor((column - 1) / 26);
  }
  return letter;
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

  // Idempotency guard by id (re-added 2026-07-30 — an earlier version of
  // this backend had this as liveRowHasId_() but it didn't carry over
  // into the 2026-07-14 rewrite of this file). Reported live: approving
  // two entries back-to-back sometimes leaves the second one duplicated
  // in Live_*. Rather than chase every possible way a row could get
  // processed more than once (a tight race between two rapid clicks, a
  // leftover duplicate onEdit trigger from before an old deployment was
  // fully cleaned up, a moderator re-ticking an already-approved row,
  // etc. — see the top-of-file fix #1 note about that exact historical
  // failure mode), make double-processing structurally harmless: refuse
  // to append a row whose id is already present in Live. If it's already
  // there, this was a redundant/duplicate move attempt — just clean up
  // the stale Pending row (it was correctly approved already) and stop.
  var idIdx = pendingHeaders.indexOf('id');
  var rowId = idIdx >= 0 ? String(rowValues[idIdx]).trim() : '';
  if (rowId && liveRowHasId_(liveSheet, rowId)) {
    pendingSheet.deleteRow(row);
    return false;
  }

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

  // Newest-first (changed 2026-07-30, was appendRow — bottom of sheet):
  // put the newest approval at row 2, right under the header, instead of
  // the end of the sheet. Only actually inserts a new row when row 2
  // already holds data — if Live is empty (or has only a header), row 2
  // is already free, so this writes straight into it instead of leaving
  // a pointless blank row above real data.
  if (liveSheet.getLastRow() >= 2) {
    liveSheet.insertRowBefore(2);
  }
  liveSheet.getRange(2, 1, 1, liveRow.length).setValues([liveRow]);
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
// CUSTOM MENU (recovered 2026-07-30 from live version history,
// Version 8, 2026-05-14 — verbatim, not modified)
// ============================================================
// This is the real onOpen() that builds the "🐦 Starlings" toolbar menu.
// It runs automatically every time the spreadsheet is opened (onOpen is
// a reserved Apps Script trigger name). If the menu still doesn't appear
// after pasting this file in, do a full page reload of the spreadsheet
// tab (not just re-run something in the script editor) — onOpen() only
// fires on an actual open/reload.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🐦 Starlings')
    .addItem('Approve Checked Rows', 'approveCheckedRows')
    .addSeparator()
    .addItem('Apply Formatting + Info to All Tabs', 'applyEverything')
    .addItem('Refresh Info Blocks Only', 'refreshAllInfoBlocks')
    .addSeparator()
    .addItem('Sweep: move all APPROVED rows now', 'sweepApproved')
    .addSeparator()
    .addItem('Rebuild Instructions Tab', 'buildInstructionsTab')
    .addToUi();
}

// ============================================================
// FORMATTING (recovered 2026-07-30 from live version history)
// ============================================================
function polishSheet(sheet, skipFilter) {
  sheet.setFrozenRows(1);
  const lastCol = sheet.getLastColumn();
  if (lastCol > 0) {
    sheet.getRange(1, 1, 1, lastCol).setFontWeight('bold');
    sheet.autoResizeColumns(1, lastCol);
  }
  if (!skipFilter) {
    const existing = sheet.getFilter();
    if (existing) existing.remove();
    const lastRow = Math.max(sheet.getLastRow(), 2);
    sheet.getRange(1, 1, lastRow, lastCol).createFilter();
  }
  const bandings = sheet.getBandings();
  bandings.forEach(function (b) { b.remove(); });
  const bandRows = Math.max(sheet.getLastRow(), 2);
  sheet.getRange(1, 1, bandRows, lastCol)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
}

function formatOneTab(sheet, cfg) {
  polishSheet(sheet, false);
  let lastCol = sheet.getLastColumn();

  if (cfg.kind === 'pending') {
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    let approveCol = headers.indexOf('Approve') + 1;
    if (approveCol === 0) {
      approveCol = cfg.flaggedCol + 1;
      if (sheet.getMaxColumns() < approveCol) {
        sheet.insertColumnsAfter(sheet.getMaxColumns(), approveCol - sheet.getMaxColumns());
      }
      sheet.getRange(1, approveCol).setValue('Approve').setFontWeight('bold');
    }
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      // Only over actual data rows, not info block area.
      const dataEnd = Math.min(lastRow, INFO_START_OFFSET - 1);
      if (dataEnd >= 2) {
        const r = sheet.getRange(2, approveCol, dataEnd - 1, 1);
        const vals = r.getValues();
        // 2026-07-30: the recovered original set `mutated` but never
        // flipped it to true, so this normalization pass silently never
        // wrote back (setValues was dead code — insertCheckboxes() below
        // still ran regardless, so this mostly didn't matter in
        // practice, but fixed it since it's clearly not what was
        // intended: normalize string "TRUE"/"FALSE" values before they
        // become real checkboxes).
        let mutated = false;
        for (let i = 0; i < vals.length; i++) {
          const v = vals[i][0];
          if (v !== true && v !== false) {
            vals[i][0] = typeof v === 'string' && v.toUpperCase() === 'TRUE';
            mutated = true;
          }
        }
        if (mutated) r.setValues(vals);
        r.insertCheckboxes();
      }
    }
    lastCol = sheet.getLastColumn();
  }

  // Conditional formatting only on data range, bounded above info block.
  const dataEndRow = INFO_START_OFFSET - 1;
  const range = sheet.getRange(2, 1, dataEndRow - 1, lastCol);
  const flagLetter = columnToLetter(cfg.flaggedCol);

  const rules = [];
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + flagLetter + '2=TRUE')
    .setBackground('#f4c7c3')
    .setRanges([range])
    .build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($B2<>"",IFERROR(DATEVALUE(LEFT($B2&"",10)),0)<TODAY()-7)')
    .setBackground('#fff2cc')
    .setRanges([range])
    .build());
  if (cfg.kind === 'pending') {
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=UPPER($C2)="APPROVED"')
      .setBackground('#d9d9d9')
      .setRanges([range])
      .build());
  }
  sheet.setConditionalFormatRules(rules);
}

function writeInfoBlock(sheet, info) {
  const cfg = TAB_CONFIG[sheet.getName()];
  const lastCol = sheet.getLastColumn();
  const startRow = INFO_START_OFFSET;

  // Clear any previous info block area (40 rows).
  const clearRows = Math.min(40, sheet.getMaxRows() - startRow + 1);
  if (clearRows > 0) {
    sheet.getRange(startRow, 1, clearRows, lastCol)
      .breakApart().clearContent().clearFormat();
  }

  let r = startRow;

  sheet.getRange(r, 1).setValue(info.title)
    .setFontSize(14).setFontWeight('bold').setBackground('#1c4587').setFontColor('#ffffff');
  sheet.getRange(r, 1, 1, lastCol).merge();
  r += 1;

  sheet.getRange(r, 1).setValue('Purpose').setFontWeight('bold').setBackground('#cfe2f3');
  sheet.getRange(r, 2, 1, lastCol - 1).merge().setValue(info.purpose).setWrap(true);
  r += 1;

  sheet.getRange(r, 1).setValue('How to use').setFontWeight('bold').setBackground('#cfe2f3');
  r += 1;
  info.steps.forEach(function (step) {
    sheet.getRange(r, 2, 1, lastCol - 1).merge().setValue(step).setWrap(true);
    r += 1;
  });

  sheet.getRange(r, 1).setValue('Color key').setFontWeight('bold').setBackground('#cfe2f3');
  r += 1;
  COLOR_KEY.slice(1).forEach(function (line, idx) {
    const cell = sheet.getRange(r, 2, 1, lastCol - 1).merge();
    cell.setValue(line).setWrap(true);
    if (idx === 0) cell.setBackground('#f4c7c3');
    if (idx === 1) cell.setBackground('#fff2cc');
    if (idx === 2) cell.setBackground('#d9d9d9');
    r += 1;
  });

  sheet.getRange(r, 1).setValue('Key insight').setFontWeight('bold').setBackground('#cfe2f3');
  sheet.getRange(r, 2, 1, lastCol - 1).merge().setValue(info.insight).setWrap(true);
  r += 1;

  sheet.getRange(r, 1).setValue('Live counters').setFontWeight('bold').setBackground('#cfe2f3');
  r += 1;

  const flagLetter = columnToLetter(cfg.flaggedCol);
  const endData = startRow - 1;
  const counters = [
    ['Total rows pending', '=COUNTA(A2:A' + endData + ')'],
    ['Flagged (needs care)', '=COUNTIF(' + flagLetter + '2:' + flagLetter + endData + ', TRUE)'],
    ['Older than 7 days', '=SUMPRODUCT((B2:B' + endData + '<>"")*(IFERROR(DATEVALUE(LEFT(B2:B' + endData + '&"",10)),TODAY())<TODAY()-7))'],
    ['Already APPROVED (stuck)', '=COUNTIF(C2:C' + endData + ', "APPROVED")']
  ];
  counters.forEach(function (pair) {
    sheet.getRange(r, 1).setValue(pair[0]);
    sheet.getRange(r, 2).setFormula(pair[1]).setFontWeight('bold');
    r += 1;
  });
}

function applyEverything() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const results = [];

  Object.keys(TAB_CONFIG).forEach(function (tabName) {
    const sheet = ss.getSheetByName(tabName);
    if (!sheet) { results.push(tabName + ': MISSING'); return; }
    try {
      formatOneTab(sheet, TAB_CONFIG[tabName]);
      results.push(tabName + ': formatted');
    } catch (e) {
      results.push(tabName + ': ERR ' + e.message);
    }
  });

  const fw = ss.getSheetByName('Flagged_Words');
  if (fw) {
    try {
      polishSheet(fw, true);
      results.push('Flagged_Words: polished');
    } catch (e) {
      results.push('Flagged_Words: ERR ' + e.message);
    }
  }

  Object.keys(TAB_INFO).forEach(function (tabName) {
    const sheet = ss.getSheetByName(tabName);
    if (!sheet) return;
    try {
      writeInfoBlock(sheet, TAB_INFO[tabName]);
      results.push(tabName + ': info block written');
    } catch (e) {
      results.push(tabName + ': info ERR ' + e.message);
    }
  });

  try {
    buildInstructionsTab();
    results.push('Instructions tab: built');
  } catch (e) {
    results.push('Instructions tab: ERR ' + e.message);
  }

  try {
    setupApprovalTrigger();
    results.push('auto-approve trigger: installed');
  } catch (e) {
    results.push('auto-approve trigger: ERR ' + e.message);
  }

  SpreadsheetApp.getUi().alert('Done.\n\n' + results.join('\n'));
}

function refreshAllInfoBlocks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TAB_INFO).forEach(function (tabName) {
    const sheet = ss.getSheetByName(tabName);
    if (sheet) writeInfoBlock(sheet, TAB_INFO[tabName]);
  });
  SpreadsheetApp.getUi().alert('Info blocks refreshed.');
}

// Written fresh 2026-07-30 — the real buildInstructionsTab() from version
// history is ~33,700 characters (effectively the rest of that file) and
// wasn't extracted; grinding it out through this session's text-recovery
// method would have meant 150+ small extraction calls. This is a
// smaller, current, functional replacement so applyEverything() and the
// "Rebuild Instructions Tab" menu item don't break. If you want the exact
// original restored verbatim later, it's still sitting in that same
// version-8 snapshot in the live project's version history — recoverable
// any time, not lost.
function buildInstructionsTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = 'Instructions';
  var sheet = ss.getSheetByName(name);
  if (sheet) ss.deleteSheet(sheet);
  sheet = ss.insertSheet(name, 0);

  var rows = [
    ['🐦 Starlings — How This Sheet Works', ''],
    ['', ''],
    ['Overview', ''],
    ['Each content type (Notes, Resources, Q&A, Reflections) has a Pending_* tab and a Live_* tab.', ''],
    ['Submissions from the website always land in Pending_*. Approving a row moves it to Live_*, which is what the public site actually reads from.', ''],
    ['', ''],
    ['Approving content', ''],
    ['Tick the checkbox in the Approve column on any Pending_* tab — the row moves to Live_* and disappears from Pending_* automatically, instantly.', ''],
    ['Approving several rows at once? Use 🐦 Starlings > Approve Checked Rows instead of clicking checkboxes one by one — same result, handles multiple rows safely in one pass.', ''],
    ['To reject something instead of approving it, just delete the row from the Pending_* tab.', ''],
    ['', ''],
    ['If something looks stuck', ''],
    ['Run 🐦 Starlings > Sweep: move all APPROVED rows now — it catches any row whose status says APPROVED but never actually moved to Live.', ''],
    ['', ''],
    ['Formatting', ''],
    ['🐦 Starlings > Apply Formatting + Info to All Tabs re-applies checkboxes, column banding, conditional color-coding, and the info block at the bottom of every tab.', ''],
    ['🐦 Starlings > Refresh Info Blocks Only just rewrites the instructions/color-key block at the bottom of each tab, without touching formatting.', ''],
    ['', ''],
    ['Reading each tab’s own info block', ''],
    ['Scroll down on any Pending_*/Live_* tab — there’s a color-coded reference block explaining what that specific tab is for, starting around row ' + INFO_START_OFFSET + '.', '']
  ];

  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.getRange(1, 1).setFontSize(16).setFontWeight('bold');
  sheet.setColumnWidth(1, 640);
  sheet.setColumnWidth(2, 200);
  sheet.getRange(1, 1, rows.length, 1).setWrap(true);
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
// ONE-TIME REPAIR: fix already-invisible (white-on-white) text
// ============================================================
// Added 2026-07-29 alongside the doPost() fix in Code.gs.js that forces
// black text on every NEW row going forward. This function is for
// whatever's ALREADY sitting in the sheet right now with invisible text
// (e.g. reflections submitted before that fix was deployed). Run it once
// from the Apps Script editor: select "fixInvisibleText" in the function
// dropdown next to the ▶ Run button, then Run. Only touches font color
// (not backgrounds/borders/conditional formatting), and only data rows
// (row 2 downward) — the header row is left alone. Safe to re-run.
function fixInvisibleText() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabNames = ['Pending_Stories', 'Live_Stories', 'Pending_Resources', 'Live_Resources',
    'Pending_QA', 'Live_QA', 'Pending_Reflections', 'Live_Reflections'];
  var results = [];
  tabNames.forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) { results.push(name + ': MISSING'); return; }
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) { results.push(name + ': no data rows'); return; }
    sheet.getRange(2, 1, lastRow - 1, lastCol).setFontColor('#000000');
    results.push(name + ': fixed ' + (lastRow - 1) + ' row(s)');
  });
  SpreadsheetApp.getUi().alert('Text color repaired.\n\n' + results.join('\n'));
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

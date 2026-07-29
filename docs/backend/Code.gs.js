// ==========================================
// STARLINGS SUPPORT MAP - GOOGLE APPS SCRIPT BACKEND V2
// ==========================================
//
// THIS FILE MIRRORS THE REAL DEPLOYED "Code.gs" FILE IN THE LIVE APPS
// SCRIPT PROJECT ATTACHED TO THE "Starlings Support Map Data" SHEET.
// It was reconstructed on 2026-07-14 directly from what's actually
// deployed (previous versions of this doc, under the name
// gas-backend.js, were an aspirational draft that had drifted far from
// reality — do not trust anything about this backend that isn't in
// this file or docs/backend/ApprovalWorkflow.gs.js).
//
// The live Apps Script project has TWO files: this one (doGet/doPost —
// the actual API surface the website talks to) and ApprovalWorkflow.gs
// (the moderation menu, checkbox-driven approve-and-move automation,
// and sheet formatting — see the sibling file in this folder).
//
// 2026-07-14 fix: this file used to also have its own onEdit(e) function
// that moved approved rows from Pending_* to Live_* tabs. It has been
// deleted. ApprovalWorkflow.gs's approvalOnEdit() already does this job
// (and does it better — checkbox-aware, locked against races). Having
// both fire on the same edit was the confirmed root cause of resources
// getting duplicated into Live_Resources when approved. Do not re-add
// an onEdit(e) function to this file.
//
// 2026-07-14 addition: doGet() now routes action=getReflections to
// Live_Reflections (see below) — this is what the website's "What
// others shared" section on each resource card reads from (explicitly
// requested by the client — reflections should be publicly visible
// once approved, same as Stories/Resources/QA). THIS LINE MUST BE
// MANUALLY PASTED INTO THE LIVE Code.gs — this repo file is only a
// mirror, it does not deploy itself. Also requires an "image_url"
// column on both Pending_Reflections and Live_Reflections (see
// ApprovalWorkflow.gs.js's TAB_CONFIG comment) — without it, reflection
// photos are silently dropped on submission.
//
// 2026-07-14 addition: doGet() now handles action=health, returning
// {success, spreadsheetId, expectedTabs} — this got dropped from the
// live Code.gs during an edit and silently broke Q&A submissions (see
// the comment on that block below for the full explanation). Test
// `?action=health` directly after any future Code.gs change.
//
// 2026-07-14 addition: doPost() now calls insertCheckboxes() on the new
// row's Approve cell right after writing it. Checkbox *appearance* on
// "Approve" only ever came from a one-time manual menu action
// (ApprovalWorkflow.gs's "🎨 Apply Formatting"), which only covers
// whatever rows existed at the moment it was run — every row a
// submission appends afterward showed up as plain FALSE/blank text with
// no clickable checkbox. This makes every new submission self-format,
// permanently, without anyone needing to remember to re-run that menu
// action. THIS CHANGE MUST BE MANUALLY PASTED INTO THE LIVE Code.gs too.
//
// 2026-07-28 fix (reported live: new Notes/Resources/QA submissions
// landing "at the bottom" past a description block, with Approve doing
// nothing on any of them): doPost() used sheet.getLastRow() + 1 to place
// new rows, which picks up ANY content sheet-wide — including the
// moderator info block ApprovalWorkflow.gs writes starting at row
// INFO_START_OFFSET (50). Every approval mechanism (approvalOnEdit,
// approveCheckedRows, sweepApproved) explicitly ignores rows >= that
// offset, so a submission placed past it could never be approved by any
// method. doPost() now finds the first empty row inside the valid data
// zone (row 2 through INFO_START_OFFSET - 1) instead. THIS CHANGE MUST BE
// MANUALLY PASTED INTO THE LIVE Code.gs.
//
// 2026-07-28 fix: the health handler now also returns a "sheets" array
// with per-tab normalizedHeaders. apiService.supportsResourceLocations()
// on the frontend has depended on this shape since it was written, but
// the live health handler never returned it — meaning the map-based
// resource location gate was unconditionally false from day one,
// blocking every resource submission that included a city with "location
// fields have not been enabled in the moderation sheet," regardless of
// whether Pending_Resources/Live_Resources actually had city/country/
// lat/lng columns. THIS CHANGE MUST BE MANUALLY PASTED INTO THE LIVE
// Code.gs — test `?action=health` afterward and confirm the response
// includes a non-empty "sheets" array.
//
// 2026-07-29 fix (reported live: reflection rows appear in
// Pending_Reflections on submit, but the reflection isn't linkable to a
// resource — "no data is transferred"): doPost()'s row-building used
// postData[header], a case-sensitive EXACT match between the sheet's
// literal header text and the frontend's JS field name. The frontend
// sends "resourceId" (camelCase) — if the sheet's actual header differs
// even slightly in case (e.g. "resourceid", "ResourceId"), the lookup
// silently returns undefined and that cell writes blank, while
// id/timestamp/status/flagged still populate fine (they're hardcoded
// branches), making the row LOOK complete except for that one field.
// Same root cause silently drops "submitterEmail" (frontend) into
// Pending_Resources' actual "submitter_email" header (found while fixing
// this — camelCase vs snake_case, not just a case difference) on every
// "Apply to Post" partner submission. doPost() now falls back to a
// normalized match (case-insensitive, non-alphanumeric characters
// stripped) whenever the exact key misses. THIS CHANGE MUST BE MANUALLY
// PASTED INTO THE LIVE Code.gs.
//
// INSTRUCTIONS FOR DEPLOYMENT:
// 1. In your existing "Starlings Support Map Data" Google Sheet
// 2. Create the following exact tabs (case-sensitive):
//    - Pending_Stories
//    - Live_Stories
//    - Pending_Resources
//    - Live_Resources
//    - Pending_QA
//    - Live_QA
//    - Pending_Reflections
//    - Live_Reflections
//    - Flagged_Words
// 3. For the Flagged_Words tab, just put words in column A (one per row).
// 4. In the menu, click Extensions > Apps Script
// 5. Paste this file as "Code.gs", and paste the sibling file in this
//    folder as "ApprovalWorkflow.gs". Click "Deploy > Manage Deployments".
// 6. Edit the existing deployment, select "New version", and click "Deploy".
// ==========================================

const SCRIPT_PROP = PropertiesService.getScriptProperties();

function setup() {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty('key', doc.getId());
}

// ------------------------------------------------------------------
// GET REQUESTS: Fetch data from specific "Live" tabs dynamically
// ------------------------------------------------------------------
function doGet(e) {
    try {
        const doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty('key'));

        const action = e.parameter.action || "getStories";

        // Must come before the sheetName routing below — health doesn't look
        // at any sheet, and if this is missing, verifyBackendTarget() in
        // api.ts fails (it requires {success:true, spreadsheetId,
        // expectedTabs}), which silently breaks Q&A question submission —
        // this exact regression happened live on 2026-07-14 when a Code.gs
        // edit dropped this handler. Test `?action=health` after any Code.gs
        // change and confirm it returns this shape, not a story list.
        if (action === "health") {
            var tabNames = ["Pending_Stories", "Live_Stories", "Pending_Resources", "Live_Resources", "Pending_QA", "Live_QA", "Pending_Reflections", "Live_Reflections", "Flagged_Words"];

            // "sheets" with normalizedHeaders was added 2026-07-28 —
            // apiService.supportsResourceLocations() (services/api.ts) reads
            // data.sheets and checks Pending_Resources/Live_Resources for
            // city/country/lat/lng headers before allowing a map-based
            // resource submission. Without this field, Array.isArray(data.sheets)
            // is false and supportsResourceLocations() ALWAYS returns false —
            // every resource submission that included a location was blocked
            // with "location fields have not been enabled in the moderation
            // sheet," regardless of whether the sheet actually had those
            // columns. THIS BLOCK MUST BE MANUALLY PASTED INTO THE LIVE
            // Code.gs — see the deployment instructions at the top of this file.
            var sheetsInfo = tabNames.map(function (name) {
                var sh = doc.getSheetByName(name);
                if (!sh) return { name: name, exists: false, normalizedHeaders: [] };
                var lastCol = sh.getLastColumn();
                var headerRow = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
                var normalizedHeaders = headerRow.map(function (h) { return String(h).trim().toLowerCase(); });
                return { name: name, exists: true, normalizedHeaders: normalizedHeaders };
            });

            return responseJSON({
                success: true,
                spreadsheetId: doc.getId(),
                expectedTabs: tabNames,
                sheets: sheetsInfo
            });
        }

        let sheetName = "Live_Stories";

        if (action === "getResources") sheetName = "Live_Resources";
        if (action === "getQA") sheetName = "Live_QA";
        if (action === "getReflections") sheetName = "Live_Reflections"; // added 2026-07-14 — see note above
        if (action === "getFlaggedWords") sheetName = "Flagged_Words";

        const sheet = doc.getSheetByName(sheetName);

        if (!sheet || sheet.getLastRow() < 2) {
            return responseJSON([]);
        }

        const data = sheet.getDataRange().getValues();

        // Flagged_Words has a header row in row 1 — skip it, return rich objects
        // { term, category, severity (1-3) } so the frontend can route by severity.
        if (action === "getFlaggedWords") {
            const words = data.slice(1)
                .map(row => ({
                    term:     String(row[0] || '').trim(),
                    category: String(row[1] || '').trim(),
                    severity: Number(row[2]) || 2,
                }))
                .filter(w => w.term.length > 0);
            return responseJSON(words);
        }

        const headers = data[0];
        const rows = [];

        for (let r = 1; r < data.length; r++) {
            const rowData = {};
            for (let c = 0; c < headers.length; c++) {
                let val = data[r][c];
                if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
                    try { val = JSON.parse(val); } catch (err) { }
                }
                rowData[headers[c]] = val;
            }
            rows.push(rowData);
        }

        return responseJSON(rows);

    } catch (e) {
        return responseError(e);
    }
}

// ------------------------------------------------------------------
// POST REQUESTS: Submit new posts or increment insight counters
// ------------------------------------------------------------------
// IMPORTANT: this function only writes a value for a field if a matching
// column header ALREADY EXISTS in row 1 of the target sheet. Adding a new
// field to the frontend payload (e.g. "image_url" on reflections) does
// NOTHING on its own — you must also add that exact header name as a
// real column in row 1 of the sheet, or the value is silently dropped.
function doPost(e) {
    try {
        const doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty('key'));

        let postData;
        if (e.postData && e.postData.contents) {
            postData = JSON.parse(e.postData.contents);
        } else {
            postData = e.parameter;
        }

        const action = postData.action || "addStory";

        if (action === "incrementInsight") {
            return handleIncrementInsight(doc, postData);
        }

        let targetSheetName = "Pending_Stories";
        if (action === "addResource")   targetSheetName = "Pending_Resources";
        if (action === "addQA")         targetSheetName = "Pending_QA";
        if (action === "addReflection") targetSheetName = "Pending_Reflections";

        const sheet = doc.getSheetByName(targetSheetName);

        if (!sheet) {
            return responseError(new Error(`Sheet not found. Please create a tab named '${targetSheetName}'.`));
        }

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

        // Server-side safety backstop (frontend handles primary check via Flagged_Words)
        const messageString = JSON.stringify(postData).toLowerCase();
        let isFlagged = postData.flagged === true ||
            messageString.includes("suicide") ||
            messageString.includes("self harm") ||
            messageString.includes("self-harm") ||
            messageString.includes("hurt myself") ||
            messageString.includes("kill myself") ||
            messageString.includes("overdose");

        // Row placement: never write past the moderator info block. Every
        // Pending_* sheet has a written info/instructions block starting at
        // ApprovalWorkflow.gs's INFO_START_OFFSET row (currently 50) — and
        // sheet.getLastRow() returns the last row with ANY content
        // sheet-wide, which includes that block (and anything below it).
        // Blindly appending at getLastRow()+1 was landing new submissions
        // past row 50 — and approvalOnEdit(), approveCheckedRows(), and
        // sweepApproved() in ApprovalWorkflow.gs ALL explicitly refuse to
        // act on rows >= INFO_START_OFFSET ("don't fire in the info
        // block"). So a submission placed there was permanently
        // un-approvable: the Approve checkbox rendered fine but ticking it
        // did nothing, no matter which approval mechanism was used. Fixed
        // 2026-07-28: find the first genuinely empty row inside the valid
        // data zone (row 2 through INFO_START_OFFSET - 1) instead.
        var infoOffset = (typeof INFO_START_OFFSET !== 'undefined') ? INFO_START_OFFSET : 50;
        var zoneLastRow = infoOffset - 1;
        var scanRows = Math.max(zoneLastRow - 1, 0);
        var nextRow = -1;
        if (scanRows > 0) {
            var firstColValues = sheet.getRange(2, 1, scanRows, 1).getValues();
            for (var r = 0; r < firstColValues.length; r++) {
                if (String(firstColValues[r][0]).trim() === '') {
                    nextRow = r + 2;
                    break;
                }
            }
        }
        if (nextRow === -1) {
            return responseError(new Error(
                'The ' + targetSheetName + ' queue is full (no free row before the info block at row ' +
                infoOffset + '). A moderator needs to approve or reject some pending items first.'
            ));
        }

        // Case/style-tolerant lookup: hand-typed sheet headers drift from the
        // frontend's exact JS field names (e.g. "resourceId" written as
        // "resourceId "/"ResourceId"/"resourceid" in the sheet, or
        // "submitterEmail" written as "submitter_email"). postData[header]
        // is a case-sensitive exact match — when it misses, the row still
        // gets created (id/timestamp/status/flagged always populate via the
        // hardcoded branches above) but that one column silently writes
        // blank, which is exactly what was reported live 2026-07-29:
        // reflections appearing in Pending_Reflections with no resourceId,
        // so the reflection could never be linked back to its resource.
        // Fixed by also trying a normalized match (case + all
        // non-alphanumeric characters stripped) whenever the exact key
        // isn't found. This is a general fix, not reflection-specific — it
        // also silently fixes "submitterEmail" (frontend) vs
        // "submitter_email" (Pending_Resources' actual header), which had
        // the same silent-blank bug on every "Apply to Post" submission.
        function normalizeKey_(s) {
            return String(s).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        }
        var normalizedPostData = {};
        for (var pk in postData) {
            if (postData.hasOwnProperty(pk)) normalizedPostData[normalizeKey_(pk)] = postData[pk];
        }

        const newRow = headers.map(function (header) {
            if (header === 'timestamp') return new Date().toISOString();
            if (header === 'id')        return Utilities.getUuid();
            if (header === 'status')    return 'PENDING';
            if (header === 'flagged')   return isFlagged;
            var val = postData[header];
            if (val === undefined) val = normalizedPostData[normalizeKey_(header)];
            if (typeof val === 'object') return JSON.stringify(val || []);
            return val || "";
        });

        sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

        // The checkbox look on "Approve" comes from checkbox data validation,
        // which is only ever applied manually (the 🎨 "Apply Formatting"
        // menu action in ApprovalWorkflow.gs, run once, over whatever row
        // range existed at that moment). It does NOT automatically extend to
        // rows appended later by submissions — those show up as plain
        // FALSE/blank text with nothing clickable. Apply it here, on every
        // new row, so every submission gets a real checkbox without anyone
        // needing to remember to re-run the formatting menu action.
        const approveColIdx = headers.map(function (h) { return String(h).trim(); }).indexOf('Approve');
        if (approveColIdx !== -1) {
            const approveCell = sheet.getRange(nextRow, approveColIdx + 1);
            approveCell.insertCheckboxes();
            approveCell.setValue(false);
        }

        return responseJSON({
            success: true,
            message: `Successfully added to ${targetSheetName} queue`,
            flagged: isFlagged
        });

    } catch (e) {
        return responseError(e);
    }
}

// ------------------------------------------------------------------
// INSIGHT INCREMENTER LOGIC (Peer Insights)
// ------------------------------------------------------------------
function handleIncrementInsight(doc, postData) {
    const resourceId = postData.resourceId;
    const reactionType = postData.reactionType;

    if (!resourceId || !reactionType) throw new Error("Missing ID or reaction type");

    const liveSheet = doc.getSheetByName("Live_Resources");
    if (!liveSheet) throw new Error("Live_Resources sheet not found");

    const data = liveSheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    const targetColumnHeader = reactionType + "_count";
    let targetColIndex = headers.indexOf(targetColumnHeader);

    let targetRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === resourceId) {
            targetRowIndex = i + 1;
            break;
        }
    }

    if (targetRowIndex === -1) throw new Error("Resource ID not found in Live_Resources");

    if (targetColIndex === -1) {
        targetColIndex = headers.length;
        liveSheet.getRange(1, targetColIndex + 1).setValue(targetColumnHeader);
    }

    const cellRange = liveSheet.getRange(targetRowIndex, targetColIndex + 1);
    let currentValue = cellRange.getValue();
    if (!currentValue || isNaN(currentValue)) currentValue = 0;
    cellRange.setValue(currentValue + 1);

    return responseJSON({ success: true, newCount: currentValue + 1 });
}

// ------------------------------------------------------------------
// HELPER FUNCTIONS
// ------------------------------------------------------------------
function responseJSON(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

function responseError(error) {
    return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
    return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}

// onEdit(e) intentionally does not exist in this file — see the big
// comment at the top of this file and docs/backend/ApprovalWorkflow.gs.js.

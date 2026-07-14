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

        const nextRow = sheet.getLastRow() + 1;
        const newRow = headers.map(function (header) {
            if (header === 'timestamp') return new Date().toISOString();
            if (header === 'id')        return Utilities.getUuid();
            if (header === 'status')    return 'PENDING';
            if (header === 'flagged')   return isFlagged;
            if (typeof postData[header] === 'object') return JSON.stringify(postData[header] || []);
            return postData[header] || "";
        });

        sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

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

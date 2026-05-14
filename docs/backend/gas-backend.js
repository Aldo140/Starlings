// ==========================================
// STARLINGS SUPPORT MAP - GOOGLE APPS SCRIPT BACKEND V2
// ==========================================
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
// 3. For the Flagged_Words tab, put terms in the "Term" column starting on row 2.
// 4. In the menu, click Extensions > Apps Script
// 5. Delete all old code, paste this entire file, and click "Deploy > Manage Deployments"
// 6. Edit the existing deployment, select "New version", and click "Deploy".
// ==========================================

const SCRIPT_PROP = PropertiesService.getScriptProperties();
const SPREADSHEET_ID = "18Vzy15shBjz0u3ei0n_eLSmMONplb66rC5XvDLyExXM";

function getSpreadsheet_() {
    const spreadsheetId = SPREADSHEET_ID || SCRIPT_PROP.getProperty('key');
    if (!spreadsheetId) {
        throw new Error("Spreadsheet ID is not configured. Set SPREADSHEET_ID or run setup().");
    }
    return SpreadsheetApp.openById(spreadsheetId);
}

function normalizeHeader_(header) {
    const clean = String(header || '').trim();
    if (!clean) return "";

    // Some moderation tabs decorate row 1 with guidance text after the real
    // column name, e.g. "id Pending_QA - Peer Question..." or "question ".
    // The first token remains the canonical key the website submits.
    return clean.split(/\s+/)[0].trim();
}

function getPostValue_(postData, header) {
    const aliases = {
        submitter_email: ['submitter_email', 'submitterEmail'],
        image_url: ['image_url', 'imageUrl'],
        resource_type: ['resource_type', 'type'],
        what_helped: ['what_helped', 'whatHelped'],
    };

    const keys = aliases[header] || [header];
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (postData[key] !== undefined && postData[key] !== null) return postData[key];
    }

    return "";
}

function getSheetDiagnostics_(doc, sheetName) {
    const sheet = doc.getSheetByName(sheetName);
    if (!sheet) {
        return { name: sheetName, exists: false };
    }

    const rawHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    return {
        name: sheetName,
        exists: true,
        lastRow: sheet.getLastRow(),
        rawHeaders,
        normalizedHeaders: rawHeaders.map(normalizeHeader_)
    };
}

function writePendingSubmission_(sheet, rowValues) {
    // Pending tabs include staff guidance/dashboard content below the live
    // moderation table. Appending at getLastRow()+1 can bury new submissions
    // under that content, so insert directly below the header instead.
    const targetRow = 2;
    sheet.insertRowBefore(targetRow);
    sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
    return targetRow;
}

function setup() {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty('key', doc.getId());
}

// ------------------------------------------------------------------
// GET REQUESTS: Fetch data from specific "Live" tabs dynamically
// ------------------------------------------------------------------
function doGet(e) {
    try {
        const doc = getSpreadsheet_();

        // Defaults to "Live_Stories" for backwards compatibility if no action is provided
        const action = e.parameter.action || "getStories";
        let sheetName = "Live_Stories";

        if (action === "health") {
            const spreadsheetId = doc.getId();
            const expectedTabs = [
                "Pending_Stories",
                "Live_Stories",
                "Pending_Resources",
                "Live_Resources",
                "Pending_QA",
                "Live_QA",
                "Pending_Reflections",
                "Live_Reflections",
                "Flagged_Words"
            ];

            return responseJSON({
                success: true,
                backendVersion: "2026-05-14-newest-pending-first",
                spreadsheetId,
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
                expectedTabs,
                sheets: expectedTabs.map(function (sheetName) {
                    return getSheetDiagnostics_(doc, sheetName);
                })
            });
        }

        if (action === "getResources") sheetName = "Live_Resources";
        if (action === "getQA") sheetName = "Live_QA";
        if (action === "getFlaggedWords") sheetName = "Flagged_Words";

        const sheet = doc.getSheetByName(sheetName);

        if (!sheet || sheet.getLastRow() < 2) {
            return responseJSON([]);
        }

        const data = sheet.getDataRange().getValues();

        // Flagged_Words has a header row in row 1 — skip it, return rich objects
        // { term, category, severity (1-3) } so the frontend can route by severity.
        if (action === "getFlaggedWords") {
            const words = data.slice(1) // skip header row
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

        // Loop through rows starting from row 2
        for (let r = 1; r < data.length; r++) {
            const rowData = {};
            for (let c = 0; c < headers.length; c++) {
                let val = data[r][c];

                // Automatically parse JSON if the text looks like an array or object
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
function doPost(e) {
    try {
        const doc = getSpreadsheet_();

        let postData;
        if (e.postData && e.postData.contents) {
            postData = JSON.parse(e.postData.contents);
        } else {
            postData = e.parameter;
        }

        const action = postData.action || "addStory";

        // SPECIAL ACTION: Incrementing Emoji "Likes" on a live Resource
        if (action === "incrementInsight") {
            return handleIncrementInsight(doc, postData);
        }

        // Standard Add Actions (Routing to specific Pending tabs)
        let targetSheetName = "Pending_Stories";
        if (action === "addResource") targetSheetName = "Pending_Resources";
        if (action === "addQA") targetSheetName = "Pending_QA";
        if (action === "addReflection") targetSheetName = "Pending_Reflections";

        const sheet = doc.getSheetByName(targetSheetName);

        if (!sheet) {
            return responseError(new Error(`Sheet not found. Please create a tab named '${targetSheetName}'.`));
        }

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const normalizedHeaders = headers.map(normalizeHeader_);

        // Server-side safety backstop (frontend handles the primary check via Flagged_Words)
        const messageString = JSON.stringify(postData).toLowerCase();
        let isFlagged = postData.flagged === true ||
            messageString.includes("suicide") ||
            messageString.includes("self harm") ||
            messageString.includes("self-harm") ||
            messageString.includes("hurt myself") ||
            messageString.includes("kill myself") ||
            messageString.includes("overdose");

        const newRow = normalizedHeaders.map(function (header) {
            if (header === 'timestamp') return new Date().toISOString();
            if (header === 'id') return Utilities.getUuid();
            if (header === 'status') return 'PENDING';
            if (header === 'flagged') return isFlagged;
            if (header === 'Approve') return false;

            // Deep stringify objects/arrays for Google Sheet cells
            const value = getPostValue_(postData, header);
            if (typeof value === 'object') return JSON.stringify(value || []);

            return value || "";
        });

        const insertedRow = writePendingSubmission_(sheet, newRow);

        return responseJSON({
            success: true,
            message: `Successfully added to ${targetSheetName} queue`,
            flagged: isFlagged,
            spreadsheetId: doc.getId(),
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${doc.getId()}/edit`,
            targetSheetName,
            rowNumber: insertedRow
        });

    } catch (e) {
        return responseError(e);
    }
}

// ------------------------------------------------------------------
// INSIGHT INCREMENTER LOGIC (Peer Insights)
// ------------------------------------------------------------------
function handleIncrementInsight(doc, postData) {
    // 1. Read which resource ID they clicked
    const resourceId = postData.resourceId;
    const reactionType = postData.reactionType; // "helpful", "supportive", "exploring"

    if (!resourceId || !reactionType) throw new Error("Missing ID or reaction type");

    // 2. Open Live Resources
    const liveSheet = doc.getSheetByName("Live_Resources");
    if (!liveSheet) throw new Error("Live_Resources sheet not found");

    const data = liveSheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    const targetColumnHeader = reactionType + "_count"; // e.g., "helpful_count"
    let targetColIndex = headers.indexOf(targetColumnHeader);

    // 3. Find the row with matching ID
    let targetRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === resourceId) {
            targetRowIndex = i + 1; // Apps script ranges are 1-indexed!
            break;
        }
    }

    if (targetRowIndex === -1) throw new Error("Resource ID not found in Live_Resources");

    // If the tracking column doesn't exist yet, create it dynamically!
    if (targetColIndex === -1) {
        targetColIndex = headers.length;
        liveSheet.getRange(1, targetColIndex + 1).setValue(targetColumnHeader);
    }

    // 4. Increment the value in that cell
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

// ------------------------------------------------------------------
// AUTOMATION: Move row from Pending to Live
// ------------------------------------------------------------------
function onEdit(e) {
    if (!e || !e.range) return;
    const sheet = e.range.getSheet();
    const sheetName = sheet.getName();

    // Only trigger on edits in tabs that start with "Pending_"
    if (!sheetName.startsWith("Pending_")) return;

    // Only trigger if they edited column 3 ("status" column in position C)
    if (e.range.getColumn() !== 3) return;

    // Ensure they changed the value to "APPROVED" (case-insensitive)
    if (!e.value || typeof e.value !== 'string' || e.value.toUpperCase() !== "APPROVED") return;

    const rowNumber = e.range.getRow();
    if (rowNumber === 1) return; // Don't move header

    const doc = e.source;
    const liveSheetName = sheetName.replace("Pending_", "Live_");
    const liveSheet = doc.getSheetByName(liveSheetName);

    if (!liveSheet) {
        SpreadsheetApp.getUi().alert(`Could not find the '${liveSheetName}' tab! Please create it.`);
        return;
    }

    const numColumns = sheet.getLastColumn();
    const rowData = sheet.getRange(rowNumber, 1, 1, numColumns).getValues();

    try {
        const headers = sheet.getRange(1, 1, 1, numColumns).getValues()[0];
        const idIndex = headers.indexOf('id');
        if (idIndex >= 0 && (!rowData[0][idIndex] || rowData[0][idIndex] === "")) {
            rowData[0][idIndex] = Utilities.getUuid();
        }
    } catch (err) { }

    liveSheet.getRange(liveSheet.getLastRow() + 1, 1, 1, numColumns).setValues(rowData);
    sheet.deleteRow(rowNumber);
}

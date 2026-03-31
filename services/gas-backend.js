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
//    - Flagged_Words
// 3. For the Flagged_Words tab, just put words in column A (one per row).
// 4. In the menu, click Extensions > Apps Script
// 5. Delete all old code, paste this entire file, and click "Deploy > Manage Deployments"
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

        // Defaults to "Live_Stories" for backwards compatibility if no action is provided
        const action = e.parameter.action || "getStories";
        let sheetName = "Live_Stories";

        if (action === "getResources") sheetName = "Live_Resources";
        if (action === "getQA") sheetName = "Live_QA";
        if (action === "getFlaggedWords") sheetName = "Flagged_Words";

        const sheet = doc.getSheetByName(sheetName);

        if (!sheet || sheet.getLastRow() < (action === "getFlaggedWords" ? 1 : 2)) {
            return responseJSON([]);
        }

        const data = sheet.getDataRange().getValues();

        // Special simple parsing for Flagged Words (just an array of strings)
        if (action === "getFlaggedWords") {
            const words = data.map(row => row[0]).filter(word => word && typeof word === 'string');
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
        const doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty('key'));

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

        const sheet = doc.getSheetByName(targetSheetName);

        if (!sheet) {
            return responseError(new Error(`Sheet not found. Please create a tab named '${targetSheetName}'.`));
        }

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

        // Very basic hardcoded safety check (Frontend handles primary check via Flagged_Words)
        const messageString = JSON.stringify(postData).toLowerCase();
        let isFlagged = postData.flagged === true || messageString.includes("suicide") || messageString.includes("self harm");

        const nextRow = sheet.getLastRow() + 1;
        const newRow = headers.map(function (header) {
            if (header === 'timestamp') return new Date().toISOString();
            if (header === 'id') return Utilities.getUuid();
            if (header === 'status') return 'PENDING';
            if (header === 'flagged') return isFlagged;

            // Deep stringify objects/arrays for Google Sheet cells
            if (typeof postData[header] === 'object') return JSON.stringify(postData[header] || []);

            return postData[header] || "";
        });

        // Append the row
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

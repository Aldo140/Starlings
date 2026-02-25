// ==========================================
// STARLINGS SUPPORT MAP - GOOGLE APPS SCRIPT BACKEND
// ==========================================
// 
// INSTRUCTIONS FOR DEPLOYMENT:
// 1. Create a Google Sheet named "Starlings Support Map Data"
// 2. Create two tabs named: "Pending" and "Approved"
// 3. In BOTH tabs, put these exact headers in row 1:
//    id, timestamp, status, country, city, lat, lng, message, what_helped, alias, flagged
// 4. In the menu, click Extensions > Apps Script
// 5. Delete all code in the script editor and paste this entire file.
// 6. Click "Deploy" > "New deployment"
// 7. Select type: "Web app"
// 8. Execute as: "Me" (your email)
// 9. Who has access: "Anyone"
// 10. Click "Deploy", copy the "Web app URL", and paste it into `services/api.ts`
// ==========================================

const SCRIPT_PROP = PropertiesService.getScriptProperties() // New property service

// Setup function to connect this script to the active spreadsheet
function setup() {
    const doc = SpreadsheetApp.getActiveSpreadsheet()
    SCRIPT_PROP.setProperty('key', doc.getId())
}

// ------------------------------------------------------------------
// GET REQUESTS: Fetch approved posts
// ------------------------------------------------------------------
function doGet(e) {
    try {
        const doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty('key'))

        // We ONLY fetch from the "Approved" tab to protect the public map
        const sheet = doc.getSheetByName("Approved")

        // If the sheet doesn't exist or is empty, return an empty array
        if (!sheet || sheet.getLastRow() < 2) {
            return responseJSON([])
        }

        const data = sheet.getDataRange().getValues()
        const headers = data[0]

        const rows = []

        // Loop through rows starting from row 2 (index 1), mapping values to headers
        for (let r = 1; r < data.length; r++) {
            const rowData = {}
            for (let c = 0; c < headers.length; c++) {
                let val = data[r][c]

                // Handle the stringified JSON array for "what_helped"
                if (headers[c] === 'what_helped') {
                    try {
                        rowData[headers[c]] = val ? JSON.parse(val) : []
                    } catch (e) {
                        rowData[headers[c]] = [val] // Fallback if not valid JSON
                    }
                }
                // Handle boolean parsing for flagged
                else if (headers[c] === 'flagged') {
                    rowData[headers[c]] = val === true || val === 'true'
                }
                else {
                    rowData[headers[c]] = val
                }
            }
            rows.push(rowData)
        }

        return responseJSON(rows)

    } catch (e) {
        return responseError(e)
    }
}

// ------------------------------------------------------------------
// POST REQUESTS: Submit a new post
// ------------------------------------------------------------------
function doPost(e) {
    try {
        const doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty('key'))

        // All new submissions land in "Pending" for moderation
        const sheet = doc.getSheetByName("Pending")

        if (!sheet) {
            return responseError(new Error("Pending sheet not found. Please create a tab named 'Pending'."))
        }

        // Ensure headers exist
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]

        // Parse the incoming JSON body
        let postData;
        if (e.postData && e.postData.contents) {
            postData = JSON.parse(e.postData.contents)
        } else {
            // Fallback for form data
            postData = e.parameter
        }

        // Double check for banned patterns natively in GAS to prevent API abuse
        const message = postData.message || ""
        const BANNED_PATTERNS = [
            /https?:\/\/[^\s]+/gi,          // URLs
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Emails
            /(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // North American phone numbers
            /\b(?:suicide|kill myself|end my life|die|self harm|self-harm|cut myself|overdose|OD)\b/gi // Crisis keywords
        ]

        let isFlagged = postData.flagged === true || postData.flagged === 'true';
        for (const pattern of BANNED_PATTERNS) {
            if (pattern.test(message)) {
                isFlagged = true;
                break;
            }
        }

        const nextRow = sheet.getLastRow() + 1
        const newRow = headers.map(function (header) {

            // Override the mapped values with safety enforcement
            if (header === 'timestamp') return new Date().toISOString()
            if (header === 'status') return 'PENDING'
            if (header === 'flagged') return isFlagged

            // Stringify the array back to text for the spreadsheet cell
            if (header === 'what_helped') return JSON.stringify(postData[header] || [])

            return postData[header] || ""
        })

        // Append the row to Google Sheets
        sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow])

        return responseJSON({
            success: true,
            message: "Successfully added to pending queue",
            flagged: isFlagged
        })

    } catch (e) {
        return responseError(e)
    }
}

// ------------------------------------------------------------------
// HELPER FUNCTIONS
// ------------------------------------------------------------------

function responseJSON(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON)
}

function responseError(error) {
    return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON)
}

// Allow handling of CORS preflight OPTIONS requests required by fetch
function doOptions(e) {
    return ContentService.createTextOutput("")
        .setMimeType(ContentService.MimeType.TEXT)
}

// ------------------------------------------------------------------
// AUTOMATION: Move row from Pending to Approved
// ------------------------------------------------------------------
function onEdit(e) {
    // Make sure we have an event object (meaning real edit, not manually running this function)
    if (!e || !e.range) return;

    const sheet = e.range.getSheet();

    // Only trigger on edits in the "Pending" tab
    if (sheet.getName() !== "Pending") return;

    // Only trigger if they edited column 3 ("status" column in position C)
    if (e.range.getColumn() !== 3) return;

    // Ensure they changed the value to "APPROVED" (case-insensitive)
    if (!e.value || typeof e.value !== 'string' || e.value.toUpperCase() !== "APPROVED") return;

    const rowNumber = e.range.getRow();

    // Don't move the header row!
    if (rowNumber === 1) return;

    const doc = e.source; // Get the active spreadsheet
    const approvedSheet = doc.getSheetByName("Approved");

    if (!approvedSheet) {
        SpreadsheetApp.getUi().alert("Could not find the 'Approved' tab!");
        return;
    }

    // Grab the entire row of data
    const numColumns = sheet.getLastColumn();
    const rowData = sheet.getRange(rowNumber, 1, 1, numColumns).getValues();

    // Append the row to the Approved tab
    approvedSheet.getRange(approvedSheet.getLastRow() + 1, 1, 1, numColumns).setValues(rowData);

    // Delete the row from the Pending tab
    sheet.deleteRow(rowNumber);
}

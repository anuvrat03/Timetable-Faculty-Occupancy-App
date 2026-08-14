// ==========================================
// CONFIGURATION: Embedded Gemini API Key
// ==========================================
const GEMINI_API_KEY = "AQ.Ab8RN6JfR4Ha90SwCmteKvZ2xyB3yRRyu4TzlxZa6VBU14YXXw";

let masterDatabase = [];

// Initialize app data from browser memory on page load
function initData() {
    const saved = localStorage.getItem("pharmacy_timetable_db");
    if (saved) {
        try {
            masterDatabase = JSON.parse(saved);
        } catch (e) {
            console.error("Error loading saved database", e);
        }
    }
    displayData([]);
}

function saveToLocalStorage() {
    localStorage.setItem("pharmacy_timetable_db", JSON.stringify(masterDatabase));
}

// Display results in the UI table
function displayData(data) {
    const tbody = document.getElementById("tableBody");
    const recordCount = document.getElementById("recordCount");
    if (!tbody || !recordCount) return;

    tbody.innerHTML = "";
    recordCount.innerText = `${data.length} Record(s) Found`;

    if (data.length === 0) {
        const query = document.getElementById("searchFaculty")?.value.trim();
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="placeholder-text" style="text-align: center; padding: 20px;">
                    ${query ? "No matching faculty schedule found." : "Type a faculty name or initials in the search box."}
                </td>
            </tr>`;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement("tr");
        const isLab = item.type && item.type.toLowerCase().includes("lab");
        const typeBadge = `<span class="badge ${isLab ? 'badge-lab' : 'badge-lecture'}">${item.type || "Class"} (${item.batch || "All"})</span>`;
        
        tr.innerHTML = `
            <td><strong>${item.faculty_name || "-"}</strong></td>
            <td>${item.day || "-"}</td>
            <td>${item.time_slot || "-"}</td>
            <td>${item.program_sem || "-"}</td>
            <td>${typeBadge}</td>
            <td><strong>${item.room_lab || "-"}</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

// Flexible search ignoring spaces and punctuation
function searchFaculty() {
    const rawQuery = document.getElementById("searchFaculty").value;
    const cleanQuery = rawQuery.toLowerCase().replace(/[\s.]/g, "");
    
    if (!cleanQuery) {
        displayData([]);
        return;
    }

    const filtered = masterDatabase.filter(item => {
        const cleanName = (item.faculty_name || "").toLowerCase().replace(/[\s.]/g, "");
        return cleanName.includes(cleanQuery);
    });
    
    displayData(filtered);
}

// ==========================================
// 🚀 AUTOMATED AI TIMETABLE EXTRACTION
// ==========================================
async function processDirectFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const statusMsg = document.getElementById("uploadStatus");
    if (statusMsg) statusMsg.innerText = "⏳ AI is processing timetable image/PDF... Please wait.";

    try {
        const base64Data = await convertFileToBase64(file);
        
        // Structured extraction prompt for Gemini 1.5 Flash
        const prompt = `Extract all faculty schedule entries from this timetable document into a raw JSON array.
Return strictly valid JSON with no markdown syntax wrapping or extra prose.
Each item in the array must follow this exact structure:
[
  {
    "faculty_name": "Full Name or Initials",
    "day": "Monday/Tuesday/etc",
    "time_slot": "10:00 AM - 11:00 AM",
    "program_sem": "B.Pharm Sem IV / M.Pharm / etc",
    "type": "Lecture or Practical Lab",
    "subject": "Subject Name",
    "room_lab": "Room 204 or Lab Name",
    "batch": "All or Batch B1"
  }
]`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: file.type, data: base64Data } }
                    ]
                }]
            })
        });

        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error.message || "API Error");
        }

        const rawText = result.candidates[0].content.parts[0].text;
        
        // Clean markdown syntax if generated
        const cleanJsonText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const newEntries = JSON.parse(cleanJsonText);

        if (Array.isArray(newEntries) && newEntries.length > 0) {
            masterDatabase = [...masterDatabase, ...newEntries];
            saveToLocalStorage();
            if (statusMsg) statusMsg.innerText = "";
            alert(`🎉 Success! Automatically extracted and added ${newEntries.length} schedule entries for all faculty!`);
            searchFaculty();
        } else {
            throw new Error("No array extracted from document");
        }

    } catch (err) {
        console.error("AI Processing Error:", err);
        if (statusMsg) statusMsg.innerText = "";
        alert("Failed to process timetable. Ensure the file is clear and valid.");
    }
}

// Helper: Convert File Object to Base64
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// ==========================================
// MANUAL JSON PASTE & BACKUP MANAGEMENT
// ==========================================
function loadAIStudioJSON() {
    const raw = document.getElementById("jsonInput").value.trim();
    if (!raw) {
        alert("Please paste valid JSON data.");
        return;
    }

    try {
        const parsed = JSON.parse(raw);
        let newEntries = [];

        if (parsed.occupancy_details && Array.isArray(parsed.occupancy_details)) {
            newEntries = parsed.occupancy_details.map(entry => ({
                faculty_name: parsed.faculty_name || "Unknown Faculty",
                day: entry.day || "N/A",
                time_slot: entry.time_slot || entry.session || "N/A",
                program_sem: entry.program_sem || "-",
                type: entry.type || "Lecture",
                subject: entry.subject || "-",
                room_lab: entry.room_lab || entry.room_number || "N/A",
                batch: entry.batch || "All"
            }));
        } else if (Array.isArray(parsed)) {
            newEntries = parsed;
        }

        if (newEntries.length > 0) {
            masterDatabase = [...masterDatabase, ...newEntries];
            saveToLocalStorage();
            document.getElementById("jsonInput").value = "";
            alert(`Successfully added ${newEntries.length} entries!`);
            searchFaculty();
        } else {
            alert("Could not extract occupancy entries from JSON.");
        }
    } catch (err) {
        alert("Invalid JSON format.");
    }
}

function exportJSON() {
    if (masterDatabase.length === 0) return alert("No data to export!");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(masterDatabase, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `Faculty_Occupancy_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
}

function exportCSV() {
    if (masterDatabase.length === 0) return alert("No data to export!");
    const headers = ["Faculty Name", "Day", "Time Slot", "Program & Sem", "Type", "Subject", "Room / Lab", "Batch"];
    const rows = masterDatabase.map(item => [
        `"${item.faculty_name}"`, `"${item.day}"`, `"${item.time_slot}"`,
        `"${item.program_sem || ''}"`, `"${item.type || ''}"`, `"${item.subject || ''}"`,
        `"${item.room_lab || ''}"`, `"${item.batch || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(",")).join("\n")];
    const a = document.createElement("a");
    a.href = encodeURI(csvContent);
    a.download = `Faculty_Occupancy_Backup_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}

function importFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                masterDatabase = imported;
                saveToLocalStorage();
                alert("Database backup restored successfully!");
                searchFaculty();
            }
        } catch (err) {
            alert("Failed to parse backup file.");
        }
    };
    reader.readAsText(file);
}

function refreshForm() {
    document.getElementById("searchFaculty").value = "";
    if (document.getElementById("jsonInput")) document.getElementById("jsonInput").value = "";
    displayData([]);
}

window.onload = initData;

let masterDatabase = [];

function initData() {
    const saved = localStorage.getItem("pharmacy_timetable_db");
    if (saved) {
        try {
            masterDatabase = JSON.parse(saved);
        } catch (e) {
            console.error("Error loading saved database", e);
        }
    }
    // Keep output table completely blank on startup
    displayData([]);
}

function saveToLocalStorage() {
    localStorage.setItem("pharmacy_timetable_db", JSON.stringify(masterDatabase));
}

function displayData(data) {
    const tbody = document.getElementById("tableBody");
    const recordCount = document.getElementById("recordCount");
    tbody.innerHTML = "";
    recordCount.innerText = `${data.length} Record(s) Found`;

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="placeholder-text">
                    ${document.getElementById("searchFaculty").value.trim() ? "No matching faculty schedule found." : "Type a faculty name in the search box to view occupancy details."}
                </td>
            </tr>`;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement("tr");
        const typeClass = item.type && item.type.toLowerCase().includes("lab") ? "badge-lab" : "badge-lecture";
        tr.innerHTML = `
            <td><strong>${item.faculty_name}</strong></td>
            <td>${item.day}</td>
            <td>${item.time_slot}</td>
            <td>${item.program_sem || "-"}</td>
            <td><span class="badge ${typeClass}">${item.type || "Class"} (${item.batch || "All"})</span></td>
            <td><strong>${item.room_lab}</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

function searchFaculty() {
    const query = document.getElementById("searchFaculty").value.toLowerCase().trim();
    
    // Hide all details if search box is empty
    if (!query) {
        displayData([]);
        return;
    }

    // Filter strictly by the entered faculty name
    const filtered = masterDatabase.filter(item => 
        item.faculty_name.toLowerCase().includes(query)
    );
    
    displayData(filtered);
}

function refreshForm() {
    document.getElementById("searchFaculty").value = "";
    document.getElementById("jsonInput").value = "";
    displayData([]);
}

function loadAIStudioJSON() {
    const raw = document.getElementById("jsonInput").value.trim();
    if (!raw) {
        alert("Please paste valid JSON from Google AI Studio.");
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
            alert(`Successfully added ${newEntries.length} schedule entries! Search the faculty name to view.`);
        } else {
            alert("Could not extract occupancy entries. Ensure standard AI Studio JSON format is used.");
        }
    } catch (err) {
        alert("Invalid JSON format. Check raw text from AI Studio.");
    }
}

function exportJSON() {
    if (masterDatabase.length === 0) {
        alert("No timetable data available to export!");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(masterDatabase, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Pharmacy_Timetable_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function exportCSV() {
    if (masterDatabase.length === 0) {
        alert("No timetable data available to export!");
        return;
    }
    const headers = ["Faculty Name", "Day", "Time Slot", "Program & Sem", "Type", "Subject", "Room / Lab", "Batch"];
    const rows = masterDatabase.map(item => [
        `"${item.faculty_name}"`,
        `"${item.day}"`,
        `"${item.time_slot}"`,
        `"${item.program_sem || ''}"`,
        `"${item.type || ''}"`,
        `"${item.subject || ''}"`,
        `"${item.room_lab || ''}"`,
        `"${item.batch || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(",")).join("\n")];
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `Pharmacy_Timetable_Backup_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
                refreshForm();
            } else {
                alert("Import file must be a JSON array of timetable records.");
            }
        } catch (err) {
            alert("Failed to parse backup JSON file.");
        }
    };
    reader.readAsText(file);
}

window.onload = initData;

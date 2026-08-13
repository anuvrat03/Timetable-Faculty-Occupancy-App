# Faculty Occupancy Tracker

A lightweight, privacy-focused web application designed for Institutes of Pharmacy (B.Pharm, M.Pharm, Pharm.D) to store, search, and manage faculty timetable occupancy, lab batch schedules, and room availability.

The app works seamlessly alongside **Google AI Studio** to extract structured schedule data from timetable PDFs or images and store them securely in the browser.

---

## ✨ Features

- **🔍 Privacy-First Search:** Schedule results stay completely hidden until a specific faculty name is typed into the search bar.
- **📥 Backup & Export:** Export your entire timetable database to **JSON** or **CSV** at any time to keep data safe from cloud deletion policies.
- **📤 Easy Data Import:** Restore saved `.json` backup files with a single click across devices without re-uploading documents to AI Studio.
- **➕ AI Studio Integration:** Paste raw JSON responses directly from Google AI Studio to append new timetable entries.
- **💾 Local Storage Persistence:** All timetable data is stored directly in your browser (`localStorage`). No server or external database is required.
- **📱 Fully Responsive:** Clean interface optimized for both desktop and mobile web browsers.

---

## 📁 Repository Structure

```text
├── index.html   # Main application interface
├── styles.css   # Modern, responsive UI styling
├── app.js       # Core application logic & backup engine
└── README.md    # Project documentation

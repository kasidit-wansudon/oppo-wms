# OPPO Warehouse Management System

ระบบจัดการคลังสินค้า OPPO - Product, PO, SO และ Inventory

## Features

- **Dashboard** — ภาพรวมสต็อก, PO/SO ที่ active, Low Stock Alerts
- **Product Management** — เพิ่ม/แก้ไข/ลบสินค้า พร้อม filter
- **Purchase Orders (PO)** — สร้าง PO, Approve, Receive, Sub-PO Management
- **Sales Orders (SO)** — สร้าง SO, Approve, Fulfill
- **Inventory** — ดูสต็อกแบบ real-time พร้อม Reserved/Incoming
- **Reports** — Stock Summary, PO/SO Report, Movement, Valuation, Low Stock
- **Export CSV** — ส่งออกข้อมูลทุก section เป็น CSV
- **Dark Mode** — รองรับ `prefers-color-scheme: dark`

## Project Structure

```
oppo-wms/
├── index.html                  # Main HTML (structure only)
├── css/
│   └── styles.css              # All styles + CSS variables + dark mode
├── js/
│   ├── data.js                 # Data layer, helpers, localStorage, defaults
│   ├── app.js                  # Core application logic (CRUD, reports, export)
│   └── searchable-select.js    # Searchable dropdown component
├── .gitignore
└── README.md
```

## How to Run

Open `index.html` in any modern browser — no build step or server required.

Data is persisted in `localStorage`.

## Tech Stack

- Pure HTML/CSS/JavaScript (no frameworks)
- CSS Custom Properties for theming
- localStorage for data persistence

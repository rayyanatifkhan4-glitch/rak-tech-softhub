# Tech ERP — All-in-One Business Suite — Technical & System Documentation

---
**Prepared By:** RAK Tech Soft Hub Group
**Document Reference:** Tech-ERP-v2.0-TechSpec
**Project:** Tech ERP Business Suite
**Date:** June 11, 2026
---

This document provides a comprehensive, descriptive technical guide for the **Tech ERP Desktop Application (v2.0)**. It details the system architecture, LAN synchronization, database collection schemas, modular application pages, PDF engine mechanics, and compilation/building commands.

---

## 1. System Architecture & Topology

The **Tech ERP Application** is designed as a standalone, offline-first application wrapped inside an Electron container. It is structured to run as a local database server, enabling other computers on the same Local Area Network (LAN) to sync records dynamically.

### Architecture Map:
```
           [ Client LAN Desktop ]              [ Local Host Manager PC ]
                    │                                      │
                    ▼                                      ▼
           [ React 19 Frontend ]                  [ React 19 Frontend ]
                    │                                      │
           (Fetch Port 3010 API)                  (Local Port 3010 API)
                    │                                      │
                    └───────────────> [ http://localhost:3010 ] <───┘
                                                 │
                                     [ Electron Main Node Server ]
                                                 │
                                                 ▼
                                     [ database.json (Disk Storage) ]
```

---

## 2. Local LAN Database API Server

Inside `electron/main.js`, the app initializes a Node.js-based HTTP server running on port `3010` that binds to `0.0.0.0` (all network interfaces).

### 2.1 API Endpoints:
*   `GET /api/db`: Reads the local `database.json` file from disk and returns it as a JSON payload. Configured with CORS headers (`Access-Control-Allow-Origin: *`) to allow client workstations on the network to request data.
*   `POST /api/db`: Receives a JSON payload representing the modified database and writes it back to `database.json` atomically.

### 2.2 Client-Side Syncing (`src/utils/db.js`):
The database service handles the network requests and provides offline local caching:
*   **Local Caches:** Every fetch from the server caches a copy in the workstation's `localStorage` under `erp_cache_[collectionName]` (e.g. `erp_cache_invoices`).
*   **Offline Fallback:** If the workstation cannot reach the main server ip, it seamlessly switches to loading its local cache, allowing managers to read existing lists.
*   **Syncer Payload:** Every write updates both the client caches and performs a POST sync request to the LAN database.

---

## 3. Database Schema Definitions (`database.json`)

The system records data in 12 unified collections. The default path for the storage file is:
`C:\Users\[Username]\AppData\Roaming\Tech ERP — All-in-One Business Suite\database.json`.

Here are the precise schemas for each collection:

### 3.1 `clients` (Sales Contacts)
```json
{
  "id": 1718115600001,
  "name": "Acme Corp",
  "contact": "John Doe",
  "email": "john@acme.co",
  "phone": "+92 300 1234567",
  "status": "Active Client", 
  "goAhead": "Approved",
  "pipelineStage": "Won"
}
```
*   `status`: `'Lead'`, `'Active Client'`, or `'Inactive'`
*   `goAhead`: `'Pending'`, `'In Discussion'`, `'Approved'`, or `'Rejected'`
*   `pipelineStage`: `'Lead'`, `'Contacted'`, `'Proposal Sent'`, `'Negotiation'`, `'Won'`, or `'Lost'`

### 3.2 `invoices` (Sales Invoicing)
```json
{
  "id": "INV-2026-145",
  "client": "Acme Corp",
  "clientEmail": "john@acme.co",
  "clientPhone": "+92 300 1234567",
  "date": "6/11/2026",
  "amount": "125000",
  "status": "Paid",
  "items": [
    {
      "name": "Web Design & Development",
      "qty": 1,
      "rate": "125000",
      "total": "125000"
    }
  ]
}
```
*   `status`: `'Paid'`, `'Pending'`, or `'Overdue'`

### 3.3 `tasks` (Operations Project Management)
```json
{
  "id": 1718115600005,
  "title": "CCTV Deployment",
  "desc": "Install 8 security cameras in warehouse.",
  "status": "todo"
}
```
*   `status`: `'todo'`, `'in-progress'`, or `'done'`

### 3.4 `services` (Digital Services Catalog)
```json
{
  "id": "S-001",
  "name": "SEO Optimization",
  "category": "Digital",
  "price": "50000",
  "description": "Search engine optimization and ranking services."
}
```

### 3.5 `vendors` (Purchasing Directory)
```json
{
  "id": 1718115600010,
  "name": "Ali Electronics",
  "company": "Ali Dist",
  "email": "ali@mail.com",
  "phone": "+92 321 1234567",
  "category": "Hardware"
}
```

### 3.6 `purchaseOrders` (Purchases POs)
```json
{
  "id": "PO-2026-042",
  "vendor": "Ali Electronics",
  "date": "6/11/2026",
  "status": "Paid",
  "amount": "17000",
  "items": [
    {
      "name": "CCTV Camera (2MP)",
      "qty": 2,
      "rate": "8500",
      "total": "17000"
    }
  ]
}
```
*   `status`: `'Draft'`, `'Sent'`, `'Received'`, or `'Paid'`

### 3.7 `products` (Physical Inventory Catalog)
```json
{
  "id": "P-001",
  "name": "CCTV Camera (2MP)",
  "category": "Hardware",
  "price": "8500",
  "stock": 27,
  "minStock": 5,
  "unit": "piece"
}
```
*   Low-stock conditions evaluate if `stock <= minStock`.

### 3.8 `employees` (Staff Registry)
```json
{
  "id": 1718115600015,
  "name": "Zubair Khan",
  "designation": "IT Engineer",
  "department": "Development",
  "salary": 75000,
  "phone": "+92 345 9876543",
  "joinDate": "2026-01-15"
}
```

### 3.9 `attendance` (Staff Attendance Ledger)
```json
{
  "empId": 1718115600015,
  "empName": "Zubair Khan",
  "date": "2026-06-11",
  "status": "Present"
}
```
*   `status`: `'Present'`, `'Absent'`, or `'Leave'`

### 3.10 `salarySlips` (Payroll Records)
```json
{
  "id": 1718115600020,
  "empId": 1718115600015,
  "empName": "Zubair Khan",
  "department": "Development",
  "designation": "IT Engineer",
  "month": "2026-06",
  "monthName": "Jun 2026",
  "baseSalary": 75000,
  "workingDays": 30,
  "presentDays": 29,
  "absentDays": 1,
  "leaveDays": 0,
  "deduction": 2500,
  "netSalary": 72500,
  "date": "6/11/2026"
}
```

### 3.11 `transactions` (General Ledger Journals)
Contains double-entry bookkeeping data. Compatible with single-entry items:
```json
{
  "id": 1718115600025,
  "description": "Payment for PO-2026-042 - Ali Electronics",
  "amount": 17000,
  "debitAccount": "Accounts Payable (A/P)",
  "creditAccount": "Cash/Bank",
  "date": "2026-06-11"
}
```
*   *Note:* Legacy entries omit `debitAccount`/`creditAccount` and are automatically mapped to correct defaults (e.g. `type === 'income'` maps to Dr: `Cash/Bank` and Cr: `Sales Revenue`).

### 3.12 `quotations` (CRM Service Proposals)
```json
{
  "id": "QT-2026-089",
  "client": "Acme Corp",
  "clientEmail": "john@acme.co",
  "clientPhone": "+92 300 1234567",
  "date": "6/11/2026",
  "amount": "125000",
  "status": "Sales Order",
  "items": [
    {
      "name": "Web Design & Development",
      "qty": 1,
      "rate": "125000",
      "total": "125000"
    }
  ]
}
```
*   `status`: `'Sent'`, `'Approved'`, `'Rejected'`, or `'Sales Order'`

---

## 4. Modular Pages Implementation

The UI contains 10 separate screens designed using standard CSS variables and Lucide icons:

1.  **Dashboard (`Dashboard.jsx`)**: Displays live revenue KPIs, launches module quicklinks with indicators (e.g., employee headcounts, low-stock warnings), and hosts the system's aggregated live activity feed.
2.  **Sales & CRM (`Clients.jsx`)**: Pipeline board displaying contact stages, quotation creators, and quotation list converters (turns quotes to sales orders, auto-posting invoices).
3.  **Purchases & Vendors (`Purchases.jsx`)**: Add/edit/delete vendors. Creates multi-item Purchase Orders which automatically update stock catalog counts on completion.
4.  **Products & Catalog (`Services.jsx`)**: Displays products catalog with custom stock adjustment grids (+/- overrides with audit comments) and lists services pricing lists.
5.  **Invoices (`Invoices.jsx`)**: Direct billing module linking client selections and service catalogs, formatting prices, and compiling invoices.
6.  **Accounting & Journals (`Accounting.jsx`)**: Features Trial Balance matching sheets (balancing Dr/Cr), General Journal entries registry, manual Journal entry creator, P&L statements, and Balance Sheet sheets.
7.  **HR & Payroll (`HR.jsx`)**: Employee registries, calendar grids to mark daily attendance statuses, and salary slip generators with attendance-deduction logic.
8.  **Customer & Vendor Ledgers (`Ledgers.jsx`)**: Detailed customer/vendor account sheets showing invoices/payments, calculates running balances, and checks total payables/receivables.
9.  **Tasks Board (`Tasks.jsx`)**: Kanban columns (To Do, In Progress, Done) managing operational task items.
10. **Docs & Settings (`Docs.jsx` / `Settings.jsx`)**: Handles documentation directories and server IP LAN synchronization setups.

---

## 5. Client-Side PDF Generation & Action Engine

PDF files are compiled locally using `jsPDF` and `jspdf-autotable`. All invoices, POs, salary slips, and statement reports follow a unified brand styling:
*   **Header Branding:** Displays RAK Tech Soft Hub details and IT Infrastructure & Digital Creative Services tags.
*   **Autotable Layouts:** Custom column widths, right-aligned rates/amounts, and custom headers.
*   **PKR Formatting:** Auto-converts numbers to localized commas strings prefixing `Rs.` (e.g., `Rs. 1,25,000`).
*   **Signature Blocks:** Renders signature guidelines at the bottom of sheets (e.g. Authorized Signatures / Receiver Signatures).

### 5.1 Split Action Buttons Flow:
To optimize workflow and operations, all document lists across `Invoices.jsx`, `Purchases.jsx`, `Clients.jsx` (Quotations), `HR.jsx` (Salary Slips), and `Ledgers.jsx` (Ledger Statements) feature split actions:
1.  **Preview Action (👁️ Eye Icon):** Triggers the generation of the PDF document blob URL and renders it inside a premium glassmorphic modal containing an `iframe`.
2.  **Print Action (🖨️ Printer Icon):** Directly generates the PDF document and loads it inside a dynamically generated hidden `iframe` in the DOM. The `iframe.onload` event immediately triggers `iframe.contentWindow.print()` to launch the native system printing utility without displaying modal interfaces.
3.  **PDF Preview Modal Actions:** Inside the preview modal, the footer provides "Download PDF", "Print" (utilizing the hidden iframe print mechanic), and "Close Preview" buttons.


---

## 6. Build Commands & Bundling (electron-builder)

For upgrades, these commands are run in `/rak-erp` root directory:

*   **Install Node Packages**: `npm install`
*   **Development Server Mode**: `npm run dev` (Runs hot-reload Vite server and boots Electron)
*   **Production Bundling**: `npm run build` (Executes client compilation and runs electron-builder)
*   **Generated Installer Output Directory**: `dist-electron/release/Tech ERP Setup 0.0.0.exe`

---
*Prepared & Maintained by RAK Tech Soft Hub Group. © 2026 All Rights Reserved.*

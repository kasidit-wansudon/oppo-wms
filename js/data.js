/**
 * Data Layer & Helper Utilities
 * OPPO Warehouse Management System
 */

// ==================== DATA ====================
let products = [], pos = [], sos = [], subPOs = [], activities = [];
let editIdx = -1, editOrderIdx = -1, currentPOIdx = -1;

const FILTERS = {
  Category: ["Phone", "IOT", "Accessories", "Bundle", "Other"],
  Storage: ["8+128GB", "8+256GB", "12+256GB", "12+512GB", "16+512GB", "16+1TB", "N/A"],
  Color: ["BLACK", "WHITE", "BLUE", "GREEN", "PURPLE", "GOLD"],
  Network: ["OPEN", "TELCEL", "AT&T", "MOVISTAR", "N/A"]
};

// ==================== HELPERS ====================
const $ = id => document.getElementById(id);
const $v = id => $(id).value;
const $s = (id, v) => { $(id).value = v; };
const fmt = n => "฿" + Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN = n => Number(n).toLocaleString("th-TH");
const today = () => new Date().toISOString().split("T")[0];
const now = () => new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
const toggleModal = (id, show) => $(id).classList[show ? "add" : "remove"]("active");
const prodDisplay = p => `${p.code} - ${p.name} ${p.storage} ${p.color} ${p.network}`;
const prodShort = p => `${p.name} ${p.storage} ${p.color}`;
const statusBadge = s => `<span class="status-badge status-${s}">${s.toUpperCase()}</span>`;

// ==================== LOCAL STORAGE ====================
function saveData() {
  try {
    localStorage.setItem("wms_data", JSON.stringify({ products, pos, sos, subPOs, activities }));
  } catch (e) { }
}

function loadData() {
  try {
    const d = JSON.parse(localStorage.getItem("wms_data"));
    if (d) {
      products = d.products || [];
      pos = d.pos || [];
      sos = d.sos || [];
      subPOs = d.subPOs || [];
      activities = d.activities || [];
      return true;
    }
  } catch (e) { }
  return false;
}

// ==================== ACTIVITY LOG ====================
function logActivity(type, ref, details, status) {
  activities.unshift({ date: today(), time: now(), type, ref, details, status });
  if (activities.length > 100) activities.pop();
  saveData();
}

// ==================== DEFAULT DATA ====================
function loadDefaultData() {

  // ========== PRODUCTS (20 SKUs) ==========
  products = [
    // --- FIND X9 Series ---
    { code: "CPH2026", name: "FIND X9 PRO", brand: "OPPO", series: "FIND", category: "Phone", storage: "16+512GB", color: "BLACK", network: "OPEN", price: 25000, importPrice: 700, tax: "YES", taxRate: 16, customRate: 0, stock: 100, reorder: 20, status: "Enable" },
    { code: "CPH2026", name: "FIND X9 PRO", brand: "OPPO", series: "FIND", category: "Phone", storage: "16+512GB", color: "WHITE", network: "OPEN", price: 25000, importPrice: 700, tax: "YES", taxRate: 16, customRate: 0, stock: 80, reorder: 20, status: "Enable" },
    { code: "CPH2026", name: "FIND X9 PRO", brand: "OPPO", series: "FIND", category: "Phone", storage: "12+256GB", color: "BLACK", network: "TELCEL", price: 22000, importPrice: 650, tax: "YES", taxRate: 16, customRate: 0, stock: 150, reorder: 30, status: "Enable" },
    { code: "CPH2027", name: "FIND X9", brand: "OPPO", series: "FIND", category: "Phone", storage: "12+256GB", color: "BLUE", network: "OPEN", price: 20000, importPrice: 580, tax: "YES", taxRate: 16, customRate: 0, stock: 60, reorder: 20, status: "Enable" },
    { code: "CPH2027", name: "FIND X9", brand: "OPPO", series: "FIND", category: "Phone", storage: "12+256GB", color: "GREEN", network: "MOVISTAR", price: 20000, importPrice: 580, tax: "YES", taxRate: 16, customRate: 0, stock: 8, reorder: 20, status: "Enable" },   // low stock
    { code: "CPH2027", name: "FIND X9", brand: "OPPO", series: "FIND", category: "Phone", storage: "16+1TB", color: "BLACK", network: "OPEN", price: 30000, importPrice: 850, tax: "YES", taxRate: 16, customRate: 0, stock: 25, reorder: 10, status: "Enable" },

    // --- RENO 12 Series ---
    { code: "CPH2515", name: "RENO 12", brand: "OPPO", series: "RENO", category: "Phone", storage: "8+256GB", color: "BLUE", network: "OPEN", price: 18000, importPrice: 500, tax: "YES", taxRate: 16, customRate: 0, stock: 200, reorder: 40, status: "Enable" },
    { code: "CPH2515", name: "RENO 12", brand: "OPPO", series: "RENO", category: "Phone", storage: "8+256GB", color: "PURPLE", network: "TELCEL", price: 18000, importPrice: 500, tax: "YES", taxRate: 16, customRate: 0, stock: 5, reorder: 30, status: "Enable" },  // low stock
    { code: "CPH2515", name: "RENO 12", brand: "OPPO", series: "RENO", category: "Phone", storage: "12+512GB", color: "GREEN", network: "OPEN", price: 20000, importPrice: 560, tax: "YES", taxRate: 16, customRate: 0, stock: 90, reorder: 25, status: "Enable" },
    { code: "CPH2516", name: "RENO 12 PRO", brand: "OPPO", series: "RENO", category: "Phone", storage: "12+256GB", color: "GOLD", network: "OPEN", price: 22000, importPrice: 620, tax: "YES", taxRate: 16, customRate: 0, stock: 45, reorder: 20, status: "Enable" },
    { code: "CPH2516", name: "RENO 12 PRO", brand: "OPPO", series: "RENO", category: "Phone", storage: "12+256GB", color: "BLACK", network: "AT&T", price: 22000, importPrice: 620, tax: "YES", taxRate: 16, customRate: 0, stock: 0, reorder: 20, status: "Enable" },  // out of stock

    // --- A Series ---
    { code: "CPH2577", name: "A3 PRO", brand: "OPPO", series: "A", category: "Phone", storage: "8+128GB", color: "BLUE", network: "OPEN", price: 9500, importPrice: 260, tax: "YES", taxRate: 16, customRate: 0, stock: 350, reorder: 80, status: "Enable" },
    { code: "CPH2577", name: "A3 PRO", brand: "OPPO", series: "A", category: "Phone", storage: "8+128GB", color: "GREEN", network: "TELCEL", price: 9500, importPrice: 260, tax: "YES", taxRate: 16, customRate: 0, stock: 12, reorder: 50, status: "Enable" },  // low stock
    { code: "CPH2599", name: "A60", brand: "OPPO", series: "A", category: "Phone", storage: "8+256GB", color: "BLACK", network: "OPEN", price: 11000, importPrice: 300, tax: "YES", taxRate: 16, customRate: 0, stock: 180, reorder: 60, status: "Enable" },

    // --- IOT ---
    { code: "OPPO-PAD3", name: "OPPO Pad 3", brand: "OPPO", series: "PAD", category: "IOT", storage: "8+256GB", color: "BLUE", network: "N/A", price: 15000, importPrice: 420, tax: "YES", taxRate: 16, customRate: 0, stock: 40, reorder: 15, status: "Enable" },
    { code: "OPPO-BAND3", name: "OPPO Band 3", brand: "OPPO", series: "BAND", category: "IOT", storage: "N/A", color: "BLACK", network: "N/A", price: 2500, importPrice: 60, tax: "YES", taxRate: 16, customRate: 0, stock: 120, reorder: 30, status: "Enable" },
    { code: "OPPO-WATCH4", name: "OPPO Watch 4 Pro", brand: "OPPO", series: "WATCH", category: "IOT", storage: "N/A", color: "GOLD", network: "N/A", price: 8900, importPrice: 240, tax: "YES", taxRate: 16, customRate: 0, stock: 55, reorder: 20, status: "Enable" },

    // --- Accessories ---
    { code: "OPPO-WC65", name: "Wireless Charger 65W", brand: "OPPO", series: "", category: "Accessories", storage: "N/A", color: "WHITE", network: "N/A", price: 1200, importPrice: 30, tax: "YES", taxRate: 16, customRate: 0, stock: 300, reorder: 50, status: "Enable" },
    { code: "OPPO-CABLE240", name: "SuperVOOC Cable 240W", brand: "OPPO", series: "", category: "Accessories", storage: "N/A", color: "WHITE", network: "N/A", price: 450, importPrice: 10, tax: "YES", taxRate: 16, customRate: 0, stock: 500, reorder: 100, status: "Enable" },

    // --- Bundle ---
    { code: "BUNDLE-X9-WC", name: "FIND X9 PRO + Charger Bundle", brand: "OPPO", series: "FIND", category: "Bundle", storage: "16+512GB", color: "BLACK", network: "OPEN", price: 26000, importPrice: 730, tax: "YES", taxRate: 16, customRate: 0, stock: 30, reorder: 10, status: "Enable" },
  ];

  // ========== PURCHASE ORDERS (12 POs) ==========
  pos = [
    // Completed POs
    { number: "PO-2026-001", supplier: "OPPO Factory SZ", date: "2026-01-10", delivery: "2026-01-25", productId: 0, quantity: 50, unitPrice: 23000, total: 1150000, status: "completed", notes: "Q1 initial stock for FIND X9 PRO BLACK", subPOs: [0, 1] },
    { number: "PO-2026-002", supplier: "OPPO Factory SZ", date: "2026-01-15", delivery: "2026-01-30", productId: 1, quantity: 100, unitPrice: 23000, total: 2300000, status: "completed", notes: "Q1 stock FIND X9 PRO WHITE", subPOs: [2] },
    { number: "PO-2026-003", supplier: "OPPO Accessories HK", date: "2026-01-20", delivery: "2026-02-05", productId: 17, quantity: 200, unitPrice: 1000, total: 200000, status: "completed", notes: "Charger restock", subPOs: [3] },
    { number: "PO-2026-004", supplier: "OPPO Factory SZ", date: "2026-02-01", delivery: "2026-02-18", productId: 6, quantity: 300, unitPrice: 16000, total: 4800000, status: "completed", notes: "RENO 12 BLUE OPEN large batch for TELCEL deal", subPOs: [4, 5] },

    // Approved / In-transit POs
    { number: "PO-2026-005", supplier: "OPPO Factory SZ", date: "2026-02-20", delivery: "2026-03-10", productId: 9, quantity: 80, unitPrice: 20000, total: 1600000, status: "approved", notes: "RENO 12 PRO GOLD for luxury promo", subPOs: [6] },
    { number: "PO-2026-006", supplier: "OPPO Factory GZ", date: "2026-03-01", delivery: "2026-03-18", productId: 11, quantity: 500, unitPrice: 8500, total: 4250000, status: "approved", notes: "A3 PRO BLUE OPEN mass market Q1", subPOs: [7] },
    { number: "PO-2026-007", supplier: "OPPO IOT Division", date: "2026-03-05", delivery: "2026-03-22", productId: 14, quantity: 60, unitPrice: 13500, total: 810000, status: "approved", notes: "OPPO Pad 3 restock", subPOs: [] },

    // Pending POs
    { number: "PO-2026-008", supplier: "OPPO Factory SZ", date: "2026-03-10", delivery: "2026-04-01", productId: 3, quantity: 100, unitPrice: 18500, total: 1850000, status: "pending", notes: "FIND X9 BLUE OPEN - awaiting approval", subPOs: [] },
    { number: "PO-2026-009", supplier: "OPPO Factory SZ", date: "2026-03-10", delivery: "2026-04-05", productId: 7, quantity: 150, unitPrice: 16500, total: 2475000, status: "pending", notes: "Emergency restock RENO 12 PURPLE TELCEL - low stock", subPOs: [] },
    { number: "PO-2026-010", supplier: "OPPO Accessories HK", date: "2026-03-12", delivery: "2026-04-10", productId: 18, quantity: 1000, unitPrice: 380, total: 380000, status: "pending", notes: "SuperVOOC Cable bulk order", subPOs: [] },
    { number: "PO-2026-011", supplier: "OPPO Factory SZ", date: "2026-03-14", delivery: "2026-04-15", productId: 19, quantity: 50, unitPrice: 24500, total: 1225000, status: "pending", notes: "Bundle package for TELCEL promo campaign", subPOs: [] },

    // Cancelled PO (edge case)
    { number: "PO-2026-012", supplier: "OPPO Factory GZ", date: "2026-02-15", delivery: "2026-03-01", productId: 10, quantity: 80, unitPrice: 20000, total: 1600000, status: "cancelled", notes: "Cancelled - RENO 12 PRO AT&T deal fell through", subPOs: [] },
  ];

  // ========== SUB-POs (12 records) ==========
  subPOs = [
    // PO-2026-001 (index 0) - 2 sub-batches
    { poIndex: 0, subPONo: "SPO-2026-001-A", systemNo: "SYS-001", invoiceNo: "CI19369126830", ladingNo: "A26765436926", pedimentoNo: "P21675497692", arrivalDate: "2026-01-24", inboundDate: "2026-01-25", status: "Inbound Completed", quantity: 30, details: "First batch - air freight express" },
    { poIndex: 0, subPONo: "SPO-2026-001-B", systemNo: "SYS-002", invoiceNo: "CI19369126831", ladingNo: "A26765436927", pedimentoNo: "P21675497693", arrivalDate: "2026-01-30", inboundDate: "2026-01-31", status: "Inbound Completed", quantity: 20, details: "Second batch - sea freight" },

    // PO-2026-002 (index 1) - 1 sub-batch
    { poIndex: 1, subPONo: "SPO-2026-002-A", systemNo: "SYS-003", invoiceNo: "CI19369126832", ladingNo: "A26765436928", pedimentoNo: "P21675497694", arrivalDate: "2026-01-29", inboundDate: "2026-01-30", status: "Inbound Completed", quantity: 100, details: "Full shipment - sea freight" },

    // PO-2026-003 (index 2) - 1 sub-batch
    { poIndex: 2, subPONo: "SPO-2026-003-A", systemNo: "SYS-004", invoiceNo: "CI29001234567", ladingNo: "B10000000001", pedimentoNo: "P30000000001", arrivalDate: "2026-02-04", inboundDate: "2026-02-05", status: "Inbound Completed", quantity: 200, details: "Accessories full batch" },

    // PO-2026-004 (index 3) - 2 sub-batches
    { poIndex: 3, subPONo: "SPO-2026-004-A", systemNo: "SYS-005", invoiceNo: "CI29001234568", ladingNo: "B10000000002", pedimentoNo: "P30000000002", arrivalDate: "2026-02-16", inboundDate: "2026-02-17", status: "Inbound Completed", quantity: 150, details: "RENO 12 first batch" },
    { poIndex: 3, subPONo: "SPO-2026-004-B", systemNo: "SYS-006", invoiceNo: "CI29001234569", ladingNo: "B10000000003", pedimentoNo: "P30000000003", arrivalDate: "2026-02-18", inboundDate: "2026-02-19", status: "Inbound Completed", quantity: 150, details: "RENO 12 second batch" },

    // PO-2026-005 (index 4) - partial inbound
    { poIndex: 4, subPONo: "SPO-2026-005-A", systemNo: "SYS-007", invoiceNo: "CI29001234570", ladingNo: "B10000000004", pedimentoNo: "P30000000004", arrivalDate: "2026-03-08", inboundDate: "2026-03-09", status: "Partial Inbound", quantity: 40, details: "First 40 units arrived - remaining 40 pending customs" },

    // PO-2026-006 (index 5) - pending inbound
    { poIndex: 5, subPONo: "SPO-2026-006-A", systemNo: "SYS-008", invoiceNo: "CI29001234571", ladingNo: "B10000000005", pedimentoNo: "", arrivalDate: "2026-03-17", inboundDate: "", status: "Pending Inbound", quantity: 500, details: "Full batch in transit - ETA March 17" },

    // PO-2026-007 (index 6) - no sub-PO yet (edge case: no subPOs array entry)
  ];

  // ========== SALES ORDERS (16 SOs) ==========
  sos = [
    // Completed SOs
    { number: "SO-2026-001", customer: "TELCEL", date: "2026-01-20", delivery: "2026-01-28", productId: 2, quantity: 50, unitPrice: 22000, total: 1100000, status: "completed", notes: "TELCEL Q1 flagship order" },
    { number: "SO-2026-002", customer: "MOVISTAR", date: "2026-01-25", delivery: "2026-02-05", productId: 6, quantity: 80, unitPrice: 18000, total: 1440000, status: "completed", notes: "RENO 12 promo bundle MOVISTAR" },
    { number: "SO-2026-003", customer: "AT&T Mexico", date: "2026-02-03", delivery: "2026-02-15", productId: 0, quantity: 20, unitPrice: 25000, total: 500000, status: "completed", notes: "FIND X9 PRO flagship display units" },
    { number: "SO-2026-004", customer: "TELCEL", date: "2026-02-10", delivery: "2026-02-20", productId: 11, quantity: 200, unitPrice: 9000, total: 1800000, status: "completed", notes: "A3 PRO mass market push" },
    { number: "SO-2026-005", customer: "MOVISTAR", date: "2026-02-18", delivery: "2026-03-01", productId: 17, quantity: 100, unitPrice: 1100, total: 110000, status: "completed", notes: "Charger accessories bundle" },

    // Approved SOs
    { number: "SO-2026-006", customer: "TELCEL", date: "2026-03-01", delivery: "2026-03-15", productId: 6, quantity: 60, unitPrice: 18000, total: 1080000, status: "approved", notes: "RENO 12 second wave TELCEL" },
    { number: "SO-2026-007", customer: "AT&T Mexico", date: "2026-03-03", delivery: "2026-03-17", productId: 9, quantity: 30, unitPrice: 22000, total: 660000, status: "approved", notes: "RENO 12 PRO premium tier" },
    { number: "SO-2026-008", customer: "MOVISTAR", date: "2026-03-05", delivery: "2026-03-20", productId: 14, quantity: 20, unitPrice: 15000, total: 300000, status: "approved", notes: "OPPO Pad 3 corp order" },
    { number: "SO-2026-009", customer: "Other", date: "2026-03-06", delivery: "2026-03-21", productId: 16, quantity: 30, unitPrice: 8500, total: 255000, status: "approved", notes: "OPPO Watch 4 Pro retail chain" },

    // Pending SOs
    { number: "SO-2026-010", customer: "TELCEL", date: "2026-03-08", delivery: "2026-03-22", productId: 2, quantity: 30, unitPrice: 22000, total: 660000, status: "pending", notes: "Awaiting warehouse confirmation" },
    { number: "SO-2026-011", customer: "AT&T Mexico", date: "2026-03-12", delivery: "2026-03-26", productId: 3, quantity: 50, unitPrice: 18000, total: 900000, status: "pending", notes: "FIND X9 BLUE - stock incoming PO-008" },
    { number: "SO-2026-012", customer: "MOVISTAR", date: "2026-03-14", delivery: "2026-03-28", productId: 0, quantity: 20, unitPrice: 25000, total: 500000, status: "pending", notes: "FIND X9 PRO reorder" },
    { number: "SO-2026-013", customer: "TELCEL", date: "2026-03-14", delivery: "2026-04-01", productId: 19, quantity: 25, unitPrice: 26000, total: 650000, status: "pending", notes: "Bundle promo package" },

    // Cancelled SO (edge case)
    { number: "SO-2026-014", customer: "Other", date: "2026-02-28", delivery: "2026-03-10", productId: 7, quantity: 40, unitPrice: 18000, total: 720000, status: "cancelled", notes: "Customer cancelled - budget cut" },

    // Shipped SO
    { number: "SO-2026-015", customer: "TELCEL", date: "2026-03-10", delivery: "2026-03-18", productId: 8, quantity: 40, unitPrice: 20000, total: 800000, status: "shipped", notes: "RENO 12 512GB GREEN en route to TELCEL DC" },

    // On-hold SO (stock conflict)
    { number: "SO-2026-016", customer: "AT&T Mexico", date: "2026-03-15", delivery: "2026-04-05", productId: 10, quantity: 30, unitPrice: 22000, total: 660000, status: "pending", notes: "RENO 12 PRO BLACK AT&T - out of stock, waiting PO-009" },
  ];

  // ========== ACTIVITIES (24 records) ==========
  activities = [
    // March 2026
    { date: "2026-03-15", time: "17:45", type: "SO", ref: "SO-2026-016", details: "Created SO: RENO 12 PRO BLACK AT&T x30 — stock 0, linked to PO-009", status: "pending" },
    { date: "2026-03-15", time: "15:30", type: "ALERT", ref: "STOCK", details: "Low stock alert: RENO 12 PURPLE TELCEL — 5 units remaining (reorder: 30)", status: "warning" },
    { date: "2026-03-14", time: "16:30", type: "SO", ref: "SO-2026-012", details: "Created SO: FIND X9 PRO 16+512GB BLACK OPEN x20", status: "pending" },
    { date: "2026-03-14", time: "14:00", type: "SO", ref: "SO-2026-013", details: "Created SO: FIND X9 PRO Bundle x25 — promo TELCEL", status: "pending" },
    { date: "2026-03-12", time: "14:20", type: "SO", ref: "SO-2026-011", details: "Created SO: FIND X9 BLUE AT&T x50 — pending stock from PO-008", status: "pending" },
    { date: "2026-03-12", time: "11:10", type: "PO", ref: "PO-2026-011", details: "Created PO: FIND X9 PRO Bundle x50 from OPPO Factory SZ", status: "pending" },
    { date: "2026-03-10", time: "13:45", type: "SO", ref: "SO-2026-015", details: "Shipped: RENO 12 12+512GB GREEN x40 to TELCEL DC", status: "shipped" },
    { date: "2026-03-10", time: "11:00", type: "PO", ref: "PO-2026-010", details: "Created PO: SuperVOOC Cable 240W x1000 from OPPO Accessories HK", status: "pending" },
    { date: "2026-03-09", time: "10:30", type: "INBOUND", ref: "SPO-2026-005-A", details: "Partial inbound: RENO 12 PRO GOLD x40 received — 40 pending customs", status: "partial" },
    { date: "2026-03-08", time: "09:15", type: "SO", ref: "SO-2026-010", details: "Created SO: FIND X9 PRO 12+256GB BLACK TELCEL x30", status: "pending" },
    { date: "2026-03-06", time: "16:00", type: "SO", ref: "SO-2026-009", details: "Approved SO: OPPO Watch 4 Pro GOLD x30", status: "approved" },
    { date: "2026-03-05", time: "14:30", type: "PO", ref: "PO-2026-009", details: "Created PO: RENO 12 PURPLE TELCEL x150 — emergency restock", status: "pending" },
    { date: "2026-03-05", time: "13:00", type: "SO", ref: "SO-2026-008", details: "Approved SO: OPPO Pad 3 BLUE x20 — MOVISTAR corp", status: "approved" },
    { date: "2026-03-03", time: "11:30", type: "SO", ref: "SO-2026-007", details: "Approved SO: RENO 12 PRO GOLD x30 — AT&T premium", status: "approved" },
    { date: "2026-03-01", time: "10:00", type: "SO", ref: "SO-2026-006", details: "Approved SO: RENO 12 BLUE x60 — TELCEL second wave", status: "approved" },
    { date: "2026-03-01", time: "08:30", type: "PO", ref: "PO-2026-008", details: "Created PO: FIND X9 BLUE OPEN x100 — awaiting approval", status: "pending" },

    // February 2026
    { date: "2026-02-19", time: "15:00", type: "INBOUND", ref: "SPO-2026-004-B", details: "Inbound completed: RENO 12 BLUE OPEN x150 — PO-2026-004 fully received", status: "completed" },
    { date: "2026-02-18", time: "09:00", type: "SO", ref: "SO-2026-005", details: "Fulfilled SO: Wireless Charger 65W x100 to MOVISTAR", status: "completed" },
    { date: "2026-02-15", time: "16:00", type: "PO", ref: "PO-2026-012", details: "Cancelled PO: RENO 12 PRO AT&T x80 — deal cancelled", status: "cancelled" },
    { date: "2026-02-10", time: "10:30", type: "SO", ref: "SO-2026-004", details: "Fulfilled SO: A3 PRO BLUE OPEN x200 to TELCEL", status: "completed" },
    { date: "2026-02-05", time: "14:00", type: "INBOUND", ref: "SPO-2026-003-A", details: "Inbound completed: Wireless Charger 65W x200 — PO-2026-003 done", status: "completed" },
    { date: "2026-02-03", time: "11:00", type: "SO", ref: "SO-2026-003", details: "Fulfilled SO: FIND X9 PRO BLACK x20 to AT&T Mexico", status: "completed" },

    // January 2026
    { date: "2026-01-31", time: "09:00", type: "INBOUND", ref: "SPO-2026-002-A", details: "Inbound completed: FIND X9 PRO WHITE x100 — PO-2026-002 done", status: "completed" },
    { date: "2026-01-20", time: "08:00", type: "SO", ref: "SO-2026-001", details: "Fulfilled SO: FIND X9 PRO 12+256GB TELCEL x50 to TELCEL", status: "completed" },
  ];

  saveData();
}

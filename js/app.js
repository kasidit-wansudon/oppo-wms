/**
 * Main Application Logic
 * OPPO Warehouse Management System
 */

// ==================== TABLE FILTER ====================
function filterTable(tableId, searchId) {
  const s = $(searchId).value.toLowerCase();
  document.querySelectorAll(`#${tableId} tbody tr`).forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(s) ? "" : "none";
  });
}

function buildFilterSelects(prefix) {
  const c = $(`${prefix}Filters`);
  c.innerHTML = Object.entries(FILTERS).map(([label, opts]) =>
    `<div class="form-group"><label>${label}</label>
    <select id="${prefix}F_${label}" onchange="filterOrderProducts('${prefix}')">
    <option value="">All ${label}</option>${opts.map(o => `<option value="${o}">${o}</option>`).join("")}</select></div>`
  ).join("");
}

function filterOrderProducts(prefix) {
  const sel = $(`${prefix}Product`);
  sel.innerHTML = '<option value="">เลือก Product</option>';
  products.forEach((p, i) => {
    if (p.status === "Disable") return;
    const match = Object.keys(FILTERS).every(k => {
      const v = $(`${prefix}F_${k}`).value;
      const field = {Category:"category", Storage:"storage", Color:"color", Network:"network"}[k];
      return !v || p[field] === v;
    });
    if (match) sel.innerHTML += `<option value="${i}">${prodDisplay(p)}</option>`;
  });
}

// ==================== ACTIVITY TABLE ====================
function renderActivityTable() {
  const tbody = $("activityTable").querySelector("tbody");
  if (!activities.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text2)">No recent activities</td></tr>';
    return;
  }
  tbody.innerHTML = activities.slice(0, 20).map(a => {
    const typeColor = {PO:"pri", SO:"ok", Product:"text", Inventory:"warn", "Sub-PO":"pri"}[a.type] || "text";
    return `<tr><td>${a.date}</td><td>${a.time}</td><td style="color:var(--${typeColor});font-weight:500">${a.type}</td><td>${a.ref}</td><td>${a.details}</td><td>${statusBadge(a.status)}</td></tr>`;
  }).join("");
}

// ==================== TAB ====================
function switchTab(tab) {
  document.querySelectorAll(".content-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
  $(tab).classList.add("active");
  event.target.classList.add("active");
  if (tab === "dashboard") updateDashboard();
  if (tab === "reports") generateReport();
}

// ==================== DASHBOARD ====================
function updateDashboard() {
  $("totalProducts").textContent = products.filter(p => p.status !== "Disable").length;
  $("activePO").textContent = pos.filter(p => p.status === "pending" || p.status === "approved").length;
  $("activeSO").textContent = sos.filter(s => s.status === "pending" || s.status === "approved").length;
  $("totalValue").textContent = fmt(products.reduce((s, p) => s + p.price * p.stock, 0));

  const lowCount = products.filter(p => {
    const reserved = sos.filter(s => s.productId === products.indexOf(p) && (s.status === "pending" || s.status === "approved")).reduce((s, o) => s + o.quantity, 0);
    return (p.stock - reserved) <= p.reorder && p.status !== "Disable";
  }).length;
  $("lowStockCount").textContent = lowCount;

  const pendingVal = pos.filter(p => p.status === "pending" || p.status === "approved").reduce((s, p) => s + p.total, 0);
  $("pendingPOValue").textContent = fmt(pendingVal);

  renderActivityTable();
  renderLowStockAlerts();
}

function renderLowStockAlerts() {
  const tbody = $("lowStockAlertTable").querySelector("tbody");
  const alerts = [];
  products.forEach((p, i) => {
    if (p.status === "Disable") return;
    const reserved = sos.filter(s => s.productId === i && (s.status === "pending" || s.status === "approved")).reduce((s, o) => s + o.quantity, 0);
    const avail = p.stock - reserved;
    if (avail <= p.reorder) alerts.push({...p, avail, deficit: p.reorder - avail});
  });
  if (!alerts.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text2)">✅ All stock levels are healthy</td></tr>';
    return;
  }
  tbody.innerHTML = alerts.map(a =>
    `<tr class="alert-row"><td>${a.code}</td><td>${a.name}</td><td>${a.storage}</td><td>${a.color}</td><td>${a.avail}</td><td>${a.reorder}</td><td style="color:var(--err);font-weight:600">${a.deficit > 0 ? "-" + a.deficit : "At Limit"}</td></tr>`
  ).join("");
}

// ==================== PRODUCT ====================
function renderProductTable() {
  $("productTable").querySelector("tbody").innerHTML = products.map((p, i) =>
    `<tr><td>${p.code}</td><td>${p.name}</td><td>${p.brand}</td><td>${p.series || "-"}</td>
    <td>${p.category}</td><td>${p.storage}</td><td>${p.color}</td><td>${p.network}</td>
    <td>${fmt(p.price)}</td><td>${p.importPrice ? "$" + p.importPrice : "-"}</td><td>${fmtN(p.stock)}</td><td>${p.reorder}</td>
    <td>${statusBadge(p.status === "Enable" ? "approved" : "cancelled")}</td>
    <td><button class="btn btn-secondary action-btn" onclick="editProduct(${i})">Edit</button>
    <button class="btn btn-danger action-btn" onclick="deleteProduct(${i})">Delete</button></td></tr>`
  ).join("");
  filterOrderProducts("po");
  filterOrderProducts("so");
}

function openProductModal() {
  editIdx = -1;
  $("productModalTitle").textContent = "เพิ่ม Product ใหม่";
  ["category","storage","color","network"].forEach(id => $s(id, ""));
  $s("brand","OPPO"); $s("series",""); $s("productCode",""); $s("productName","");
  $s("unitPrice",""); $s("importPrice",""); $s("tax","NO"); $s("taxRate","0");
  $s("customRate","0"); $s("initialStock","0"); $s("reorderLevel","10"); $s("pStatus","Enable");
  toggleModal("productModal", true);
}

function saveProduct(e) {
  e.preventDefault();
  const p = {
    code: $v("productCode"), name: $v("productName"), brand: $v("brand"), series: $v("series"),
    category: $v("category"), storage: $v("storage"), color: $v("color"), network: $v("network"),
    price: parseFloat($v("unitPrice")), importPrice: parseFloat($v("importPrice")) || 0,
    tax: $v("tax"), taxRate: parseFloat($v("taxRate")) || 0, customRate: parseFloat($v("customRate")) || 0,
    stock: editIdx >= 0 ? products[editIdx].stock : parseInt($v("initialStock")),
    reorder: parseInt($v("reorderLevel")), status: $v("pStatus")
  };
  if (editIdx >= 0) {
    products[editIdx] = {...products[editIdx], ...p, stock: products[editIdx].stock};
    if (editIdx === -1) p.stock = parseInt($v("initialStock"));
    logActivity("Product", p.code, `Updated: ${p.name} ${p.storage} ${p.color}`, "completed");
  } else {
    p.stock = parseInt($v("initialStock"));
    products.push(p);
    logActivity("Product", p.code, `Added: ${p.name} ${p.storage} ${p.color}`, "completed");
  }
  renderProductTable(); renderInventoryTable(); updateDashboard();
  toggleModal("productModal", false); saveData();
}

function editProduct(i) {
  editIdx = i;
  const p = products[i];
  $("productModalTitle").textContent = "แก้ไข Product: " + p.code;
  $s("category",p.category); $s("brand",p.brand); $s("series",p.series);
  $s("productCode",p.code); $s("productName",p.name); $s("storage",p.storage);
  $s("color",p.color); $s("network",p.network); $s("unitPrice",p.price);
  $s("importPrice",p.importPrice||0); $s("tax",p.tax||"NO"); $s("taxRate",p.taxRate||0);
  $s("customRate",p.customRate||0); $s("initialStock",p.stock); $s("reorderLevel",p.reorder);
  $s("pStatus",p.status||"Enable");
  toggleModal("productModal", true);
}

function deleteProduct(i) {
  const p = products[i];
  const hasOrders = pos.some(o => o.productId === i && o.status !== "cancelled") || sos.some(o => o.productId === i && o.status !== "cancelled");
  if (hasOrders) { alert("ไม่สามารถลบได้ เนื่องจากมี PO/SO ที่เกี่ยวข้อง"); return; }
  if (confirm(`ต้องการลบ ${p.name} ${p.storage} ${p.color} หรือไม่?`)) {
    logActivity("Product", p.code, `Deleted: ${p.name} ${p.storage} ${p.color}`, "cancelled");
    products.splice(i, 1);
    pos.forEach(o => { if (o.productId > i) o.productId--; else if (o.productId === i) o.productId = -1; });
    sos.forEach(o => { if (o.productId > i) o.productId--; else if (o.productId === i) o.productId = -1; });
    renderProductTable(); renderPOTable(); renderSOTable(); renderInventoryTable(); updateDashboard(); saveData();
  }
}

// ==================== ORDER (PO/SO) ====================
function updateOrderProduct(prefix) {
  const pid = parseInt($v(`${prefix}Product`));
  const p = products[pid];
  $s(`${prefix}UnitPrice`, p ? p.price : "");
  updateOrderTotal(prefix);
}

function updateOrderTotal(prefix) {
  const q = parseFloat($v(`${prefix}Quantity`)) || 0;
  const u = parseFloat($v(`${prefix}UnitPrice`)) || 0;
  $s(`${prefix}Total`, (q * u).toFixed(2));
}

function openOrderModal(prefix) {
  editOrderIdx = -1;
  const data = prefix === "po" ? pos : sos;
  const num = `${prefix.toUpperCase()}-${new Date().getFullYear()}-${String(data.length + 1).padStart(3, "0")}`;
  $s(`${prefix}Number`, num); $s(`${prefix}Date`, today());
  if (prefix === "po") { $s("supplier",""); $s("expectedDelivery",""); }
  else { $s("customer",""); $s("deliveryDate",""); }
  $s(`${prefix}Product`,""); $s(`${prefix}Quantity`,""); $s(`${prefix}UnitPrice`,""); $s(`${prefix}Total`,""); $s(`${prefix}Notes`,"");
  Object.keys(FILTERS).forEach(k => $s(`${prefix}F_${k}`, ""));
  toggleModal(`${prefix}Modal`, true);
  filterOrderProducts(prefix);
}

function saveOrder(e, prefix) {
  e.preventDefault();
  const isPO = prefix === "po";
  const order = {
    number: $v(`${prefix}Number`),
    [isPO ? "supplier" : "customer"]: $v(isPO ? "supplier" : "customer"),
    date: $v(`${prefix}Date`),
    delivery: $v(isPO ? "expectedDelivery" : "deliveryDate"),
    productId: parseInt($v(`${prefix}Product`)),
    quantity: parseInt($v(`${prefix}Quantity`)),
    unitPrice: parseFloat($v(`${prefix}UnitPrice`)),
    total: parseFloat($v(`${prefix}Total`)),
    status: "pending",
    notes: $v(`${prefix}Notes`)
  };
  const p = products[order.productId];
  if (isPO) {
    order.subPOs = [];
    pos.push(order);
    logActivity("PO", order.number, `Created PO: ${p ? prodShort(p) : "N/A"} x${order.quantity}`, "pending");
    renderPOTable();
  } else {
    if (p) {
      const reserved = sos.filter(s => s.productId === order.productId && (s.status === "pending" || s.status === "approved")).reduce((s,o) => s + o.quantity, 0);
      if (p.stock - reserved < order.quantity) { alert(`สต็อกไม่เพียงพอ! Available: ${p.stock - reserved}`); return; }
    }
    sos.push(order);
    logActivity("SO", order.number, `Created SO: ${p ? prodShort(p) : "N/A"} x${order.quantity}`, "pending");
    renderSOTable();
  }
  updateDashboard(); toggleModal(`${prefix}Modal`, false); saveData();
}

// ==================== PO TABLE ====================
function renderPOTable() {
  $("poTable").querySelector("tbody").innerHTML = pos.map((po, i) => {
    const p = products[po.productId];
    return `<tr><td><a href="#" onclick="viewOrderDetail('po',${i});return false" style="color:var(--pri);text-decoration:none;font-weight:500">${po.number}</a></td>
    <td>${po.supplier}</td><td>${p ? prodShort(p) : '<span style="color:var(--err)">N/A</span>'}</td>
    <td>${po.date}</td><td>${po.delivery || "-"}</td><td>${fmtN(po.quantity)}</td><td>${fmt(po.unitPrice)}</td><td>${fmt(po.total)}</td>
    <td>${statusBadge(po.status)}</td>
    <td>
      <button class="btn btn-secondary action-btn" onclick="viewSubPOs(${i})">Sub-POs (${po.subPOs ? po.subPOs.length : 0})</button>
      ${po.status === "pending" ? `<button class="btn btn-warning action-btn" onclick="approveOrder('po',${i})">Approve</button>` : ""}
      ${po.status !== "completed" && po.status !== "cancelled" ? `<button class="btn btn-primary action-btn" onclick="receivePO(${i})">Receive</button>` : ""}
      ${po.status !== "completed" && po.status !== "cancelled" ? `<button class="btn btn-danger action-btn" onclick="cancelOrder('po',${i})">Cancel</button>` : ""}
    </td></tr>`;
  }).join("");
}

function approveOrder(type, i) {
  const orders = type === "po" ? pos : sos;
  const o = orders[i];
  if (o.status !== "pending") return;
  o.status = "approved";
  logActivity(type.toUpperCase(), o.number, `Approved ${type.toUpperCase()}`, "approved");
  type === "po" ? renderPOTable() : renderSOTable();
  updateDashboard(); saveData();
}

function receivePO(i) {
  const po = pos[i], p = products[po.productId];
  if (!p) { alert("Product not found!"); return; }
  if (confirm(`รับสินค้า ${po.quantity} ชิ้น เข้าคลัง?`)) {
    p.stock += po.quantity;
    po.status = "completed";
    logActivity("PO", po.number, `Received: ${prodShort(p)} x${po.quantity} → Stock: ${p.stock}`, "completed");
    logActivity("Inventory", p.code, `Stock IN +${po.quantity} from ${po.number}`, "completed");
    renderPOTable(); renderProductTable(); renderInventoryTable(); updateDashboard(); saveData();
    alert("✅ รับสินค้าเข้าคลังสำเร็จ!");
  }
}

// ==================== SO TABLE ====================
function renderSOTable() {
  $("soTable").querySelector("tbody").innerHTML = sos.map((so, i) => {
    const p = products[so.productId];
    return `<tr><td><a href="#" onclick="viewOrderDetail('so',${i});return false" style="color:var(--pri);text-decoration:none;font-weight:500">${so.number}</a></td>
    <td>${so.customer}</td><td>${p ? prodShort(p) : '<span style="color:var(--err)">N/A</span>'}</td>
    <td>${so.date}</td><td>${so.delivery || "-"}</td><td>${fmtN(so.quantity)}</td><td>${fmt(so.unitPrice)}</td><td>${fmt(so.total)}</td>
    <td>${statusBadge(so.status)}</td>
    <td>
      ${so.status === "pending" ? `<button class="btn btn-warning action-btn" onclick="approveOrder('so',${i})">Approve</button>` : ""}
      ${so.status !== "completed" && so.status !== "cancelled" ? `<button class="btn btn-primary action-btn" onclick="fulfillSO(${i})">Fulfill</button>` : ""}
      ${so.status !== "completed" && so.status !== "cancelled" ? `<button class="btn btn-danger action-btn" onclick="cancelOrder('so',${i})">Cancel</button>` : ""}
    </td></tr>`;
  }).join("");
}

function fulfillSO(i) {
  const so = sos[i], p = products[so.productId];
  if (!p) { alert("Product not found!"); return; }
  if (p.stock < so.quantity) { alert(`สต็อกไม่เพียงพอ! Current: ${p.stock}`); return; }
  if (confirm(`จัดส่งสินค้า ${so.quantity} ชิ้น?`)) {
    p.stock -= so.quantity;
    so.status = "completed";
    logActivity("SO", so.number, `Fulfilled: ${prodShort(p)} x${so.quantity} → Stock: ${p.stock}`, "completed");
    logActivity("Inventory", p.code, `Stock OUT -${so.quantity} from ${so.number}`, "completed");
    renderSOTable(); renderProductTable(); renderInventoryTable(); updateDashboard(); saveData();
    alert("✅ จัดส่งสินค้าสำเร็จ!");
  }
}

function cancelOrder(type, i) {
  const label = type === "po" ? "PO" : "SO";
  if (confirm(`ต้องการยกเลิก ${label} นี้หรือไม่?`)) {
    const orders = type === "po" ? pos : sos;
    orders[i].status = "cancelled";
    logActivity(label, orders[i].number, `Cancelled ${label}`, "cancelled");
    type === "po" ? renderPOTable() : renderSOTable();
    updateDashboard(); saveData();
  }
}

// ==================== ORDER DETAIL VIEW ====================
function viewOrderDetail(type, i) {
  const isPO = type === "po";
  const o = isPO ? pos[i] : sos[i];
  const p = products[o.productId];
  $("detailModalTitle").textContent = `${type.toUpperCase()} Detail: ${o.number}`;
  let html = `<div class="form-grid" style="background:var(--sec);padding:var(--sp16);border-radius:var(--r);margin-bottom:var(--sp16)">
    <div><strong>${type.toUpperCase()} Number:</strong><br>${o.number}</div>
    <div><strong>${isPO ? "Supplier" : "Customer"}:</strong><br>${isPO ? o.supplier : o.customer}</div>
    <div><strong>Order Date:</strong><br>${o.date}</div>
    <div><strong>${isPO ? "Expected Delivery" : "Delivery Date"}:</strong><br>${o.delivery || "-"}</div>
    <div><strong>Product:</strong><br>${p ? prodDisplay(p) : "N/A"}</div>
    <div><strong>Quantity:</strong><br>${fmtN(o.quantity)}</div>
    <div><strong>Unit Price:</strong><br>${fmt(o.unitPrice)}</div>
    <div><strong>Total:</strong><br>${fmt(o.total)}</div>
    <div><strong>Status:</strong><br>${statusBadge(o.status)}</div>
    ${o.notes ? `<div style="grid-column:1/-1"><strong>Notes:</strong><br>${o.notes}</div>` : ""}
  </div>`;

  if (isPO && o.subPOs && o.subPOs.length) {
    html += `<h3 class="section-title">Sub-POs</h3>`;
    o.subPOs.forEach(id => {
      const s = subPOs[id];
      if (!s) return;
      html += `<div class="sub-po-item"><div class="sub-po-header"><span>${s.subPONo}</span>${statusBadge(s.status === "Inbound Completed" ? "completed" : s.status === "Partial Inbound" ? "approved" : "pending")}</div>
      <div class="sub-po-grid">
        <div><div class="sub-po-label">Quantity</div><div class="sub-po-value">${s.quantity}</div></div>
        <div><div class="sub-po-label">Invoice</div><div class="sub-po-value">${s.invoiceNo || "-"}</div></div>
        <div><div class="sub-po-label">Arrival</div><div class="sub-po-value">${s.arrivalDate || "-"}</div></div>
        <div><div class="sub-po-label">Inbound</div><div class="sub-po-value">${s.inboundDate || "-"}</div></div>
      </div></div>`;
    });
  }
  $("detailContent").innerHTML = html;
  toggleModal("detailModal", true);
}

// ==================== INVENTORY ====================
function renderInventoryTable() {
  $("inventoryTable").querySelector("tbody").innerHTML = products.map((p, i) => {
    if (p.status === "Disable") return "";
    const reserved = sos.filter(s => s.productId === i && (s.status === "pending" || s.status === "approved")).reduce((s, o) => s + o.quantity, 0);
    const incoming = pos.filter(o => o.productId === i && (o.status === "pending" || o.status === "approved")).reduce((s, o) => s + o.quantity, 0);
    const avail = p.stock - reserved;
    const low = avail <= p.reorder;
    return `<tr class="${low ? "alert-row" : ""}"><td>${p.code}</td><td>${p.name}</td><td>${p.storage}</td><td>${p.color}</td><td>${p.network}</td>
    <td>${fmtN(p.stock)}</td><td>${reserved > 0 ? fmtN(reserved) : "-"}</td><td>${incoming > 0 ? fmtN(incoming) : "-"}</td><td>${fmtN(avail)}</td><td>${p.reorder}</td>
    <td>${fmt(p.stock * p.price)}</td>
    <td>${low ? statusBadge("cancelled").replace("CANCELLED","⚠️ LOW STOCK") : statusBadge("approved").replace("APPROVED","✅ GOOD")}</td></tr>`;
  }).filter(Boolean).join("");
}

// ==================== SUB-PO ====================
function viewSubPOs(i) {
  currentPOIdx = i;
  const po = pos[i], p = products[po.productId];
  const totalSubQty = (po.subPOs || []).reduce((s, id) => s + (subPOs[id] ? subPOs[id].quantity : 0), 0);
  $("currentPOInfo").innerHTML = `<div class="form-grid" style="background:var(--sec);padding:var(--sp12);border-radius:var(--r)">
    <div><strong>PO Number:</strong> ${po.number}</div><div><strong>Supplier:</strong> ${po.supplier}</div>
    <div><strong>Product:</strong> ${p ? prodDisplay(p) : "N/A"}</div><div><strong>PO Quantity:</strong> ${po.quantity}</div>
    <div><strong>Sub-PO Total:</strong> ${totalSubQty} / ${po.quantity}</div>
    <div><strong>Status:</strong> ${statusBadge(po.status)}</div></div>`;
  renderSubPOList();
  toggleModal("subPOModal", true);
}

function renderSubPOList() {
  const po = pos[currentPOIdx], list = $("subPOList");
  if (!po.subPOs?.length) {
    list.innerHTML = '<p style="text-align:center;color:var(--text2);padding:var(--sp20)">ยังไม่มี Sub-PO</p>';
    return;
  }
  list.innerHTML = po.subPOs.map(id => {
    const s = subPOs[id];
    if (!s) return "";
    const cls = s.status === "Inbound Completed" ? "status-completed" : s.status === "Partial Inbound" ? "status-approved" : "status-pending";
    const fields = [["System Number",s.systemNo],["Invoice No.",s.invoiceNo],["Bill of Lading",s.ladingNo],
      ["Pedimento No.",s.pedimentoNo],["Arrival Date",s.arrivalDate],["Inbound Date",s.inboundDate],["Quantity",s.quantity]];
    return `<div class="sub-po-item"><div class="sub-po-header"><span>${s.subPONo}</span><span class="status-badge ${cls}">${s.status}</span></div>
    <div class="sub-po-grid">${fields.map(([l,v]) => `<div><div class="sub-po-label">${l}</div><div class="sub-po-value">${v || "-"}</div></div>`).join("")}
    <div style="grid-column:1/-1"><div class="sub-po-label">Details</div><div class="sub-po-value">${s.details || "-"}</div></div></div>
    <div class="btn-actions" style="margin-top:var(--sp8)"><button class="btn btn-secondary action-btn" onclick="editSubPO(${id})">Edit</button>
    <button class="btn btn-danger action-btn" onclick="deleteSubPO(${id})">Delete</button></div></div>`;
  }).join("");
}

function openAddSubPOForm() {
  editIdx = -1;
  const po = pos[currentPOIdx];
  const letter = String.fromCharCode(65 + (po.subPOs?.length || 0));
  $s("subPONo", `${po.number}-${letter}`);
  ["systemNo","invoiceNo","ladingNo","pedimentoNo","arrivalDate","inboundDate","subPODetails"].forEach(id => $s(id, ""));
  $s("subPOStatus","Pending Inbound"); $s("subPOQuantity","");
  toggleModal("addSubPOModal", true);
}

function saveSubPO(e) {
  e.preventDefault();
  const s = {
    poIndex: currentPOIdx, subPONo: $v("subPONo"), systemNo: $v("systemNo"),
    invoiceNo: $v("invoiceNo"), ladingNo: $v("ladingNo"), pedimentoNo: $v("pedimentoNo"),
    arrivalDate: $v("arrivalDate"), inboundDate: $v("inboundDate"), status: $v("subPOStatus"),
    quantity: parseInt($v("subPOQuantity")), details: $v("subPODetails")
  };
  const po = pos[currentPOIdx];
  if (editIdx >= 0) {
    subPOs[editIdx] = s;
    logActivity("Sub-PO", s.subPONo, `Updated Sub-PO for ${po.number}`, "completed");
  } else {
    if (!po.subPOs) po.subPOs = [];
    po.subPOs.push(subPOs.length);
    subPOs.push(s);
    logActivity("Sub-PO", s.subPONo, `Added Sub-PO to ${po.number}, Qty: ${s.quantity}`, "completed");
  }
  renderSubPOList(); renderPOTable(); toggleModal("addSubPOModal", false); saveData();
}

function editSubPO(id) {
  editIdx = id;
  const s = subPOs[id];
  $s("subPONo",s.subPONo); $s("systemNo",s.systemNo||""); $s("invoiceNo",s.invoiceNo||"");
  $s("ladingNo",s.ladingNo||""); $s("pedimentoNo",s.pedimentoNo||""); $s("arrivalDate",s.arrivalDate||"");
  $s("inboundDate",s.inboundDate||""); $s("subPOStatus",s.status); $s("subPOQuantity",s.quantity);
  $s("subPODetails",s.details||"");
  toggleModal("addSubPOModal", true);
}

function deleteSubPO(id) {
  if (confirm("ต้องการลบ Sub-PO นี้หรือไม่?")) {
    const s = subPOs[id];
    logActivity("Sub-PO", s.subPONo, `Deleted Sub-PO from ${pos[currentPOIdx].number}`, "cancelled");
    pos[currentPOIdx].subPOs = pos[currentPOIdx].subPOs.filter(x => x !== id);
    renderSubPOList(); renderPOTable(); saveData();
  }
}

// ==================== REPORTS ====================
function generateReport() {
  const type = $v("reportType");
  const from = $v("reportDateFrom");
  const to = $v("reportDateTo");
  const titles = {
    stock_summary: "Stock Summary Report",
    po_report: "Purchase Order Report",
    so_report: "Sales Order Report",
    movement_report: "Stock Movement Report",
    valuation_report: "Inventory Valuation Report",
    low_stock_report: "Low Stock Report"
  };
  $("reportTitle").textContent = titles[type] || "Report";
  const thead = $("reportTable").querySelector("thead tr");
  const tbody = $("reportTable").querySelector("tbody");
  const summary = $("reportSummary");

  switch(type) {
    case "stock_summary": {
      thead.innerHTML = "<th>Product Code</th><th>Product Name</th><th>Category</th><th>Storage</th><th>Color</th><th>Network</th><th>Stock</th><th>Reserved</th><th>Incoming</th><th>Available</th><th>Reorder</th><th>Status</th>";
      let totalStock = 0, totalReserved = 0, totalIncoming = 0;
      tbody.innerHTML = products.filter(p => p.status !== "Disable").map((p, i) => {
        const reserved = sos.filter(s => s.productId === i && (s.status === "pending" || s.status === "approved")).reduce((s,o) => s + o.quantity, 0);
        const incoming = pos.filter(o => o.productId === i && (o.status === "pending" || o.status === "approved")).reduce((s,o) => s + o.quantity, 0);
        const avail = p.stock - reserved;
        totalStock += p.stock; totalReserved += reserved; totalIncoming += incoming;
        return `<tr class="${avail <= p.reorder ? "alert-row" : ""}"><td>${p.code}</td><td>${p.name}</td><td>${p.category}</td><td>${p.storage}</td><td>${p.color}</td><td>${p.network}</td>
        <td>${fmtN(p.stock)}</td><td>${reserved}</td><td>${incoming}</td><td>${avail}</td><td>${p.reorder}</td>
        <td>${avail <= p.reorder ? "⚠️ Low" : "✅ Good"}</td></tr>`;
      }).join("");
      summary.innerHTML = `
        <div class="stat-card"><div class="stat-label">Total Products</div><div class="stat-value">${products.filter(p=>p.status!=="Disable").length}</div></div>
        <div class="stat-card"><div class="stat-label">Total Stock</div><div class="stat-value">${fmtN(totalStock)}</div></div>
        <div class="stat-card"><div class="stat-label">Total Reserved</div><div class="stat-value">${fmtN(totalReserved)}</div></div>
        <div class="stat-card"><div class="stat-label">Total Incoming</div><div class="stat-value">${fmtN(totalIncoming)}</div></div>`;
      break;
    }
    case "po_report": {
      thead.innerHTML = "<th>PO Number</th><th>Supplier</th><th>Product</th><th>Date</th><th>Expected</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Sub-POs</th><th>Status</th>";
      const filtered = pos.filter(po => (!from || po.date >= from) && (!to || po.date <= to));
      const totalAmt = filtered.reduce((s,o) => s + o.total, 0);
      const totalQty = filtered.reduce((s,o) => s + o.quantity, 0);
      tbody.innerHTML = filtered.map(po => {
        const p = products[po.productId];
        return `<tr><td>${po.number}</td><td>${po.supplier}</td><td>${p ? prodShort(p) : "N/A"}</td>
        <td>${po.date}</td><td>${po.delivery||"-"}</td><td>${fmtN(po.quantity)}</td><td>${fmt(po.unitPrice)}</td><td>${fmt(po.total)}</td>
        <td>${po.subPOs ? po.subPOs.length : 0}</td><td>${statusBadge(po.status)}</td></tr>`;
      }).join("");
      const byStatus = {pending:0, approved:0, completed:0, cancelled:0};
      filtered.forEach(o => byStatus[o.status] = (byStatus[o.status]||0) + 1);
      summary.innerHTML = `
        <div class="stat-card"><div class="stat-label">Total POs</div><div class="stat-value">${filtered.length}</div></div>
        <div class="stat-card"><div class="stat-label">Total Amount</div><div class="stat-value">${fmt(totalAmt)}</div></div>
        <div class="stat-card"><div class="stat-label">Total Qty</div><div class="stat-value">${fmtN(totalQty)}</div></div>
        <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value">${byStatus.pending}</div></div>
        <div class="stat-card"><div class="stat-label">Approved</div><div class="stat-value">${byStatus.approved}</div></div>
        <div class="stat-card"><div class="stat-label">Completed</div><div class="stat-value">${byStatus.completed}</div></div>`;
      break;
    }
    case "so_report": {
      thead.innerHTML = "<th>SO Number</th><th>Customer</th><th>Product</th><th>Date</th><th>Delivery</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Status</th>";
      const filtered = sos.filter(so => (!from || so.date >= from) && (!to || so.date <= to));
      const totalAmt = filtered.reduce((s,o) => s + o.total, 0);
      const totalQty = filtered.reduce((s,o) => s + o.quantity, 0);
      tbody.innerHTML = filtered.map(so => {
        const p = products[so.productId];
        return `<tr><td>${so.number}</td><td>${so.customer}</td><td>${p ? prodShort(p) : "N/A"}</td>
        <td>${so.date}</td><td>${so.delivery||"-"}</td><td>${fmtN(so.quantity)}</td><td>${fmt(so.unitPrice)}</td><td>${fmt(so.total)}</td>
        <td>${statusBadge(so.status)}</td></tr>`;
      }).join("");
      const byCustomer = {};
      filtered.forEach(o => { byCustomer[o.customer] = (byCustomer[o.customer]||0) + o.total; });
      const byStatus = {pending:0, approved:0, completed:0, cancelled:0};
      filtered.forEach(o => byStatus[o.status] = (byStatus[o.status]||0) + 1);
      summary.innerHTML = `
        <div class="stat-card"><div class="stat-label">Total SOs</div><div class="stat-value">${filtered.length}</div></div>
        <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">${fmt(totalAmt)}</div></div>
        <div class="stat-card"><div class="stat-label">Total Qty</div><div class="stat-value">${fmtN(totalQty)}</div></div>
        <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value">${byStatus.pending}</div></div>
        <div class="stat-card"><div class="stat-label">Completed</div><div class="stat-value">${byStatus.completed}</div></div>
        <div class="stat-card"><div class="stat-label">Customers</div><div class="stat-value">${Object.keys(byCustomer).length}</div></div>`;
      break;
    }
    case "movement_report": {
      thead.innerHTML = "<th>Date</th><th>Time</th><th>Type</th><th>Reference</th><th>Details</th><th>Status</th>";
      const filtered = activities.filter(a => (a.type === "Inventory" || a.type === "PO" || a.type === "SO") && (!from || a.date >= from) && (!to || a.date <= to));
      tbody.innerHTML = filtered.map(a =>
        `<tr><td>${a.date}</td><td>${a.time}</td><td>${a.type}</td><td>${a.ref}</td><td>${a.details}</td><td>${statusBadge(a.status)}</td></tr>`
      ).join("") || '<tr><td colspan="6" style="text-align:center;color:var(--text2)">No movements found</td></tr>';
      const inCount = filtered.filter(a => a.details.includes("Stock IN")).length;
      const outCount = filtered.filter(a => a.details.includes("Stock OUT")).length;
      summary.innerHTML = `
        <div class="stat-card"><div class="stat-label">Total Movements</div><div class="stat-value">${filtered.length}</div></div>
        <div class="stat-card"><div class="stat-label">Stock IN</div><div class="stat-value">${inCount}</div></div>
        <div class="stat-card"><div class="stat-label">Stock OUT</div><div class="stat-value">${outCount}</div></div>`;
      break;
    }
    case "valuation_report": {
      thead.innerHTML = "<th>Product Code</th><th>Product Name</th><th>Category</th><th>Storage</th><th>Color</th><th>Stock</th><th>Unit Price (฿)</th><th>Import (USD)</th><th>Stock Value (฿)</th><th>% of Total</th>";
      const totalVal = products.filter(p => p.status !== "Disable").reduce((s, p) => s + p.stock * p.price, 0);
      tbody.innerHTML = products.filter(p => p.status !== "Disable").map(p => {
        const val = p.stock * p.price;
        const pct = totalVal > 0 ? ((val / totalVal) * 100).toFixed(1) : "0.0";
        return `<tr><td>${p.code}</td><td>${p.name}</td><td>${p.category}</td><td>${p.storage}</td><td>${p.color}</td>
        <td>${fmtN(p.stock)}</td><td>${fmt(p.price)}</td><td>${p.importPrice ? "$" + p.importPrice : "-"}</td>
        <td style="font-weight:600">${fmt(val)}</td><td>${pct}%</td></tr>`;
      }).join("");
      const byCategory = {};
      products.filter(p => p.status !== "Disable").forEach(p => { byCategory[p.category] = (byCategory[p.category]||0) + p.stock * p.price; });
      summary.innerHTML = `
        <div class="stat-card"><div class="stat-label">Total Valuation</div><div class="stat-value">${fmt(totalVal)}</div></div>
        ${Object.entries(byCategory).map(([k,v]) => `<div class="stat-card"><div class="stat-label">${k}</div><div class="stat-value">${fmt(v)}</div></div>`).join("")}`;
      break;
    }
    case "low_stock_report": {
      thead.innerHTML = "<th>Product Code</th><th>Product Name</th><th>Category</th><th>Storage</th><th>Color</th><th>Network</th><th>Stock</th><th>Reserved</th><th>Available</th><th>Reorder Level</th><th>Deficit</th><th>Suggested PO Qty</th>";
      const items = [];
      products.forEach((p, i) => {
        if (p.status === "Disable") return;
        const reserved = sos.filter(s => s.productId === i && (s.status === "pending" || s.status === "approved")).reduce((s,o) => s + o.quantity, 0);
        const avail = p.stock - reserved;
        if (avail <= p.reorder) items.push({...p, idx: i, reserved, avail, deficit: p.reorder - avail, suggested: Math.max(p.reorder * 2 - avail, p.reorder)});
      });
      tbody.innerHTML = items.map(a =>
        `<tr class="alert-row"><td>${a.code}</td><td>${a.name}</td><td>${a.category}</td><td>${a.storage}</td><td>${a.color}</td><td>${a.network}</td>
        <td>${a.stock}</td><td>${a.reserved}</td><td>${a.avail}</td><td>${a.reorder}</td>
        <td style="color:var(--err);font-weight:600">${a.deficit > 0 ? "-" + a.deficit : "At Limit"}</td>
        <td style="color:var(--pri);font-weight:600">${a.suggested}</td></tr>`
      ).join("") || '<tr><td colspan="12" style="text-align:center;color:var(--text2)">✅ No low stock items</td></tr>';
      summary.innerHTML = `
        <div class="stat-card"><div class="stat-label">Low Stock Items</div><div class="stat-value" style="color:var(--err)">${items.length}</div></div>
        <div class="stat-card"><div class="stat-label">Total Deficit</div><div class="stat-value">${items.reduce((s,a) => s + Math.max(a.deficit, 0), 0)}</div></div>`;
      break;
    }
  }
}

// ==================== EXPORT CSV ====================
function exportCSV(section) {
  let rows = [], filename = "";
  switch(section) {
    case "product":
      rows.push(["Product Code","Product Name","Brand","Series","Category","Storage","Color","Network",
        "Price (฿)","Import (USD)","Tax Type","Tax Rate (%)","Custom Rate (%)","Stock","Reorder Level","Status"]);
      products.forEach(p => rows.push([
        p.code, p.name, p.brand, p.series, p.category, p.storage, p.color, p.network,
        p.price, p.importPrice, p.tax||"", p.taxRate||0, p.customRate||0, p.stock, p.reorder, p.status
      ]));
      filename = "products_" + today() + ".csv";
      break;

    case "po":
      rows.push(["PO Number","Supplier","Product Code","Product Name","Brand","Series","Category",
        "Storage","Color","Network","Order Date","Expected Delivery","Qty","Unit Price","Total","Status","Notes",
        "Sub-PO No","System No","Invoice No","Lading No","Pedimento No",
        "Arrival Date","Inbound Date","Sub-PO Status","Sub-PO Qty","Sub-PO Details"]);
      pos.forEach((o, oi) => {
        const p = products[o.productId];
        const baseCols = [
          o.number, o.supplier,
          p ? p.code : "N/A", p ? p.name : "N/A", p ? p.brand : "", p ? p.series : "",
          p ? p.category : "", p ? p.storage : "", p ? p.color : "", p ? p.network : "",
          o.date, o.delivery, o.quantity, o.unitPrice, o.total, o.status, o.notes||""
        ];
        const subs = subPOs.filter(s => s.poIndex === oi);
        if (subs.length === 0) {
          rows.push([...baseCols, "","","","","","","","","",""]);
        } else {
          subs.forEach(s => {
            rows.push([...baseCols,
              s.subPONo, s.systemNo, s.invoiceNo, s.ladingNo, s.pedimentoNo,
              s.arrivalDate, s.inboundDate, s.status, s.quantity, s.details||""
            ]);
          });
        }
      });
      filename = "purchase_orders_" + today() + ".csv";
      break;

    case "so":
      rows.push(["SO Number","Customer","Product Code","Product Name","Brand","Series","Category",
        "Storage","Color","Network","Order Date","Delivery Date","Qty","Unit Price","Total","Status","Notes"]);
      sos.forEach(o => {
        const p = products[o.productId];
        rows.push([
          o.number, o.customer,
          p ? p.code : "N/A", p ? p.name : "N/A", p ? p.brand : "", p ? p.series : "",
          p ? p.category : "", p ? p.storage : "", p ? p.color : "", p ? p.network : "",
          o.date, o.delivery, o.quantity, o.unitPrice, o.total, o.status, o.notes||""
        ]);
      });
      filename = "sales_orders_" + today() + ".csv";
      break;

    case "inventory":
      rows.push(["Product Code","Product Name","Brand","Series","Category","Storage","Color","Network",
        "Price (฿)","Import (USD)","Current Stock","Reserved (SO)","Incoming (PO)","Available",
        "Reorder Level","Stock Value (฿)","Status"]);
      products.filter(p => p.status !== "Disable").forEach((p, i) => {
        const reserved = sos.filter(s => s.productId === i && (s.status === "pending" || s.status === "approved"))
          .reduce((s, o) => s + o.quantity, 0);
        const incoming = pos.filter(o => o.productId === i && (o.status === "pending" || o.status === "approved"))
          .reduce((s, o) => s + o.quantity, 0);
        rows.push([
          p.code, p.name, p.brand, p.series, p.category, p.storage, p.color, p.network,
          p.price, p.importPrice, p.stock, reserved, incoming,
          p.stock - reserved, p.reorder, p.stock * p.price,
          p.stock <= p.reorder ? "LOW STOCK" : "OK"
        ]);
      });
      filename = "inventory_" + today() + ".csv";
      break;

    case "report":
      const table = $("reportTable");
      const headers = Array.from(table.querySelectorAll("th")).map(th => th.textContent);
      rows.push(headers);
      table.querySelectorAll("tbody tr").forEach(tr => {
        rows.push(Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim()));
      });
      filename = $v("reportType") + "_" + today() + ".csv";
      break;
  }
  if (!rows.length) return;
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], {type: "text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function printReport() { window.print(); }

// ==================== INIT ====================
function init() {
  if (!loadData()) {
    loadDefaultData();
  }
  buildFilterSelects("po");
  buildFilterSelects("so");
  updateDashboard();
  renderProductTable();
  renderPOTable();
  renderSOTable();
  renderInventoryTable();
}

init();

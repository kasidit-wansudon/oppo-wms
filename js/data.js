/**
 * Data Layer & Helper Utilities
 * OPPO Warehouse Management System
 */

// ==================== DATA ====================
let products = [], pos = [], sos = [], subPOs = [], activities = [];
let editIdx = -1, editOrderIdx = -1, currentPOIdx = -1;

const FILTERS = {
  Category: ["Phone","IOT","Accessories","Bundle","Other"],
  Storage: ["8+128GB","8+256GB","12+256GB","12+512GB","16+512GB","16+1TB","N/A"],
  Color: ["BLACK","WHITE","BLUE","GREEN","PURPLE","GOLD"],
  Network: ["OPEN","TELCEL","AT&T","MOVISTAR","N/A"]
};

// ==================== HELPERS ====================
const $ = id => document.getElementById(id);
const $v = id => $(id).value;
const $s = (id, v) => { $(id).value = v; };
const fmt = n => "฿" + Number(n).toLocaleString("th-TH", {minimumFractionDigits:2, maximumFractionDigits:2});
const fmtN = n => Number(n).toLocaleString("th-TH");
const today = () => new Date().toISOString().split("T")[0];
const now = () => new Date().toLocaleTimeString("th-TH", {hour:"2-digit", minute:"2-digit"});
const toggleModal = (id, show) => $(id).classList[show ? "add" : "remove"]("active");
const prodDisplay = p => `${p.code} - ${p.name} ${p.storage} ${p.color} ${p.network}`;
const prodShort = p => `${p.name} ${p.storage} ${p.color}`;
const statusBadge = s => `<span class="status-badge status-${s}">${s.toUpperCase()}</span>`;

// ==================== LOCAL STORAGE ====================
function saveData() {
  try {
    localStorage.setItem("wms_data", JSON.stringify({products, pos, sos, subPOs, activities}));
  } catch(e) {}
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
  } catch(e) {}
  return false;
}

// ==================== ACTIVITY LOG ====================
function logActivity(type, ref, details, status) {
  activities.unshift({date: today(), time: now(), type, ref, details, status});
  if (activities.length > 100) activities.pop();
  saveData();
}

// ==================== DEFAULT DATA ====================
function loadDefaultData() {
  products = [
    {code:"CPH2026",name:"FIND X9 PRO",brand:"OPPO",series:"FIND",category:"Phone",storage:"16+512GB",color:"BLACK",network:"OPEN",price:25000,importPrice:700,tax:"YES",taxRate:16,customRate:0,stock:100,reorder:20,status:"Enable"},
    {code:"CPH2026",name:"FIND X9 PRO",brand:"OPPO",series:"FIND",category:"Phone",storage:"16+512GB",color:"WHITE",network:"OPEN",price:25000,importPrice:700,tax:"YES",taxRate:16,customRate:0,stock:80,reorder:20,status:"Enable"},
    {code:"CPH2026",name:"FIND X9 PRO",brand:"OPPO",series:"FIND",category:"Phone",storage:"12+256GB",color:"BLACK",network:"TELCEL",price:22000,importPrice:650,tax:"YES",taxRate:16,customRate:0,stock:150,reorder:30,status:"Enable"},
    {code:"CPH2515",name:"RENO 12",brand:"OPPO",series:"RENO",category:"Phone",storage:"8+256GB",color:"BLUE",network:"OPEN",price:18000,importPrice:500,tax:"YES",taxRate:16,customRate:0,stock:200,reorder:40,status:"Enable"},
    {code:"OPPO-WC65",name:"Wireless Charger 65W",brand:"OPPO",series:"",category:"Accessories",storage:"N/A",color:"WHITE",network:"N/A",price:1200,importPrice:30,tax:"YES",taxRate:16,customRate:0,stock:300,reorder:50,status:"Enable"}
  ];
  pos = [
    {number:"PO-2026-001",supplier:"OPPO Factory",date:"2026-03-01",delivery:"2026-03-15",productId:0,quantity:50,unitPrice:23000,total:1150000,status:"pending",notes:"",subPOs:[0,1]},
    {number:"PO-2026-002",supplier:"OPPO Factory",date:"2026-03-05",delivery:"2026-03-20",productId:1,quantity:100,unitPrice:23000,total:2300000,status:"completed",notes:"",subPOs:[2]},
    {number:"PO-2026-003",supplier:"OPPO Accessories",date:"2026-03-10",delivery:"2026-03-25",productId:4,quantity:200,unitPrice:1000,total:200000,status:"approved",notes:"",subPOs:[]}
  ];
  subPOs = [
    {poIndex:0,subPONo:"SPO-2026-001-A",systemNo:"SYS-001",invoiceNo:"CI19369126830",ladingNo:"A26765436926",pedimentoNo:"P21675497692",arrivalDate:"2026-03-15",inboundDate:"2026-03-16",status:"Inbound Completed",quantity:30,details:"First shipment batch"},
    {poIndex:0,subPONo:"SPO-2026-001-B",systemNo:"SYS-002",invoiceNo:"CI19369126831",ladingNo:"A26765436927",pedimentoNo:"P21675497693",arrivalDate:"2026-03-18",inboundDate:"",status:"Pending Inbound",quantity:20,details:"Second shipment batch"},
    {poIndex:1,subPONo:"SPO-2026-002-A",systemNo:"SYS-003",invoiceNo:"CI19369126832",ladingNo:"A26765436928",pedimentoNo:"P21675497694",arrivalDate:"2026-03-20",inboundDate:"2026-03-21",status:"Inbound Completed",quantity:100,details:"Full shipment"}
  ];
  sos = [
    {number:"SO-2026-001",customer:"TELCEL",date:"2026-03-08",delivery:"2026-03-22",productId:2,quantity:30,unitPrice:22000,total:660000,status:"pending",notes:""},
    {number:"SO-2026-002",customer:"AT&T Mexico",date:"2026-03-12",delivery:"2026-03-26",productId:3,quantity:50,unitPrice:18000,total:900000,status:"approved",notes:""},
    {number:"SO-2026-003",customer:"MOVISTAR",date:"2026-03-14",delivery:"2026-03-28",productId:0,quantity:20,unitPrice:25000,total:500000,status:"completed",notes:""}
  ];
  activities = [
    {date:"2026-03-14",time:"16:30",type:"SO",ref:"SO-2026-003",details:"Fulfilled: FIND X9 PRO 16+512GB BLACK x20",status:"completed"},
    {date:"2026-03-12",time:"14:20",type:"SO",ref:"SO-2026-002",details:"Created SO: RENO 12 8+256GB BLUE x50",status:"pending"},
    {date:"2026-03-10",time:"11:00",type:"PO",ref:"PO-2026-003",details:"Created PO: Wireless Charger 65W x200",status:"approved"},
    {date:"2026-03-08",time:"09:15",type:"SO",ref:"SO-2026-001",details:"Created SO: FIND X9 PRO 12+256GB BLACK x30",status:"pending"},
    {date:"2026-03-05",time:"10:00",type:"PO",ref:"PO-2026-002",details:"Created PO: FIND X9 PRO 16+512GB WHITE x100",status:"completed"},
    {date:"2026-03-01",time:"08:30",type:"PO",ref:"PO-2026-001",details:"Created PO: FIND X9 PRO 16+512GB BLACK x50",status:"pending"}
  ];
  saveData();
}

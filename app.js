const agents = [
  {
    name: "Supplier Scout",
    category: "Discovery",
    score: 91,
    cost: "$0.42/run",
    permission: "Vendor portals",
    copy: "Finds qualified substitute suppliers, checks constraints, and ranks options by lead time, margin, and certification fit.",
    steps: ["Read approved-vendor list", "Search alternates by part spec", "Rank by lead time and risk"]
  },
  {
    name: "Quote Arbiter",
    category: "Procurement",
    score: 88,
    cost: "$0.31/run",
    permission: "ERP + inbox",
    copy: "Normalizes vendor quotes, flags hidden fees, compares payment terms, and drafts a purchase recommendation.",
    steps: ["Parse quote attachments", "Normalize freight and tax", "Compare landed cost"]
  },
  {
    name: "Freight Watch",
    category: "Logistics",
    score: 93,
    cost: "$0.27/run",
    permission: "Carrier APIs",
    copy: "Tracks shipments, detects route drift, predicts ETA changes, and proposes recovery actions before teams notice delays.",
    steps: ["Check carrier event stream", "Detect ETA drift", "Open recovery options"]
  },
  {
    name: "Invoice Reconciler",
    category: "Finance ops",
    score: 89,
    cost: "$0.22/run",
    permission: "ERP + PDF",
    copy: "Matches invoices to purchase orders, receipts, contracts, and exceptions without exposing unrelated finance data.",
    steps: ["Match PO to receipt", "Check contract terms", "Prepare variance note"]
  },
  {
    name: "Customs Drafter",
    category: "Trade",
    score: 86,
    cost: "$0.36/run",
    permission: "Docs only",
    copy: "Drafts customs packets, checks tariff classifications, and flags missing certificates before freight gets stuck.",
    steps: ["Read commercial invoice", "Check HS code", "Draft packet checklist"]
  },
  {
    name: "Demand Forecaster",
    category: "Planning",
    score: 92,
    cost: "$0.48/run",
    permission: "ERP + sheets",
    copy: "Combines order history, seasonality, lead times, and stockouts into a forecast that procurement can act on.",
    steps: ["Read demand history", "Adjust for lead time", "Flag shortage window"]
  },
  {
    name: "Exception Resolver",
    category: "Coordination",
    score: 94,
    cost: "$0.40/run",
    permission: "Least-context",
    copy: "Finds late shipments, checks contract terms, proposes recovery actions, and escalates only when a human decision is required.",
    steps: ["Classify exception", "Pull relevant memory shard", "Route subtask to agent swarm"]
  }
];

const connectors = [
  ["SAP", "Purchase orders"],
  ["Gmail", "Supplier threads"],
  ["S3", "Contracts"],
  ["Sheets", "Expedite queue"],
  ["Vendor portal", "Carrier status"]
];

const compression = [
  ["Transaction memory", 78, "34 ERP events"],
  ["Communication memory", 64, "19 threads"],
  ["Temporal memory", 52, "14 carrier events"],
  ["Policy memory", 44, "8 contracts"],
  ["Planning memory", 35, "6 tabs"]
];

const permissions = [
  ["Exception Resolver", "Receives PO metadata, shipment events, and policy shards. Cannot approve spend or edit ERP records."],
  ["Quote Arbiter", "Receives quote attachments and vendor terms. Cannot send supplier emails or change payment data."],
  ["Supplier Scout", "Receives public supplier data and approved-vendor list. Cannot access invoices or customer names."]
];

const runtimeLayers = [
  [
    "01",
    "Event bus",
    "Normalizes ERP changes, supplier emails, carrier updates, invoice events, and document uploads into typed supply-chain events."
  ],
  [
    "02",
    "Context compiler",
    "Converts raw data into entity, transaction, policy, temporal, and exception memory shards before retrieval."
  ],
  [
    "03",
    "Permission graph",
    "Issues task-scoped capability tokens so each agent sees the minimum context and tools needed for one job."
  ],
  [
    "04",
    "Task router",
    "Turns an exception into a dependency graph, selects agents by reliability/cost/latency, and tracks handoffs."
  ],
  [
    "05",
    "Evaluation loop",
    "Scores source coverage, hallucination risk, tool success, escalation rate, latency, and cost per completed workflow."
  ],
  [
    "06",
    "Audit ledger",
    "Stores prompts, sources, tool calls, approvals, diffs, and rollback metadata for every agent action."
  ]
];

const baseAudit = [
  ["09:14", "ERP event PO-1842 ingested", "source"],
  ["09:15", "Memory compactor built 7 context shards", "memory"],
  ["09:16", "Exception Resolver selected for delay risk", "router"],
  ["09:16", "Freight Watch checked carrier route drift", "agent"],
  ["09:17", "Human approval required for expedite spend", "gate"]
];

let activeAgent = agents[6];
let auditEvents = [...baseAudit];
let runCount = 0;

const agentGrid = document.querySelector("#agentGrid");
const connectorList = document.querySelector("#connectorList");
const compressionBars = document.querySelector("#compressionBars");
const permissionList = document.querySelector("#permissionList");
const runtimeGrid = document.querySelector("#runtimeGrid");
const auditLog = document.querySelector("#auditLog");
const taskList = document.querySelector("#taskList");
const selectedAgentName = document.querySelector("#selectedAgentName");
const selectedAgentCopy = document.querySelector("#selectedAgentCopy");
const selectedAgentScore = document.querySelector("#selectedAgentScore");
const routeButton = document.querySelector("#routeButton");
const simulateButton = document.querySelector("#simulateButton");
const resetButton = document.querySelector("#resetButton");
const runStatus = document.querySelector("#runStatus");
const etaMetric = document.querySelector("#etaMetric");
const tokenPill = document.querySelector("#tokenPill");

function renderAgents() {
  agentGrid.innerHTML = "";
  agents.forEach((agent) => {
    const card = document.createElement("button");
    card.className = `agent-card ${agent.name === activeAgent.name ? "active" : ""}`;
    card.type = "button";
    card.innerHTML = `
      <span>${agent.category}</span>
      <h3>${agent.name}</h3>
      <p>${agent.copy}</p>
      <div class="agent-meta">
        <span>${agent.score} reliability</span>
        <span>${agent.cost}</span>
        <span>${agent.permission}</span>
      </div>
    `;
    card.addEventListener("click", () => {
      activeAgent = agent;
      addAudit(`${agent.name} selected from marketplace`, "select");
      renderAll();
      showView("workbench");
    });
    agentGrid.appendChild(card);
  });
}

function renderConnectors() {
  connectorList.innerHTML = "";
  connectors.forEach(([name, scope]) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <div>
        <strong>${name}</strong><br />
        <span>${scope}</span>
      </div>
      <span class="connector-status" aria-label="Connected"></span>
    `;
    connectorList.appendChild(item);
  });
}

function renderCompression() {
  compressionBars.innerHTML = "";
  compression.forEach(([label, percent, count]) => {
    const item = document.createElement("div");
    item.className = "compression-item";
    item.innerHTML = `
      <strong>${label}</strong>
      <div class="compression-track">
        <div class="compression-fill" style="width: ${percent}%"></div>
      </div>
      <span>${count}</span>
    `;
    compressionBars.appendChild(item);
  });
}

function renderPermissions() {
  permissionList.innerHTML = "";
  permissions.forEach(([name, scope]) => {
    const item = document.createElement("div");
    item.className = "permission-item";
    item.innerHTML = `<strong>${name}</strong><span>${scope}</span>`;
    permissionList.appendChild(item);
  });
}

function renderRuntime() {
  runtimeGrid.innerHTML = "";
  runtimeLayers.forEach(([index, title, copy]) => {
    const card = document.createElement("article");
    card.className = "runtime-card";
    card.innerHTML = `
      <span class="runtime-index">${index}</span>
      <h3>${title}</h3>
      <p>${copy}</p>
    `;
    runtimeGrid.appendChild(card);
  });
}

function renderAudit() {
  auditLog.innerHTML = "";
  auditEvents.slice().reverse().forEach(([time, action, tag]) => {
    const item = document.createElement("div");
    item.className = "audit-item";
    item.innerHTML = `
      <span class="audit-time">${time}</span>
      <span class="audit-action">${action}</span>
      <span class="audit-tag">${tag}</span>
    `;
    auditLog.appendChild(item);
  });
}

function renderSelectedAgent() {
  selectedAgentName.textContent = activeAgent.name;
  selectedAgentCopy.textContent = activeAgent.copy;
  selectedAgentScore.textContent = activeAgent.score;
  taskList.innerHTML = "";
  activeAgent.steps.forEach((step, index) => {
    const item = document.createElement("div");
    item.className = "task-item";
    item.innerHTML = `<span>Step ${index + 1}</span><strong>${step}</strong>`;
    taskList.appendChild(item);
  });
}

function addAudit(action, tag) {
  const time = `09:${String(18 + auditEvents.length).padStart(2, "0")}`;
  auditEvents.push([time, action, tag]);
}

function routeTask() {
  runCount += 1;
  const nextAgent = agents[(agents.indexOf(activeAgent) + runCount) % agents.length];
  addAudit(`${activeAgent.name} routed subtask to ${nextAgent.name}`, "route");
  runStatus.textContent = "Routed";
  tokenPill.textContent = runCount % 2 === 0 ? "1,360 tokens" : "1,480 tokens";
  renderAll();
}

function simulateDelay() {
  activeAgent = agents[2];
  etaMetric.textContent = "44%";
  runStatus.textContent = "Delay detected";
  addAudit("Carrier ETA dropped below confidence threshold", "risk");
  addAudit("Freight Watch opened expedite recovery path", "agent");
  renderAll();
}

function resetRun() {
  activeAgent = agents[6];
  auditEvents = [...baseAudit];
  runCount = 0;
  runStatus.textContent = "Ready";
  etaMetric.textContent = "61%";
  tokenPill.textContent = "1,480 tokens";
  renderAll();
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewId);
  });
}

function renderAll() {
  renderAgents();
  renderSelectedAgent();
  renderAudit();
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

routeButton.addEventListener("click", routeTask);
simulateButton.addEventListener("click", simulateDelay);
resetButton.addEventListener("click", resetRun);

renderConnectors();
renderCompression();
renderPermissions();
renderRuntime();
renderAll();

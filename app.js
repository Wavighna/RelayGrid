const scenarios = [
  {
    id: "late-lithium",
    title: "PO-1842 lithium-cell shipment delay",
    short: "Late lithium cells from Shenzhen supplier",
    severity: "high",
    summary:
      "Carrier telemetry shows a 38-hour delay on cells required for a contract electronics build. The system must recover ETA, compare expedite options, check supplier penalties, and prepare a human approval gate for spend.",
    risk: "$418K",
    hours: "19.4",
    confidence: 61,
    recommended: ["freight-watch", "exception-resolver", "supplier-scout", "contract-sentinel", "quote-arbiter", "escalation-gatekeeper"],
    signals: [
      ["ETA drift", "38h late"],
      ["Carrier confidence", "44%"],
      ["Contract penalty", "$62K/day"],
      ["Alternate lanes", "3 viable"],
      ["Spend approval", "$18.6K"],
      ["Factory stockout", "31h window"]
    ],
    sources: ["SAP PO-1842", "Maersk event stream", "Supplier thread #A17", "S3 contract v4", "Expedite queue"],
    graph: [
      ["ingest", "Ingest event stream", "event-bus", "source", "Normalize carrier, ERP, and inbox events into one exception record."],
      ["compile", "Compile context packet", "context-compiler", "memory", "Build policy, temporal, transaction, and communication memory shards."],
      ["route", "Route recovery graph", "task-router", "router", "Select Freight Watch, Supplier Scout, Quote Arbiter, and approval gate."],
      ["act", "Execute agent workers", "freight-watch", "agent", "Compare lanes, draft supplier escalation, and prepare expedite recommendation."],
      ["verify", "Evaluate output", "evaluation-loop", "eval", "Score source coverage, hallucination risk, tool success, and cost."],
      ["approve", "Human approval gate", "escalation-gatekeeper", "gate", "Require approval before spend or supplier-facing messages are sent."]
    ]
  },
  {
    id: "quote-mismatch",
    title: "RFQ-771 quote mismatch across three suppliers",
    short: "Quote terms conflict across vendors",
    severity: "medium",
    summary:
      "Three suppliers returned quotes with inconsistent Incoterms, hidden freight charges, and conflicting minimum order quantities. The system must normalize landed cost and flag the clause that changes margin.",
    risk: "$129K",
    hours: "11.7",
    confidence: 72,
    recommended: ["quote-arbiter", "landed-cost-modeler", "supplier-scout", "contract-sentinel", "margin-guardian", "vendor-email-drafter"],
    signals: [
      ["Hidden freight", "$14.2K"],
      ["MOQ variance", "4.8x"],
      ["Payment terms", "Net 15 vs Net 60"],
      ["Margin swing", "9.1 pts"],
      ["Supplier rank", "2 unstable"],
      ["Decision window", "22h"]
    ],
    sources: ["RFQ inbox", "Quote PDFs", "Vendor portal", "Margin sheet", "Contract library"],
    graph: [
      ["ingest", "Parse RFQ packet", "event-bus", "source", "Extract quote PDFs, supplier emails, and vendor portal terms."],
      ["compile", "Normalize commercial context", "context-compiler", "memory", "Compile price, freight, MOQ, lead time, payment, and clause shards."],
      ["route", "Route comparison tasks", "task-router", "router", "Send cost work to Quote Arbiter and clause checks to Contract Sentinel."],
      ["act", "Compute landed cost", "landed-cost-modeler", "agent", "Calculate margin impact across supplier options."],
      ["verify", "Run variance checks", "evaluation-loop", "eval", "Detect hidden fee assumptions and rank confidence by source coverage."],
      ["approve", "Draft negotiation path", "vendor-email-drafter", "gate", "Prepare supplier questions for human approval."]
    ]
  },
  {
    id: "invoice-variance",
    title: "INV-9021 invoice variance against receipt",
    short: "Invoice differs from PO and received quantity",
    severity: "medium",
    summary:
      "An invoice shows a 7.4% variance against purchase order terms and receiving data. The system must reconcile tax, freight, unit price, and quantity before finance releases payment.",
    risk: "$74K",
    hours: "8.8",
    confidence: 78,
    recommended: ["invoice-reconciler", "receipt-matcher", "contract-sentinel", "ap-posting-guard", "variance-explainer", "erp-writeback-agent"],
    signals: [
      ["Unit variance", "7.4%"],
      ["Receipt mismatch", "212 units"],
      ["Tax delta", "$4.1K"],
      ["Payment hold", "48h"],
      ["Approval chain", "Finance + Ops"],
      ["Duplicate risk", "Low"]
    ],
    sources: ["NetSuite invoice", "PO line items", "Warehouse receipt", "Supplier statement", "Tax table"],
    graph: [
      ["ingest", "Capture finance event", "event-bus", "source", "Normalize invoice, receipt, PO, tax, and supplier statement events."],
      ["compile", "Compile reconciliation memory", "context-compiler", "memory", "Build transaction and policy shards around the variance."],
      ["route", "Route reconciliation", "task-router", "router", "Assign matching, contract, and writeback agents with finance permissions."],
      ["act", "Resolve variance", "invoice-reconciler", "agent", "Match PO, receipt, contract terms, and invoice line items."],
      ["verify", "Check posting safety", "ap-posting-guard", "eval", "Block ERP writeback until policy and duplicate checks pass."],
      ["approve", "Prepare payment decision", "variance-explainer", "gate", "Summarize variance cause and recommended hold/release decision."]
    ]
  },
  {
    id: "customs-hold",
    title: "BOM-301 customs certificate hold",
    short: "Missing certificate blocks cross-border freight",
    severity: "high",
    summary:
      "A shipment is held because the certificate of origin and HS classification do not match the commercial invoice. The system must build the customs packet and flag the approval risk.",
    risk: "$236K",
    hours: "16.2",
    confidence: 58,
    recommended: ["customs-drafter", "hs-code-classifier", "document-forensics", "trade-compliance-auditor", "freight-watch", "broker-coordinator"],
    signals: [
      ["Hold clock", "17h"],
      ["Missing docs", "2"],
      ["HS confidence", "63%"],
      ["Demurrage risk", "$8.3K/day"],
      ["Broker queue", "5th"],
      ["Release paths", "2"]
    ],
    sources: ["Broker portal", "Commercial invoice", "Packing list", "HS table", "Certificate folder"],
    graph: [
      ["ingest", "Ingest trade packet", "event-bus", "source", "Normalize broker notes, invoice, packing list, and certificate data."],
      ["compile", "Compile compliance context", "context-compiler", "memory", "Build policy, document, and temporal memory shards."],
      ["route", "Route compliance graph", "task-router", "router", "Send classification to HS agent and packet assembly to Customs Drafter."],
      ["act", "Draft customs response", "customs-drafter", "agent", "Prepare corrected certificate checklist and broker message."],
      ["verify", "Run compliance checks", "trade-compliance-auditor", "eval", "Score classification evidence and missing-document risk."],
      ["approve", "Escalate broker release", "broker-coordinator", "gate", "Escalate only with human approval because customs filing is external."]
    ]
  },
  {
    id: "demand-shock",
    title: "SKU-44 demand shock against supplier capacity",
    short: "Demand spike exceeds committed capacity",
    severity: "low",
    summary:
      "A sudden channel order spike exceeds committed supplier capacity for the next six weeks. The system must forecast shortage timing, identify substitution options, and reserve capacity.",
    risk: "$91K",
    hours: "13.1",
    confidence: 81,
    recommended: ["demand-forecaster", "capacity-negotiator", "supplier-scout", "inventory-simulator", "margin-guardian", "planner-copilot"],
    signals: [
      ["Demand spike", "+31%"],
      ["Capacity gap", "18K units"],
      ["Stockout horizon", "24 days"],
      ["Substitute SKUs", "5"],
      ["Margin risk", "4.6 pts"],
      ["Forecast confidence", "81%"]
    ],
    sources: ["Order history", "Forecast sheet", "Supplier capacity email", "Inventory ledger", "SKU substitution map"],
    graph: [
      ["ingest", "Ingest planning signals", "event-bus", "source", "Normalize demand, inventory, capacity, and substitute-SKU records."],
      ["compile", "Compile planning context", "context-compiler", "memory", "Build temporal, entity, and planning memory shards."],
      ["route", "Route planning graph", "task-router", "router", "Dispatch forecasting, capacity, and margin agents."],
      ["act", "Simulate shortage paths", "inventory-simulator", "agent", "Model stockout timing under committed and negotiated capacity."],
      ["verify", "Evaluate scenario quality", "evaluation-loop", "eval", "Score assumptions, forecast confidence, and margin impact."],
      ["approve", "Reserve capacity", "capacity-negotiator", "gate", "Draft supplier request for human approval."]
    ]
  },
  {
    id: "tariff-rule-change",
    title: "HTS-88 tariff change against open purchase orders",
    short: "Tariff update changes landed cost",
    severity: "high",
    summary:
      "A tariff update changes the landed cost on open orders already committed to customers. The system must find exposed POs, reprice supplier options, model margin damage, and decide which contracts need renegotiation.",
    risk: "$612K",
    hours: "22.8",
    confidence: 57,
    recommended: ["tariff-simulator", "trade-compliance-auditor", "landed-cost-modeler", "supplier-risk-underwriter", "cash-conversion-optimizer", "contract-renewal-pricer"],
    signals: [
      ["Affected POs", "43"],
      ["Duty delta", "+11.2%"],
      ["Margin exposure", "$612K"],
      ["Open customer quotes", "19"],
      ["Alternative origins", "4"],
      ["Renegotiation window", "36h"]
    ],
    sources: ["HTS update feed", "Open PO table", "Customer quote book", "Contract library", "Supplier country-of-origin file"],
    graph: [
      ["ingest", "Ingest tariff bulletin", "event-bus", "source", "Normalize HTS update, origin data, open POs, and customer commitments."],
      ["compile", "Compile commercial exposure", "context-compiler", "memory", "Build policy, commercial, transaction, and supplier shards around the tariff delta."],
      ["route", "Route repricing workflow", "task-router", "router", "Select trade, landed-cost, risk, and cash agents by affected contract scope."],
      ["act", "Simulate tariff exposure", "tariff-simulator", "agent", "Calculate duty impact by SKU, supplier origin, customer quote, and shipment timing."],
      ["verify", "Audit compliance evidence", "trade-compliance-auditor", "eval", "Check tariff evidence, origin confidence, and restricted-party constraints."],
      ["approve", "Prepare renegotiation packet", "contract-renewal-pricer", "gate", "Create human-approved supplier and customer renegotiation options."]
    ]
  },
  {
    id: "quality-escape",
    title: "QMS-17 field failures tied to supplier lot",
    short: "Supplier lot may require containment",
    severity: "high",
    summary:
      "Field failures are clustering around one supplier lot that is already inside finished goods and outbound shipments. The system must trace exposure, freeze risky inventory, draft supplier containment, and protect customers without over-recalling product.",
    risk: "$377K",
    hours: "27.6",
    confidence: 64,
    recommended: ["recall-containment-agent", "receipt-matcher", "document-forensics", "production-scheduler", "inventory-allocation-arbiter", "sla-arbiter"],
    signals: [
      ["Suspect lots", "3"],
      ["Finished units", "12.4K"],
      ["Customer orders", "87"],
      ["Warehouse sites", "5"],
      ["Containment cost", "$377K"],
      ["False recall risk", "High"]
    ],
    sources: ["QMS tickets", "Lot trace ledger", "Warehouse inventory", "Customer order queue", "Supplier 8D folder"],
    graph: [
      ["ingest", "Ingest quality signals", "event-bus", "source", "Normalize QMS cases, lot trace data, inventory, customer orders, and supplier documents."],
      ["compile", "Compile containment context", "context-compiler", "memory", "Build quality, entity, transaction, document, and customer-impact shards."],
      ["route", "Route containment graph", "task-router", "router", "Assign lot tracing, recall, production scheduling, and SLA-impact agents."],
      ["act", "Trace exposed inventory", "recall-containment-agent", "agent", "Find suspect finished goods, shipments, replacement options, and quarantine actions."],
      ["verify", "Evaluate recall boundary", "evaluation-loop", "eval", "Score false-positive recall risk, source coverage, and customer-impact confidence."],
      ["approve", "Gate customer and supplier actions", "human-gates", "gate", "Require approval before customer updates, quarantines, or supplier claims."]
    ]
  }
];

const agents = [
  ["exception-resolver", "Exception Resolver", "Orchestration", 94, "$0.40", "1.8s", "Builds the dependency graph for a supply-chain exception and assigns bounded work to specialist agents.", ["graph.route", "policy.check", "approval.request"], ["exception", "policy", "temporal"], "ExceptionRecord", "ExecutionDAG", "Overroutes when source confidence is low", "93.8% successful handoffs"],
  ["supplier-scout", "Supplier Scout", "Procurement", 91, "$0.42", "2.4s", "Finds alternate suppliers by spec, region, certification, lead time, and approved-vendor constraints.", ["vendor.search", "cert.verify", "risk.rank"], ["entity", "vendor", "policy"], "PartSpec", "RankedSupplierList", "Public supplier data can be stale", "87.1% top-3 accepted"],
  ["quote-arbiter", "Quote Arbiter", "Procurement", 88, "$0.31", "1.5s", "Normalizes supplier quotes across freight, tax, MOQ, payment terms, and hidden fees.", ["pdf.parse", "cost.normalize", "term.diff"], ["transaction", "policy"], "QuoteBundle", "LandedCostMatrix", "Weak when quotes omit Incoterms", "91.4% cost agreement"],
  ["freight-watch", "Freight Watch", "Logistics", 93, "$0.27", "0.9s", "Detects carrier route drift, predicts ETA confidence, and opens recovery lanes before teams notice delays.", ["carrier.poll", "eta.predict", "lane.compare"], ["temporal", "carrier"], "ShipmentEvent", "RecoveryOptions", "Carrier APIs rate-limit during spikes", "94.2% ETA drift detection"],
  ["invoice-reconciler", "Invoice Reconciler", "Finance Ops", 89, "$0.22", "1.3s", "Matches invoices to purchase orders, receipts, contract terms, and tolerances.", ["invoice.parse", "po.match", "variance.calc"], ["transaction", "policy"], "InvoicePacket", "VarianceDecision", "Requires clean receipt data", "89.9% variance classification"],
  ["customs-drafter", "Customs Drafter", "Trade", 86, "$0.36", "2.0s", "Drafts customs packets and flags missing certificates, packing lists, and invoice mismatches.", ["doc.assemble", "broker.message", "checklist.build"], ["document", "policy"], "TradeDocBundle", "BrokerResponseDraft", "Cannot file without approval", "84.7% packet completeness"],
  ["demand-forecaster", "Demand Forecaster", "Planning", 92, "$0.48", "2.8s", "Combines orders, lead times, capacity, and seasonality into shortage and overstock forecasts.", ["forecast.run", "seasonality.fit", "gap.score"], ["temporal", "planning"], "DemandSeries", "ForecastScenario", "Sensitive to one-time promotions", "92.6% direction accuracy"],
  ["contract-sentinel", "Contract Sentinel", "Legal Ops", 90, "$0.29", "1.7s", "Extracts penalty, payment, liability, and approval clauses from supplier contracts.", ["contract.search", "clause.extract", "obligation.score"], ["policy", "document"], "ContractCorpus", "ClauseRiskMap", "Clause ambiguity requires human review", "90.8% source-backed clauses"],
  ["landed-cost-modeler", "Landed Cost Modeler", "Finance Ops", 87, "$0.34", "1.9s", "Calculates true landed cost using freight, duties, taxes, rebates, MOQ, and payment timing.", ["cost.model", "duty.estimate", "cashflow.compare"], ["transaction", "policy"], "QuoteBundle", "CostScenarioTable", "Duty codes can shift final totals", "88.3% model agreement"],
  ["margin-guardian", "Margin Guardian", "Finance Ops", 91, "$0.25", "1.2s", "Flags decisions that damage gross margin, contribution margin, or cash conversion cycle.", ["margin.calc", "scenario.rank", "threshold.check"], ["transaction", "planning"], "ScenarioTable", "MarginRiskBrief", "Needs current price books", "91.1% finance acceptance"],
  ["vendor-email-drafter", "Vendor Email Drafter", "Procurement", 85, "$0.18", "0.8s", "Drafts supplier emails with sourced questions, negotiation asks, and no unsanctioned commitments.", ["email.draft", "tone.guard", "commitment.check"], ["communication", "policy"], "VendorIssue", "EmailDraft", "Must never send without approval", "86.0% draft reuse"],
  ["receipt-matcher", "Receipt Matcher", "Warehouse Ops", 88, "$0.21", "1.1s", "Matches ASN, receiving data, invoice lines, and warehouse exceptions.", ["asn.match", "receipt.compare", "lot.trace"], ["transaction", "warehouse"], "ReceiptPacket", "ReceiptVarianceMap", "Lot-level data can be incomplete", "88.9% match precision"],
  ["ap-posting-guard", "AP Posting Guard", "Finance Ops", 93, "$0.19", "0.7s", "Blocks unsafe ERP writebacks when duplicate, tolerance, tax, or approval checks fail.", ["duplicate.scan", "approval.check", "erp.guard"], ["policy", "transaction"], "PostingRequest", "PostOrHoldDecision", "Conservative on missing approvals", "96.1% unsafe-post block rate"],
  ["variance-explainer", "Variance Explainer", "Finance Ops", 90, "$0.20", "1.0s", "Turns reconciliation diffs into a concise finance-ready explanation with source links.", ["diff.summarize", "source.link", "owner.assign"], ["transaction", "communication"], "VarianceMap", "FinanceExplanation", "Weak when root cause is outside data", "89.7% operator accepted"],
  ["erp-writeback-agent", "ERP Writeback Agent", "Integration", 84, "$0.33", "1.4s", "Prepares ERP updates with dry-run diffs, rollback metadata, and approval gates.", ["erp.diff", "rollback.plan", "writeback.stage"], ["transaction", "policy"], "ApprovedChange", "StagedWriteback", "Never executes without approval", "82.4% staged updates accepted"],
  ["hs-code-classifier", "HS Code Classifier", "Trade", 83, "$0.39", "2.5s", "Suggests HS classifications from invoice, product spec, prior filings, and trade rulings.", ["hs.lookup", "ruling.search", "evidence.score"], ["document", "policy"], "ProductSpec", "ClassificationEvidence", "Human broker remains final approver", "81.3% broker agreement"],
  ["document-forensics", "Document Forensics", "Trade", 89, "$0.28", "1.6s", "Finds mismatches across invoices, packing lists, certificates, bills of lading, and broker notes.", ["ocr.extract", "field.compare", "missing.flag"], ["document", "transaction"], "DocumentBundle", "MismatchReport", "OCR quality drives confidence", "90.5% mismatch recall"],
  ["trade-compliance-auditor", "Trade Compliance Auditor", "Trade", 92, "$0.41", "2.2s", "Checks customs packets against restricted-party, certificate, tariff, and approval policies.", ["party.screen", "policy.audit", "evidence.pack"], ["policy", "document"], "TradePacket", "ComplianceDecision", "May require external legal review", "92.0% audit traceability"],
  ["broker-coordinator", "Broker Coordinator", "Logistics", 86, "$0.24", "1.2s", "Coordinates broker follow-ups and release paths without filing externally unless approved.", ["broker.thread", "release.plan", "sla.track"], ["communication", "temporal"], "BrokerCase", "ReleasePlan", "Broker response times vary", "85.2% time-to-next-action gain"],
  ["capacity-negotiator", "Capacity Negotiator", "Planning", 87, "$0.30", "1.7s", "Drafts capacity reservation asks and supplier tradeoff options under demand shocks.", ["capacity.model", "email.draft", "constraint.rank"], ["planning", "communication"], "CapacityGap", "ReservationAsk", "Supplier claims need validation", "87.5% planner reuse"],
  ["inventory-simulator", "Inventory Simulator", "Planning", 90, "$0.44", "2.6s", "Simulates stockout paths across lead time, capacity, substitutions, and demand volatility.", ["inventory.sim", "substitute.map", "montecarlo.run"], ["planning", "temporal"], "InventoryState", "StockoutSimulation", "Forecast inputs can dominate results", "90.2% scenario usefulness"],
  ["planner-copilot", "Planner Copilot", "Planning", 85, "$0.23", "1.1s", "Summarizes planning scenarios into recommended commits, deferrals, substitutions, and escalations.", ["plan.summarize", "owner.assign", "risk.brief"], ["planning", "communication"], "PlanningScenario", "PlannerBrief", "Summary only; not a solver", "86.6% briefing accepted"],
  ["risk-sentinel", "Risk Sentinel", "Risk", 91, "$0.37", "1.8s", "Scores supplier, lane, region, currency, and compliance risk across the active workflow.", ["risk.score", "region.scan", "watchlist.check"], ["entity", "policy", "temporal"], "WorkflowContext", "RiskVector", "External signals can be noisy", "91.8% risk escalation precision"],
  ["sla-arbiter", "SLA Arbiter", "Customer Ops", 88, "$0.26", "1.3s", "Maps supply-chain exceptions to customer-facing SLA exposure and update timing.", ["sla.map", "customer.impact", "update.window"], ["policy", "communication"], "ExceptionRecord", "SLAImpact", "Needs accurate customer commitments", "88.1% impact match"],
  ["data-quality-sentinel", "Data Quality Sentinel", "Data Ops", 93, "$0.16", "0.6s", "Detects stale, conflicting, missing, and low-confidence fields before agents act.", ["schema.validate", "freshness.check", "conflict.detect"], ["all"], "ContextPacket", "QualityGate", "Can block flows when sources disagree", "95.4% defect catch rate"],
  ["permission-broker", "Permission Broker", "Security", 95, "$0.18", "0.5s", "Issues scoped capability tokens and removes unnecessary tools from each agent run.", ["token.issue", "scope.reduce", "policy.enforce"], ["policy"], "TaskRequest", "CapabilityToken", "Overly strict scopes need retry", "97.2% least-context compliance"],
  ["rollback-planner", "Rollback Planner", "Integration", 89, "$0.21", "1.0s", "Creates rollback metadata for staged ERP updates, supplier messages, and generated documents.", ["diff.capture", "rollback.write", "owner.map"], ["transaction", "policy"], "StagedAction", "RollbackPlan", "Dependent external actions may not reverse", "88.6% rollback completeness"],
  ["tariff-simulator", "Tariff Simulator", "Trade", 90, "$0.53", "3.1s", "Models tariff, duty, country-of-origin, and quota changes against open POs, customer quotes, and supplier alternatives.", ["hts.diff", "duty.model", "origin.compare"], ["policy", "commercial", "transaction"], "TariffDelta", "ExposureSimulation", "Needs validated country-of-origin data", "89.6% landed-cost variance match"],
  ["supplier-risk-underwriter", "Supplier Risk Underwriter", "Risk", 92, "$0.46", "2.2s", "Prices supplier fragility using delivery variance, quality escapes, geopolitical exposure, payment stress, and concentration risk.", ["risk.price", "news.signal", "concentration.calc"], ["entity", "temporal", "quality"], "SupplierPortfolio", "RiskPremiumMap", "External risk feeds can overreact", "90.9% escalation precision"],
  ["lane-capacity-broker", "Lane Capacity Broker", "Logistics", 88, "$0.38", "1.9s", "Finds temporary carrier capacity and scores lanes by cost, temperature constraints, customs risk, and service reliability.", ["lane.bid", "carrier.rank", "capacity.reserve"], ["carrier", "temporal", "commercial"], "LaneConstraint", "CapacityBidStack", "Spot rates expire quickly", "87.4% viable-lane acceptance"],
  ["carbon-duty-estimator", "Carbon Duty Estimator", "Sustainability", 84, "$0.25", "1.4s", "Estimates emissions, carbon fees, and regulatory reporting risk for supplier and lane choices.", ["emission.factor", "cbam.estimate", "report.flag"], ["policy", "carrier", "document"], "ShipmentPlan", "CarbonCostBrief", "Emission factors vary by source", "83.8% estimate agreement"],
  ["recall-containment-agent", "Recall Containment Agent", "Quality Ops", 91, "$0.49", "2.7s", "Traces suspect lots through receipts, work orders, finished goods, shipments, and customer orders to minimize recall blast radius.", ["lot.trace", "quarantine.plan", "customer.scope"], ["quality", "transaction", "entity"], "QualityEscape", "ContainmentPlan", "False positives are expensive", "91.7% containment boundary precision"],
  ["production-scheduler", "Production Scheduler", "Manufacturing", 87, "$0.35", "1.8s", "Rebuilds production schedules around material shortages, quarantines, capacity constraints, and customer priority rules.", ["schedule.rebuild", "constraint.solve", "line.swap"], ["planning", "temporal", "policy"], "PlantConstraintSet", "RevisedSchedule", "Local plant rules may be undocumented", "86.8% planner acceptance"],
  ["contract-renewal-pricer", "Contract Renewal Pricer", "Legal Ops", 86, "$0.32", "1.6s", "Builds renegotiation packets when tariff, freight, or quality shocks make existing supplier terms uneconomic.", ["clause.price", "term.redline", "counterparty.brief"], ["policy", "commercial", "communication"], "ContractShock", "RenegotiationPacket", "Legal approval remains mandatory", "85.9% negotiation reuse"],
  ["portal-operator", "Portal Operator", "Integration", 82, "$0.29", "2.4s", "Operates low-API vendor portals through scripted forms, field validation, screenshot evidence, and approval-gated submission.", ["portal.read", "form.stage", "screenshot.capture"], ["document", "communication"], "PortalTask", "StagedPortalAction", "Portal UI changes break scripts", "81.5% staged task completion"],
  ["edi-mapper", "EDI Mapper", "Integration", 90, "$0.26", "1.2s", "Maps EDI 850, 855, 856, 810, and 214 documents into typed operational events with lineage.", ["edi.parse", "segment.map", "schema.reconcile"], ["transaction", "execution"], "EdiDocument", "TypedSupplyChainEvent", "Partner-specific segments drift", "92.3% segment mapping precision"],
  ["inventory-allocation-arbiter", "Inventory Allocation Arbiter", "Planning", 89, "$0.37", "2.0s", "Allocates constrained inventory across customers, regions, margin tiers, SLA risk, and substitution rules.", ["allocation.solve", "priority.rank", "substitution.check"], ["planning", "policy", "commercial"], "ConstrainedSupply", "AllocationDecision", "Requires current customer priority rules", "88.5% allocation approval"],
  ["cash-conversion-optimizer", "Cash Conversion Optimizer", "Finance Ops", 88, "$0.31", "1.5s", "Optimizes payment terms, expedite spend, inventory carrying cost, and margin impact across recovery options.", ["cashflow.model", "working_capital.score", "term.compare"], ["commercial", "transaction", "planning"], "RecoveryScenario", "CashImpactBrief", "Finance assumptions must be current", "88.0% finance reuse"],
  ["counterparty-knowledge-builder", "Counterparty Knowledge Builder", "Data Ops", 93, "$0.20", "0.9s", "Builds supplier and broker profiles from contracts, email history, delivery performance, quality events, and exception outcomes.", ["entity.resolve", "profile.merge", "relationship.score"], ["entity", "communication", "quality"], "CounterpartySignals", "CounterpartyProfile", "Entity resolution can merge lookalikes", "94.1% duplicate suppression"],
  ["source-citation-agent", "Source Citation Agent", "Evaluation", 94, "$0.14", "0.7s", "Attaches source spans to claims and fails responses that cannot cite operational records.", ["source.trace", "claim.link", "coverage.score"], ["all"], "AgentOutput", "CitedOutput", "Fails sparse source packets", "96.0% claim traceability"]
].map(([id, name, category, score, cost, latency, copy, tools, memory, input, output, failure, benchmark]) => ({
  id,
  name,
  category,
  score,
  cost,
  latency,
  copy,
  tools,
  memory,
  input,
  output,
  failure,
  benchmark
}));

const runtimeLayers = [
  {
    id: "event-bus",
    title: "Event Bus",
    plane: "Control",
    copy: "Normalizes ERP mutations, email threads, carrier webhooks, document uploads, and vendor portal changes into typed events.",
    input: "{ source, event_type, entity_id, observed_at, payload }",
    output: "{ event_id, entity_refs, freshness, confidence, lineage }",
    failure: "Duplicate events, stale carrier pings, malformed portal exports"
  },
  {
    id: "context-compiler",
    title: "Context Compiler",
    plane: "Control",
    copy: "Builds entity, transaction, policy, temporal, communication, and exception shards for the active task.",
    input: "{ event_ids, task_goal, token_budget, permission_scope }",
    output: "{ packet_id, shards, omitted_context, compression_report }",
    failure: "Over-compression, missing clauses, stale policy shard"
  },
  {
    id: "permission-graph",
    title: "Permission Graph",
    plane: "Security",
    copy: "Issues task-scoped capability tokens and strips tools or memory an agent does not need.",
    input: "{ agent_id, task_id, requested_tools, requested_shards }",
    output: "{ capability_token, allowed_tools, denied_fields, expiry }",
    failure: "Over-broad tool grants, missing approval gate, expired token"
  },
  {
    id: "task-router",
    title: "Task Router",
    plane: "Control",
    copy: "Converts exceptions into DAGs and selects agents by benchmark, cost, latency, source coverage, and permission fit.",
    input: "{ exception, candidate_agents, policy_constraints }",
    output: "{ dag, assignments, confidence, fallback_path }",
    failure: "Wrong specialist, circular dependency, no safe approval path"
  },
  {
    id: "agent-workers",
    title: "Agent Workers",
    plane: "Execution",
    copy: "Runs narrow agents with structured inputs, bounded tools, retries, and typed output contracts.",
    input: "{ capability_token, execution_packet, tool_budget }",
    output: "{ result, tool_calls, diffs, sources, confidence }",
    failure: "Tool timeout, invalid schema, low source coverage"
  },
  {
    id: "evaluation-loop",
    title: "Evaluation Loop",
    plane: "Quality",
    copy: "Scores source coverage, correction rate, hallucination risk, escalation precision, latency, and unit economics.",
    input: "{ agent_output, expected_schema, audit_context }",
    output: "{ eval_score, failed_checks, required_human_review }",
    failure: "Unclear ground truth, missing source spans, policy ambiguity"
  },
  {
    id: "audit-ledger",
    title: "Audit Ledger",
    plane: "Control",
    copy: "Stores prompts, sources, tool calls, approvals, diffs, rollback data, and replay metadata for every action.",
    input: "{ event, actor, source_refs, diff, approval }",
    output: "{ ledger_id, immutable_record, replay_pointer }",
    failure: "Partial external state, missing rollback owner, unlinked source"
  },
  {
    id: "human-gates",
    title: "Human Gates",
    plane: "Governance",
    copy: "Requires approval before supplier messages, ERP writes, customs filings, spend commitments, or customer updates.",
    input: "{ proposed_action, policy, risk, approver_group }",
    output: "{ approved, rejected, edits, approver_identity }",
    failure: "Wrong approver, stale policy, action exceeds authority"
  },
  {
    id: "agent-registry",
    title: "Agent Registry",
    plane: "Control",
    copy: "Stores agent manifests, schema versions, benchmark history, tool contracts, memory scopes, and deployment stages.",
    input: "{ agent_manifest, version, benchmark, rollout_policy }",
    output: "{ deployable_agent, compatibility_report, rollback_pointer }",
    failure: "Schema drift, stale benchmark, unsafe rollout target"
  },
  {
    id: "connector-registry",
    title: "Connector Registry",
    plane: "Integration",
    copy: "Manages ERP, WMS, TMS, email, S3, EDI, vendor portal, and broker portal connectors with lineage metadata.",
    input: "{ connector_id, credential_scope, schema_map, sync_policy }",
    output: "{ normalized_stream, source_health, lineage_map }",
    failure: "Credential expiry, vendor schema drift, partial sync"
  },
  {
    id: "tool-sandbox",
    title: "Tool Sandbox",
    plane: "Security",
    copy: "Runs agent tool calls inside constrained sandboxes with budgets, dry-run diffs, screenshots, and reversible side effects.",
    input: "{ capability_token, tool_call, budget, dry_run }",
    output: "{ tool_result, diff, evidence, rollback_handle }",
    failure: "Timeout, non-reversible side effect, stale external page"
  },
  {
    id: "evaluation-warehouse",
    title: "Evaluation Warehouse",
    plane: "Quality",
    copy: "Persists benchmark traces, operator corrections, ground-truth labels, unit economics, and regression suites by workflow.",
    input: "{ run_trace, correction, outcome, cost, latency }",
    output: "{ benchmark_update, regression_case, reliability_score }",
    failure: "Sparse labels, delayed outcomes, biased correction data"
  }
];

const memoryShards = [
  ["entity", "Entity memory", "Suppliers, parts, SKUs, lanes, brokers, customers, and approved-vendor relationships.", 71],
  ["transaction", "Transaction memory", "POs, invoices, receipts, RFQs, ASNs, line items, quantities, and price terms.", 82],
  ["policy", "Policy memory", "Contract clauses, approval thresholds, tolerance rules, compliance constraints, and SLA terms.", 77],
  ["temporal", "Temporal memory", "Carrier pings, lead times, stockout windows, ETA drift, demand curves, and event freshness.", 64],
  ["communication", "Communication memory", "Supplier emails, broker notes, planner comments, customer updates, and negotiation history.", 59],
  ["document", "Document memory", "PDFs, certificates, invoices, packing lists, bills of lading, quote attachments, and OCR fields.", 68],
  ["planning", "Planning memory", "Forecasts, inventory positions, capacity commitments, substitute SKUs, and margin scenarios.", 73],
  ["quality", "Quality memory", "Freshness scores, field conflicts, missing data, lineage links, and confidence penalties.", 88],
  ["commercial", "Commercial memory", "Customer quotes, price books, rebates, payment terms, margin thresholds, and working-capital assumptions.", 66],
  ["carrier", "Carrier memory", "Lane history, carrier SLAs, spot bids, temperature constraints, equipment availability, and route reliability.", 61],
  ["execution", "Execution memory", "Tool calls, staged writes, dry-run diffs, screenshots, rollback handles, and prior workflow outcomes.", 74],
  ["customer", "Customer memory", "Service commitments, allocation priority, order status, revenue exposure, and approved update language.", 58]
];

const state = {
  view: "workbench",
  scenarioId: "late-lithium",
  activeAgentId: "exception-resolver",
  selectedDagId: "route",
  runtimeLayerId: "context-compiler",
  auditFilter: "all",
  routeStep: 0,
  deployed: new Set(["exception-resolver", "freight-watch", "supplier-scout", "quote-arbiter", "contract-sentinel", "permission-broker"]),
  selectedShards: new Set(["entity", "transaction", "policy", "temporal", "communication"]),
  audit: []
};

const $ = (selector) => document.querySelector(selector);

const refs = {
  pageTitle: $("#pageTitle"),
  scenarioList: $("#scenarioList"),
  riskMetric: $("#riskMetric"),
  hoursMetric: $("#hoursMetric"),
  confidenceMetric: $("#confidenceMetric"),
  deployedMetric: $("#deployedMetric"),
  runStateMetric: $("#runStateMetric"),
  scenarioTitle: $("#scenarioTitle"),
  scenarioSummary: $("#scenarioSummary"),
  severityPill: $("#severityPill"),
  signalGrid: $("#signalGrid"),
  dag: $("#dag"),
  inspectorTitle: $("#inspectorTitle"),
  inspectorBody: $("#inspectorBody"),
  agentGrid: $("#agentGrid"),
  categoryFilter: $("#categoryFilter"),
  agentDetailName: $("#agentDetailName"),
  agentDetailScore: $("#agentDetailScore"),
  agentDetail: $("#agentDetail"),
  runtimeMap: $("#runtimeMap"),
  runtimeDetailTitle: $("#runtimeDetailTitle"),
  runtimeDetail: $("#runtimeDetail"),
  tokenBudget: $("#tokenBudget"),
  compressionMode: $("#compressionMode"),
  memoryShards: $("#memoryShards"),
  packetTitle: $("#packetTitle"),
  packetOutput: $("#packetOutput"),
  auditFilters: $("#auditFilters"),
  auditTable: $("#auditTable"),
  auditDetailTitle: $("#auditDetailTitle"),
  auditDetail: $("#auditDetail")
};

function scenario() {
  return scenarios.find((item) => item.id === state.scenarioId);
}

function agent(id = state.activeAgentId) {
  const found = agents.find((item) => item.id === id);
  return found || (id === state.activeAgentId ? agents[0] : null);
}

function runtimeLayer(id = state.runtimeLayerId) {
  return runtimeLayers.find((item) => item.id === id) || runtimeLayers[0];
}

function addAudit(type, actor, action, details = {}) {
  const count = state.audit.length + 1;
  const time = `09:${String(13 + count).padStart(2, "0")}`;
  state.audit.unshift({
    id: `evt_${String(count).padStart(3, "0")}`,
    time,
    type,
    actor,
    action,
    scenario: state.scenarioId,
    details
  });
}

function seedAudit() {
  if (state.audit.length) return;
  const active = scenario();
  addAudit("source", "Event Bus", `${active.title} ingested`, { sources: active.sources });
  addAudit("memory", "Context Compiler", "Compiled baseline context packet", { shards: [...state.selectedShards] });
  addAudit("router", "Task Router", "Candidate agents ranked by reliability, latency, and permission fit", {
    candidates: active.recommended
  });
  addAudit("gate", "Permission Broker", "Scoped capability tokens issued", { deployed: [...state.deployed] });
}

function severityClass(value) {
  if (value === "high") return "severity-high";
  if (value === "medium") return "severity-medium";
  return "severity-low";
}

function tagClass(type) {
  return `tag-${type}`;
}

function renderScenarioList() {
  refs.scenarioList.innerHTML = scenarios
    .map(
      (item) => `
        <button class="scenario-button ${item.id === state.scenarioId ? "active" : ""}" data-scenario="${item.id}" type="button">
          <strong>${item.short}</strong>
          <span>${item.risk} exposure · ${item.confidence}% confidence</span>
        </button>
      `
    )
    .join("");

  refs.scenarioList.querySelectorAll("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      state.scenarioId = button.dataset.scenario;
      state.routeStep = 0;
      state.selectedDagId = scenario().graph[2][0];
      state.activeAgentId = scenario().recommended[0];
      addAudit("source", "Scenario Loader", `Loaded ${scenario().title}`, { scenario: state.scenarioId });
      renderAll();
    });
  });
}

function renderMetrics() {
  const active = scenario();
  refs.riskMetric.textContent = active.risk;
  refs.hoursMetric.textContent = active.hours;
  refs.confidenceMetric.textContent = `${active.confidence}%`;
  refs.deployedMetric.textContent = String(state.deployed.size);
  refs.runStateMetric.textContent = state.routeStep >= active.graph.length ? "Complete" : state.routeStep > 0 ? "Running" : "Ready";
}

function renderWorkbench() {
  const active = scenario();
  refs.pageTitle.textContent = "Supply-chain command center";
  refs.scenarioTitle.textContent = active.title;
  refs.scenarioSummary.textContent = active.summary;
  refs.severityPill.textContent = active.severity.toUpperCase();
  refs.severityPill.className = `severity-pill ${severityClass(active.severity)}`;
  refs.signalGrid.innerHTML = active.signals
    .map(([label, value]) => `<article class="signal-card"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");

  refs.dag.innerHTML = active.graph
    .map(([id, title, ownerId, type, copy], index) => {
      const runClass = index < state.routeStep ? "complete" : index === state.routeStep ? "running" : "";
      const badge = index < state.routeStep ? "complete" : index === state.routeStep ? "ready" : "queued";
      const ownerAgent = agent(ownerId);
      const ownerLayer = runtimeLayer(ownerId);
      const owner = ownerAgent ? ownerAgent.name : ownerLayer.title || ownerId;
      return `
        <button class="dag-node ${state.selectedDagId === id ? "active" : ""}" data-dag="${id}" type="button">
          <span class="run-badge ${runClass}">${badge}</span>
          <strong>${title}</strong>
          <p>${copy}</p>
          <span class="chip ${tagClass(type)}">${owner}</span>
        </button>
      `;
    })
    .join("");

  refs.dag.querySelectorAll("[data-dag]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedDagId = button.dataset.dag;
      addAudit("router", "Workbench", `Inspected DAG node ${button.dataset.dag}`, { node: button.dataset.dag });
      renderWorkbench();
      renderAudit();
    });
  });

  renderInspector();
}

function renderInspector() {
  const active = scenario();
  const node = active.graph.find(([id]) => id === state.selectedDagId) || active.graph[0];
  const owner = agent(node[2]);
  const layer = runtimeLayer(node[2]);
  refs.inspectorTitle.textContent = node[1];
  refs.inspectorBody.innerHTML = `
    <div class="inspector-section">
      <p class="lead">${node[4]}</p>
      <div class="detail-grid">
        <article class="manifest-card"><span>Node type</span><strong>${node[3]}</strong></article>
        <article class="manifest-card"><span>Owner</span><strong>${owner ? owner.name : layer.title}</strong></article>
        <article class="manifest-card"><span>Source coverage</span><strong>${Math.min(99, scenario().confidence + 12)}%</strong></article>
        <article class="manifest-card"><span>Rollback</span><strong>${node[3] === "gate" ? "required" : "available"}</strong></article>
      </div>
      <ul class="recommendation-list">
        ${active.recommended
          .slice(0, 4)
          .map((id) => `<li><strong>${agent(id).name}</strong><br><span class="muted">${agent(id).copy}</span></li>`)
          .join("")}
      </ul>
    </div>
  `;
}

function renderCategoryFilter() {
  const categories = ["All", ...new Set(agents.map((item) => item.category))];
  const current = refs.categoryFilter.value || "All";
  refs.categoryFilter.innerHTML = categories.map((category) => `<option value="${category}">${category}</option>`).join("");
  refs.categoryFilter.value = categories.includes(current) ? current : "All";
}

function renderMarketplace() {
  refs.pageTitle.textContent = "Agent catalog and deployment";
  renderCategoryFilter();
  const category = refs.categoryFilter.value || "All";
  const visibleAgents = category === "All" ? agents : agents.filter((item) => item.category === category);
  refs.agentGrid.innerHTML = visibleAgents
    .map(
      (item) => `
        <button class="agent-card ${item.id === state.activeAgentId ? "active" : ""}" data-agent="${item.id}" type="button">
          <div class="agent-card-top">
            <span class="chip">${item.category}</span>
            <span class="score-pill">${item.score}</span>
          </div>
          <h3>${item.name}</h3>
          <p>${item.copy}</p>
          <div class="agent-meta">
            <span class="chip">${item.cost}/run</span>
            <span class="chip">${item.latency}</span>
            <span class="chip">${state.deployed.has(item.id) ? "deployed" : "available"}</span>
          </div>
        </button>
      `
    )
    .join("");

  refs.agentGrid.querySelectorAll("[data-agent]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeAgentId = button.dataset.agent;
      addAudit("agent", "Agent Catalog", `Opened ${agent().name} manifest`, { agent: state.activeAgentId });
      renderMarketplace();
      renderAudit();
    });
  });

  renderAgentDetail();
}

function renderAgentDetail() {
  const item = agent();
  refs.agentDetailName.textContent = item.name;
  refs.agentDetailScore.textContent = `${item.score} reliability`;
  refs.agentDetail.innerHTML = `
    <p class="lead">${item.copy}</p>
    <div class="manifest-grid">
      <article class="manifest-card"><span>Input schema</span><strong>${item.input}</strong></article>
      <article class="manifest-card"><span>Output schema</span><strong>${item.output}</strong></article>
      <article class="manifest-card"><span>Latency</span><strong>${item.latency}</strong></article>
      <article class="manifest-card"><span>Unit cost</span><strong>${item.cost}</strong></article>
      <article class="manifest-card"><span>Benchmark</span><strong>${item.benchmark}</strong></article>
      <article class="manifest-card"><span>Failure mode</span><strong>${item.failure}</strong></article>
    </div>
    <h3>Tools</h3>
    <ul class="tool-list">${item.tools.map((tool) => `<li>${tool}</li>`).join("")}</ul>
    <h3>Memory access</h3>
    <div class="agent-meta">${item.memory.map((memory) => `<span class="chip">${memory}</span>`).join("")}</div>
    <div class="manifest-actions">
      <button class="primary-button small" id="deployAgentButton" type="button">${state.deployed.has(item.id) ? "Redeploy" : "Deploy agent"}</button>
      <button class="ghost-button small" id="testAgentButton" type="button">Test on exception</button>
      <button class="ghost-button small" id="scopeAgentButton" type="button">Issue token</button>
    </div>
  `;

  $("#deployAgentButton").addEventListener("click", () => {
    state.deployed.add(item.id);
    addAudit("agent", item.name, "Deployed into active workflow", { tools: item.tools, memory: item.memory });
    renderAll();
  });

  $("#testAgentButton").addEventListener("click", () => {
    state.selectedDagId = "act";
    state.view = "workbench";
    addAudit("tool", item.name, `Dry-run completed on ${scenario().short}`, {
      input: item.input,
      output: item.output,
      confidence: item.score
    });
    showView("workbench");
  });

  $("#scopeAgentButton").addEventListener("click", () => {
    addAudit("gate", "Permission Broker", `Issued scoped token for ${item.name}`, {
      allowed_tools: item.tools,
      memory: item.memory,
      ttl: "15m"
    });
    renderAudit();
  });
}

function renderRuntime() {
  refs.pageTitle.textContent = "Runtime architecture";
  refs.runtimeMap.innerHTML = runtimeLayers
    .map(
      (layer) => `
        <button class="runtime-node ${layer.id === state.runtimeLayerId ? "active" : ""}" data-layer="${layer.id}" type="button">
          <span class="chip">${layer.plane}</span>
          <h3>${layer.title}</h3>
          <p>${layer.copy}</p>
        </button>
      `
    )
    .join("");

  refs.runtimeMap.querySelectorAll("[data-layer]").forEach((button) => {
    button.addEventListener("click", () => {
      state.runtimeLayerId = button.dataset.layer;
      addAudit("source", "Runtime Map", `Inspected ${runtimeLayer().title}`, { layer: state.runtimeLayerId });
      renderRuntime();
      renderAudit();
    });
  });

  const layer = runtimeLayer();
  refs.runtimeDetailTitle.textContent = layer.title;
  refs.runtimeDetail.innerHTML = `
    <p class="lead">${layer.copy}</p>
    <article class="schema-card"><span>Input contract</span><strong>${layer.input}</strong></article>
    <article class="schema-card"><span>Output contract</span><strong>${layer.output}</strong></article>
    <article class="schema-card"><span>Failure modes</span><strong>${layer.failure}</strong></article>
    <pre>${JSON.stringify(
      {
        layer: layer.id,
        plane: layer.plane,
        scenario: scenario().id,
        sample_input: layer.input,
        sample_output: layer.output,
        guardrail: layer.failure
      },
      null,
      2
    )}</pre>
  `;
}

function buildPacket() {
  const active = scenario();
  const activeAgent = agent();
  const budget = Number(refs.tokenBudget.value);
  const selected = [...state.selectedShards];
  const omitted = memoryShards.filter(([id]) => !state.selectedShards.has(id)).map(([, name]) => name);
  return {
    packet_id: `pkt_${active.id}_${activeAgent.id}`,
    scenario: active.title,
    target_agent: activeAgent.name,
    compression_mode: refs.compressionMode.value,
    token_budget: budget,
    selected_shards: selected,
    omitted_shards: omitted,
    allowed_tools: activeAgent.tools,
    denied_actions: ["send_external_email", "write_erp", "approve_spend", "file_customs"],
    source_refs: active.sources,
    quality_gate: {
      minimum_source_coverage: "85%",
      requires_human_approval: active.severity !== "low",
      confidence: `${active.confidence}%`
    }
  };
}

function renderMemory() {
  refs.pageTitle.textContent = "Context compiler";
  refs.memoryShards.innerHTML = memoryShards
    .map(
      ([id, name, copy, coverage]) => `
        <button class="shard-button ${state.selectedShards.has(id) ? "active" : ""}" data-shard="${id}" type="button">
          <strong>${name}</strong>
          <p>${copy}</p>
          <span class="chip">${coverage}% coverage</span>
        </button>
      `
    )
    .join("");

  refs.memoryShards.querySelectorAll("[data-shard]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.shard;
      if (state.selectedShards.has(id) && state.selectedShards.size > 2) {
        state.selectedShards.delete(id);
      } else {
        state.selectedShards.add(id);
      }
      addAudit("memory", "Context Compiler", `Toggled ${id} shard`, { selected_shards: [...state.selectedShards] });
      renderMemory();
      renderAudit();
    });
  });

  const packet = buildPacket();
  refs.packetTitle.textContent = `${packet.token_budget} token ${packet.compression_mode} packet`;
  refs.packetOutput.textContent = JSON.stringify(packet, null, 2);
}

function renderAuditFilters() {
  const filters = ["all", "source", "memory", "router", "agent", "tool", "gate", "eval"];
  refs.auditFilters.innerHTML = filters
    .map(
      (filter) => `
        <button class="filter-button ${state.auditFilter === filter ? "active" : ""}" data-filter="${filter}" type="button">
          ${filter}
        </button>
      `
    )
    .join("");

  refs.auditFilters.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.auditFilter = button.dataset.filter;
      renderAudit();
    });
  });
}

function renderAudit() {
  renderAuditFilters();
  const rows = state.auditFilter === "all" ? state.audit : state.audit.filter((event) => event.type === state.auditFilter);
  refs.auditTable.innerHTML = rows
    .map(
      (event) => `
        <button class="audit-row ${event.id === state.selectedAuditId ? "active" : ""}" data-event="${event.id}" type="button">
          <span class="audit-time">${event.time}</span>
          <span class="audit-tag ${tagClass(event.type)}">${event.type}</span>
          <span class="audit-action">${event.action}</span>
          <span class="audit-actor">${event.actor}</span>
        </button>
      `
    )
    .join("");

  refs.auditTable.querySelectorAll("[data-event]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedAuditId = button.dataset.event;
      renderAudit();
    });
  });

  const selected = state.audit.find((event) => event.id === state.selectedAuditId) || rows[0] || state.audit[0];
  if (selected) {
    state.selectedAuditId = selected.id;
    refs.auditDetailTitle.textContent = `${selected.actor} · ${selected.type}`;
    refs.auditDetail.textContent = JSON.stringify(selected, null, 2);
  } else {
    refs.auditDetailTitle.textContent = "No events";
    refs.auditDetail.textContent = "{}";
  }
}

function routeGraph() {
  const active = scenario();
  if (state.routeStep < active.graph.length) {
    const node = active.graph[state.routeStep];
    state.selectedDagId = node[0];
    addAudit(node[3], agent(node[2])?.name || runtimeLayer(node[2])?.title || "RelayGrid", `Executed: ${node[1]}`, {
      node: node[0],
      scenario: active.id
    });
    state.routeStep += 1;
  } else {
    state.routeStep = 0;
    addAudit("router", "Task Router", "Routing graph reset for replay", { scenario: active.id });
  }
  renderAll();
}

function advanceGraph() {
  routeGraph();
}

function generatePacketAndShow() {
  state.view = "memory";
  const packet = buildPacket();
  addAudit("memory", "Context Compiler", `Generated packet for ${agent().name}`, packet);
  showView("memory");
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function showView(view) {
  state.view = view;
  document.querySelectorAll(".view").forEach((item) => {
    item.classList.toggle("active", item.id === view);
  });
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view);
  });
  renderAll();
}

function renderAll() {
  renderScenarioList();
  renderMetrics();
  if (state.view === "workbench") renderWorkbench();
  if (state.view === "marketplace") renderMarketplace();
  if (state.view === "runtime") renderRuntime();
  if (state.view === "memory") renderMemory();
  renderAudit();
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

refs.categoryFilter.addEventListener("change", renderMarketplace);
refs.tokenBudget.addEventListener("input", renderMemory);
refs.compressionMode.addEventListener("change", renderMemory);
$("#routeButton").addEventListener("click", routeGraph);
$("#advanceGraphButton").addEventListener("click", advanceGraph);
$("#generatePacketButton").addEventListener("click", generatePacketAndShow);
$("#copyPacketButton").addEventListener("click", () => {
  const packet = buildPacket();
  addAudit("memory", "Context Compiler", "Exported execution packet JSON", packet);
  downloadJson("relaygrid-execution-packet.json", packet);
  renderAudit();
});
$("#downloadAuditButton").addEventListener("click", () => {
  downloadJson("relaygrid-audit-ledger.json", state.audit);
});

seedAudit();
renderAll();

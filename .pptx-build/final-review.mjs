import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const { SKILL_DIR, TMP_DIR, WORKSPACE_DIR, FINAL_PPTX, RUNTIME_PYTHON } = process.env;
const { resolvePresentationFont, finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, 'container_tools/artifact_tool_utils.mjs')).href,
);
const font = resolvePresentationFont({ fontFamily: 'Arial' });
const C = {
  navy: '#071A2B', navy2: '#102C42', ink: '#183244', muted: '#597180',
  teal: '#00A9B7', cyan: '#65D1DA', pale: '#E6F4F5', paper: '#F5F8F8',
  white: '#FFFFFF', line: '#D8E4E7', amber: '#D18A27', amberPale: '#FFF2DB',
  green: '#25785D', greenPale: '#E4F3EC', red: '#B84B4B', redPale: '#F9E8E6',
  violet: '#7865BA', violetPale: '#EFEAF9',
};
const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const noLine = { fill: 'none', width: 0 };

function rect(s, x, y, w, h, fill, line = 'none', radius = false) {
  return s.shapes.add({
    geometry: radius ? 'roundRect' : 'rect',
    position: { left: x, top: y, width: w, height: h }, fill,
    line: { fill: line, width: line === 'none' ? 0 : 1 },
    ...(radius ? { borderRadius: 'rounded-xl' } : {}),
  });
}
function rule(s, x, y, w, color = C.line, h = 1) { return rect(s, x, y, w, h, color); }
function txt(s, text, x, y, w, h, size, color = C.ink, bold = false, opts = {}) {
  const q = s.shapes.add({ geometry: 'textbox', position: { left: x, top: y, width: w, height: h }, fill: 'none', line: noLine });
  q.text = text;
  q.text.style = { typeface: font, fontSize: size, bold, color, verticalAlignment: 'middle', autoFit: 'shrinkText', wrap: true, ...opts };
  return q;
}
function notes(s, value) { s.speakerNotes.textFrame.setText(value); }
function base(title, num, sub = '') {
  const s = p.slides.add();
  s.background.fill = C.paper;
  rect(s, 0, 0, 12, 720, C.teal);
  txt(s, title, 66, 38, 1120, 58, 35, C.ink, true);
  if (sub) txt(s, sub, 68, 98, 1120, 38, 17, C.muted);
  rule(s, 68, 650, 1120, C.line);
  txt(s, 'AGENTIC DATABASE HANDLER   /   DBTHON 2026', 68, 663, 620, 24, 11, C.muted, true);
  txt(s, String(num).padStart(2, '0'), 1152, 662, 36, 24, 12, C.muted, true);
  return s;
}
function label(s, text, x, y, color = C.teal, w = 240) { txt(s, text.toUpperCase(), x, y, w, 22, 12, color, true); }
function card(s, x, y, w, h, title, body, accent = C.teal) {
  rect(s, x, y, w, h, C.white, C.line, true);
  rect(s, x, y, 5, h, accent);
  txt(s, title, x + 20, y + 15, w - 40, 31, 19, C.ink, true);
  txt(s, body, x + 20, y + 52, w - 40, h - 64, 15, C.muted, false, { verticalAlignment: 'top' });
}

// 1 Cover
{
  const s = p.slides.add(); s.background.fill = C.navy;
  const bytes = new Uint8Array(await fs.readFile(path.join(TMP_DIR, 'cover.png')));
  s.images.add({ blob: bytes, contentType: 'image/png', alt: 'Abstract relational database schema in blue light', fit: 'cover', position: { left: 0, top: 0, width: 1280, height: 720 } });
  rect(s, 0, 0, 720, 720, '#071A2B/65');
  label(s, 'DBTHON 2026  /  Final project review', 80, 143, C.cyan, 500);
  txt(s, 'Agentic Database\nHandler', 78, 194, 620, 160, 49, C.white, true, { verticalAlignment: 'top' });
  txt(s, 'A local workbench for understanding database structure and guiding human review', 82, 378, 525, 86, 23, '#D6E8EF', false, { verticalAlignment: 'top' });
  rect(s, 82, 500, 68, 5, C.teal);
  txt(s, 'Scan  /  Explain  /  Review', 82, 524, 390, 32, 16, '#C3DCE4', true);
  txt(s, 'SDG 9  /  Industry, Innovation and Infrastructure', 82, 661, 630, 23, 12, '#A9C4CF', false);
  notes(s, 'Project identity, current scope, and SDG 9 alignment are summarized from PROJECT_PRIMER.md and the DBTHON form discussion in chat “DBthon form.”');
}

// 2 Problem
{
  const s = base('Database reviews start with scattered evidence', 2, 'Schema structure, design concerns, and change history often live in different tools.');
  txt(s, 'Teams need to answer four basic questions before they can make a safe design decision.', 72, 174, 495, 110, 28, C.ink, true, { verticalAlignment: 'top' });
  const qs = [
    ['01', 'What is here?', 'Tables, fields, keys, and relationships'],
    ['02', 'What needs a look?', 'Possible design and documentation issues'],
    ['03', 'What changed?', 'A comparison with the last scan'],
    ['04', 'What does it mean?', 'A readable explanation tied to evidence'],
  ];
  qs.forEach((a, i) => {
    const y = 170 + i * 102;
    txt(s, a[0], 650, y, 52, 40, 17, C.teal, true);
    txt(s, a[1], 714, y - 2, 205, 38, 21, C.ink, true);
    txt(s, a[2], 920, y, 260, 49, 15, C.muted, false, { verticalAlignment: 'top' });
    if (i < 3) rule(s, 650, y + 68, 530, C.line);
  });
  rect(s, 72, 477, 500, 94, C.navy, 'none', true);
  txt(s, 'The gap', 96, 494, 100, 24, 13, C.cyan, true);
  txt(s, 'Understanding a database takes more than seeing its tables.', 96, 526, 430, 34, 18, C.white, true);
  notes(s, 'Problem framing draws from PROJECT_PRIMER.md and the hackathon review guide in chat “Explain project for hackathon review.” The project targets schema understanding and review, not automatic database administration.');
}

// 3 Workflow
{
  const s = base('One saved snapshot anchors the review', 3, 'The workbench turns metadata into a record people can inspect, discuss, and compare.');
  const steps = [
    ['01', 'Connect', 'Test access to an authorized database'],
    ['02', 'Scan', 'Save schema metadata as a snapshot'],
    ['03', 'Analyze', 'Run repeatable checks on that snapshot'],
    ['04', 'Explain', 'Explore findings, docs, diagram, and chat'],
    ['05', 'Review', 'Record decisions and compare future scans'],
  ];
  const x0 = 70, gap = 230;
  steps.forEach((a, i) => {
    const x = x0 + i * gap;
    txt(s, a[0], x, 210, 44, 38, 22, C.teal, true);
    rect(s, x, 259, 4, 100, i === 0 ? C.teal : C.line);
    txt(s, a[1], x + 18, 258, 190, 34, 20, C.ink, true);
    txt(s, a[2], x + 18, 301, 185, 68, 15, C.muted, false, { verticalAlignment: 'top' });
  });
  rule(s, 72, 421, 1110);
  label(s, 'Two databases, two jobs', 74, 452, C.teal, 250);
  card(s, 72, 486, 505, 108, 'Target database', 'Business tables and collections being inspected.', C.blue);
  card(s, 613, 486, 570, 108, 'Workbench store', 'Connections, snapshots, findings, reports, conversations, and run history.', C.violet);
  notes(s, 'Workflow and target/store distinction are documented in PROJECT_PRIMER.md, especially “The most important mental model: two databases, two purposes” and “How an investigation flows.”');
}

// 4 Architecture
{
  const s = base('A browser workbench coordinates local services', 4, 'The backend inspects the target and stores results separately from business data.');
  card(s, 72, 202, 255, 138, 'React + TypeScript', 'Schema explorer, findings, reports, design tools, and chat.', C.teal);
  card(s, 380, 202, 255, 138, 'FastAPI', 'Versioned API, validation, background runs, and progress events.', C.blue);
  card(s, 688, 202, 255, 138, 'Connectors', 'PostgreSQL and MariaDB metadata; MongoDB metadata and sampled shape.', C.violet);
  card(s, 996, 202, 192, 138, 'Target DB', 'Authorized database under inspection.', C.amber);
  // Thin editable connectors mark request/data direction.
  rect(s, 330, 269, 44, 2, C.teal); rect(s, 638, 269, 44, 2, C.teal); rect(s, 946, 269, 44, 2, C.teal);
  card(s, 236, 403, 365, 128, 'SQLAlchemy + Alembic store', 'Saved connections, snapshots, findings, reports, and runs.', C.blue);
  card(s, 680, 403, 365, 128, 'Optional bounded AI', 'Explicit opt-in, limited snapshot context, read-oriented tools, checked references.', C.violet);
  txt(s, 'Default path stays local. AI mode is off until a key and schema-sharing opt-in are configured.', 238, 560, 810, 38, 15, C.muted, false);
  notes(s, 'Architecture is summarized from PROJECT_PRIMER.md and README.md. AI tools and schema sharing are described in backend/app/agent.py and README.md. The AI path was not exercised in the recorded local verification.');
}

// 5 Demo schema
{
  const s = base('The shop demo makes findings concrete', 5, 'Four tables show ordinary relationships and one deliberate review question.');
  const table = (x, y, w, name, fields, accent = C.teal) => {
    rect(s, x, y, w, 138, C.white, C.line, true);
    rect(s, x, y, w, 35, accent, 'none', true);
    txt(s, name, x + 14, y + 3, w - 28, 28, 17, C.white, true);
    txt(s, fields, x + 14, y + 48, w - 28, 74, 14, C.muted, false, { verticalAlignment: 'top' });
  };
  table(76, 204, 238, 'customers', 'id, email\ncreated_at');
  table(388, 204, 238, 'orders', 'id, customer_id\nplaced_at');
  table(700, 204, 254, 'order_items', 'order_id + product_id\nproduct_name, sale_price');
  table(1002, 204, 200, 'event_log', 'event_type\ncreated_at');
  rect(s, 315, 271, 66, 2, C.teal); rect(s, 627, 271, 66, 2, C.teal);
  txt(s, '1 to many', 317, 244, 62, 20, 10, C.teal, true);
  txt(s, '1 to many', 629, 244, 62, 20, 10, C.teal, true);
  rect(s, 1084, 355, 2, 50, C.amber);
  txt(s, 'Review prompt', 950, 421, 242, 24, 13, C.amber, true);
  txt(s, 'No declared primary key and a timestamp without time zone invite review. They do not prove the table is wrong.', 950, 453, 246, 95, 15, C.ink, false, { verticalAlignment: 'top' });
  rect(s, 76, 399, 820, 132, C.pale, 'none', true);
  txt(s, 'A useful modeling nuance', 100, 421, 300, 24, 14, C.teal, true);
  txt(s, 'order_items keeps product name and price from the purchase date. That history may be intentional, even if a catalog stores current values too.', 100, 459, 755, 54, 18, C.ink, true, { verticalAlignment: 'top' });
  notes(s, 'Demo schema details and interpretation come from PROJECT_PRIMER.md and the supplied demo SQL under demo/postgres and demo/supabase_shop_schema.sql. The documented demo has two customers, two orders, and one order item. The relationship diagram shows table-level structure, not row counts.');
}

// 6 Evidence
{
  const s = base('The recorded live demo completed the core review loop', 6, 'PostgreSQL verification on October 7, 2026 covered the path from connection to safe query rejection.');
  const metrics = [
    ['4', 'tables scanned'], ['6', 'findings generated'], ['1', 'documentation report'], ['1', 'write attempt rejected'],
  ];
  metrics.forEach((a, i) => {
    const x = 74 + i * 282;
    rect(s, x, 202, 250, 134, C.white, C.line, true);
    txt(s, a[0], x + 20, 216, 210, 55, 38, i === 3 ? C.green : C.teal, true);
    txt(s, a[1], x + 21, 282, 210, 30, 15, C.muted, true);
  });
  label(s, 'Also exercised', 75, 390, C.teal, 160);
  const checks = [
    ['Connection test', 'Saved and tested the demo target'],
    ['Evidence chat', 'Answer referenced saved schema facts'],
    ['Query lab', 'Bounded SELECT and estimated plan returned'],
  ];
  checks.forEach((a, i) => {
    const x = 74 + i * 370;
    rect(s, x, 432, 340, 106, C.white, C.line, true);
    txt(s, a[0], x + 18, 448, 300, 26, 18, C.ink, true);
    txt(s, a[1], x + 18, 482, 300, 42, 14, C.muted, false, { verticalAlignment: 'top' });
  });
  txt(s, 'Recorded automated checks: 20 backend tests, 5 frontend tests, and a successful frontend production build.', 76, 574, 1000, 28, 14, C.muted, false);
  notes(s, 'All metrics and verification claims are from IMPLEMENTATION_STATUS.md and PROJECT_PRIMER.md. The status file records that the browser flow completed on 2026-10-07, with 4 tables, relationships, 6 findings, Markdown documentation, evidence-linked fallback chat, bounded read query and estimated plan, and write-query rejection. Automated suites and frontend build passed in that run.');
}

// 7 Agentic
{
  const s = base('Three kinds of reasoning share the work', 7, 'Repeatable checks establish facts; human context and optional AI help interpret them.');
  const layers = [
    { x: 74, c: C.blue, n: '01  Deterministic checks', t: 'Repeatable observations', b: 'Example: a table has no declared primary key. The output is a finding with evidence, assumptions, and a certainty label.' },
    { x: 454, c: C.violet, n: '02  User supplied meaning', t: 'Business rules add context', b: 'Normalization checks use confirmed functional dependencies. The result depends on whether those rules are complete and true.' },
    { x: 834, c: C.teal, n: '03  Optional AI assistant', t: 'Flexible explanation, limited tools', b: 'With explicit opt-in, the model can inspect objects, findings, or business rules, then cite saved evidence.' },
  ];
  layers.forEach((a) => {
    rect(s, a.x, 211, 350, 294, C.white, C.line, true);
    rect(s, a.x, 211, 350, 8, a.c);
    txt(s, a.n, a.x + 22, 241, 308, 28, 13, a.c, true);
    txt(s, a.t, a.x + 22, 290, 302, 61, 22, C.ink, true, { verticalAlignment: 'top' });
    txt(s, a.b, a.x + 22, 374, 302, 105, 16, C.muted, false, { verticalAlignment: 'top' });
  });
  rect(s, 74, 545, 1110, 56, C.navy, 'none', true);
  txt(s, 'The model has no general SQL execution or schema-change tool.', 95, 556, 1060, 32, 17, C.white, true);
  notes(s, 'Reasoning model and boundaries come from PROJECT_PRIMER.md, backend/app/agent.py, and the project review chat. AI mode was not enabled in the recorded local run, so this slide describes the implemented design and its intended boundaries rather than a live AI demonstration.');
}

// 8 Design lab
{
  const s = base('The Design Lab helps investigate tradeoffs', 8, 'Each report has a different evidence base, so its limits travel with the result.');
  const rows = [
    ['Normalization', 'Checks supplied dependencies', 'Business rules may be incomplete'],
    ['Profiling', 'Samples up to 1,000 rows per table', 'Sample may not represent all rows'],
    ['Workload + indexes', 'Fingerprints SQL and suggests candidates', 'Candidate needs plan and write-cost review'],
    ['Engine suitability', 'Uses workload description and heuristics', 'Not a benchmark or migration decision'],
    ['Index experiments', 'Measures synthetic rows in SQLite or sandbox', 'Does not predict source performance'],
    ['Diffs + relationships', 'Compares snapshots and suggests matches', 'A suggestion needs semantic confirmation'],
  ];
  txt(s, 'TOOL', 76, 183, 230, 22, 12, C.teal, true);
  txt(s, 'WHAT IT USES', 336, 183, 365, 22, 12, C.teal, true);
  txt(s, 'HOW TO READ THE RESULT', 750, 183, 430, 22, 12, C.teal, true);
  rule(s, 74, 215, 1110, C.line, 2);
  rows.forEach((a, i) => {
    const y = 229 + i * 57;
    txt(s, a[0], 76, y, 245, 37, 15, C.ink, true);
    txt(s, a[1], 336, y, 390, 37, 14, C.muted);
    txt(s, a[2], 750, y, 425, 42, 14, C.muted);
    if (i < rows.length - 1) rule(s, 74, y + 44, 1110, C.line);
  });
  notes(s, 'Design Lab details and qualifications are summarized from PROJECT_PRIMER.md, IMPLEMENTATION_STATUS.md, and the related chat “Explain the design lab.” Additional features include source-context line references, migration inventories, generated sample data, scheduled scans, and PostgreSQL sandbox support; several advanced flows still need browser-level verification.');
}

// 9 Recent work
{
  const s = base('Recent work makes the demo easier to connect and explain', 9, 'The current tree adds Supabase-oriented sample assets and a clearer connection workflow.');
  const work = [
    { x: 74, y: 204, t: 'Supabase shop demo', b: 'Schema, seed, and expansion SQL files support a richer shop example.' },
    { x: 454, y: 204, t: 'Safer diagnostics', b: 'Connection errors explain likely auth, pooler, database, and network causes without exposing driver text.' },
    { x: 834, y: 204, t: 'Editable connections', b: 'Users can update a saved connection and leave the password blank to retain it.' },
    { x: 74, y: 385, t: 'Grounded local fallback', b: 'Basic chat answers can cite saved objects and findings when external AI is off.' },
    { x: 454, y: 385, t: 'Explicit AI sharing', b: 'Open-ended model analysis requires a key and a separate schema-sharing opt-in.' },
    { x: 834, y: 385, t: 'Accessible review history', b: 'Snapshots, reports, findings, conversations, and run records stay available in the workbench.' },
  ];
  work.forEach((a, i) => card(s, a.x, a.y, 346, 140, a.t, a.b, [C.teal, C.blue, C.violet, C.green, C.amber, C.teal][i]));
  txt(s, 'Supabase demo assets are present in the repository; the recorded live end-to-end run used the local PostgreSQL demo.', 75, 566, 1100, 28, 14, C.muted, false);
  notes(s, 'Current-tree evidence comes from demo/supabase_shop_schema.sql, demo/supabase_shop_seed.sql, demo/supabase_shop_expansion.sql, backend/app/error_messages.py, backend/app/main.py, and frontend/src/App.tsx. README.md documents the local AI opt-in. Supabase live operation is not included in the recorded verification.');
}

// 10 Boundaries
{
  const s = base('Human review and database permissions set the boundary', 10, 'The workbench records and explains recommendations. The target database remains under the operator’s control.');
  const left = [
    ['Read first', 'Use an authorized connection and read-only credentials for ordinary scans.'],
    ['Bound queries', 'Limit returned rows, response size, and execution time; reject non-SELECT and locking queries.'],
    ['Keep decisions visible', 'Approvals and migration inventories record review. They do not apply schema changes.'],
  ];
  const right = [
    ['AI privacy', 'A model key and explicit schema-sharing opt-in are required for external AI context.'],
    ['Snapshot freshness', 'A saved snapshot describes one scan. Rescan before relying on changed database structure.'],
    ['Local scope', 'Optional local accounts are not security-reviewed for public exposure; jobs run in one API process.'],
  ];
  left.forEach((a, i) => card(s, 74, 198 + i * 124, 530, 105, a[0], a[1], C.green));
  right.forEach((a, i) => card(s, 676, 198 + i * 124, 530, 105, a[0], a[1], i === 2 ? C.amber : C.blue));
  txt(s, 'A recommendation can be useful and still require workload evidence or business context.', 76, 594, 1100, 30, 16, C.ink, true);
  notes(s, 'Boundaries and limitations are documented in README.md, PROJECT_PRIMER.md, and IMPLEMENTATION_STATUS.md. SQL parsing does not replace database permissions. The optional local account system lacks a security review, rate limits, external identity, backup/restore, and distributed workers.');
}

// 11 Verification status
{
  const s = base('Core flow is verified; several advanced paths need a live pass', 11, 'This separates recorded results from capabilities that exist in code but have less end-to-end coverage.');
  rect(s, 74, 192, 530, 384, C.white, C.line, true);
  rect(s, 74, 192, 530, 48, C.greenPale, 'none', true);
  txt(s, 'RECORDED LIVE VERIFICATION', 96, 203, 490, 25, 13, C.green, true);
  const yes = ['PostgreSQL demo connection and scan', 'Four tables, relationships, and six findings', 'Markdown documentation and cited fallback chat', 'Bounded SELECT, estimated plan, write rejection', '20 backend tests, 5 frontend tests, frontend build'];
  yes.forEach((a, i) => { txt(s, '✓', 98, 263 + i * 53, 28, 25, 18, C.green, true); txt(s, a, 132, 260 + i * 53, 435, 34, 15, C.ink); });
  rect(s, 674, 192, 530, 384, C.white, C.line, true);
  rect(s, 674, 192, 530, 48, C.amberPale, 'none', true);
  txt(s, 'NEEDS MORE LIVE VALIDATION', 696, 203, 490, 25, 13, C.amber, true);
  const next = ['MariaDB and MongoDB integration fixtures', 'Schedules, cancellation, account roles, sandbox runs', 'Advanced Design Lab browser flows', 'External AI answers and schema-sharing path', 'Supabase live connection and demo walkthrough'];
  next.forEach((a, i) => { txt(s, '○', 698, 263 + i * 53, 28, 25, 18, C.amber, true); txt(s, a, 732, 260 + i * 53, 435, 37, 15, C.ink); });
  txt(s, 'Source: project status recorded October 7, 2026. Current uncommitted changes may include newer work than that verification.', 76, 594, 1100, 27, 13, C.muted);
  notes(s, 'Recorded tests and live demo details come from IMPLEMENTATION_STATUS.md, which states the verification date as October 7, 2026. The right-side items are explicitly listed there as not yet verified or as integration/browser coverage gaps. Supabase demo assets are newer additions and are not included in the documented live run.');
}

// 12 Closing / next steps
{
  const s = base('Next: validate advice before broader use', 12, 'The strongest continuation is broader live evidence and measured value for review decisions.');
  const next = [
    ['01  Verify', 'Exercise connector fixtures, schedules, auth, sandbox, and advanced design flows on disposable data.'],
    ['02  Evaluate', 'Compare advisory finding triage and evidence-gap labels with human review on representative cases.'],
    ['03  Harden', 'Improve authentication, secrets, persistence, worker coordination, and operational checks before shared deployment.'],
  ];
  next.forEach((a, i) => {
    const x = 76 + i * 375;
    txt(s, a[0], x, 205, 330, 36, 21, [C.teal, C.violet, C.blue][i], true);
    rule(s, x, 256, 320, C.line, 3);
    txt(s, a[1], x, 281, 320, 122, 18, C.ink, false, { verticalAlignment: 'top' });
  });
  rect(s, 76, 455, 1110, 120, C.navy, 'none', true);
  txt(s, 'Review takeaway', 102, 476, 240, 23, 13, C.cyan, true);
  txt(s, 'A database workbench that turns schema metadata into reviewable findings and evidence-linked explanations, while keeping changes under human control.', 102, 513, 1035, 50, 21, C.white, true);
  txt(s, 'Jev decision support is being explored in a separate branch. Its live TypeSafe responses still need validation before presenting it as part of this build.', 78, 594, 1100, 28, 13, C.muted);
  notes(s, 'Next steps are based on IMPLEMENTATION_STATUS.md, README.md, and the related chats “Prioritize JEV Decision Making” and “Grill-me on agentic DB handler.” Jev is not in this checkout’s backend/frontend. A related separate branch described a Jev integration, with mocked response tests but real TypeSafe API behavior unverified because no API key was configured. Keep the Jev work advisory and validate it against representative cases before relying on it.');
}

await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });
const candidate = path.join(TMP_DIR, 'candidate.pptx');
await (await PresentationFile.exportPptx(p)).save(candidate);
const result = await finalizePresentation({
  workspaceDir: WORKSPACE_DIR,
  candidatePath: candidate,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(SKILL_DIR, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-bullet-geometry', '--validate-heading-fit'],
  fontPolicy: { basis: 'design', families: [font] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(WORKSPACE_DIR, '.codex-finalizer', 'final-hackathon-review-v2.validation.json'),
});
console.log(JSON.stringify({ font, result }));
for (let i = 0; i < p.slides.items.length; i++) {
  const slide = p.slides.items[i];
  const png = await p.export({ slide, format: 'png', scale: 1 });
  await fs.writeFile(path.join(TMP_DIR, `slide-${String(i + 1).padStart(2, '0')}.png`), new Uint8Array(await png.arrayBuffer()));
}

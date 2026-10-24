from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path

out=Path('output/DBTHON_2026_Assessment_7_Project_Report.docx')
doc=Document()
sec=doc.sections[0]
sec.top_margin=Inches(.72); sec.bottom_margin=Inches(.68); sec.left_margin=Inches(.78); sec.right_margin=Inches(.78)
styles=doc.styles
styles['Normal'].font.name='Aptos'; styles['Normal'].font.size=Pt(10); styles['Normal'].font.color.rgb=RGBColor(0,0,0)
styles['Normal'].paragraph_format.space_after=Pt(6)
for name,size,color in [('Title',27,'000000'),('Heading 1',17,'000000'),('Heading 2',12,'333333'),('Heading 3',10,'000000')]:
    s=styles[name]; s.font.name='Aptos Display'; s.font.size=Pt(size); s.font.bold=True; s.font.color.rgb=RGBColor.from_string(color)
    s.paragraph_format.space_before=Pt(12); s.paragraph_format.space_after=Pt(5)

# helpers

def shade(cell, fill):
    tcPr=cell._tc.get_or_add_tcPr(); shd=OxmlElement('w:shd'); shd.set(qn('w:fill'),fill); tcPr.append(shd)
def set_cell(cell,text,bold=False,color=None,size=9):
    cell.text=''; p=cell.paragraphs[0]; p.paragraph_format.space_after=Pt(2)
    r=p.add_run(text); r.bold=bold; r.font.name='Aptos'; r.font.size=Pt(size)
    if color: r.font.color.rgb=RGBColor.from_string(color)
    cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER

def table(headers, rows, widths=None):
    t=doc.add_table(rows=1, cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.style='Table Grid'
    for i,h in enumerate(headers): set_cell(t.rows[0].cells[i],h,True,'FFFFFF',9); shade(t.rows[0].cells[i],'404040')
    for ri,row in enumerate(rows):
        cells=t.add_row().cells
        for i,val in enumerate(row):
            set_cell(cells[i],val,False,None,8.5)
            if ri%2==1: shade(cells[i],'F2F2F2')
    if widths:
        for row in t.rows:
            for i,w in enumerate(widths): row.cells[i].width=Inches(w)
    doc.add_paragraph().paragraph_format.space_after=Pt(0)
    return t

def para(txt='', style=None): return doc.add_paragraph(txt, style)
def bullet(txt):
    p=doc.add_paragraph(style='List Bullet'); p.paragraph_format.space_after=Pt(3); p.add_run(txt); return p

def numbered(txt):
    p=doc.add_paragraph(style='List Number'); p.paragraph_format.space_after=Pt(3); p.add_run(txt); return p

# header/footer
header=sec.header.paragraphs[0]; header.text='DBTHON 2026  |  ASSESSMENT 7 PROJECT PROPOSAL'; header.style='Caption'; header.runs[0].font.color.rgb=RGBColor(70,70,70); header.runs[0].bold=True
footer=sec.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
rr=footer.add_run('Agentic Database Handler  •  Proposed Project Report'); rr.font.size=Pt(8); rr.font.color.rgb=RGBColor(100,112,125)

p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(35)
r=p.add_run('DBTHON 2026'); r.bold=True; r.font.size=Pt(12); r.font.color.rgb=RGBColor(70,70,70)
p=doc.add_paragraph(style='Title'); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run('Agentic Database Handler')
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=p.add_run('An evidence grounded workbench for understanding and improving database design'); r.font.size=Pt(14); r.font.color.rgb=RGBColor(70,70,70)
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.paragraph_format.space_before=Pt(18)
r=p.add_run('Assessment 7  |  Detailed Project Proposal'); r.bold=True; r.font.size=Pt(12)
p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
p.add_run('Project domain: Database systems, developer tooling, explainable AI').font.size=Pt(10)

# callout
p=doc.add_paragraph(); p.paragraph_format.left_indent=Inches(.45); p.paragraph_format.right_indent=Inches(.45); p.paragraph_format.space_before=Pt(23); p.paragraph_format.space_after=Pt(10)
r=p.add_run('Proposal summary  '); r.bold=True; r.font.color.rgb=RGBColor(70,70,70)
p.add_run('The project proposes a local database workbench that turns schema inspection into an explainable, reviewable workflow. It combines deterministic design checks, saved schema snapshots, evidence-linked AI assistance, and human approval gates. A working local implementation already supports the core workflow; the physical hackathon will focus on a polished end-to-end demonstration, targeted integration hardening, and structured evaluation. Assessment 7 documents the problem and plan; prototype demonstration and evaluation remain for the hackathon / Final Project Review.')

doc.add_page_break()
doc.add_heading('1. Executive summary', level=1)
para('Teams often inherit databases whose structure is poorly documented, inconsistently indexed, or difficult to reason about. Understanding the schema requires navigating database consoles, source code, design notes, and specialist knowledge. This slows onboarding and makes early design decisions harder to review. A general-purpose AI assistant can make this worse if it invents schema facts or proposes risky changes without showing its evidence.')
para('The Agentic Database Handler addresses this gap with a local workbench for inspecting authorized databases, saving point-in-time schema snapshots, identifying review candidates, generating documentation, and answering questions grounded in observed metadata. It is designed around a practical control boundary: inspect and explain first; keep query execution bounded and read-only in the normal path; require a person to evaluate proposals; never silently apply schema changes.')
para('The project already has a React and TypeScript frontend, a FastAPI backend, PostgreSQL demo target, metadata connectors for PostgreSQL, MariaDB, and MongoDB, deterministic findings, documentation and chat flows, query safeguards, background jobs, and proposal review records. The hackathon implementation effort can therefore concentrate on one compelling demonstration path, clarify feature boundaries, test the most important failure cases, and measure whether the tool improves the speed and quality of schema understanding.')

doc.add_heading('2. Problem statement', level=1)
para('Database schemas encode important business decisions, but their meaning is often distributed across table definitions, application code, migration history, and the knowledge of individual developers. As systems evolve, schema documentation becomes stale. A developer who needs to answer “What does this table represent?”, “Which relationships are declared?”, or “Why might this index matter?” may have to perform a manual investigation across several tools.')
para('The problem is especially visible in small teams, student projects, and organizations without a dedicated database administrator. They need useful design feedback but may not have time or specialist support for repeated schema reviews. They also need to distinguish an observed fact from a heuristic recommendation: a missing primary key is observable, while whether a denormalized value is wrong depends on business meaning and workload.')
para('The project addresses the following core question: How can a developer understand and review a database schema more quickly while retaining traceability, human judgment, and control over changes?')

doc.add_heading('3. Domain and intended users', level=1)
table(['Area','Project relevance'],[
('Database systems','Schema metadata, tables and collections, attributes, keys, indexes, relationships, query plans, normalization, and schema evolution.'),
('Developer productivity','A single workbench for exploration, documentation, findings, query inspection, saved history, and design review.'),
('Explainable AI','Optional model assistance that can inspect a restricted set of saved evidence and cite known objects or findings.'),
('Intended users','Students, application developers, database learners, small engineering teams, and reviewers onboarding to an existing database.'),
('Operating context','Local, single-computer demonstration using databases the operator is authorized to inspect; not a production database administration service.')], [1.5,5.5])

doc.add_heading('4. Existing approaches and their limitations', level=1)
table(['Approach','What it does well','Limitation addressed by this proposal'],[
('Database-native consoles and catalog queries','Expose accurate metadata and let experienced users run direct investigations.','Require familiarity with engine-specific tools and query patterns; findings, explanation, and history are often spread across views.'),
('ERD and schema documentation tools','Make structure and relationships easier to browse.','May not explain design risks, preserve review decisions, or connect recommendations to evidence.'),
('Manual code review and DBA consultation','Bring business context and expert judgment.','Can be slow to schedule and difficult to repeat consistently as a schema changes.'),
('General-purpose AI chat','Accept natural-language questions and produce readable explanations.','Can hallucinate objects, overlook evidence, or suggest unsafe actions unless constrained and checked.'),
('Automated linting and static rules','Offer repeatable checks for known patterns.','Rules can be context-insensitive; a heuristic is not proof that a design is defective.')], [1.6,2.4,3.0])
para('The proposed workbench combines the strengths of these approaches: metadata comes from the database, deterministic checks remain reproducible, AI is optional and bounded, and decisions remain reviewable by a person. It is not intended to replace a DBA, engine documentation, or workload testing.')

doc.add_heading('5. Proposed database solution', level=1)
para('The solution has two separate database roles. The target database contains the application’s business tables and is inspected. The workbench store contains saved connections, snapshots, findings, reports, conversations, run status, and review records. Keeping these roles separate makes it clear where observations originate and where the tool persists its own history.')
table(['Capability','Proposed behavior'],[
('Connection and scan','Test an authorized connection and inspect metadata within a bounded scan. Save the result as a timestamped snapshot; mark incomplete scans when inspection warnings occur.'),
('Schema explorer','Show tables or collections, columns, types, keys, indexes, comments, and declared relationships; render a relationship diagram.'),
('Design findings','Run repeatable rules such as missing primary keys, foreign-key index candidates, ambiguous timestamp types, and missing documentation. Explain evidence, assumptions, severity, and certainty.'),
('Documentation and comparison','Generate Markdown documentation from a selected snapshot and compare snapshots to show added, removed, or changed objects.'),
('Question answering','Answer from saved snapshot facts using local grounded responses by default. Optional AI may request a small set of read-only evidence tools when schema sharing is explicitly enabled.'),
('Query and design labs','Draft or inspect bounded read queries, view estimated plans, review supplied business dependencies, and explore synthetic index experiments with explicit limitations.'),
('Review workflow','Allow a user to accept or dismiss findings and review proposal inventories. Record decisions; do not execute schema changes automatically.')], [1.6,5.4])

doc.add_heading('6. Innovation, novelty, and contribution', level=1)
para('The project’s novelty is the combination and control model, rather than a claim that schema scanning or language models are individually new. It connects repeatable metadata analysis with a conversational interface while preserving a clear evidence trail and a human decision point.')
bullet('Snapshot anchored answers: responses refer to a saved observation, making the source and age of an answer visible.')
bullet('Mixed reasoning with explicit boundaries: deterministic rules state observable facts; user supplied business rules provide domain meaning; optional AI explains or navigates evidence.')
bullet('Evidence linked findings: each recommendation is accompanied by supporting objects, rationale, assumptions, and a certainty label so users can assess its fit.')
bullet('Human controlled change: the system records review decisions and can prepare migration inventories, but these remain artifacts for inspection rather than automatic target changes.')
bullet('Learning oriented experiments: synthetic index experiments and design comparisons help explain tradeoffs while clearly stating that synthetic timing does not predict production performance.')
para('This makes the project useful both as a developer tool and as a teaching aid for database design, schema literacy, and safe use of AI in engineering workflows.')

doc.add_heading('7. SDG relevance', level=1)
para('The strongest alignment is with SDG 9, Industry, Innovation and Infrastructure. The project is a software engineering tool that supports learning, technological capability, and practical innovation in database development. This is a contribution at the tool and education level; it does not by itself measure industrial growth or infrastructure outcomes. The UN describes Goal 9 in terms of resilient infrastructure, sustainable industrialization, and innovation. [1]')
para('There is also a supporting connection to SDG 16, Peace, Justice and Strong Institutions, through accountability and traceable review. Saved evidence, recorded decisions, and clear permissions can make technical changes easier to scrutinize. The project does not claim direct institutional or justice impact; the relevance is limited to transparent and accountable software operations. [2]')
para('A further, indirect connection is SDG 12, Responsible Consumption and Production. Better schema documentation and cautious review may help teams avoid unnecessary rework and inefficient data operations. Any environmental benefit would need measurement and cannot be inferred from the prototype alone. [3]')
table(['SDG','Connection','How the project can evidence it'],[
('SDG 9','Primary: innovation and stronger digital engineering capability.','Demonstrate an accessible workflow for inspecting, documenting, and reviewing database design.'),
('SDG 16','Supporting: accountable decisions and traceable review.','Show evidence references, role-aware actions where enabled, and a review audit trail.'),
('SDG 12','Indirect: more deliberate use and maintenance of data systems.','Treat efficiency as a hypothesis; measure query behavior or rework only in future evaluation.')], [1.0,3.1,2.9])

doc.add_heading('8. Proposed technical approach', level=1)
para('The implementation uses a modular web architecture. The browser frontend communicates with a versioned API. The API coordinates connector scans, deterministic analysis, optional evidence retrieval for AI, and local background runs. A workbench database stores snapshots and results independently from the inspected target.')
table(['Layer','Current or proposed technology','Responsibility'],[
('Frontend','React, TypeScript, Vite','Connection setup, schema explorer, diagrams, findings, reports, query and design labs, review controls.'),
('API and orchestration','Python, FastAPI','Validated API routes, run lifecycle, progress and status, authorization checks when local accounts are enabled.'),
('Metadata access','SQLAlchemy and engine-specific connectors','Inspect PostgreSQL and MariaDB metadata; inspect MongoDB validators and bounded observed shape.'),
('Analysis and decision support','Deterministic Python rules, optional GPT-6 Luna chat, and optional Jev advisory decisions','Produce repeatable checks; retrieve approved snapshot facts for chat; request typed decision support from Jev only with its separate API key and schema-sharing opt-in. Luna requests disable reasoning effort for tool calling; other configured models retain their request shape.'),
('Workbench persistence','PostgreSQL in the demo; SQLite supported for local store','Save connections, snapshots, findings, conversations, artifacts, jobs, and review history; version schema using Alembic.'),
('Demo targets','Local PostgreSQL shop and Supabase-compatible shop fixture','Provide realistic relationships, constraints, a derived order-total view, and a deliberately incomplete legacy import table for review. The Supabase fixture applies row-level security and grants a dedicated inspection role read-only access to demo objects.')], [1.3,2.0,3.7])

doc.add_heading('9. Implementation plan for the hackathon', level=1)
para('A focused implementation should make one end-to-end story reliable before expanding the feature set. The local project already contains the core components, so the plan below prioritizes integration, usability, and evidence of behavior. Work is sequenced to keep the demonstration small enough to complete and understandable to reviewers.')
numbered('Freeze the demo scenario. Use the supplied shop database and a read-only target account. Prepare one connection, one full scan, representative findings, and a snapshot report. Include the event_log table as a discussion case rather than labeling every unusual design choice an error.')
numbered('Harden the primary path. Verify connection test, scan, snapshot persistence, deterministic analysis, schema diagram, documentation export, evidence grounded chat, and bounded read query. Exercise the Supabase-ready fixture and its row-level security using the dedicated inspection role.')
numbered('Verify connection recovery. Demonstrate editing a saved connection while preserving its password when the password field is left blank. Exercise invalid credentials, missing project identity, pooler host and user mistakes, permission failures, SSL problems, and unavailable hosts; confirm the UI displays actionable hints without exposing driver details or secrets.')
numbered('Make evidence visible. For each finding and chat answer, show the snapshot and object or finding references that support the statement. Display uncertainty and assumptions alongside recommendations.')
numbered('Demonstrate advisory decision support when credentials and sharing consent are available. Show Jev prioritizing findings, schema changes, proposal readiness, and run attention, including confidence labels and human review. Keep this optional so the core workflow works without an external service.')
numbered('Demonstrate the safety boundary. Use the read-only demo credentials for ordinary target access. Show that a write query is rejected and that review approval records a decision without changing the target schema.')
numbered('Package the demo. Provide clear startup steps, environment configuration, a resettable sample database, a brief architecture diagram, and a known limitations page. Keep secrets out of source control and keep external AI disabled unless explicitly configured for the demo.')
numbered('Run targeted verification and evaluation. Check the primary workflow and failure cases, record results, and use participant tasks to assess whether the tool helps people understand a schema. These results are for the physical hackathon / Final Project Review, not a claim made by this proposal.')

doc.add_heading('Recent project changes already reflected in this proposal', level=2)
para('The current project files include several implementation changes that strengthen the proposed workflow and shape the hackathon demo:')
table(['Recent change','What it adds','Why it matters'],[
('Supabase demonstration fixture','A larger e-commerce schema with customers, categories, products, orders, items, payments, shipments, a derived order totals view, and a deliberately keyless legacy import table; a repeatable seed script supplies fictional data.','Exercises real relationships, constraints, view metadata, historical examples, and a clear design finding in a more representative scenario.'),
('Supabase access controls','Row-level security is enabled on demo tables. Public, anon, and authenticated roles are revoked; a dedicated agentic_inspector role receives schema usage and SELECT grants with explicit read policies.','Makes least-privilege inspection and the separation between inspection and data modification part of the demonstration.'),
('Actionable, credential-safe errors','A centralized error mapper identifies common authentication, Supabase pooler, DNS, network, SSL, permission, database, timeout, and read-only failures. API responses include stable codes, hints, and request IDs without echoing secrets.','Helps users recover from connection problems while preventing database driver details and passwords from leaking through public errors.'),
('Connection editing and recovery UX','Users can update saved connection details and leave the password field blank to retain the stored password. The interface clears stale notices when switching connections and surfaces server hints.','Supports iterative configuration during setup and turns connection troubleshooting into a usable workflow.'),
('Updated model configuration','The default optional chat model is GPT-6 Luna; requests set reasoning effort to none for Luna tool calling and preserve the existing request shape for other models.','Makes the optional assistant configuration explicit and keeps tool-call behavior compatible with the chosen model.'),
('Jev decision support','An optional TypeSafe System One integration returns typed, confidence-scored advisory decisions for finding priority and triage, relevance and missing evidence, schema-diff priority, proposal readiness, and run attention. The UI displays these in findings, snapshot comparison, artifact review, and activity views.','Adds structured prioritization on top of schema evidence while leaving the final decision to a person. It is separate from the GPT chat assistant and requires its own API key and explicit schema-sharing opt-in.')], [1.45,3.05,2.5])
para('The new error handling has backend tests for known failure classes and secret redaction, plus an API test for the structured connection-test response. A frontend test confirms that the user sees the actionable hint. Jev has unit and route tests using a mocked System One response, including validation of the typed answer shape and confidence values, evidence-backed route inputs, pagination, proposal readiness, and run attention. These tests verify request handling; they do not demonstrate a live external service integration or replace the broader hackathon evaluation described below.')
para('Jev calls are bounded by a 12 second request timeout and a four-request concurrency limit. Finding and schema-diff decisions are requested in pages of up to 50 items. The backend validates returned decision names, allowed choice values, numeric ranges, and confidence values before returning them to the interface. A failed external decision is surfaced as unavailable; outputs are advisory and are not written back as automatic approvals.')

doc.add_heading('10. Data model and key workflow', level=1)
para('The workbench store is organized around durable project history. A connection belongs to a project or local workspace. A scan creates a snapshot. Analysis creates findings linked to that snapshot. Documentation, query outputs, and design assessments are saved as artifacts. Runs track progress and outcome. Review records capture a person’s decision against a finding or proposal.')
para('The normal workflow is: connect and test → scan metadata → save snapshot → analyze → browse evidence and ask questions → review findings → rescan after an external change → compare snapshots. The target database remains a source of observations; the workbench store retains the project’s audit and learning history.')
table(['Entity','Important relationship or content'],[
('Connection','Engine, host, database, scope, and protected credentials or references; points to the target.'),
('Snapshot','Timestamped schema observation with completeness and warnings; belongs to a connection.'),
('Finding','Rule result with evidence, recommendation, assumptions, certainty, and review state; belongs to a snapshot.'),
('Run and artifact','Long task status, progress, and saved output such as a report, analysis, or experiment.'),
('Conversation and message','Question and answer history, including references to snapshot objects or findings.'),
('Review record','Actor, action, target finding or proposal, timestamp, and audit details; does not apply DDL.')], [1.5,5.5])

doc.add_heading('11. Safety, privacy, and responsible use', level=1)
bullet('Use a read-only database account for normal scans and queries; application level SQL checks supplement but do not replace database permissions.')
bullet('Bound scan time, query duration, result rows, and serialized response size. Reject non read queries in the query lab.')
bullet('For the Supabase demo fixture, enable row-level security on demo tables, revoke access from public and application-facing roles, and grant only schema usage and SELECT to the dedicated inspection role. The database role remains the primary enforcement boundary.')
bullet('Map known database and pooler failures to stable public error codes and actionable hints. Avoid returning raw driver exceptions, connection strings, or password values to the browser.')
bullet('Keep both external AI paths optional. OpenAI schema sharing and Jev schema sharing use separate backend keys and explicit opt-ins; selected schema names, evidence, or summaries are sent externally only when the corresponding sharing setting is enabled.')
bullet('Treat Jev scores and categories as decision support, not ground truth. Confidence is displayed, and a human reviews findings, changes, proposals, and run history before taking action.')
bullet('Validate model references against known snapshot objects and findings. Treat generated explanations as review suggestions, not authoritative database facts.')
bullet('Do not automatically run migrations or apply generated schema changes. A reviewer must inspect and execute any real change through an independently controlled process.')
bullet('Do not expose the current local account system as a production security boundary without further security work, rate limiting, secrets management, and review.')

doc.add_heading('12. Hackathon evaluation plan', level=1)
para('No evaluation results are claimed in this Assessment 7 report. During the physical hackathon / Final Project Review, the team can evaluate the implementation against observable tasks and report the sample size and setup.')
table(['Evaluation question','Possible measure','Evidence to collect'],[
('Can a new user understand the schema?','Task completion and time to identify tables, keys, and relationships.','A small set of scripted tasks and observer notes.'),
('Are findings explainable?','Share of reviewed findings for which participants can identify the evidence and explain the recommendation.','Participant explanation against finding evidence.'),
('Is Jev useful and calibrated?','Agreement between advisory priority and reviewer judgment; confidence on cases where the model is uncertain.','Blind review of a representative, labeled set of findings and diffs; report disagreements and examples where business context changes the recommendation.'),
('Is the assistant grounded?','Correctness of answers against the selected snapshot; validity of cited objects/findings.','Prepared question set and source-of-truth answer key.'),
('Does the review boundary work?','Whether write attempts are blocked and proposal review leaves the target unchanged.','API/UI checks and before/after schema comparison.'),
('Does the workflow remain usable on failure?','Recovery and clarity for invalid credentials, partial scan, unavailable model, and stale snapshot.','Observed failure-case walkthroughs and run records.')], [1.8,2.5,2.7])
para('Evaluation should be reported with the demo database size, engine and configuration, participant count, task wording, completion criteria, observed limitations, and any failures. Synthetic index experiments should be described as educational only and not as a benchmark of production performance.')

doc.add_heading('13. Scope, assumptions, and limitations', level=1)
para('The Assessment 7 scope is the project proposal: problem, domain, existing approaches, proposed solution, innovation, SDG relevance, and technical plan. A working prototype, implementation demonstration, and evaluation results are not required for this component; they are planned for the physical hackathon / Final Project Review. The repository includes a working local implementation, but that fact does not imply that every feature is production ready or fully verified.')
bullet('The current demo is a local, single-computer workbench. Jobs and schedules run in one API process.')
bullet('Jev decision support is an optional external integration. Its automated tests use mocked responses; live provider behavior and the quality of its prioritization still require hackathon verification.')
bullet('Migration output is a review inventory, not automatic cross-engine conversion or execution.')
bullet('Normalization checks involving functional dependencies require business rules supplied by a user; schema metadata alone cannot establish all normal forms.')
bullet('Engine suitability scoring is provisional and must not be presented as a benchmark or migration recommendation.')
bullet('MongoDB and MariaDB connectors and several advanced flows need broader integration verification; optional AI mode is not required for the core demo.')
bullet('The tool inspects schemas and bounded query results; it is not designed for unrestricted bulk data extraction.')

doc.add_heading('14. Conclusion', level=1)
para('The Agentic Database Handler proposes a practical way to make database structure easier to understand and review. Its contribution is the integration of schema snapshots, deterministic checks, evidence grounded assistance, and human controlled decisions in one workbench. The existing implementation gives the project a concrete base for the hackathon. The next milestone is a dependable, well explained demonstration and an evaluation that measures usability and grounding without overstating what a local prototype proves.')

doc.add_heading('References', level=1)
refs=[
'[1] United Nations Department of Economic and Social Affairs, “Goal 9: Industry, Innovation and Infrastructure.” https://sdgs.un.org/goals/goal9',
'[2] United Nations Department of Economic and Social Affairs, “Goal 16: Peace, Justice and Strong Institutions.” https://sdgs.un.org/goals/goal16',
'[3] United Nations Department of Economic and Social Affairs, “Goal 12: Responsible Consumption and Production.” https://sdgs.un.org/goals/goal12',
'[4] Project source materials: PROJECT_PRIMER.md, IMPLEMENTATION_STATUS.md, and README.md, Agentic Database Handler repository, current project state documented October 2026.'
]
for ref in refs:
    p=doc.add_paragraph(ref); p.paragraph_format.left_indent=Inches(.2); p.paragraph_format.first_line_indent=Inches(-.2); p.paragraph_format.space_after=Pt(4)

# headings keep with next; table header repeat
for p in doc.paragraphs:
    if p.style.name.startswith('Heading'): p.paragraph_format.keep_with_next=True
for t in doc.tables:
    trPr=t.rows[0]._tr.get_or_add_trPr(); rep=OxmlElement('w:tblHeader'); rep.set(qn('w:val'),'true'); trPr.append(rep)


# Final grayscale normalization for all explicitly colored text and table shading.
for paragraph in doc.paragraphs:
    for run in paragraph.runs:
        if run.font.color and run.font.color.rgb:
            rgb=run.font.color.rgb
            gray=round((rgb[0]+rgb[1]+rgb[2])/3)
            run.font.color.rgb=RGBColor(gray,gray,gray)

doc.core_properties.title='DBTHON 2026 Assessment 7 Project Report'
doc.core_properties.subject='Agentic Database Handler proposal'
doc.core_properties.author='DBTHON 2026 Project Team'
doc.save(out)
print(out.resolve())

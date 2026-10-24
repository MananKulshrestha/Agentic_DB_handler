import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';
const {SKILL_DIR,TMP_DIR,WORKSPACE_DIR,FINAL_PPTX,RUNTIME_PYTHON}=process.env;
const {resolvePresentationFont,finalizePresentation}=await import(pathToFileURL(path.join(SKILL_DIR,'container_tools/artifact_tool_utils.mjs')).href);
const font=resolvePresentationFont({fontFamily:"Arial"});
const C={navy:'#0B1B2A',ink:'#142B3A',muted:'#526878',teal:'#12A9B5',cyan:'#58CFD3',amber:'#E4A84B',paper:'#F5F7F6',white:'#FFFFFF',line:'#D8E2E5',pale:'#E9F5F4',blue:'#306A86'};
const p=Presentation.create({slideSize:{width:1280,height:720}});
function rect(s,x,y,w,h,fill){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:'none',width:0}})}
function txt(s,text,x,y,w,h,size,color,bold=false,opts={}){const q=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});q.text=text;q.text.style={typeface:font,fontSize:size,bold,color,verticalAlignment:'middle',autoFit:'shrinkText',...opts};return q}
function base(title,num,sub=''){const s=p.slides.add();s.background.fill=C.paper;rect(s,0,0,14,720,C.teal);txt(s,title,68,42,1120,60,36,C.ink,true);if(sub)txt(s,sub,70,108,1100,40,18,C.muted);txt(s,String(num).padStart(2,'0'),1172,660,50,24,14,C.muted,true);return s}
function notes(s,t){s.speakerNotes.textFrame.setText(t)}
// 1 Cover
{
 const s=p.slides.add();s.background.fill=C.navy;
 const bytes=new Uint8Array(await fs.readFile(path.join(TMP_DIR,'cover.png')));
 s.images.add({blob:bytes,contentType:'image/png',alt:'Abstract database schema under review',fit:'cover',position:{left:0,top:0,width:1280,height:720}});
 rect(s,0,0,610,720,'#0B1B2A/35');
 txt(s,'AGENTIC DATABASE\nHANDLER',78,210,570,142,48,C.white,true,{verticalAlignment:'top'});
 txt(s,'A local workbench for understanding database structure and guiding review',82,372,520,83,24,'#D8EDF0',false,{verticalAlignment:'top'});
 rect(s,82,493,64,5,C.teal);
 txt(s,'PROJECT OVERVIEW  |  OCTOBER 2026',82,520,480,30,15,'#B8D5DC',true);
 notes(s,'Project status and scope are summarized from PROJECT_PRIMER.md and IMPLEMENTATION_STATUS.md. JEV roadmap items are proposed, not implemented.');
}
// 2 Purpose and flow
{
 const s=base('A database workbench for evidence-led review',2,'It records what a database looks like, explains possible issues, and keeps decisions reviewable.');
 const labels=[['01','Connect & scan','Read schema metadata'],['02','Analyze','Apply repeatable rules'],['03','Explore','Inspect objects and evidence'],['04','Review','Accept, dismiss, or add context'],['05','Compare','Rescan and inspect changes']];
 const x0=70, gap=230;
 labels.forEach((a,i)=>{let x=x0+i*gap;txt(s,a[0],x,218,50,44,28,C.teal,true);rect(s,x,270,4,100,i===0?C.teal:C.line);txt(s,a[1],x+18,270,195,35,21,C.ink,true);txt(s,a[2],x+18,313,190,66,17,C.muted,false,{verticalAlignment:'top'});});
 rect(s,70,443,1120,1,C.line);
 txt(s,'Core boundary',70,476,190,32,18,C.teal,true);
 txt(s,'Findings, approvals, reports, and migration inventories record review. Target schema changes stay under explicit human control.',270,469,900,72,22,C.ink,true);
 notes(s,'The normal workflow inspects saved schema snapshots. Query Lab separately supports bounded read queries. The workbench supports learning and demonstration, with production database administration outside its scope.');
}
// 3 current capabilities
{
 const s=base('What the project already implements',3,'Verified core flow: PostgreSQL connection, scan, findings, documentation, grounded chat, and bounded read query.');
 const col=[
  {x:72,h:'Inspect',t:'PostgreSQL, MariaDB, and MongoDB metadata connectors\nSaved snapshots with objects, types, keys, indexes, and relationships\nSchema explorer and relationship diagram'},
  {x:470,h:'Explain',t:'Deterministic checks produce evidence-linked findings\nMarkdown documentation and snapshot comparisons\nChat answers can cite saved objects and findings'},
  {x:868,h:'Review',t:'Read-only query lab with row and time limits\nDesign tools for normalization, workload, and migration inventory\nProposal review, run history, schedules, and optional roles'}
 ];
 col.forEach(c=>{txt(s,c.h,c.x,204,330,44,26,C.teal,true);rect(s,c.x,254,330,3,C.line);txt(s,c.t,c.x,278,330,250,19,C.ink,false,{verticalAlignment:'top',wrap:true});});
 txt(s,'Some advanced flows still need live browser or integration verification. AI mode also requires an explicit model key and schema-sharing opt-in.',72,588,1090,44,16,C.muted,false);
 notes(s,'As of October 7, 2026. The latest live verification covered the PostgreSQL demo with four tables and six findings. Advanced design flows, sandbox experiments, schedules, roles, and non-PostgreSQL fixtures still need additional live verification.');
}
// 4 P0
{
 const s=base('JEV roadmap | P0 clear candidates',4,'Add an advisory decision layer where the workbench already has evidence and review workflows.');
 const items=[
  ['Finding priority','Rank findings using severity, certainty, evidence, and affected objects.'],
  ['Review triage','Group findings into review now, later, or informational.'],
  ['Likely relevance','Flag likely relevant, possibly relevant, or probably intentional for human review.'],
  ['Evidence gaps','Show when a recommendation needs workload data or business context.'],
  ['Snapshot diffs','Prioritize changes that deserve a closer look.'],
  ['Proposal readiness','Flag proposals that are ready, need context, or remain speculative.'],
  ['Run attention','Bring failed, interrupted, or consequential runs forward.']
 ];
 items.forEach((a,i)=>{let y=190+i*61;txt(s,String(i+1).padStart(2,'0'),78,y,48,32,18,C.teal,true);txt(s,a[0],142,y,245,32,20,C.ink,true);txt(s,a[1],390,y,800,40,18,C.muted);});
 notes(s,'P0 reflects the user-defined category of a clear project improvement candidate. JEV output should remain advisory. A small evaluation against existing severity/certainty and representative examples should confirm value before relying on rankings. Source: referenced chat “Prioritize JEV Decision Making.”');
}
// 5 P1/P2
{
 const s=base('JEV roadmap | P1 and P2',5,'P1 needs a new feature or evidence of benefit. P2 is feasible, with a likely small user impact.');
 txt(s,'P1  |  Needs a feature or validation',74,184,1080,38,23,C.blue,true);
 txt(s,'Database-engine suitability from richer workload context\nIndex candidates and query profiling priorities\nChat tool routing and evidence-coverage checks\nSnapshot freshness and scan-warning impact\nSource-reference ranking and migration risk\nAmbiguous findings routed to human review\nRelated findings across snapshots; guided next report',82,232,1080,245,18,C.ink,false,{verticalAlignment:'top'});
 rect(s,74,493,1110,1,C.line);
 txt(s,'P2  |  Low impact or mostly polish',74,520,1080,36,22,C.teal,true);
 txt(s,'Object ordering, detail display, documentation order, follow-up questions, explanation length, default tabs or filters, and report labels.',82,567,1080,66,18,C.ink,false,{verticalAlignment:'top'});
 notes(s,'P1 and P2 items are proposed opportunities from the referenced JEV analysis. Engine suitability currently uses a provisional heuristic, and index experiments use synthetic or sandbox data. Neither should be presented as a validated production recommendation.');
}
// 6 sequence + guardrails
{
 const s=base('Implementation sequence and safety boundaries',6,'Start with decisions that reuse existing evidence. Expand only when a workflow or evaluation supports it.');
 const steps=[
  ['01  Evaluate','Compare a few representative findings and diffs with current sorting.'],
  ['02  Pilot','Add advisory priority and evidence-gap labels to findings.'],
  ['03  Expand','Add proposal and run triage, then validate each new use case.']
 ];
 steps.forEach((a,i)=>{const x=76+i*376;txt(s,a[0],x,202,320,34,22,C.teal,true);txt(s,a[1],x,249,310,95,18,C.ink,false,{verticalAlignment:'top'});if(i<2)rect(s,x+330,218,1,122,C.line);});
 rect(s,76,395,1110,1,C.line);
 txt(s,'Keep these deterministic or human-controlled',76,430,1040,35,21,C.ink,true);
 txt(s,'Database facts and permissions\nRead-query safety and access checks\nSQL execution, migrations, and target changes\nFinal approval and business-context decisions',82,484,1080,125,18,C.muted,false,{verticalAlignment:'top'});
 txt(s,'JEV confidence is a signal, not proof.',76,626,800,28,17,C.teal,true);
 notes(s,'The referenced chat recommends treating JEV as a structured decision model for bounded questions. Keep deterministic checks as the source of facts and require human review for high-impact actions. This deck describes the planned JEV layer, not existing implementation.');
}
const stage=path.join(WORKSPACE_DIR,'.codex-finalizer');await fs.mkdir(stage,{recursive:true});await fs.mkdir(path.dirname(FINAL_PPTX),{recursive:true});
const candidate=path.join(TMP_DIR,'candidate.pptx');await (await PresentationFile.exportPptx(p)).save(candidate);
const result=await finalizePresentation({workspaceDir:WORKSPACE_DIR,candidatePath:candidate,finalPath:FINAL_PPTX,pythonExecutable:RUNTIME_PYTHON,integrityValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,receiptPath:path.join(stage,'project-overview-v2.validation.json')});
console.log(JSON.stringify({font,result}));
for(let i=0;i<p.slides.items.length;i++){const slide=p.slides.items[i];const png=await p.export({slide,format:'png',scale:1});await fs.writeFile(path.join(TMP_DIR,`slide-${i+1}.png`),new Uint8Array(await png.arrayBuffer()));}

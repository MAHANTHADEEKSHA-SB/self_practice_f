export type Row = {id:string; [key:string]:string};
export const initial = {
 name:'UCIe verification workspace', protocol:'UCIe',
 requirements:[
 {id:'REQ-001',requirement:'Define the acceptance point for each incoming request.',source:'Starter checklist · project decision',protocol:'UCIe',status:'Draft',method:'Monitor + scoreboard',test:'AT-001'},
 {id:'REQ-002',requirement:'Specify the fate of outstanding transactions on reset.',source:'Starter checklist · project decision',protocol:'UCIe',status:'Needs review',method:'Reset sequence + scoreboard',test:'AT-002'},
 {id:'REQ-003',requirement:'Define the condition that permits traffic after reset release.',source:'Starter checklist · project decision',protocol:'UCIe',status:'Draft',method:'Assertion + directed test',test:'AT-003'}],
 resets:[{id:'RST-001',trigger:'Reset asserted with requests in flight',scope:'Bridge / transaction queues',consequence:'Drain accepted requests; block new acceptance',policy:'Proposed project policy',recovery:'Resume after reset release and interface readiness',check:'Account for every accepted ID exactly once',source:'Design decision required; not a universal protocol rule'}],
 tests:[{id:'AT-001',name:'Acceptance boundary',given:'Interface ready; valid request presented',when:'Observe the defined acceptance event',then:'Exactly one expected transaction is queued',requirement:'REQ-001',status:'Not run'}, {id:'AT-002',name:'Reset with outstanding traffic',given:'Two accepted requests are outstanding',when:'Assert reset between request and response',then:'Every request follows the agreed drain / abort / replay policy',requirement:'REQ-002',status:'Not run'}, {id:'AT-003',name:'Recovery gate',given:'Reset is active and traffic is waiting',when:'Release reset before interface readiness',then:'New requests wait until the specified ready condition',requirement:'REQ-003',status:'Not run'}],
 mistakes:[{id:'ERR-001',title:'Treating extracted text as a verified requirement',cause:'Context, exceptions, and cross-references were missed',correction:'Read the full clause and linked tables; record version and source',prevention:'Review every candidate before acceptance',status:'Open'}],
 references:[
 {id:'REF-001',title:'UCIe specifications',protocol:'UCIe',version:'Choose your project revision',url:'https://www.uciexpress.org/specifications',notes:'Start with the exact licensed specification. Cross-reference initialization states, sideband messages, encodings, timing and exceptions.'},
 {id:'REF-002',title:'AMBA specification library',protocol:'AMBA',version:'Record IHI and issue',url:'https://www.arm.com/architecture/system-architectures/amba/amba-specifications',notes:'Record the protocol variant: APB, AHB-Lite, AHB5 or AXI. Check acceptance, ordering and reset separately.'},
 {id:'REF-003',title:'UVM reference implementation',protocol:'SV / UVM',version:'Match your simulator library',url:'https://www.accellera.org/downloads/standards/uvm',notes:'Use the matching reference library and API documentation. Build a single packaged UVC; record simulator and UVM version.'},
 {id:'REF-004',title:'PCI-SIG specification portal',protocol:'PCIe',version:'Select authorized revision',url:'https://pcisig.com/specifications',notes:'Use your authorized specification for exact LTSSM transitions, ordering, credits and replay. This workspace does not embed the specification.'}],
 checks:{} as Record<string,boolean>,
 sourceText:'',sourceName:'',sourceVersion:'',sourceSection:'',
 snippets:[] as Row[],customSteps:[] as Row[]
};
export const workflows=[
 {id:'requirements',name:'Extract requirements',desc:'Turn specification excerpts into traceable, reviewable requirements.',icon:'file',tag:'PDF → requirements',time:'Start with a source',color:'teal'},
 {id:'reset',name:'Map reset consequences',desc:'Follow reset from trigger to outstanding traffic and recovery.',icon:'reset',tag:'Trigger → consequence',time:'Make policy explicit',color:'orange'},
 {id:'protocol',name:'Explore protocol behavior',desc:'Walk through handshakes, ordering and timing, one step at a time.',icon:'wave',tag:'Signals → behavior',time:'Trace every transition',color:'blue'},
 {id:'code',name:'Build & review SV / UVM',desc:'Prepare code, review architecture and define what must pass.',icon:'code',tag:'Intent → verification',time:'Keep the evidence',color:'violet'}
];
export const checklistGroups={
 'Requirements & sources':['Exact specification revision recorded','Each requirement has a source clause or marked design decision','Exceptions and cross-references reviewed','Acceptance event and completion event distinguished'],
 'Reset-aware verification':['Drain, abort, replay or retain policy explicitly agreed','Outstanding expected and observed queues reconciled','Monitor distinguishes accepted traffic from partial activity','Recovery readiness and first legal transaction checked','Checking resumes without hiding lost or duplicated traffic'],
 'UVC architecture':['Active and passive modes reviewed','Driver / monitor BFMs share a defined signal interface','Parameter ownership and proxy boundaries explicit','Predictor models intent independently of DUT output','Compile lists exclude unused optional agents','Simulator, UVM version and run command documented'],
 'Closure':['Positive, negative and boundary tests mapped','Assertions and functional coverage reviewed','Failures reproduced with seed and source revision','Open discrepancies have owner and disposition']
};
export const snippets=[
 {id:'sv1',title:'APB wait-state stability',category:'Assertions',description:'Illustrative APB3+ property. Use the selected slave PSEL, adapt signal widths, and review reset semantics against your design.',code:`// Illustrative template; validate in your target simulator.\nproperty apb_stable_during_wait;\n  @(posedge PCLK) disable iff (!PRESETn)\n    (PSEL && PENABLE && !PREADY) |=>\n      (PSEL && PENABLE &&\n       $stable({PADDR, PWRITE}) &&\n       (!$past(PWRITE) || $stable(PWDATA)));\nendproperty\na_apb_wait: assert property (apb_stable_during_wait);`},
 {id:'sv2',title:'Reset policy in the scoreboard',category:'Scoreboards',description:'Architecture sketch, not a compilable class. Choose behavior from the DUT contract; freezing comparisons alone does not reconcile outstanding traffic.',code:`// PSEUDOCODE — integrate into your scoreboard.\non_reset_assert():\n  block_new_acceptance_checks_as_specified();\n  case (cfg.reset_policy)\n    DRAIN: keep_expected_queue_and_check_completions();\n    ABORT: mark_pending_as_aborted_with_reason();\n    REPLAY: retain_ids_and_track_replay_exactly_once();\n  endcase\n\non_reset_release():\n  wait_for_contract_defined_ready();\n  reconcile_expected_observed_and_aborted_ids();\n  resume_normal_checks();`},
 {id:'sv3',title:'Sequence objection boundary',category:'UVM',description:'Example run_phase body inside a uvm_test with an env and sequence defined by your project. Replace the completion condition with a bounded, reset-aware drain.',code:`task run_phase(uvm_phase phase);\n  my_sequence seq;\n  phase.raise_objection(this, "stimulus and checking");\n  seq = my_sequence::type_id::create("seq");\n  seq.start(env.agent.sequencer);\n  // Implement a bounded wait; fatal on timeout.\n  env.scoreboard.wait_for_all_expected_or_timeout();\n  phase.drop_objection(this, "checking complete");\nendtask`},
 {id:'sv4',title:'Predictor contract',category:'Predictors',description:'Review template. For simple transforms this may live in a scoreboard; retain an independent expected-data path.',code:`// PSEUDOCODE — transaction model contract\ninput: accepted_request, configuration_snapshot, reset_epoch\noutput: expected_response, ordering_key, allowed_latency\n\n1. Validate request legality against the configured mode.\n2. Transform address, size, payload and byte enables.\n3. Preserve transaction identity and ordering domain.\n4. Apply documented reset / error semantics.\n5. Queue expected output independently of observed DUT data.\n6. Compare response, report mismatch with source requirement.`}
];
export function extractCandidates(text:string,onlyReset=false){
 let page='excerpt'; const result:{text:string;page:string}[]=[];
 for(const line of text.split(/\n/)){const m=line.match(/^\[Page (\d+)\]/);if(m){page=m[1];continue;}for(const s of line.split(/(?<=[.!?])\s+/)){if(s.trim().length>15 && (onlyReset?/reset|abort|flush|retain|recover|drain|replay/i:/\b(shall|must|required|should|reset|shall not)\b/i).test(s)) result.push({text:s.trim(),page});}}
 return result.slice(0,100);
}
export function csv(rows:Row[]){if(!rows.length)return '';const keys=Object.keys(rows[0]);const cell=(s:string)=>'"'+String(/^[=+@-]/.test(s)?"'"+s:s).replaceAll('"','""')+'"';return [keys,...rows.map(r=>keys.map(k=>r[k]??''))].map(r=>r.map(cell).join(',')).join('\r\n');}

// Keep the inputs as strings while editing; only parse when extraction is requested.
export function parsePageRange(startText:string,endText:string){
 const parse=(text:string,label:string)=>{
  if(!/^[0-9]+$/.test(text)||!Number.isSafeInteger(Number(text))||Number(text)<1)
   throw new Error(`${label} must be a whole page number of 1 or greater.`);
  return Number(text);
 };
 const start=parse(startText,'From page'),end=parse(endText,'To page');
 if(end<start)throw new Error('To page must be greater than or equal to From page.');
 return {start,end};
}

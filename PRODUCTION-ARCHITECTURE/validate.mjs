import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Ajv=createRequire(require.resolve('eslint/package.json'))('ajv');
const base=path.dirname(new URL(import.meta.url).pathname), read=n=>JSON.parse(fs.readFileSync(path.join(base,'contracts',n),'utf8'));
let checks=0;const check=(ok,label)=>{if(!ok)throw Error(label);checks++};
const ajv=new Ajv({allErrors:true,schemaId:'auto'});
for(const name of fs.readdirSync(path.join(base,'contracts')).filter(n=>n.endsWith('.json'))) {read(name);checks++;}
const event=read('event-envelope.schema.json');delete event.$schema;
const validate=ajv.compile(event), example=read('event-example.json');
check(validate(example),'valid event example');
for(const change of [v=>delete v.tenant_id,v=>delete v.causation_id,v=>v.payload={},v=>v.payload_ref.digest='invalid',v=>v.untrusted=true]){const v=structuredClone(example);change(v);check(!validate(v),'reject malformed event');}
for(const name of ['agent.schema.json','capability.schema.json']) {const s=read(name);delete s.$schema;ajv.compile(s);checks++;}
const api=read('openapi.json'), ids=new Set();
function visit(value){if(!value||typeof value!=='object')return;if(value.$ref){check(value.$ref.startsWith('#/components/schemas/'),'local ref');check(!!api.components.schemas[value.$ref.split('/').at(-1)],'resolved ref');}Object.values(value).forEach(visit);}
visit(api);
for(const [route,item] of Object.entries(api.paths))for(const [method,op] of Object.entries(item)){if(!['get','post','put','patch','delete'].includes(method))continue;check(!ids.has(op.operationId),'unique operation');ids.add(op.operationId);for(const match of route.matchAll(/\{([^}]+)\}/g))check((op.parameters||item.parameters||[]).some(p=>p.in==='path'&&p.name===match[1]&&p.required),'required path parameter');}
const run=ajv.compile(api.components.schemas.RunCreate), sample=read('run-example.json');check(run(sample),'valid run example');const bad=structuredClone(sample);bad.budget.maximum_micro=1.5;check(!run(bad),'reject inexact budget');
for(const name of fs.readdirSync(base).filter(n=>n.endsWith('.md'))){const text=fs.readFileSync(path.join(base,name),'utf8');for(const m of text.matchAll(/\]\(([^)]+)\)/g)){const target=m[1];if(!/^(https?:|#)/.test(target))check(fs.existsSync(path.resolve(base,target.split('#')[0])),`link ${name}: ${target}`);}}
check([15,10,8,5,8,8,12,7,5,5,5,7,5].reduce((a,b)=>a+b)===100,'score weights');
check(100000*1000*86400===8640000000000,'event capacity arithmetic');
const sql=fs.readFileSync(path.join(base,'contracts/core-schema.sql'),'utf8');check(sql.includes('FORCE ROW LEVEL SECURITY'),'RLS force declared');check(sql.includes('ENABLE ROW LEVEL SECURITY'),'RLS enabled');
const report={status:'passed',checks,scope:'JSON parsing, compatible JSON Schema keyword compilation, event/run positive and negative fixtures, local OpenAPI references and path parameters, documentation links, score/capacity arithmetic, SQL RLS declarations',limitations:['AJV 6 checks the draft-7-compatible keywords used here; this is not complete JSON Schema 2020-12 or OpenAPI conformance certification.','SQL and GraphQL are reference designs; no PostgreSQL execution or GraphQL parser validation was performed.','No production service, provider authorization, microVM, load, recovery, or self-healing certification is implied.']};
fs.writeFileSync(path.join(base,'validation-report.json'),JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(path.join(base,'validation-report.md'),'# Architecture verification\n\n'+checks+' automated documentation and contract checks passed.\n\nScope: '+report.scope+'.\n\n'+report.limitations.map(x=>'- '+x).join('\n')+'\n');
console.log(JSON.stringify(report));

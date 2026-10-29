type Token={kind:'name'|'punct'|'string'|'template'|'regex';value:string;start:number;dynamic?:boolean;expressions?:Token[][]};
type Signal={kind:'eval'|'sql'|'credential';line:number;evidence:string};
const credentialName=/(?:api[_-]?key|password|secret|client[_-]?secret|access[_-]?token|auth[_-]?token)$/i;
const MAX_CHARS=200_000,MAX_TOKENS=50_000,MAX_DEPTH=32;

/** A bounded lexical aid for snapshot warnings, not a JavaScript parser or a
 * data-flow engine. No source is evaluated. Unknown coverage stays explicit. */
function lexicalTokens(source:string){
 let position=0,count=0,lookbehindSteps=0;
 const token=(kind:Token['kind'],value:string,start:number,extra:Partial<Token>={}):Token=>{
  if(++count>MAX_TOKENS)throw Error('token-limit');
  return {kind,value,start,...extra};
 };
 function quoted(quote:string){
  let value='';position++;
  while(position<source.length){
   const c=source[position++];
   if(c===quote)return value;
   if(c==='\\'){
    if(position>=source.length)break;
    const escaped=source[position++];
    const width=escaped==='u'?4:escaped==='x'?2:0;
    const digits=source.slice(position,position+width);
    if(width&&digits.length===width&&/^[0-9a-f]+$/i.test(digits)){value+=String.fromCharCode(parseInt(digits,16));position+=width;}
    else value+=({n:'\n',r:'\r',t:'\t',b:'\b',f:'\f',v:'\v','0':'\0'} as Record<string,string>)[escaped]??escaped;
   }else value+=c;
  }
  throw Error('unterminated-string');
 }
 function regexAllowed(tokens:Token[]){
  const previous=tokens.at(-1);
  if(previous?.kind==='punct'&&previous.value===')'){
   let depth=0;
   for(let i=tokens.length-1;i>=0;i--){
    if(++lookbehindSteps>500_000)throw Error('lexical-lookbehind-budget');
    if(tokens[i].kind!=='punct')continue;
    if(tokens[i].value===')')depth++;
    if(tokens[i].value==='('&&!--depth)return ['if','while','for','with','switch','catch'].includes(tokens[i-1]?.value);
   }
  }
  return !previous||previous.kind==='punct'&&['(','[','{',',',':','=','!','?',';','&&','||','??','=>','+','-','*','%'].includes(previous.value)
   ||previous.kind==='name'&&['return','throw','case','yield','await','typeof','void','delete','in','of'].includes(previous.value);
 }
 function regex(){
  position++;let inClass=false;
  while(position<source.length){
   const c=source[position++];
   if(c==='\\'){position++;continue;}
   if(c==='\n'||c==='\r')throw Error('unterminated-regex');
   if(c==='[')inClass=true;else if(c===']')inClass=false;
   else if(c==='/'&&!inClass){while(/[a-z]/i.test(source[position]||'')&&position<source.length)position++;return;}
  }
  throw Error('unterminated-regex');
 }
 function template(depth:number){
  const start=position++;let value='',dynamic=false;const expressions:Token[][]=[];
  while(position<source.length){
   const c=source[position++];
   if(c==='`')return token('template',value,start,{dynamic,expressions});
   if(c==='\\'){if(position<source.length)value+=source[position++];continue;}
   if(c==='$'&&source[position]==='{'){position++;dynamic=true;expressions.push(code(true,depth+1));}
   else value+=c;
  }
  throw Error('unterminated-template');
 }
 function code(stopAtBrace=false,depth=0):Token[]{
  if(depth>MAX_DEPTH)throw Error('nesting-limit');
  const tokens:Token[]=[];let braces=0;
  while(position<source.length){
   const start=position,c=source[position],next=source[position+1];
   if(/\s/.test(c)){position++;continue;}
   if(c==='/'&&next==='/'){position+=2;while(position<source.length&&!/[\r\n]/.test(source[position]))position++;continue;}
   if(c==='/'&&next==='*'){const end=source.indexOf('*/',position+2);if(end<0)throw Error('unterminated-comment');position=end+2;continue;}
   if(c==='"'||c==="'"){tokens.push(token('string',quoted(c),start));continue;}
   if(c==='`'){tokens.push(template(depth));continue;}
   if(c==='/'&&regexAllowed(tokens)){regex();tokens.push(token('regex','',start));continue;}
   if(/[A-Za-z_$]/.test(c)){
    position++;while(position<source.length&&/[A-Za-z0-9_$]/.test(source[position]))position++;
    tokens.push(token('name',source.slice(start,position),start));continue;
   }
   if(c==='{' )braces++;
   if(c==='}'){
    if(stopAtBrace&&braces===0){position++;return tokens;}
    braces--;
   }
   const pair=c+(next||'');
   if(['?.','=>','++','--','&&','||','??','+=','-=','==','!=','<=','>='].includes(pair)){position+=2;tokens.push(token('punct',pair,start));}
   else{position++;tokens.push(token('punct',c,start));}
  }
  if(stopAtBrace)throw Error('unterminated-expression');
  return tokens;
 }
 return code();
}

function callAt(tokens:Token[],index:number){
 if(tokens[index-1]?.value==='function')return -1;
 const next=index+1+(tokens[index+1]?.value==='?.'?1:0);
 return tokens[next]?.value==='('?next:-1;
}
function firstArgument(tokens:Token[],open:number,budget:{steps:number}){
 const argument:Token[]=[];const stack:string[]=[];
 for(let index=open+1;index<tokens.length;index++){
  if(++budget.steps>500_000)throw Error('analysis-budget');
  const t=tokens[index];
  if(t.kind==='punct'){
   if(!stack.length&&(t.value===','||t.value===')'))return {tokens:argument,end:index};
   if(['(','[','{'].includes(t.value))stack.push(t.value);
   else if([')',']','}'].includes(t.value))stack.pop();
  }
  argument.push(t);
 }
 return {tokens:[],end:-1};
}
function callEnd(tokens:Token[],open:number,budget:{steps:number}){
 let depth=1;
 for(let index=open+1;index<tokens.length;index++){
  if(++budget.steps>500_000)throw Error('analysis-budget');
  if(tokens[index].kind!=='punct')continue;
  if(tokens[index].value==='(')depth++;
  else if(tokens[index].value===')'&&!--depth)return index;
 }
 return -1;
}
function literalValue(tokens:Token[],index:number){
 let at=index+1;
 if(tokens[at]?.value!==':'&&tokens[at]?.value!=='=')return null;
 const declared=['const','let','var'].includes(tokens[index-1]?.value);
 if(tokens[at].value===':'&&(declared||tokens[at+1]?.kind==='name')){
  // Skip a bounded type annotation, never turn a type literal into a secret.
  for(at++;at<Math.min(tokens.length,index+20)&&!['=',',',';','{','}'].includes(tokens[at].value);at++);
  if(tokens[at]?.value!=='=')return null;
 }
 const value=tokens[at+1];
 return value?.kind==='string'||value?.kind==='template'&&!value.dynamic?value:null;
}

export function scanSnapshotSecurity(file:{path:string;content:string}){
 const mode=/\.(?:[cm]?[jt]sx?)$/i.test(file.path)?'javascript-typescript-lexical':/\.json$/i.test(file.path)?'json-literals':'generic-text-pattern';
 const limitations=mode==='generic-text-pattern'
  ?'This language is not parsed. Text patterns may match comments or examples; absence does not establish safety.'
  :'Lexical warnings only: no taint flow, alias or binding resolution, computed-call resolution, full type-only or JSX interpretation, vulnerability confirmation or secret validity check. Ambiguous regex and declaration/block positions need parser review.';
 const coverage={path:file.path,mode,status:'inspected-heuristic',limitations};
 const signals:Signal[]=[];const seen=new Set<Signal['kind']>();
 const add=(kind:Signal['kind'],start:number,evidence:string)=>{
  if(seen.has(kind))return;seen.add(kind);signals.push({kind,line:file.content.slice(0,start).split('\n').length,evidence});
 };
 if(file.content.length>MAX_CHARS)return {signals,coverage:{...coverage,status:'not-inspected-size-limit'}};
 if(mode==='generic-text-pattern'){
  const patterns:[Signal['kind'],RegExp,string][]=[
   ['eval',/\beval\s*\(/,'Text resembles an eval call; this language needs parser or runtime confirmation.'],
   ['credential',/(?:api[_-]?key|password|secret)\s*[:=]\s*["'][^"']{8,}["']/i,'Credential-like text found; literal value redacted and validity unverified.']
  ];
  for(const [kind,pattern,evidence] of patterns){const match=pattern.exec(file.content);if(match)add(kind,match.index,evidence);}
  // Keep the generic text-only signal without repeatedly scanning the same
  // suffix for each query name in an untrusted source file.
  let queryStart=-1;
  for(const match of file.content.matchAll(/(?:query|execute)\s*\(|[\n;+]/g)){
   if(match[0]==='+'&&queryStart>=0){add('sql',queryStart,'Text resembles query concatenation; argument and data-flow semantics are unverified.');break;}
   if(match[0]==='\n'||match[0]===';')queryStart=-1;
   else if(match[0]!=='+'&&queryStart<0)queryStart=match.index;
  }
  return {signals,coverage};
 }
 try{
  if(mode==='json-literals')JSON.parse(file.content);
  const tokens=lexicalTokens(file.content);
  const budget={steps:0};
  function inspect(list:Token[]){
   for(let index=0;index<list.length;index++){
    const t=list[index];
    if(t.kind==='template')for(const expression of t.expressions||[])inspect(expression);
    if(mode==='javascript-typescript-lexical'&&t.kind==='name'&&['eval','query','execute'].includes(t.value)){
     const open=callAt(list,index);
     if(open>=0){
      const first=firstArgument(list,open,budget),end=callEnd(list,open,budget),definition=end>=0&&list[end+1]?.value==='{' ;
      if(!definition&&t.value==='eval'){
       const member=['.','?.'].includes(list[index-1]?.value);
       if(!member||['globalThis','window','global'].includes(list[index-2]?.value))add('eval',t.start,'Direct eval-like execution found; binding and input trust still require review.');
      }
      if(!definition&&['query','execute'].includes(t.value)&&first.tokens.some(part=>part.kind==='punct'&&part.value==='+'||part.kind==='template'&&part.dynamic))
       add('sql',t.start,'The first query/execute argument contains concatenation or template interpolation; bound parameter values are excluded from this signal.');
     }
    }
    if((t.kind==='name'||t.kind==='string')&&credentialName.test(t.value)){
     if(t.kind==='string'&&list[index+1]?.value!==':')continue;
     const value=literalValue(list,index);
     if(value&&value.value.length>=8)add('credential',t.start,'Credential-named field has a literal value of at least eight characters; value redacted and validity unverified.');
    }
   }
  }
  inspect(tokens);return {signals,coverage};
 }catch(error){
  return {signals:[],coverage:{...coverage,status:'not-inspected-incomplete-syntax-or-limit'}};
 }
}

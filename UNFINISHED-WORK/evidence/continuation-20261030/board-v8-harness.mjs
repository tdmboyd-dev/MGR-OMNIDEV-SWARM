/**
 * Portable evidence adapter for the constrained JavaScript execution used in
 * this repair. The caller supplies exact source/board bytes. No Node, React,
 * filesystem, browser or full application test is simulated or claimed.
 */
export function runBoardContractChecks({moduleSource,testsSource,board,originalComponentSource}) {
  const candidate=new Function(moduleSource.replaceAll('export function ','function ')
    +'\nreturn {isCompleteProgressBoard,isCompleteProgressData};')();
  const results=[];
  const assert={equal(actual,expected,label=''){
    if(!Object.is(actual,expected))throw Error(label+' expected '+expected+', got '+actual);
  }};
  const test=(name,fn)=>{
    try{fn();results.push({name,status:'PASS'});}
    catch(error){results.push({name,status:'FAIL',error:String(error.message)});}
  };
  const runnable=testsSource.replace(/^import .*;\n/gm,'').replace(
    "const board=readFileSync(new URL('../public/owner-progress.html',import.meta.url),'utf8');",
    'const board=actualBoard;');
  new Function('test','assert','actualBoard','isCompleteProgressBoard','isCompleteProgressData',runnable)(
    test,assert,board,candidate.isCompleteProgressBoard,candidate.isCompleteProgressData);
  let original=originalComponentSource.slice(originalComponentSource.indexOf('function isCompleteProgressBoard'),
    originalComponentSource.indexOf('/** The generated'));
  original=original.replace('html: string','html').replace('): boolean',')')
    .replaceAll('(task: {id?: unknown; acceptance?: unknown})','(task)')
    .replaceAll('(task: {id: string})','(task)')
    .replaceAll('(clause: {id?: unknown; requirement?: unknown})','(clause)')
    .replaceAll('(clause: {id: string})','(clause)');
  const before=new Function(original+'\nreturn isCompleteProgressBoard;')();
  const data=JSON.parse(board.match(/<script id="progress-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  const variants=[
    ['duplicate upgrade identity',value=>value.upgrades[1].id=value.upgrades[0].id],
    ['forged fully accepted total',value=>value.summaries.fullyAcceptedParents=174],
    ['missing renderer actions',value=>value.tasks[0].pendingActions=null],
    ['invalid completion reference',value=>value.tasks[0].completedHere=[99999]],
    ['corrupt last test total',value=>value.verification.passedProfiles=999]
  ].map(([name,change])=>{
    const value=JSON.parse(JSON.stringify(data));change(value);
    const html=board.replace(/(<script id="progress-data" type="application\/json">)[\s\S]*?(<\/script>)/,
      (_,start,end)=>start+JSON.stringify(value).replace(/</g,'\\u003c')+end);
    return {name,beforeAccepted:before(html),afterAccepted:candidate.isCompleteProgressBoard(html)};
  });
  return {groups:results.length,passed:results.filter(item=>item.status==='PASS').length,
    failed:results.filter(item=>item.status==='FAIL').length,results,variants};
}

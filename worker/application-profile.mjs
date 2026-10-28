// Fixed recipes only. Application scripts execute inside the constrained container.
export const applicationCommand=['npm','run','omni:verify'];
export function applicationRecipe(files){
 const manifest=files.find(f=>f.path==='package.json'),lock=files.find(f=>f.path==='package-lock.json');
 if(!manifest||!lock)throw Error('Application testing requires package.json and package-lock.json; import a runnable source bundle');
 let pkg;try{pkg=JSON.parse(manifest.content);JSON.parse(lock.content);}catch{throw Error('Invalid application package metadata');}
 if(!pkg.scripts?.test||typeof pkg.scripts.test!=='string'||/no test specified/i.test(pkg.scripts.test))throw Error('Application has no meaningful test script');
 const scripts=['typecheck','build','test'].filter(k=>typeof pkg.scripts?.[k]==='string');
 return {scripts,command:applicationCommand,scope:'Imported candidate application bundle; repository-wide coverage is not implied'};
}
export function applicationDockerArgs(dir,name,image){return ['run','--rm','--name',name,'--pull=never','--network=none','--read-only','--cap-drop=ALL','--security-opt=no-new-privileges','--pids-limit=128','--memory=1024m','--memory-swap=1024m','--cpus=2','--user=65534:65534','--tmpfs=/tmp:rw,nosuid,size=512m','--mount',`type=bind,src=${dir},dst=/source,readonly`,'--workdir=/tmp',image,'sh','-ec','mkdir /tmp/app; cp -R /source/. /tmp/app/; cd /tmp/app; npm ci --offline --ignore-scripts --cache=/opt/omni-npm-cache; node -e \'const p=require("./package.json"); for(const s of ["typecheck","build","test"]) if(p.scripts?.[s]) { const r=require("child_process").spawnSync("npm",["run",s],{stdio:"inherit",env:{...process.env,CI:"true"}}); if(r.status!==0)process.exit(r.status||1); }\''];}

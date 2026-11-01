import {prepareNodeRuntime} from '../scripts/prepare-node-runtime.mjs';
const {preparedModules,manifestSha256}=prepareNodeRuntime();
console.log(JSON.stringify({preparedModules,manifestSha256}));

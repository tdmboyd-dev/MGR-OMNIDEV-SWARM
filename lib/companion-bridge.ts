export const companionOrigin='http://127.0.0.1:8765';
export function acceptsCompanionMessage(event:{origin:string;source:any;data:any},popup:any,nonce:string){return !!popup&&event.origin===companionOrigin&&event.source===popup&&event.data?.nonce===nonce&&['omnidev-ready','omnidev-candidate'].includes(event.data?.type);}

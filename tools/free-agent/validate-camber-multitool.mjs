import {readFile} from "node:fs/promises";
const expectedNames=["binary_session","inspect_apktool_client","inspect_adb_client"];
export function validateCamberPlan(p) {
 if(!p||typeof p!=="object"||Array.isArray(p))throw Error("Plan must be object");
 const keys=["schema_version","task_id","requested_by","source_conversation","purpose","tools","max_calls","allow_external_targets","allow_paid_services","requires_human_approved_workflow"];
 if(Object.keys(p).length!==keys.length||Object.keys(p).some(k=>!keys.includes(k)))throw Error("Plan top-level keys invalid");
 if(p.schema_version!==1||p.task_id!=="rea-android-readiness"||
   p.requested_by!=="camber"||
   p.source_conversation!=="https://app.cambercloud.com/project/cbdb401b-cf2d-4248-8692-b2ebcb5effbb?chatId=289e6fe5-4023-4563-9505-1999017d6379"||
   typeof p.purpose!=="string"||p.purpose.length>180||
   p.max_calls!==3||p.allow_external_targets!==false||p.allow_paid_services!==false||
   p.requires_human_approved_workflow!==true)throw Error("Unapproved task or cost policy");
 if(!Array.isArray(p.tools)||p.tools.length!==3)throw Error("Expected exactly three tools");
 for(let i=0;i<3;i++){
   const t=p.tools[i];
   if(!t||typeof t!=="object"||Array.isArray(t)||
      Object.keys(t).length!==3||Object.keys(t).some(k=>!["name","arguments","reason"].includes(k))||
      t.name!==expectedNames[i]||t.arguments===null||typeof t.arguments!=="object"||
      Array.isArray(t.arguments)||Object.keys(t.arguments).length!==0||
      typeof t.reason!=="string"||t.reason.length>200)throw Error("Unapproved MCP tool selection or args");
 }
 return p.tools.map(t=>Object.freeze({name:t.name,arguments:Object.freeze({})}));
}
export async function loadCamberPlan(path) {
 const raw=await readFile(path,"utf8");
 if(Buffer.byteLength(raw)>10000)throw Error("Plan too large");
 return validateCamberPlan(JSON.parse(raw));
}

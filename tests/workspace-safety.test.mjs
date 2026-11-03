// Run: node --test tests/workspace-safety.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../workspace-safety.js',import.meta.url),'utf8');
function harness(){
 const window={},memory=new Map();
 runInNewContext(source,{window,Date,Math,JSON,Set,Number,String},{filename:'workspace-safety.js'});
 const storage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,String(value))};
 return {api:window.PhaenomenonWorkspaceSafety,storage,memory};
}
const base=()=>({projects:[],leads:[],events:[],clients:[{id:'client1',name:'Demo'}],fixtures:[],eventJobs:[],venues:[],equipment:[],invoices:[]});
test('reject invalid JSON models before they can replace the browser workspace',()=>{
 const {api}=harness(),data=base();
 assert.equal(api.inspect(data).valid,true);
 assert.equal(api.inspect(null).valid,false);
 assert.match(api.inspect({...data,clients:{}}).error,/clients/);
 assert.match(api.inspect({...data,eventJobs:{}}).error,/eventJobs/);
 assert.match(api.inspect({...data,clients:[data.clients[0],data.clients[0]]}).error,/duplicate/);
 assert.match(api.inspect({...data,productionOS:[]}).error,/production data/);
});
test('warn on missing client or venue without discarding valid import data',()=>{
 const {api}=harness(),data=base();
 data.eventJobs=[{id:'ev1',title:'Bad reference',clientId:'missing-client',venueId:'missing-venue'}];
 const result=api.inspect(data);
 assert.equal(result.valid,true);
 assert.equal(result.warnings.length,2);
});
test('capture and restore local recovery points with a compact bounded history',()=>{
 const {api,storage}=harness(),data=base();
 const a=api.checkpoint(storage,JSON.stringify(data),'Before edit',true);
 assert.equal(a.created,true);
 assert.equal(api.list(storage).length,1);
 assert.equal(api.readPoint(storage,a.id).workspace.clients[0].id,'client1');
 const noRepeat=api.checkpoint(storage,JSON.stringify(data),'Same data',true);
 assert.equal(noRepeat.created,false);
 for(let i=0;i<4;i++){
   data.eventJobs.push({id:'ev'+i,title:'Show '+i});
   assert.equal(api.checkpoint(storage,JSON.stringify(data),'Edit '+i,true).created,true);
 }
 assert.equal(api.list(storage).length,3);
 assert.equal(api.readPoint(storage,'no-such-point').error,'Recovery point is unavailable.');
});
test('oversize data and corrupt checkpoints are safely ignored',()=>{
 const {api,storage}=harness(),data=base();
 data.note='a'.repeat(500000);
 assert.equal(api.checkpoint(storage,JSON.stringify(data),'Too big',true).created,false);
 storage.setItem(api.key,'invalid json');
 assert.equal(api.list(storage).length,0);
 assert.equal(api.readPoint(storage,'unknown').error,'Recovery point is unavailable.');
});
test('recovery points do not force cloud sync or alter current workspace',()=>{
 const {api,storage,memory}=harness();
 const data=base(),before=JSON.stringify(data);
 const point=api.checkpoint(storage,before,'Before edit',true);
 assert.equal(point.created,true);
 assert.equal(memory.get('phaenomenon-demo-v1'),undefined);
 assert.equal(api.readPoint(storage,point.id).workspace.clients[0].id,'client1');
});

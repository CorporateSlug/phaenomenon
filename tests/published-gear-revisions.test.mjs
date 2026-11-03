// Event inventory changes must invalidate the correct installation instructions.
// No npm dependencies: node --test tests/published-gear-revisions.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../production-os.js',import.meta.url),'utf8')
  .replace('ensure();store();route();','ensure();store();route();window.__test={db,current,org,publish,isChanged,changes,revisionDiff};');

function harness(){
  const mem=new Map(),handler={},root={innerHTML:'',contains:()=>true};
  const window={addEventListener:(key,fn)=>{handler[key]=fn}};
  const document={
    getElementById:id=>id==='production-app'?root:null,
    addEventListener:(key,fn)=>{handler['document.'+key]=fn},
    querySelector:()=>null,body:{insertAdjacentHTML(){}}
  };
  const location={hash:'#/home'};
  const localStorage={
    getItem:key=>mem.get(key)||null,
    setItem:(key,val)=>mem.set(key,String(val))
  };
  runInNewContext(source,{
    window,document,location,localStorage,
    confirm:()=>true,alert(){},prompt:()=>'',setTimeout(){},
    console,Date,Math,JSON,Map,Set,Array,Object,Number,String,Intl,encodeURIComponent,decodeURIComponent
  },{filename:'production-os.js'});
  return window.__test;
}
function setup(){
  const api=harness(),e=api.current(),plan=api.db.venuePlans[e.id],item=plan.items[0];
  api.db.equipment.push({id:'test-model-a',name:'Fixture model A',watts:300,category:'Lighting'},
    {id:'test-model-b',name:'Fixture model B',watts:400,category:'Lighting'});
  item.eqId='test-model-a';item.kitTracked=true;
  e.kit=[{id:'test-model-a',qty:1}];
  api.publish(e.id,true);
  const pack=api.org().published[e.id],placement='task-place-'+item.id;
  const unchanged=pack.tasks.find(x=>x.id!==placement);
  pack.tasks.find(x=>x.id===placement).state='verified';
  if(unchanged)unchanged.state='verified';
  return {api,e,item,placement,unchanged};
}
test('changing a linked model is visible as a revision and resets only affected installation tasks',()=>{
  const {api,e,item,placement,unchanged}=setup();
  item.eqId='test-model-b';e.kit=[{id:'test-model-b',qty:1}];
  assert.equal(api.isChanged(e),true);
  assert.ok(api.changes(e).some(x=>/Equipment location or configuration changed/.test(x)));
  assert.ok(api.revisionDiff(e).changed>=1);
  api.publish(e.id,true);
  const pack=api.org().published[e.id];
  assert.equal(pack.tasks.find(x=>x.id===placement).state,'pending');
  if(unchanged)assert.equal(pack.tasks.find(x=>x.id===unchanged.id).state,'verified');
});
test('changing catalogue power specifications prompts revised placement instructions',()=>{
  const {api,e,placement}=setup();
  api.db.equipment.find(x=>x.id==='test-model-a').watts=700;
  assert.equal(api.isChanged(e),true);
  assert.ok(api.changes(e).some(x=>/Linked equipment specification changed/.test(x)));
  assert.ok(api.revisionDiff(e).changed>=1);
  api.publish(e.id,true);
  assert.equal(api.org().published[e.id].tasks.find(x=>x.id===placement).state,'pending');
});
test('changing kit quantities is disclosed without resetting unchanged physical placement checks',()=>{
  const {api,e,placement}=setup();
  e.kit=[{id:'test-model-a',qty:5}];
  assert.equal(api.isChanged(e),true);
  assert.ok(api.changes(e).some(x=>/Event equipment kit quantities/.test(x)));
  assert.equal(api.revisionDiff(e).changed,0);
  api.publish(e.id,true);
  assert.equal(api.org().published[e.id].tasks.find(x=>x.id===placement).state,'verified');
});

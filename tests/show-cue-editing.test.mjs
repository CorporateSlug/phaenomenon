// Show cue changes are controlled planning edits, never live console control.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const script=readFileSync(new URL('../production-os.js',import.meta.url),'utf8')
  .replace('ensure();store();route();','ensure();store();route();window.__test={db,current,org};');

function harness(){
  const store=new Map(),handlers={},ui={innerHTML:'',contains:()=>true};
  let modal='';
  const window={addEventListener:(name,cb)=>handlers['window.'+name]=cb};
  const location={hash:'#/production'};
  const document={
    getElementById:id=>id==='production-app'?ui:null,
    querySelector:()=>null,
    addEventListener:(name,fn)=>handlers[name]=fn,
    body:{insertAdjacentHTML:(where,html)=>{modal=html}}
  };
  class FormDataMock{constructor(el){this.v=el.values||{}}get(key){return this.v[key]??null}getAll(key){return this.v[key]||[]}}
  for(const file of ['event-lifecycle.js','event-lifecycle-ui.js','event-workspace.js']){
    runInNewContext(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{window},{filename:file});
  }
  runInNewContext(script,{
    window,document,location,FormData:FormDataMock,
    localStorage:{getItem:key=>store.get(key)||null,setItem:(key,val)=>store.set(key,String(val))},
    confirm:()=>true,alert(){},prompt:()=>'',setTimeout(){},
    console,Date,Math,JSON,Map,Set,Array,Object,Number,String,Intl,encodeURIComponent,decodeURIComponent
  },{filename:'production-os.js'});
  return {
    window,ui,store,refresh:()=>handlers['window.hashchange'](),
    click:(act,id)=>handlers.click({target:{closest:()=>({dataset:{act,id}})},preventDefault(){}}),
    submit:(id,values)=>handlers.submit({target:{id,values},preventDefault(){}}),
    modal:()=>modal
  };
}
test('an existing show cue can be edited without changing other cues or lighting looks',()=>{
  const h=harness(),api=h.window.__test,e=api.current(),cues=api.org().show[e.id]||[];
  api.org().show[e.id]=cues;
  const other={id:'other-cue',time:'20:00',title:'Doors',areaId:(e.spaceIds?.[0]||'ab-indoor'),done:false};
  const cue={id:'edit-cue',time:'20:30',title:'Performance',areaId:(e.spaceIds?.[0]||'ab-indoor'),done:true};
  cues.push(other,cue);
  h.refresh();
  assert.match(h.ui.innerHTML,/data-act="edit-cue"/);
  h.click('edit-cue',cue.id);
  assert.match(h.modal(),/id="cue-editor-form"/);
  h.submit('cue-editor-form',{id:cue.id,time:'21:30',title:'Encore',areaId:(e.spaceIds?.[0]||'ab-indoor'),lookId:''});
  assert.equal(cue.title,'Encore');
  assert.equal(cue.time,'21:30');
  assert.equal(cue.done,false);
  assert.equal(other.title,'Doors');
  assert.ok(JSON.parse(h.store.get('phaenomenon-demo-v1')).productionOS.show[e.id].some(x=>x.id===cue.id&&x.title==='Encore'));
});
test('removing one show cue leaves other cues and draft lighting looks alone',()=>{
  const h=harness(),api=h.window.__test,e=api.current();
  api.org().show[e.id]=[{id:'cue-one',time:'21:00',title:'Changeover',areaId:(e.spaceIds?.[0]||'ab-indoor')},{id:'cue-two',time:'22:00',title:'Main set',areaId:(e.spaceIds?.[0]||'ab-indoor')}];
  const existing=JSON.stringify(api.org().looks[e.id]||[]);
  h.click('delete-cue','cue-one');
  assert.equal(api.org().show[e.id].length,1);
  assert.equal(api.org().show[e.id][0].id,'cue-two');
  assert.equal(JSON.stringify(api.org().looks[e.id]||[]),existing);
});

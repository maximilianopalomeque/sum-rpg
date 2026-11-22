import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import * as story from '../story.js';
import * as engine from '../engine.js';
import * as icons from '../icons.js';
function ui(){
 const listeners={},elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{style:{},dataset:{},value:'',textContent:'',innerHTML:'',children:id==='route'?[{},{},{}]:[],focus(){},querySelector(){return {focus(){}}},addEventListener(){},setAttribute(){},getContext(){return {}}});return elements.get(id)};
 const document={getElementById:element,hidden:false,addEventListener(name,fn){listeners['document:'+name]=fn}};
 const window={addEventListener(name,fn){listeners['window:'+name]=fn}};
 const context=vm.createContext({...engine,...story,...icons,paintStory(){},paint(){},document,window,matchMedia:()=>({matches:false}),requestAnimationFrame(){},console});
 vm.runInContext(fs.readFileSync(new URL('../main.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),context);
 return {run:code=>vm.runInContext(code,context),listeners,document,element};
}
test('real UI blur and visibility listeners pause time; resume does not catch up',()=>{
 const {run,listeners,document}=ui();run('reset();frame(1000);frame(1100)');const time=run('state.time');listeners['window:blur']();assert.equal(run('paused'),true);run('frame(4000)');assert.equal(run('state.time'),time);run('togglePause(false);frame(4100)');assert.ok(Math.abs(run('state.time')-(time-.1))<.00001);document.hidden=true;listeners['document:visibilitychange']();assert.equal(run('paused'),true);
});
test('cinematic completion and skip reach tutorial without damage or spent time',()=>{
 const {run}=ui();assert.equal(run('state.phase'),'cinematic');run('frame(1000);frame(2000);submit(true)');assert.equal(run('state.hp'),6);assert.equal(run('state.time'),14);assert.equal(run('state.wrong'),0);run('storyNext();storyNext();storyNext()');assert.equal(run('storyIndex'),3);assert.equal(run('state.phase'),'cinematic');run('storyNext()');assert.equal(run('state.phase'),'intro');run('showStory();finishStory()');assert.equal(run('state.phase'),'intro');assert.equal(run('state.hp'),6);
});
test('replay resets intro, keyboard skip is safe, restart starts clean combat',()=>{
 const {run,listeners}=ui();run('storyNext();showStory()');assert.equal(run('storyIndex'),0);listeners['document:keydown']({key:'Escape',preventDefault(){},target:{tagName:'BODY'}});assert.equal(run('state.phase'),'intro');run('reset()');assert.equal(run('state.phase'),'battle');assert.equal(run('state.hp'),6);assert.equal(run('state.round'),0);assert.equal(run('state.time'),14);
});

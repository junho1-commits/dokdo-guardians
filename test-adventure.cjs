const assert=require('node:assert/strict');
const D=require('./adventure-data.js');
for(const grade of ['1','3','5']){
 let s=D.fresh(),questions=0;
 for(let chapter=0;chapter<D.stages.length;chapter++){
  assert.equal(s.stage,chapter);assert.equal(D.gate(s),false);
  assert.deepEqual(D.next(s),s,'Locked gate must not advance');
  for(const n of D.stages[chapter].nodes){
   if(n.use)assert.equal(D.inspect(s,n,null),'tool',`${n.id} requires a tool`);
   assert.equal(D.inspect(s,n,n.use),'ready',`${grade}: ${n.id} reachable`);
   if(n.puzzle){const qs=D.puzzles[n.puzzle][grade];assert(qs.length);for(const q of qs){assert(Number.isInteger(q.answer));assert(q.answer>=0&&q.answer<q.options.length);assert(q.explain.length>5);questions++}}
   s=D.complete(s,n);assert.equal(D.inspect(s,n,n.use),'done');assert.deepEqual(D.complete(s,n),s,'Repeated collection must be idempotent');assert(D.valid(s));
  }
  assert(D.gate(s));s=D.next(s);assert(D.valid(s));
 }
 assert(s.finished);assert.equal(s.done.length,18);assert.equal(s.bag.length,Object.keys(D.items).length);
 console.log(`${grade}~${+grade+1}: all 6 chapters, ${s.done.length} activities, ${questions} questions, inventory and ending PASS`);
}
const n=D.stages[0].nodes[1];assert.equal(D.inspect(D.fresh(),n,null),'requires');
for(const value of [null,{}, {...D.fresh(),stage:99},{...D.fresh(),bag:['bad']},{...D.fresh(),stage:3},{...D.fresh(),finished:true},{...D.fresh(),done:['map']}])assert.equal(D.valid(value),false);
assert(D.valid(JSON.parse(JSON.stringify(D.fresh()))));console.log('Corrupt saves, prerequisite locks and save round-trip PASS');

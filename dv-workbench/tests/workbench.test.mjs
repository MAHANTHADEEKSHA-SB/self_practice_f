import assert from 'node:assert/strict';
import {extractCandidates,csv,parsePageRange} from '../lib/workbench.ts';
const input='[Page 12]\nThe interface shall retain queued requests.\nThis is introductory text.\n[Page 13]\nReset shall block acceptance.\nThe register should clear after recovery.';
const found=extractCandidates(input);
assert.equal(found.length,3);assert.equal(found[0].page,'12');assert.equal(found[1].page,'13');
assert.equal(extractCandidates(input,true).length,3);
assert.deepEqual(extractCandidates('Welcome to the document.'),[]);
assert.equal(extractCandidates(Array(150).fill('The block must retain all requests.').join('\n')).length,100);
assert.equal(csv([{id:'1',value:'=SUM(A1:A4)'},{id:'2',value:'a,"b"'}]),'"id","value"\r\n"1","\'=SUM(A1:A4)"\r\n"2","a,""b"""');
assert.equal(csv([]),'');
console.log('6 extraction and export checks passed');

assert.deepEqual(parsePageRange('12','25'),{start:12,end:25});
assert.deepEqual(parsePageRange('1','1'),{start:1,end:1});
assert.deepEqual(parsePageRange('002','020'),{start:2,end:20});
for(const value of ['', '0', '-1', '1.5', '1e2', 'abc', '9007199254740992']){
 assert.throws(()=>parsePageRange(value,'20'),/From page/);
 assert.throws(()=>parsePageRange('1',value),/To page/);
}
assert.throws(()=>parsePageRange('25','12'),/greater than or equal/);
console.log('Page-range validation passed: multi-digit values, same-page ranges, empty/invalid fields and reversed bounds');

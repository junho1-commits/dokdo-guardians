const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sandbox = {
  Image: class { constructor() { this.src = ''; } },
  document: { title: '' },
  console: console
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const D = require('./adventure-data.js');
sandbox.DokdoData = D;

const itemIconsCode = fs.readFileSync(path.join(__dirname, 'item-icons.js'), 'utf8') + '\nglobalThis.ItemIcons = ItemIcons; globalThis.itemIcon = itemIcon;';
vm.runInContext(itemIconsCode, sandbox);

const escapeDataCode = fs.readFileSync(path.join(__dirname, 'escape-data.js'), 'utf8') + '\nglobalThis.EscapeRooms = EscapeRooms;';
vm.runInContext(escapeDataCode, sandbox);

const EscapeRooms = sandbox.EscapeRooms;
const ItemIcons = sandbox.ItemIcons;
const itemIcon = sandbox.itemIcon;

console.log('--- 독도 수호대 방탈출 및 3단계 역사 잠금카드 호환성 검증 시작 ---');

assert.equal(EscapeRooms.length, 6, '방탈출 방 개수는 정확히 6개여야 합니다.');

EscapeRooms.forEach((room, idx) => {
  assert(room.name, `방 ${idx + 1}의 이름이 없습니다.`);
  assert(room.lock, `방 ${idx + 1}의 잠금장치 명칭이 없습니다.`);
  assert(room.prompt, `방 ${idx + 1}의 안내 질문이 없습니다.`);
  assert(Array.isArray(room.cards), `방 ${idx + 1}의 카드는 배열이어야 합니다.`);
  assert(Array.isArray(room.answer), `방 ${idx + 1}의 정답은 배열이어야 합니다.`);
  assert(room.cards.length >= room.answer.length, `방 ${idx + 1}의 카드 수는 정답 슬롯 수 이상이어야 합니다.`);

  room.answer.forEach((ansIdx, slotIdx) => {
    assert(ansIdx >= 0 && ansIdx < room.cards.length, `방 ${idx + 1} 슬롯 ${slotIdx + 1}의 정답 인덱스가 유효하지 않습니다.`);
  });
});

console.log('✔ 전체 6개 방 데이터 및 슬롯 기본 구조 검증 통과');

const room4 = EscapeRooms[3];
assert.equal(room4.name, '봉인된 역사 기록실');
assert.equal(room4.answer.length, 3, '4번 방 잠금장치 슬롯은 반드시 3단계여야 합니다.');
assert.equal(room4.cards.length, 3, '4번 방 카드는 3장이 제공되어야 합니다.');

const [c0, c1, c2] = room4.cards;
assert(c0[0].includes('1900년') || c0[0].includes('대한제국'), '0번 카드는 1900년 대한제국 칙령이어야 합니다.');
assert(c1[0].includes('512년') || c1[0].includes('신라') || c1[0].includes('이사부'), '1번 카드는 512년 신라 이사부여야 합니다.');
assert(c2[0].includes('조선') || c2[0].includes('안용복'), '2번 카드는 조선 안용복이어야 합니다.');

assert.equal(JSON.stringify([...room4.answer]), JSON.stringify([1, 2, 0]), '4번 방의 역사 시간순 정답은 [1, 2, 0]이어야 합니다.');

room4.cards.forEach(([text, iconId]) => {
  assert(ItemIcons[iconId], `카드 [${text}]의 아이콘 ID '${iconId}'가 ItemIcons에 등록되어 있어야 합니다.`);
  assert(ItemIcons[iconId].startsWith('data:image/svg+xml'), `아이콘 '${iconId}'는 유효한 SVG data URI여야 합니다.`);
});

console.log('✔ 4번 방 역사 3단계 잠금카드 (신라 512년 → 조선 안용복 → 1900년 칙령) 정밀 검증 통과');

assert(ItemIcons.isabu, 'ItemIcons.isabu가 정상 등록되어 있어야 합니다.');
assert(ItemIcons.anyongbok, 'ItemIcons.anyongbok가 정상 등록되어 있어야 합니다.');

const isabuTag = itemIcon('isabu');
assert(isabuTag.includes('class="item-icon "'), 'itemIcon은 class="item-icon" 태그를 반환해야 합니다.');
assert(!isabuTag.includes('undefined'), '정상 아이콘 호출 시 undefined가 포함되면 안 됩니다.');

const fallbackTag = itemIcon('non_existent_random_id_12345');
assert(!fallbackTag.includes('undefined'), '미등록 아이콘 호출 시 src="undefined"가 되면 안 됩니다.');
assert(fallbackTag.includes('src="data:image/svg+xml'), '미등록 아이콘 호출 시 기본 archive 아이콘으로 안전하게 fallback 되어야 합니다.');

console.log('✔ 아이콘 시스템 및 fallback 엑스박스 방어 로직 검증 통과');
console.log('==================================================');
console.log('🎉 4번 방 3단계 잠금카드 및 엔진 호환성 테스트 ALL PASS');
console.log('==================================================');

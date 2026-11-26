import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPhatAm, mergePhatAm} from './phat-am.mjs';

const MAP = {HP: 'hát pê', Follow: 'phô lô'};

test('thay HP bằng phiên âm, giữ dấu câu bám theo chữ', () => {
  const r = buildPhatAm('Trừ một kẻ lì đòn: vi khuẩn HP.', MAP);
  assert.equal(r.ttsText, 'Trừ một kẻ lì đòn: vi khuẩn hát pê.');
  assert.deepEqual(r.tokens.at(-1), {text: 'HP.', n: 2});
  assert.equal(r.tokens.length, 8);
});

test('dấu câu đứng trước chữ cũng giữ lại đúng âm tiết đầu', () => {
  const r = buildPhatAm('Nó (HP) đây', MAP);
  assert.equal(r.ttsText, 'Nó (hát pê) đây');
});

test('không có bảng hoặc không trùng thì giữ nguyên', () => {
  assert.equal(buildPhatAm('Dạ dày ngâm axit.', {}).ttsText, 'Dạ dày ngâm axit.');
  assert.equal(buildPhatAm('HPV khác HP', MAP).ttsText, 'HPV khác hát pê');
});

test('gộp mốc: các âm tiết phiên âm về một chữ hiển thị, t0 đầu và t1 cuối', () => {
  const {ttsText, tokens} = buildPhatAm('Vi khuẩn HP ở đây', MAP);
  const words = ttsText.split(' ').map((text, i) => ({text, t0: i * 0.3, t1: i * 0.3 + 0.25}));
  const merged = mergePhatAm(words, tokens);
  assert.deepEqual(merged.map((w) => w.text), ['Vi', 'khuẩn', 'HP', 'ở', 'đây']);
  assert.equal(merged[2].t0, 0.6); // "hát"
  assert.equal(merged[2].t1, 0.9 + 0.25); // "pê"
  assert.equal(merged[3].t0, 1.2);
});

test('Follow ở cuối câu: hai âm tiết thành một chữ, dấu chấm than giữ lại', () => {
  const {ttsText, tokens} = buildPhatAm('Follow để hiểu nhé!', MAP);
  assert.equal(ttsText, 'phô lô để hiểu nhé!');
  const merged = mergePhatAm(ttsText.split(' ').map((text, i) => ({text, t0: i, t1: i + 0.5})), tokens);
  assert.deepEqual(merged[0], {text: 'Follow', t0: 0, t1: 1.5});
});

test('số chữ TTS lệch thì báo lỗi thay vì gộp sai', () => {
  const {tokens} = buildPhatAm('HP ở đây', MAP);
  assert.throws(() => mergePhatAm([{text: 'a', t0: 0, t1: 1}], tokens), /không khớp/);
});

test('khoá là số có dấu chấm hoặc số thường: dấu câu theo sau vẫn giữ', () => {
  const map = {'7.000': 'bảy nghìn', '69': 'sáu mươi chín', '1800': 'một tám không không', '6606': 'sáu sáu không sáu'};
  const r = buildPhatAm('hơn 7.000 hoá chất, 69 chất, gọi 1800 6606.', map);
  assert.equal(r.ttsText, 'hơn bảy nghìn hoá chất, sáu mươi chín chất, gọi một tám không không sáu sáu không sáu.');
  assert.deepEqual(r.tokens.find((x) => x.text === '7.000'), {text: '7.000', n: 2});
  assert.deepEqual(r.tokens.at(-1), {text: '6606.', n: 4});
});
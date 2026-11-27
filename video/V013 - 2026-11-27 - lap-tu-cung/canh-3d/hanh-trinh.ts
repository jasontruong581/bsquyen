/* Hành trình của quả trứng nhân vật (mạch xuyên suốt video): vị trí, cỡ và tâm trạng theo thời gian, tính từ mốc lời đọc.
   Chờ ở góc dưới → bay vào nang trứng → được thả ra → tua vòi đón → đi dọc vòi trứng → vào khoang tử cung → tan thành tia sáng → quay lại lúc chúc mừng.
   Hàm thuần theo t; camera cũng bám theo vị trí này (may-quay.ts). */
import * as THREE from 'three';
import {FOLLICLE_W, FUNNEL, V, tubeCurve} from './giai-phau';
import {S, T, clamp01, kf, sm, smooth} from './moc';

export type Mood = 'vui' | 'tinh' | 'ngac';
export type Egg = {p: THREE.Vector3; s: number; mood: Mood; visible: boolean; /** 0..1: đang tan thành tia sáng */ fade: number; /** đang ở trong vòi trứng, u dọc vòi (phải); -1 nếu không */ tubeU: number};

export const HOME = V(-3.3, -2.6, 1.0);
const TUBE_R = tubeCurve(1);
const FM = FUNNEL(1).add(V(0.0, 0.05, 0.15));
const BORN = FOLLICLE_W.clone().add(V(0, 0, 0.0));
const OUT = FOLLICLE_W.clone().add(V(0.5, 0.7, 0.1));
const J = TUBE_R.getPointAt(0);
const REST = V(0.05, -0.05, 0.5);

/** Các mốc chuyển đoạn, giây */
export const B = {
  fly: T.follicles + 0.3,
  inside: T.follicles + 1.7,
  out0: T.burst + 0.2,
  out1: T.release + 0.55,
  mouth0: T.catch + 0.1,
  mouth1: T.enter + 0.1,
  tube0: T.enter + 0.8,
  tube1: T.ready - 0.4,
  rest: T.ready + 0.8,
  bye0: T.ifNot + 0.25,
  gone: T.ifNot + 1.9,
  back: T.party - 0.1,
};

const U_KEYS: [number, number][] = [
  [B.tube0, 1.0],
  [B.tube0 + 1.2, 0.88],
  [T.toward + 1.0, 0.72],
  [T.meet + 0.1, 0.5],
  [T.ready - 1.0, 0.14],
  [B.tube1, 0.0],
];

const lerp3 = (a: THREE.Vector3, b: THREE.Vector3, f: number) => a.clone().lerp(b, f);

export const eggAt = (t: number): Egg => {
  const e: Egg = {p: new THREE.Vector3(), s: 0.5, mood: 'vui', visible: true, fade: 0, tubeU: -1};
  const bob = (a = 0.12, w = 3.2) => a * Math.abs(Math.sin(t * w));
  if (t < T.eggIn) {
    e.visible = false;
  } else if (t < B.fly) {
    // chờ ở góc dưới khung chậu, nảy tưng tưng; hiện ra bằng cách nảy lên từ phía dưới
    const f = sm(t, T.eggIn, 0.5);
    e.p.copy(HOME).add(V(0, -1.2 * (1 - f) + bob(0.35, 3.4), 0));
    e.s = 0.5 * Math.max(f, 0.001);
  } else if (t < B.inside) {
    // bay vòng cung vào nang trứng, nhỏ dần
    const f = sm(t, B.fly, B.inside - B.fly);
    e.p.copy(lerp3(HOME, BORN, f)).add(V(0, 1.6 * Math.sin(Math.PI * f), 0.4 * Math.sin(Math.PI * f)));
    e.s = 0.5 + (0.14 - 0.5) * f;
  } else if (t < B.out0) {
    // nằm trong nang, lắc lư rất nhẹ; nang phồng lên thì trứng cũng nhích lớn một chút
    e.p.copy(BORN).add(V(0.03 * Math.sin(t * 1.3), 0.02 * Math.sin(t * 1.9), 0.0));
    e.s = 0.14 + 0.05 * sm(t, T.bulge, 1.8);
    e.mood = 'tinh';
  } else if (t < B.out1) {
    // nang nứt: trứng được thả ra ngoài mặt buồng trứng (ngạc nhiên một chút rồi cười)
    const f = sm(t, B.out0, B.out1 - B.out0);
    e.p.copy(lerp3(BORN, OUT, f));
    e.s = 0.19 + 0.08 * f;
    e.mood = f < 0.7 ? 'ngac' : 'vui';
  } else if (t < B.mouth0) {
    e.p.copy(OUT).add(V(0.04 * Math.sin(t * 2.2), 0.06 * Math.sin(t * 3.1), 0));
    e.s = 0.27;
  } else if (t < B.mouth1) {
    // tua vòi đón lấy, đưa lên miệng phễu
    const f = sm(t, B.mouth0, B.mouth1 - B.mouth0);
    e.p.copy(lerp3(OUT, FM, f));
    e.s = 0.27 - 0.07 * f;
  } else if (t < B.tube0) {
    e.p.copy(lerp3(FM, TUBE_R.getPointAt(1), sm(t, B.mouth1, B.tube0 - B.mouth1)));
    e.s = 0.2;
    e.tubeU = 1;
  } else if (t < B.tube1) {
    const u = kf(U_KEYS, t);
    e.p.copy(TUBE_R.getPointAt(clamp01(u)));
    e.s = 0.2;
    e.mood = 'tinh';
    e.tubeU = u;
  } else if (t < B.rest) {
    // vào khoang tử cung rồi nghỉ ở giữa
    const f = sm(t, B.tube1, B.rest - B.tube1);
    const mid = V(0.6, 0.6, 0.45);
    const a = lerp3(J, mid, Math.min(1, f * 2));
    e.p.copy(f < 0.5 ? a : lerp3(mid, REST, (f - 0.5) * 2));
    e.s = 0.2 + 0.15 * f;
  } else if (t < B.bye0) {
    e.p.copy(REST).add(V(0, bob(0.05, 2.2), 0));
    e.s = 0.35;
  } else if (t < B.gone) {
    // vẫy chào, nhảy lên rồi tan thành các tia sáng nhỏ
    const f = clamp01((t - B.bye0) / (B.gone - B.bye0));
    e.p.copy(REST).add(V(0, 0.35 * Math.abs(Math.sin(f * Math.PI * 3)), 0));
    e.s = 0.35 * (1 - 0.8 * smooth(clamp01((f - 0.45) / 0.55)));
    e.fade = smooth(clamp01((f - 0.45) / 0.55));
  } else if (t < B.back) {
    e.visible = false;
  } else {
    // quay lại nhảy mừng lúc chúc mừng
    const f = sm(t, B.back, 0.5);
    e.p.copy(HOME).add(V(0, -1.2 * (1 - f) + 0.45 * Math.abs(Math.sin((t - T.party) * 4)) * f, 0));
    e.s = 0.65 * Math.max(f, 0.001);
  }
  return e;
};

/** Thời điểm bắt đầu vẫy chào và tan; dùng cho tia sáng */
export const SPARK_AT = B.bye0 + 0.9;
export const PARTY_FROM = S(15);

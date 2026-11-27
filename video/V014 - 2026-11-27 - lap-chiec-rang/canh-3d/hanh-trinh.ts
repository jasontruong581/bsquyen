/* Hành trình của viên đường nhân vật (mạch xuyên suốt) và các thời điểm chung cho cả cảnh, tính từ mốc lời đọc (moc.ts).
   Từ ngoài khung nhảy lên nướu → leo lên mũi nhai khi nói đến mảng bám → theo camera vào cảnh phóng to men → quay ra, lo lắng đứng cạnh lỗ sâu
   → trượt ra khỏi khung lúc chuyển sang phần bảo vệ răng → quay lại lúc đi khám → nhảy mừng. */
import * as THREE from 'three';
import {V} from './giai-phau';
import {E, S, T, clamp01, sm, smooth} from './moc';
import type {Mood} from './chung';

export const REST = V(-2.75, 0.5, 1.4);
export const TOP = V(-0.95, 3.1, 0.85);
export const WORRY = V(-1.0, 3.02, 1.0);
export const STAGE_SUGAR = V(-2.1, 2.4, 2.3);
const OFF = V(-6.6, -2.4, 2.4);

/** Các mốc chuyển đoạn, giây */
export const B = {
  in0: T.build + 0.35,
  in1: T.build + 1.35,
  up0: T.plaque - 0.15,
  up1: T.plaque + 0.85,
  eat0: T.meal,
  toStage0: T.zoomIn + 0.15,
  toStage1: T.zoomIn + 1.15,
  back0: T.zoomOut,
  back1: T.zoomOut + 1.0,
  out0: E(14) - 0.45,
  out1: E(14) + 0.55,
  ret0: T.check - 0.25,
  ret1: T.check + 0.75,
};

/** Các lúc có bộ phận mới nảy vào: viên đường nhảy mừng theo */
const JUMPS = [T.pulp - 0.25, T.dentin - 0.7, T.enamel - 0.9, T.cement - 0.4, T.bone - 0.5, T.gum - 0.5];

const hop = (a: THREE.Vector3, b: THREE.Vector3, f: number, h: number) => a.clone().lerp(b, smooth(f)).add(V(0, h * Math.sin(Math.PI * f), 0.3 * Math.sin(Math.PI * f)));

export type Sugar = {p: THREE.Vector3; s: number; mood: Mood; squash: number; tilt: number};

export const sugarAt = (t: number): Sugar => {
  const o: Sugar = {p: REST.clone(), s: 0.9, mood: 'vui', squash: 1, tilt: 0};
  const bob = (a = 0.1, w = 2.8) => a * Math.abs(Math.sin(t * w));
  if (t < B.in0) o.s = 0;
  else if (t < B.in1) {
    const f = clamp01((t - B.in0) / (B.in1 - B.in0));
    o.p = hop(OFF, REST, f, 1.8);
    o.tilt = 0.5 * (1 - f) * Math.sin(f * 9);
  } else if (t < B.up0) {
    let j = 0;
    for (const a of JUMPS) j += 0.32 * Math.sin(Math.PI * clamp01((t - a) / 0.5));
    o.p = REST.clone().add(V(0, bob(0.06) + j, 0));
  } else if (t < B.up1) {
    o.p = hop(REST, TOP, clamp01((t - B.up0) / (B.up1 - B.up0)), 1.3);
  } else if (t < B.toStage0) {
    // đứng trên mũi nhai; "bữa ăn" thì được vi khuẩn gặm bớt (nhỏ dần), nhìn có chút ngơ ngác
    o.p = TOP.clone().add(V(0, bob(0.05), 0));
    const eat = sm(t, B.eat0, 2.2) * (1 - sm(t, B.toStage0 - 0.4, 0.4));
    o.s = 0.9 - 0.3 * eat;
    o.mood = eat > 0.15 ? 'ngac' : 'vui';
  } else if (t < B.toStage1) {
    o.p = hop(TOP, STAGE_SUGAR, clamp01((t - B.toStage0) / (B.toStage1 - B.toStage0)), 1.0);
    o.s = 0.9 - 0.2 * sm(t, B.toStage0, 1);
  } else if (t < B.back0) {
    o.p = STAGE_SUGAR.clone().add(V(0, bob(0.08), 0));
    o.s = 0.7;
    o.mood = t > T.leave && t < T.fix ? 'ngac' : 'vui';
    if (t > T.fix) o.mood = 'vui';
  } else if (t < B.back1) {
    o.p = hop(STAGE_SUGAR, WORRY, clamp01((t - B.back0) / (B.back1 - B.back0)), 0.3);
    o.s = 0.7 + 0.2 * sm(t, B.back0, 1.0);
  } else if (t < B.out0) {
    // lo lắng đứng cạnh lỗ sâu; thoáng ngạc nhiên lúc "đau rõ"
    o.p = WORRY.clone().add(V(0, bob(0.03, 1.6), 0));
    o.mood = t >= T.painful && t < T.notSure ? 'ngac' : 'lo';
  } else if (t < B.out1) {
    o.p = hop(WORRY, OFF, clamp01((t - B.out0) / (B.out1 - B.out0)), 0.5);
    o.mood = 'lo';
  } else if (t < B.ret0) o.s = 0;
  else if (t < B.ret1) o.p = hop(OFF, REST, clamp01((t - B.ret0) / (B.ret1 - B.ret0)), 1.8);
  else if (t < T.party) o.p = REST.clone().add(V(0, bob(0.06), 0));
  else {
    o.p = REST.clone().add(V(0, 0.5 * Math.abs(Math.sin((t - T.party) * 4)), 0.3));
    o.s = 1.0;
  }
  return o;
};

/* ---------- bàn chải: nhảy vào bên trái, chải lên xuống hai lượt, rồi rút ra; lúc chúc mừng nhảy lên bên phải ---------- */
const BRUSH_OFF = V(-7.2, -1.6, 1.0);
const BRUSH_POSE = V(-3.07, -0.37, 0.5);
export const brushClean = (t: number) => sm(t, T.brush + 0.5, 3.4);
export const brushAt = (t: number) => {
  const o = {p: BRUSH_POSE.clone(), rot: -0.2, s: 0.9, visible: true, sweep: 0};
  const in0 = T.brush - 0.5;
  const out0 = T.floss - 0.55;
  if (t < in0 || (t > out0 + 0.9 && t < T.party)) return {...o, visible: false};
  if (t < in0 + 0.9) o.p = BRUSH_OFF.clone().lerp(BRUSH_POSE, smooth(clamp01((t - in0) / 0.9))).add(V(0, 1.2 * Math.sin(Math.PI * clamp01((t - in0) / 0.9)), 0));
  else if (t < out0) {
    o.sweep = Math.sin((t - T.brush) * 5.6);
    o.p = BRUSH_POSE.clone().add(V(0.12 * Math.abs(o.sweep), 0.7 * o.sweep, 0));
  } else if (t < out0 + 0.9) o.p = BRUSH_POSE.clone().lerp(BRUSH_OFF, smooth(clamp01((t - out0) / 0.9)));
  else {
    // lúc chúc mừng: nhảy ở bên phải, đứng thẳng
    o.p = V(3.1, 0.2 + 0.5 * Math.abs(Math.sin((t - T.party) * 4)), 1.4);
    o.rot = 0.1;
    o.s = 0.7;
  }
  return o;
};

/** Tuýp kem (hỏi nha sĩ) hiện ở bên phải, và gương nha khoa lúc đi khám */
export const TUBE_POSE = V(2.3, 1.6, 1.6);
export const tubeAt = (t: number) => {
  // hai lần xuất hiện: nói tới kem có flo (cảnh 15) và lúc dặn hỏi nha sĩ (cảnh 16)
  const k = Math.max(sm(t, T.fluoride - 0.2, 0.5) * (1 - sm(t, T.floss - 0.6, 0.5)), sm(t, T.ask - 0.3, 0.5) * (1 - sm(t, T.check - 0.6, 0.5)));
  return {visible: k > 0.01, k};
};
export const mirrorAt = (t: number) => {
  const f = clamp01((t - (T.check - 0.1)) / (T.detect - T.check + 0.4));
  const k = sm(t, T.check - 0.1, 0.5) * (1 - sm(t, T.party - 0.8, 0.5));
  // soi quanh thân răng rồi dừng ở rãnh nhai (nơi lỗ sâu nhỏ)
  const x = f < 1 ? -0.9 + 1.7 * smooth(f) + 0.35 * Math.sin(t * 2.4) * (1 - f) : 0.8;
  return {p: V(x + 1.3, 2.85 + 0.08 * Math.sin(t * 3), 1.2), k};
};

/* ---------- lúc mô hình thu nhỏ biến mất (vào cảnh phóng to; đặt lại khi sang phần bảo vệ răng) ---------- */
export const STAGE_ON = T.zoomIn + 0.4;
export const STAGE_OFF = T.zoomOut + 0.4;
export const RESET_OUT = E(14) - 0.1;
export const RESET_IN = S(15) + 0.2;
export const modelScale = (t: number) => {
  const zoom = t < T.zoomOut ? 1 - sm(t, T.zoomIn + 0.05, 0.5) : sm(t, T.zoomOut + 0.2, 0.6);
  const reset = sm(t, RESET_OUT, 0.4) * (1 - sm(t, RESET_IN, 0.6));
  return Math.max(0.0001, zoom * (1 - reset));
};
export const stageScale = (t: number) => {
  const a = sm(t, STAGE_ON, 0.7);
  const b = 1 - sm(t, STAGE_OFF - 0.3, 0.5);
  return t < STAGE_ON ? 0 : Math.max(0, a * b);
};

/* ---------- lỗ sâu: mức đi sâu 0..1 theo đường DECAY_PATH ---------- */
export const decayGrow = (t: number) => {
  if (t < T.hole) return 0;
  if (t < T.spread) return 0.3 * sm(t, T.hole, 0.9);
  if (t < T.toPulp) return 0.3 + 0.32 * sm(t, T.spread, 1.6);
  if (t < RESET_OUT) return 0.62 + 0.4 * sm(t, T.toPulp, 1.3);
  if (t < T.check) return 0;
  // lúc đi khám: một lỗ nhỏ vừa mới nhen
  return 0.24 * sm(t, T.detect - 0.2, 0.8) * (1 - sm(t, T.detect + 1.5, 0.6));
};









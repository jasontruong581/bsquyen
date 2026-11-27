/* Hành trình của viên thức ăn (mạch xuyên suốt video): vị trí, cỡ và tâm trạng theo thời gian, tính từ mốc lời đọc.
   Hàm thuần theo t; các bán kính ống (chỗ phình nhu động) cũng lấy vị trí viên thức ăn từ đây. */
import * as THREE from 'three';
import {ANUS_POS, COLON_CURVE, ESO_CURVE, MOUTH_C, MOUTH_CAVITY, SI_CURVE, STO_CURVE, THROAT, V} from './giai-phau';
import {S, T, clamp01, kf, sm, smooth} from './moc';

export type Tract = 'none' | 'eso' | 'sto' | 'si' | 'col';
export type Mood = 'vui' | 'tinh' | 'ngac';

/** Các mốc chuyển đoạn, giây */
export const B = {
  swallow: T.swallow + 0.4,
  esoIn: T.swallow + 0.9,
  esoOut: S(4),
  stoSettle: S(4) + 0.9,
  stoLeave: S(6) - 1.0,
  siIn: S(6) + 0.4,
  siOut: S(10),
  colIn: S(10) + 0.05,
  rectumRest: T.rectum + 1.4,
  exit: T.exit,
  gone: T.exit + 1.6,
};

const ESO_END = ESO_CURVE.getPointAt(1);
const STO_ENTER = STO_CURVE.getPointAt(0.12);
const MOUTH_REST = V(0, MOUTH_C.y - 0.13, 0.98);

const HOVER_Y = MOUTH_C.y + 1.95;

export type Bolus = {p: THREE.Vector3; s: number; tract: Tract; u: number; mood: Mood; face: boolean; chew: number; visible: boolean};

/** Tiến độ u trên từng đoạn ống */
const esoU = (t: number) => kf([[B.esoIn, 0], [B.esoOut, 1]], t);
const siU = (t: number) => kf([[B.siIn, 0], [T.pancreas + 1.5, 0.15], [T.zoomIn, 0.33], [S(9), 0.78], [B.siOut, 1]], t);
const colU = (t: number) =>
  kf(
    [
      [B.colIn, 0],
      [T.colon + 1.4, 0.22],
      [T.water + 1.8, 0.53],
      [T.water + 4.3, 0.72],
      [T.rectum + 0.2, 0.87],
      [B.rectumRest, 0.9],
      [B.exit, 0.9],
      [B.exit + 0.9, 1],
    ],
    t,
  );

export const bolusAt = (t: number): Bolus => {
  const out: Bolus = {p: new THREE.Vector3(), s: 0.5, tract: 'none', u: 0, mood: 'tinh', face: true, chew: 0, visible: true};
  // viên thức ăn tượng trưng cho cả bữa cơm: to ở miệng, thu nhỏ khi đi vào ống
  out.s = kf([[0, 0.5], [T.mouthIn + 1.1, 0.36], [B.swallow, 0.36], [B.esoIn + 0.3, 0.15], [B.esoOut - 0.3, 0.15], [B.stoSettle, 0.42], [B.stoLeave, 0.42], [B.siIn + 0.3, 0.17], [B.colIn, 0.19], [T.water + 3, 0.15]], t);
  if (t < T.mouthIn) {
    // nhảy tưng tưng phía trên miệng, chờ được lắp
    out.p.set(0.35 * Math.sin(t * 1.7), HOVER_Y + 0.4 * Math.abs(Math.sin(t * 3.4)), 1.1);
    out.mood = 'vui';
  } else if (t < T.mouthIn + 1.1) {
    const f = sm(t, T.mouthIn, 1.1);
    const g = f * f;
    out.p.set(0, HOVER_Y + (MOUTH_REST.y - HOVER_Y) * g, 1.1 + (MOUTH_REST.z - 1.1) * f);
    out.mood = 'vui';
  } else if (t < B.swallow) {
    // nhai: viên thức ăn bị ép dẹt theo nhịp răng
    const chewing = t > T.teeth - 0.3 && t < T.softBall + 0.2 ? 1 : 0;
    out.chew = chewing * (0.5 + 0.5 * Math.sin(t * 9));
    out.p.copy(MOUTH_REST).add(V(0.06 * Math.sin(t * 4.5) * chewing, -0.05 * out.chew, 0));
    out.mood = t > T.teeth ? 'tinh' : 'vui';
  } else if (t < B.esoIn) {
    const f = sm(t, B.swallow, B.esoIn - B.swallow);
    out.p.lerpVectors(MOUTH_REST, THROAT, f);
    out.p.z = MOUTH_REST.z + (THROAT.z - MOUTH_REST.z) * f;
  } else if (t < B.esoOut) {
    out.tract = 'eso';
    out.u = esoU(t);
    out.p.copy(ESO_CURVE.getPointAt(out.u));
  } else if (t < B.stoLeave) {
    out.tract = 'sto';
    if (t < B.stoSettle) {
      out.p.lerpVectors(ESO_END, STO_ENTER, sm(t, B.esoOut, B.stoSettle - B.esoOut));
      out.u = 0.12;
    } else {
      // nhào trộn trong thân dạ dày
      const u0 = 0.4 + 0.06 * sm(t, B.stoSettle, 8);
      const w = (t - B.stoSettle) * 3.2;
      out.p.copy(STO_CURVE.getPointAt(u0)).add(V(0.3 * Math.cos(w), 0.26 * Math.sin(w * 1.31), 0.12 * Math.sin(w * 0.7)));
      out.u = u0;
    }
    out.mood = t > T.acid - 0.2 && t < B.stoLeave ? 'ngac' : 'tinh';
  } else if (t < B.siIn) {
    out.tract = 'sto';
    out.u = 0.46 + 0.54 * smooth(clamp01((t - B.stoLeave) / (B.siIn - B.stoLeave)));
    out.p.copy(STO_CURVE.getPointAt(out.u));
  } else if (t < B.siOut) {
    out.tract = 'si';
    out.u = siU(t);
    out.p.copy(SI_CURVE.getPointAt(out.u));
  } else if (t < B.exit + 0.9) {
    out.tract = 'col';
    out.u = colU(t);
    out.p.copy(COLON_CURVE.getPointAt(out.u));
  } else {
    // ra khỏi hậu môn: trượt xuống rồi tan thành các tia sáng nhỏ
    out.tract = 'none';
    const f = clamp01((t - (B.exit + 0.9)) / 0.9);
    out.p.copy(ANUS_POS).add(V(0, -0.2 - 0.9 * f, 0.05));
    out.visible = t < B.gone;
  }
  // mặt chỉ có ở phần "viên cơm"; sang ruột già thì thành khối bã trơn
  out.face = t < S(9) && out.s > 0.3;
  if (t >= T.zoomIn + 0.4 && t < B.colIn - 0.2) out.visible = false;
  return out;
};

/** Vị trí viên thức ăn dọc ruột già và ruột non (cho chỗ phình nhu động) */
export const bolusU = (t: number, tract: Tract) => {
  const b = bolusAt(t);
  return b.tract === tract ? b.u : -1;
};

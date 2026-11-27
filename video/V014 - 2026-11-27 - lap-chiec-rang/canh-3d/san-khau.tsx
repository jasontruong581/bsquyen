/* "Sân khấu" phóng to vào men răng (cảnh 9-11): men là một bức tường khoáng chất (gạch xanh nhạt xếp sát nhau), mảng bám là vài mảng lầy nhầy tím,
   vi khuẩn bận rộn ăn đường rồi thải axit; axit rút từng chút khoáng ra khỏi tường (gạch nhỏ lại, các hạt khoáng bay đi); lặp lại nhiều lần thì hiện đốm trắng;
   nước bọt và flo trả khoáng về nên tường dày lại. Mô hình răng thu nhỏ biến mất trong lúc này (hanh-trinh.ts: modelScale/stageScale). */
import * as THREE from 'three';
import {ToonMesh} from '../../V005 - 2026-11-26 - phoi-tam-soat/canh-3d/chat-lieu';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {C} from './mau';
import {Bacterium} from './nhan-vat';
import {GEO, V} from './chung';
import {T, clamp01, sm, smooth, win} from './moc';
import {STAGE_SUGAR, stageScale} from './hanh-trinh';

const brickGeo = (w: number) => {
  const g = new RoundedBoxGeometry(w, 0.9, 0.8, 4, 0.14);
  g.deleteAttribute('uv');
  return g;
};
const BRICK_FULL = brickGeo(1.26);
const BRICK_HALF = brickGeo(0.62);

type Brick = {x: number; y: number; half: boolean; spot: boolean; i: number};
const BRICKS: Brick[] = (() => {
  const out: Brick[] = [];
  for (let r = 0; r < 4; r++) {
    const y = 1.35 - 0.9 * r;
    const xs = r % 2 === 0 ? [-1.95, -0.65, 0.65, 1.95] : [-2.28, -1.3, 0, 1.3, 2.28];
    xs.forEach((x) => {
      const half = Math.abs(x) > 2.2;
      const spot = (r === 1 && x === 0) || (r === 2 && Math.abs(x) === 0.65);
      out.push({x, y, half, spot, i: out.length});
    });
  }
  return out;
})();

/** Vị trí vi khuẩn trong cảnh, và viên gạch mỗi con nhắm tới */
const BACS = [
  {x: -2.0, y: 1.55, to: 5},
  {x: 1.9, y: 1.5, to: 7},
  {x: -2.1, y: -0.1, to: 9},
  {x: 2.1, y: -0.15, to: 12},
  {x: -1.0, y: -1.7, to: 14},
  {x: 1.15, y: -1.7, to: 16},
];
const JELLY = BACS.map((b, i) => ({x: b.x, y: b.y - 0.2, s: 0.75 + 0.05 * (i % 3)}));

const centerOf = (b: Brick) => V(b.x, b.y, 0.45);

/** Tỉ lệ mất khoáng của mỗi viên gạch theo thời gian: hai đợt axit, rồi được nước bọt và flo trả lại */
const lossOf = (b: Brick, t: number) => {
  const a = sm(t, T.leave, 2.0) * 0.45;
  const bb = sm(t, T.repeat + 0.4, 2.2) * (b.spot ? 0.55 : 0.12);
  const rec = sm(t, T.saliva + 0.3, 3.6);
  return (a + bb) * (1 - rec);
};

const MIN_N = 14;
const dirOf = (j: number) => V(Math.cos(j * 2.4), 0.6 + 0.6 * Math.sin(j * 1.9), 0.9 + 0.5 * Math.sin(j * 3.1)).normalize();
const attackWin = (t: number) => Math.max(win(t, T.acidWall - 0.1, T.leave + 1.7, 0.3), win(t, T.repeat - 0.1, T.spot + 1.8, 0.3));

export const Stage = ({t}: {t: number}) => {
  const sc = stageScale(t);
  if (sc < 0.01) return null;
  const att = attackWin(t);
  const rec = t > T.saliva - 0.2 ? 1 : 0;
  const els: JSX.Element[] = [];

  /* tường gạch */
  BRICKS.forEach((b) => {
    const loss = lossOf(b, t);
    const s = 1 - 0.3 * loss;
    const white = b.spot ? sm(t, T.spot - 0.2, 1.0) * (1 - sm(t, T.saliva + 0.8, 2.6)) : 0;
    const mint = sm(t, T.flo, 0.8) * (1 - sm(t, T.stop + 0.6, 1.8)) * 0.5;
    const g = b.half ? BRICK_HALF : BRICK_FULL;
    els.push(
      <group key={`b${b.i}`} position={[b.x, b.y, -0.4]} scale={[s, s, 1]}>
        <ToonMesh geometry={g} color={C.brick} rimColor={C.brickRim} outline={4} castShadow />
        {white > 0.01 && <ToonMesh geometry={g} color={C.white} opacity={white} outline={0} scale={1.012} renderOrder={4} />}
        {mint > 0.01 && <ToonMesh geometry={g} color={C.flo} opacity={mint} outline={0} scale={1.014} renderOrder={5} />}
      </group>,
    );
  });

  /* mảng bám (lầy nhầy tím) và vi khuẩn */
  JELLY.forEach((j, i) => {
    const g = sm(t, T.zoomIn + 0.8 + 0.1 * i, 0.5);
    els.push(<ToonMesh key={`j${i}`} geometry={GEO.sphere} color={C.plaque} rimColor={C.bacteria} opacity={0.62} rim={1} outline={0} position={[j.x, j.y - 0.08, 0.32]} scale={[1.0 * j.s * g, 0.62 * j.s * g, 0.3 * j.s * g]} renderOrder={5} />);
  });
  BACS.forEach((b, i) => {
    const g = sm(t, T.zoomIn + 1.1 + 0.12 * i, 0.5);
    const calm = t > T.stop + 0.4 ? 0.82 : 1;
    const bob = 0.07 * Math.sin(t * 2.1 + i * 1.3);
    els.push(<Bacterium key={`c${i}`} t={t} p={V(b.x, b.y + 0.3 + bob, 0.75)} s={0.37 * g * calm} ph={i * 1.3} chew={att} mood="trung" />);
  });

  /* giọt axit bay từ vi khuẩn xuống tường trong hai đợt tấn công */
  if (att > 0.02) {
    BACS.forEach((b, i) => {
      for (let k = 0; k < 2; k++) {
        const f = (t * 0.9 + i * 0.31 + k * 0.5) % 1;
        const to = centerOf(BRICKS[b.to]);
        const p = V(b.x, b.y + 0.2, 0.9).lerp(to, smooth(f));
        p.y += 0.35 * Math.sin(Math.PI * f);
        els.push(<ToonMesh key={`a${i}${k}`} geometry={GEO.dodeca} color={C.acid} rimColor={C.bacteriaDark} position={[p.x, p.y, p.z]} rotation={[t * 3 + i, t * 2 + k, 0]} scale={0.15 * Math.sin(Math.PI * f) * att} outline={2} />);
      }
    });
  }

  /* hạt khoáng bay ra khỏi tường (khi axit tấn công) rồi bay về (khi được sửa) */
  for (let j = 0; j < MIN_N; j++) {
    const b = BRICKS[(j * 3 + 1) % BRICKS.length];
    const c = centerOf(b);
    const d = dirOf(j);
    const outs = [T.leave + 0.15 * j, T.repeat + 0.5 + 0.12 * j];
    outs.forEach((t0, k) => {
      const f = clamp01((t - t0) / 1.9);
      if (f <= 0 || f >= 1) return;
      const p = c.clone().addScaledVector(d, 2.4 * smooth(f));
      els.push(<ToonMesh key={`m${j}o${k}`} geometry={GEO.octa} color={C.mineral} rimColor={C.brickRim} position={[p.x, p.y, p.z]} rotation={[t * 3 + j, t * 2, 0]} scale={0.2 * Math.sin(Math.PI * f)} outline={2} />);
    });
    const tr = T.saliva + 0.4 + 0.16 * j;
    const fr = clamp01((t - tr) / 1.8);
    if (fr > 0 && fr < 1) {
      const p = c.clone().addScaledVector(d, 2.2 * (1 - smooth(fr)));
      els.push(<ToonMesh key={`m${j}r`} geometry={GEO.octa} color={C.mineral} rimColor={C.brickRim} position={[p.x, p.y, p.z]} rotation={[t * 3 + j, t * 2, 0]} scale={0.2 * Math.sin(Math.PI * fr)} outline={2} />);
    }
  }

  /* nước bọt (giọt xanh nhạt) rơi xuống, flo (sao xanh lá) lấp lánh trên tường */
  if (rec) {
    const fall = win(t, T.saliva - 0.1, T.stop + 1.4, 0.4);
    for (let i = 0; i < 9; i++) {
      const f = (((t - T.saliva) * 0.42 + i * 0.113) % 1 + 1) % 1;
      els.push(<ToonMesh key={`s${i}`} geometry={GEO.sphere} color={C.saliva} rimColor="#5FA9D8" position={[-2.4 + (i * 0.6) % 4.8, 3.4 - f * 5.6, 0.95]} scale={[0.17 * fall, 0.24 * fall, 0.17 * fall]} outline={2} />);
    }
    const fl = win(t, T.flo - 0.1, T.stop + 1.8, 0.4);
    for (let i = 0; i < 10; i++) {
      const a = i * 2.39;
      const x = -2.2 + ((i * 0.8 + t * 0.35) % 4.4);
      const y = 2.2 - ((i * 0.97) % 4.4) + 0.2 * Math.sin(t * 2 + a);
      els.push(<ToonMesh key={`f${i}`} geometry={GEO.octa} color={C.flo} rimColor={C.floDark} position={[x, y, 0.8]} rotation={[t * 2 + a, t * 3, 0]} scale={[0.17 * fl, 0.28 * fl, 0.17 * fl]} outline={2} />);
    }
  }

  /* vòng đánh dấu đốm trắng */
  const ring = win(t, T.spot - 0.1, T.early + 1.8, 0.4);
  if (ring > 0.02) {
    els.push(
      <group key="ring" position={[0, 0.05, 0.15]} scale={[1.55 + 0.05 * Math.sin(t * 5), 0.95 + 0.04 * Math.sin(t * 5), 1]}>
        <ToonMesh geometry={GEO.ring} color={C.spark} rimColor="#B58A00" scale={ring} outline={2} />
      </group>,
    );
  }

  /* vài vụn đường vi khuẩn được "mời" khi đợt hai bắt đầu */
  for (let k = 0; k < 3; k++) {
    const t0 = T.repeat + 0.1 + 0.35 * k;
    const f = clamp01((t - t0) / 1.0);
    if (f <= 0 || f >= 1) continue;
    const bac = BACS[[1, 2, 3][k]];
    const p = STAGE_SUGAR.clone().lerp(V(bac.x, bac.y + 0.5, 0.9), smooth(f));
    p.y += 0.6 * Math.sin(Math.PI * f);
    els.push(<ToonMesh key={`u${k}`} geometry={GEO.cube} color={C.sugar} rimColor={C.sugarRim} position={[p.x, p.y, p.z]} rotation={[t * 3, t * 2, 0]} scale={0.2} outline={2} />);
  }

  return <group scale={sc}>{els}</group>;
};


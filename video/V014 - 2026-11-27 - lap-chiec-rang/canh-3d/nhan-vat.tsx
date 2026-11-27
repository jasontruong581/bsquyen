/* Nhân vật và đồ vật của V014, dựng từ khối cơ bản: viên đường (nhân vật xuyên suốt), vi khuẩn, bàn chải, gương nha khoa, tuýp kem, sợi chỉ.
   Ranh giới giọng điệu: viên đường chỉ là thức ăn, vi khuẩn bận rộn chứ không hả hê; không nhân vật nào cười khi răng bị tổn thương. */
import {useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {ToonMesh} from '../../V005 - 2026-11-26 - phoi-tam-soat/canh-3d/chat-lieu';
import {C} from './mau';
import {Face, GEO, V, type Mood} from './chung';

/* ---------- viên đường ---------- */
export const SugarCube = ({t, p, s = 0.9, mood = 'vui', rot = 0, squash = 1, tilt = 0}: {t: number; p: THREE.Vector3 | [number, number, number]; s?: number; mood?: Mood; rot?: number; squash?: number; tilt?: number}) => {
  if (s < 0.01) return null;
  const pos = Array.isArray(p) ? p : [p.x, p.y, p.z];
  const wob = 1 + 0.03 * Math.sin(t * 6);
  return (
    <group position={[pos[0], pos[1], pos[2]]} rotation={[0, rot, tilt]} scale={[s * wob / squash, s * squash / wob, s * wob]}>
      <ToonMesh geometry={GEO.cube} color={C.sugar} rimColor={C.sugarRim} outline={4} castShadow />
      <Face t={t} mood={mood} z={0.52} scale={0.62} />
      {[[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5]].map(([x, y], i) => (
        <ToonMesh key={i} geometry={GEO.octa} color={C.mineral} position={[x, y, 0.5]} rotation={[t * 2 + i, t * 3, 0]} scale={0.07 * (0.7 + 0.3 * Math.sin(t * 5 + i * 2))} outline={0} depthTest={false} renderOrder={31} />
      ))}
    </group>
  );
};

/* ---------- vi khuẩn: khối tròn tím, bận rộn, không cười hả hê ---------- */
export const Bacterium = ({t, p, s = 0.3, mood = 'trung', ph = 0, chew = 0, dark = false}: {t: number; p: THREE.Vector3; s?: number; mood?: Mood; ph?: number; chew?: number; dark?: boolean}) => {
  if (s < 0.005) return null;
  const q = 1 + 0.07 * Math.sin(t * 4 + ph) + 0.12 * chew * Math.abs(Math.sin(t * 9 + ph));
  return (
    <group position={[p.x, p.y, p.z]} scale={[s * q, (s * 0.88) / q, s]}>
      <ToonMesh geometry={GEO.sphere} color={dark ? C.bacteriaDark : C.bacteria} rimColor={C.bacteriaDark} outline={4} depthTest />
      {[[-0.55, 0.78], [0.55, 0.78]].map(([x, y], i) => (
        <ToonMesh key={i} geometry={GEO.octa} color={C.bacteriaDark} position={[x, y, 0.1]} scale={[0.16, 0.34, 0.16]} rotation={[0, 0, x > 0 ? -0.5 : 0.5]} outline={2} />
      ))}
      <Face t={t + ph} mood={mood} z={0.78} scale={0.78} />
    </group>
  );
};

/* ---------- bàn chải đánh răng: nhân vật hùng dũng, cán dài, đầu có lông ---------- */
const BRISTLES = (() => {
  const gs: THREE.BufferGeometry[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 3; col++) {
      const g = new THREE.CylinderGeometry(0.06, 0.06, 0.34, 6);
      g.rotateZ(Math.PI / 2);
      g.translate(0.55, -0.55 + row * 0.22, -0.14 + col * 0.14);
      g.deleteAttribute('uv');
      gs.push(g);
    }
  return mergeGeometries(gs)!;
})();
const BRUSH_HANDLE = (() => {
  const g = new THREE.CapsuleGeometry(0.3, 2.9, 6, 14);
  g.deleteAttribute('uv');
  return g;
})();
const BRUSH_HEAD = (() => {
  const g = new THREE.CapsuleGeometry(0.28, 1.0, 6, 12);
  g.translate(0, 0, 0);
  g.deleteAttribute('uv');
  return g;
})();
export const Brush = ({t, p, rot = 0, s = 1, mood = 'vui'}: {t: number; p: [number, number, number]; rot?: number; s?: number; mood?: Mood}) => (
  <group position={p} rotation={[0, 0, rot]} scale={s}>
    <ToonMesh geometry={BRUSH_HANDLE} color={C.brushBlue} rimColor="#1B6FA3" outline={4} castShadow />
    <group position={[0.14, 2.3, 0]} scale={[1, 1, 0.8]}>
      <ToonMesh geometry={BRUSH_HEAD} color={C.flo} rimColor={C.floDark} outline={4} />
    </group>
    <group position={[0.14, 2.3, 0]}>
      <ToonMesh geometry={BRISTLES} color={C.brushBristle} outline={2} />
    </group>
    <group position={[0, -0.2, 0.28]}>
      <Face t={t} mood={mood} z={0} scale={0.55} />
    </group>
  </group>
);

/* ---------- gương nha khoa (đi khám) ---------- */
const MIRROR_RING = new THREE.TorusGeometry(0.62, 0.1, 10, 36);
const MIRROR_DISC = new THREE.CylinderGeometry(0.6, 0.6, 0.06, 30);
MIRROR_DISC.rotateX(Math.PI / 2);
const MIRROR_STICK = new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8);
export const Mirror = ({t, p, rot = 0, s = 1}: {t: number; p: [number, number, number]; rot?: number; s?: number}) => (
  <group position={p} rotation={[0, 0, rot]} scale={s}>
    <ToonMesh geometry={MIRROR_STICK} color={C.metal} rimColor="#5A6B7C" position={[0, -1.4, 0]} outline={3} />
    <ToonMesh geometry={MIRROR_RING} color={C.metal} rimColor="#5A6B7C" outline={3} />
    <ToonMesh geometry={MIRROR_DISC} color={C.mirror} outline={0} />
    <ToonMesh geometry={GEO.octa} color={C.white} position={[-0.25 + 0.5 * Math.sin(t * 2), 0.25, 0.08]} rotation={[0, 0, t * 2]} scale={[0.1, 0.2, 0.05]} outline={0} />
  </group>
);

/* ---------- tuýp kem đánh răng (không có chữ hay nhãn hiệu): đứng trên nắp vặn xanh, thân thuôn dẹt, đuôi ép mí bản rộng có vạch, sọc xanh ---------- */
const TUBE_BODY = (() => {
  const g = new THREE.CylinderGeometry(0.64, 0.5, 2.0, 24);
  g.deleteAttribute('uv');
  return g;
})();
const TUBE_SHOULDER = (() => {
  const g = new THREE.CylinderGeometry(0.5, 0.26, 0.4, 24);
  g.deleteAttribute('uv');
  return g;
})();
const TUBE_CAP = (() => {
  const g = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
  g.deleteAttribute('uv');
  return g;
})();
export const PasteTube = ({p, rot = 0, s = 1}: {p: [number, number, number]; rot?: number; s?: number}) => (
  <group position={p} rotation={[0, 0, rot]} scale={s}>
    <group scale={[1, 1, 0.5]}>
      <ToonMesh geometry={TUBE_BODY} color={C.white} rimColor={C.sugarRim} position={[0, 0.3, 0]} outline={4} />
      <ToonMesh geometry={TUBE_SHOULDER} color={C.white} rimColor={C.sugarRim} position={[0, -0.9, 0]} outline={4} />
    </group>
    <ToonMesh geometry={TUBE_CAP} color={C.flo} rimColor={C.floDark} position={[0, -1.35, 0]} outline={3} />
    <ToonMesh geometry={GEO.cube} color={C.white} rimColor={C.sugarRim} position={[0, 1.38, 0]} scale={[1.55, 0.34, 0.16]} outline={3} />
    {[-0.45, 0, 0.45].map((x) => (
      <ToonMesh key={x} geometry={GEO.cube} color={C.sugarRim} position={[x, 1.38, 0.09]} scale={[0.06, 0.24, 0.03]} outline={0} />
    ))}
    <ToonMesh geometry={GEO.cube} color={C.flo} position={[0, 0.2, 0.31]} scale={[1.14, 0.55, 0.05]} outline={0} />
    <ToonMesh geometry={GEO.cube} color={C.floDark} position={[0, 0.2, 0.34]} scale={[0.6, 0.1, 0.04]} outline={0} />
  </group>
);
/* ---------- sợi chỉ nha khoa: dây trắng kéo căng giữa hai tay cầm, luồn vào kẽ răng ---------- */
export const Floss = ({o, k = 1}: {o: number; k?: number}) => {
  const geo = useMemo(() => {
    const pts = [V(3.2, 3.2, 1.5), V(2.45, 2.2 + o, 0.9), V(2.05, 1.5 + o, 0.55), V(2.05, 1.5 + o, -0.55), V(2.45, 2.2 + o, -0.9), V(3.2, 3.2, -1.5)];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 40, 0.075, 6, false);
  }, [o]);
  return (
    <group scale={k}>
      <ToonMesh geometry={geo} color={C.white} rimColor={C.sugarRim} outline={2} />
      {[[3.2, 3.2, 1.5], [3.2, 3.2, -1.5]].map((q, i) => (
        <ToonMesh key={i} geometry={GEO.cube} color={C.flo} position={[q[0] + 0.1, q[1] + 0.15, q[2]]} scale={[0.45, 0.45, 0.3]} outline={3} />
      ))}
    </group>
  );
};




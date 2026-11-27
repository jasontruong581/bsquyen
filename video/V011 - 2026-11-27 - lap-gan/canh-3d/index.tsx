/* V011 "Lắp lá gan" (video 3D dài): dựng bằng @remotion/three (three.js), toàn bộ hình khối sinh bằng code (xem giai-phau.ts),
   tô bóng toon + viền đen + bóng đổ, camera xoay liên tục quanh mô hình (may-quay.ts), nhãn 2D có đường chỉ (lop-phu.tsx).
   Dùng lại chất liệu toon của V005 (chat-lieu.tsx). */
import {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {useFonts} from '../../src/common/fonts';
import {FPS} from '../../src/timeline';
import {ToonMesh, shared, HEIGHT, WIDTH} from '../../V005 - 2026-11-26 - phoi-tam-soat/canh-3d/chat-lieu';
import {
  ARTERY, BILE, CELL_R, GB_FLOW, GB_NECK, GB_QUAT, HEPATIC, HEX_H, HEX_R, LIVER_C, LL, LOB_POS, MAX_DEPTH, PORTAL, RL, TRIAD_R, V,
  buildCells, buildCystic, buildGallbladder, buildHexRing, buildHexWalls, buildIntestine, buildLobe, buildRibs, buildSinusoids, hexCorner, levelGeoms, lobePoint, triadPos, type Seg,
} from './giai-phau';
import {cameraAt} from './may-quay';
import {Bubbles, GanOverlay} from './lop-phu';
import {T, kf, pop, sm, smooth, clamp01, timeline} from './moc';

export const id = 'lap-gan';
export const durationInFrames = Math.ceil(timeline.total * FPS);

/* Màu ghi theo mã sRGB như bảng màu CSS. R3F bật quản lý màu của three nên mã hex trong chuỗi bị đổi sang tuyến tính (tối đi khi canvas xuất thẳng); aw đảo ngược phép đổi đó để màu hiện đúng mã đã ghi. */
const linearToSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
const raw = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(255 * linearToSrgb(v / 255)));
  return '#' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
};
const P0 = {
  liverR: '#F4745B',
  liverL: '#F78C66',
  rib: '#F4F6FA',
  portal: '#9B8CFF',
  artery: '#FF5A64',
  hep: '#4DB4FF',
  bile: '#4FE08C',
  gb: '#7BE69B',
  gut: '#FFC8B8',
  cell: '#FFB894',
  sugar: '#FFD23C',
  toxin: '#A98BFF',
  wall: '#FFE3D6',
  white: '#FFFFFF',
  dark: '#2b0b0e',
};
const C = Object.fromEntries(Object.entries(P0).map(([k, v]) => [k, raw(v)])) as typeof P0;

const canals = () => {
  const gs: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 6; k++) {
    const dir = hexCorner(k, 1).normalize();
    const side = V(dir.z, 0, -dir.x);
    for (const lat of [-0.23, 0.23]) {
      const a = dir.clone().multiplyScalar(0.55).addScaledVector(side, lat);
      const b = dir.clone().multiplyScalar(HEX_R * 0.93).addScaledVector(side, lat);
      const g = new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 6, 0.045, 6, false);
      g.deleteAttribute('uv');
      gs.push(g);
    }
  }
  return mergeGeometries(gs)!;
};

const GEO = {
  rl: buildLobe('R'),
  ll: buildLobe('L'),
  ribs: buildRibs(),
  portal: levelGeoms(PORTAL),
  artery: levelGeoms(ARTERY),
  bile: levelGeoms(BILE),
  hepatic: levelGeoms(HEPATIC),
  gb: buildGallbladder(),
  cystic: buildCystic(),
  gut: buildIntestine(),
  walls: buildHexWalls(),
  ringTop: buildHexRing(HEX_R),
  ringNb: buildHexRing(HEX_R, 0.1),
  cells: buildCells(),
  sinus: buildSinusoids(),
  canals: canals(),
  sphere: new THREE.SphereGeometry(1, 22, 16),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 18, 1),
  dodeca: new THREE.DodecahedronGeometry(1),
  octa: new THREE.OctahedronGeometry(1),
  box: new THREE.BoxGeometry(1, 1, 1),
  smile: new THREE.TorusGeometry(0.4, 0.07, 8, 28, Math.PI),
  ring: new THREE.TorusGeometry(0.14, 0.05, 8, 20),
  mouthOpen: new THREE.CircleGeometry(0.42, 24, Math.PI, Math.PI),
  disc: new THREE.CircleGeometry(0.12, 16),
};

const basic = (color: string) => new THREE.MeshBasicMaterial({color: raw(color), toneMapped: false});
const DOT = {
  portal: basic('#B7AEFF'),
  artery: basic('#FF8A8F'),
  hep: basic('#8AD0FF'),
  bile: basic('#B6F29A'),
  blood: basic('#FF4B55'),
  confetti: ['#FF8A1F', '#FFD23C', '#2FC46B', '#1F8FE8', '#FF5C8A', '#7B4FE0'].map(basic),
};

/* ---------- hạt chảy dọc các ống ---------- */
type Flow = {seg: Seg; phase: number; speed: number; rev: boolean};
const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const mkFlow = (segs: Seg[], n: number, seed: number, revBranches: boolean): Flow[] => {
  const rand = mulberry(seed);
  return Array.from({length: n}, (_, i) => {
    const seg = i < Math.ceil(n / 3) ? segs[0] : segs[Math.floor(rand() * segs.length)];
    return {seg, phase: rand(), speed: 0.3 + rand() * 0.15, rev: revBranches && seg.depth > 0};
  });
};
const FLOWS = {
  portal: mkFlow(PORTAL, 24, 1, false),
  artery: mkFlow(ARTERY, 18, 2, false),
  hep: mkFlow(HEPATIC, 20, 3, true),
  bile: mkFlow(BILE, 16, 4, true),
};
const LEVEL_GAP = 0.38;
const levelP = (t: number, t0: number, depth: number) => sm(t, t0 + depth * LEVEL_GAP, 0.6);

const Flows = ({flows, mat, t, t0, op}: {flows: Flow[]; mat: THREE.Material; t: number; t0: number; op: number}) => {
  if (op < 0.9) return null;
  return (
    <>
      {flows.map((f, i) => {
        if (levelP(t, t0, f.seg.depth) < 0.99) return null;
        const u = (f.phase + t * f.speed) % 1;
        const p = f.seg.curve.getPointAt(f.rev ? 1 - u : u);
        const r = Math.max(0.05, f.seg.r0 * 0.42);
        return <mesh key={i} geometry={GEO.sphere} material={mat} position={p} scale={r} />;
      })}
    </>
  );
};

/* ---------- một hệ ống: các cấp mọc dần từ một điểm gốc ---------- */
const Tree = ({levels, color, op, t, t0, pivot}: {levels: (THREE.BufferGeometry | null)[]; color: string; op: number; t: number; t0: number; pivot: THREE.Vector3}) => (
  <>
    {levels.slice(0, MAX_DEPTH + 1).map((g, k) => {
      if (!g) return null;
      const s = levelP(t, t0, k);
      return (
        <group key={k} position={[pivot.x * (1 - s), pivot.y * (1 - s), pivot.z * (1 - s)]} scale={Math.max(s, 0.0001)} visible={s > 0.01}>
          <ToonMesh geometry={g} color={color} opacity={op} outline={k <= 1 ? 4 : 3} />
        </group>
      );
    })}
  </>
);

const CameraRig = ({t}: {t: number}) => {
  const {camera} = useThree();
  const c = cameraAt(t);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.copy(c.eye);
  cam.quaternion.copy(c.quat);
  cam.fov = c.fov;
  cam.near = 0.1;
  cam.far = 140;
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return null;
};

/* ---------- gương mặt lém lỉnh của lá gan ---------- */
type Mood = 'tinh' | 'ngac' | 'vui' | 'cuoi';
const moodAt = (t: number): Mood => (t >= T.party ? 'cuoi' : t >= T.regrow ? 'vui' : t >= T.cut - 0.3 ? 'ngac' : 'tinh');
const EYE_L = lobePoint('R', -0.3, 0.3);
const EYE_R = lobePoint('R', 0.22, 0.3);
const MOUTH = lobePoint('R', -0.04, -0.12);

const Face = ({t, vis}: {t: number; vis: number}) => {
  if (vis < 0.02) return null;
  const mood = moodAt(t);
  const blink = (t % 3.3) < 0.13 ? 0.12 : 1;
  const big = mood === 'ngac' ? 1.18 : 1;
  const gx = 0.06 * Math.sin(t * 1.3);
  const gy = 0.04 * Math.sin(t * 0.9 + 1);
  const eye = (p: THREE.Vector3, key: string) => (
    <group key={key} position={[p.x, p.y, p.z + 0.04]} scale={vis}>
      <ToonMesh geometry={GEO.sphere} color={C.white} scale={[0.34 * big, 0.42 * big * blink, 0.18]} outline={4} />
      <ToonMesh geometry={GEO.sphere} color={raw("#101820")} position={[gx, gy - 0.02, 0.17]} scale={[0.15, 0.17 * Math.max(blink, 0.3), 0.06]} outline={0} />
    </group>
  );
  const m = MOUTH;
  return (
    <>
      {eye(EYE_L, 'l')}
      {eye(EYE_R, 'r')}
      <group position={[m.x, m.y, m.z + 0.06]} scale={vis}>
        {mood === 'tinh' && <ToonMesh geometry={GEO.smile} color={C.dark} rotation={[0, 0, Math.PI + 0.22]} scale={[0.8, 0.8, 1]} outline={0} />}
        {mood === 'ngac' && (
          <>
            <ToonMesh geometry={GEO.sphere} color={C.dark} scale={[0.17, 0.22, 0.05]} outline={0} />
          </>
        )}
        {(mood === 'vui' || mood === 'cuoi') && (
          <>
            <ToonMesh geometry={GEO.mouthOpen} color={C.dark} scale={mood === 'cuoi' ? [1.1, 1.1, 1] : [0.8, 0.8, 1]} position={[0, 0.1, 0]} doubleSide outline={0} />
            <ToonMesh geometry={GEO.sphere} color={raw("#FF7B8E")} scale={[0.2, 0.1, 0.05]} position={[0, -0.2 * (mood === 'cuoi' ? 1.1 : 0.8) + 0.1, 0.02]} outline={0} />
          </>
        )}
      </group>
    </>
  );
};

/* ---------- tiểu thuỳ lục giác (phóng to vào trong gan) ---------- */
const Lobule = ({t}: {t: number}) => {
  const op = kf(
    [
      [T.zoomIn + 0.4, 0],
      [T.lobule + 0.6, 1],
      [T.pullBack + 0.3, 1],
      [T.pullBack + 1.8, 0],
    ],
    t,
  );
  if (op < 0.01) return null;
  const sc = Math.max(0.01, pop(t, T.lobule, 0.7) * (1 - 0.4 * sm(t, T.pullBack + 0.3, 1.5)));
  const cellOp = op * (1 - 0.6 * sm(t, T.bile, 0.5));
  const canalOp = op * sm(t, T.bile, 0.6);
  const hi = (a: number, d = 1.9) => 1 + 0.45 * Math.sin(Math.PI * clamp01((t - a) / d)) ** 2 * (t >= a && t <= a + d ? 1 : 0);
  const hiV = hi(T.triadV, 1.5);
  const hiA = hi(T.triadA, 1.4);
  const hiB = hi(T.triadB, 1.4);
  const hiC = hi(T.center, 1.8);
  const hexPulse = 1 + 0.04 * Math.sin(Math.PI * clamp01((t - (T.lobule + 2.4)) / 1.0)) ** 2;
  const dirOf = (k: number) => hexCorner(k, 1).normalize();
  const els: JSX.Element[] = [];

  // máu chảy từ góc về tâm
  if (t > T.flow) {
    for (let k = 0; k < 6; k++)
      for (let j = 0; j < 3; j++) {
        const f = (j / 3 + k * 0.13 + (t - T.flow) * 0.28) % 1;
        const r = HEX_R * 0.9 * (1 - f);
        if (r < 0.15) continue;
        const d = dirOf(k);
        els.push(<mesh key={`b${k}${j}`} geometry={GEO.sphere} material={DOT.blood} position={[d.x * r, 0.02, d.z * r]} scale={0.11 * Math.min(1, r / 0.5)} />);
      }
  }
  // máu đi lên theo tĩnh mạch trung tâm
  if (t > T.center - 0.6) {
    for (let j = 0; j < 5; j++) {
      const f = (j / 5 + (t - T.center) * 0.4) % 1;
      els.push(<mesh key={`c${j}`} geometry={GEO.sphere} material={DOT.hep} position={[0, -0.95 + f * 2.0, 0]} scale={0.13} />);
    }
  }
  // đường tích trữ: hạt đường vàng
  for (let k = 0; k < 6; k++)
    for (let i = 2; i <= 3; i++) {
      const at = T.sugar + k * 0.1 + (i - 2) * 0.07;
      if (t < at) continue;
      const d = dirOf(k);
      const side = V(d.z, 0, -d.x);
      const p = d.clone().multiplyScalar(CELL_R[i]).addScaledVector(side, i === 2 ? 0.23 : -0.23);
      els.push(<ToonMesh key={`s${k}${i}`} geometry={GEO.sphere} color={C.sugar} position={[p.x, 0.58, p.z]} scale={0.12 * pop(t, at, 0.4) * (1 + 0.1 * Math.sin(t * 6 + k))} outline={3} />);
    }
  // lọc: chất lạ (tím) đi vào hàng tế bào và biến mất
  if (t > T.filter && t < T.filter + 3.3) {
    for (let k = 0; k < 6; k++)
      for (let j = 0; j < 2; j++) {
        const f = (j * 0.5 + k * 0.07 + (t - T.filter) * 0.38) % 1;
        const r = HEX_R * 0.95 * (1 - f * 0.65);
        const s = 0.14 * (1 - smooth(clamp01((f - 0.42) / 0.2)));
        if (s < 0.01) continue;
        const d = dirOf(k);
        els.push(<ToonMesh key={`x${k}${j}`} geometry={GEO.dodeca} color={C.toxin} position={[d.x * r, 0.02, d.z * r]} rotation={[t * 3 + k, t * 2, 0]} scale={s} outline={3} />);
      }
  }
  // mật: giọt xanh chảy ngược chiều máu, từ giữa ra các góc
  if (t > T.bile + 0.4 && t < T.pullBack + 1.4) {
    for (let k = 0; k < 6; k++)
      for (let j = 0; j < 2; j++) {
        const f = (j * 0.5 + k * 0.09 + (t - T.bile) * 0.32) % 1;
        const r = 0.55 + f * (HEX_R * 0.93 - 0.55);
        const d = dirOf(k);
        const side = V(d.z, 0, -d.x);
        const p = d.clone().multiplyScalar(r).addScaledVector(side, j === 0 ? -0.23 : 0.23);
        els.push(<mesh key={`m${k}${j}`} geometry={GEO.sphere} material={DOT.bile} position={[p.x, 0.0, p.z]} scale={0.1} />);
      }
  }

  return (
    <group position={[LOB_POS.x, LOB_POS.y, LOB_POS.z]} scale={sc * hexPulse}>
      <ToonMesh geometry={GEO.walls} color={C.wall} opacity={0.3 * op} rim={op} doubleSide outline={0} renderOrder={2} />
      <group position={[0, HEX_H / 2, 0]}>
        <ToonMesh geometry={GEO.ringTop} color={C.white} opacity={op} outline={3} />
      </group>
      <group position={[0, -HEX_H / 2 + 0.09, 0]}>
        <ToonMesh geometry={GEO.ringTop} color={C.white} opacity={op} outline={3} />
      </group>
      {Array.from({length: 6}, (_, k) => {
        const a = (Math.PI / 180) * (30 + 60 * k);
        const d = Math.sqrt(3) * HEX_R;
        return (
          <group key={k} position={[d * Math.sin(a), 0, d * Math.cos(a)]}>
            <group position={[0, HEX_H / 2, 0]}>
              <ToonMesh geometry={GEO.ringNb} color={C.white} opacity={0.5 * op} outline={0} />
            </group>
            <group position={[0, -HEX_H / 2 + 0.09, 0]}>
              <ToonMesh geometry={GEO.ringNb} color={C.white} opacity={0.5 * op} outline={0} />
            </group>
          </group>
        );
      })}
      <ToonMesh geometry={GEO.cells} color={C.cell} opacity={cellOp} outline={3} />
      <ToonMesh geometry={GEO.sinus} color={raw("#B82430")} opacity={op} outline={0} />
      {canalOp > 0.01 && <ToonMesh geometry={GEO.canals} color={C.bile} opacity={canalOp} outline={0} />}
      <ToonMesh geometry={GEO.cyl} color={C.hep} opacity={op} position={[0, 0, 0]} scale={[0.27 * hiC, 2.0, 0.27 * hiC]} outline={4} />
      {Array.from({length: 6}, (_, k) => (
        <group key={k}>
          {(['v', 'a', 'b'] as const).map((part) => {
            const p = triadPos(k, part);
            const r = TRIAD_R[part] * (part === 'v' ? hiV : part === 'a' ? hiA : hiB);
            const col = part === 'v' ? C.portal : part === 'a' ? C.artery : C.bile;
            return <ToonMesh key={part} geometry={GEO.cyl} color={col} opacity={op} position={[p.x, 0, p.z]} scale={[r, 1.55, r]} outline={3} />;
          })}
        </group>
      ))}
      {els}
    </group>
  );
};

/* ---------- toàn cảnh ---------- */
const FLOOR_Y = -5.4;
const PIVOT = V(0.3, -0.8, 0);

const Scene = ({t}: {t: number}) => {
  shared.uTime.value = t;
  shared.uLamp.value = 0;
  shared.uFogK.value = 0;

  /* cắt rồi lớn lại: tỉ lệ tuyến tính 0,72 ứng với khoảng một phần ba khối lượng */
  const cut = sm(t, T.cut, 0.3);
  const regrow = t >= T.regrow ? pop(t, T.regrow, 1.3) : 0;
  const mass = t < T.regrow ? 1 - 0.28 * cut : 0.72 + 0.28 * regrow;
  const breath = 1 + 0.014 * Math.sin((2 * Math.PI * t) / 2.2);
  const hop = t >= T.party ? Math.abs(Math.sin((t - T.party) * 4)) * 0.18 * Math.min(1, (t - T.party) / 0.3) : 0;
  const k = mass * breath;
  const asm = {scale: k, position: [PIVOT.x * (1 - k), PIVOT.y * (1 - k) + hop, PIVOT.z * (1 - k)] as [number, number, number]};

  /* gan: đặc → mờ (để thấy mạch) → ẩn khi vào tiểu thuỳ → mờ → đặc */
  const liverOp = kf(
    [
      [T.ghost, 1],
      [T.ghost + 0.9, 0.3],
      [T.zoomIn + 0.2, 0.3],
      [T.zoomIn + 1.5, 0],
      [T.pullBack + 0.6, 0],
      [T.pullBack + 2.0, 0.3],
      [T.solid, 0.3],
      [T.solid + 1.0, 1],
    ],
    t,
  );
  const ghostK = clamp01((1 - liverOp) / 0.7);
  const solidLiver = liverOp > 0.98;

  const dropP = clamp01((t - T.liverDrop) / 0.7);
  const land = t - (T.liverDrop + 0.7);
  const squash = land > 0 ? 0.14 * Math.exp(-6 * land) * Math.cos(14 * land) : 0;
  const dropY = t < T.liverDrop ? 7 : 7 * (1 - smooth(dropP)) ** 2;
  const lobeL = t < T.leftLobe ? 0 : pop(t, T.leftLobe, 0.6);

  const faceVis = sm(t, T.liverDrop + 0.7, 0.25) * (1 - sm(t, T.ghost - 0.15, 0.25)) + sm(t, T.solid + 0.3, 0.4);

  /* các hệ ống: độ đặc theo từng đoạn truyện */
  const solidK = sm(t, T.solid, 1.0);
  const hidden = kf([[T.zoomIn + 0.2, 1], [T.zoomIn + 1.5, 0], [T.pullBack + 0.6, 0], [T.pullBack + 2.0, 1]], t);
  const portalOp = Math.max(solidK, hidden * kf([[T.portal, 0], [T.portal + 0.1, 1], [T.artery, 1], [T.artery + 0.8, 0.4], [T.hepatic + 0.5, 0.3], [T.pullBack + 2.0, 0.22]], t));
  const arteryOp = Math.max(solidK, hidden * kf([[T.artery, 0], [T.artery + 0.1, 1], [T.hepatic, 1], [T.hepatic + 0.6, 0.4], [T.pullBack + 2.0, 0.22]], t));
  const hepOp = Math.max(solidK, hidden * kf([[T.hepatic, 0], [T.hepatic + 0.1, 1], [T.zoomIn, 1], [T.pullBack + 2.0, 0.22]], t));
  const bileOp = Math.max(solidK, kf([[T.ducts - 0.1, 0], [T.ducts, 1]], t) * hidden);
  const ribOp = kf([[T.ribs0 + 2.4, 1], [T.ribs0 + 3.7, 0.16], [T.leftLobe - 0.4, 0.16], [T.leftLobe + 0.8, 0]], t);

  const gbP = t < T.gb ? 0 : pop(t, T.gb, 0.6);
  const q = t > T.squeeze ? Math.sin(Math.PI * clamp01((t - T.squeeze) / 1.6) * 2) ** 2 * (t < T.squeeze + 1.6 ? 1 : 0) : 0;
  const gutP = sm(t, T.intestine, 0.7);
  const gbOp = Math.max(solidK, kf([[T.gb, 0], [T.gb + 0.1, 1]], t) * hidden);

  /* mảnh bị cắt bay ra */
  const chunkP = clamp01((t - T.cut) / 1.1);
  /* tia sáng khi lớn lại */
  const spark = t > T.regrow + 0.5 && t < T.regrow + 2.2;
  /* màng bảo vệ */
  const shield = t >= T.vaccine ? pop(t, T.vaccine, 0.8) : 0;

  return (
    <>
      <CameraRig t={t} />
      <directionalLight position={[-4, 10, -6]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-near={1} shadow-camera-far={50} shadow-radius={6} shadow-bias={-0.0004} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.15} color="#0b2a4a" />
      </mesh>

      {/* khung sườn: bay vào từng cái, rồi mờ dần */}
      {GEO.ribs.map((g, i) => {
        const a = T.ribs0 + 0.28 * i;
        const p = t < a ? 0 : pop(t, a, 0.7);
        return <ToonMesh key={i} geometry={g} color={C.rib} opacity={Math.max(0.0001, ribOp)} outline={5} position={[(i % 2 ? 16 : -16) * (1 - p), 0, 0]} visible={p > 0.01} />;
      })}

      <group {...asm}>
        {/* hai thuỳ gan */}
        <group position={[0, dropY, 0]} scale={[1 + squash * 0.5, 1 - squash, 1 + squash * 0.5]}>
          <ToonMesh geometry={GEO.rl} color={C.liverR} opacity={liverOp} rimColor={raw('#9A3B30')} rim={ghostK * Math.min(1, liverOp / 0.25)} position={[RL.c.x, RL.c.y, RL.c.z]} scale={[RL.r.x, RL.r.y, RL.r.z]} castShadow renderOrder={3} depthWrite={solidLiver} visible={t >= T.liverDrop} />
          <Face t={t} vis={faceVis} />
        </group>
        <group position={[(1 - lobeL) * 12, 0, 0]} scale={Math.max(lobeL, 0.0001)}>
          <ToonMesh geometry={GEO.ll} color={C.liverL} opacity={liverOp} rimColor={raw('#9A3B30')} rim={ghostK * Math.min(1, liverOp / 0.25)} position={[LL.c.x, LL.c.y, LL.c.z]} scale={[LL.r.x, LL.r.y, LL.r.z]} castShadow renderOrder={3} depthWrite={solidLiver} visible={lobeL > 0.01} />
        </group>

        {/* ruột non (đoạn tá tràng) */}
        <group position={[0.5 * (1 - gutP), -3.5 * (1 - gutP), 0.7 * (1 - gutP)]} scale={Math.max(gutP, 0.0001)} visible={gutP > 0.01}>
          <ToonMesh geometry={GEO.gut} color={C.gut} opacity={hidden} outline={5} />
        </group>

        {/* các hệ ống */}
        <Tree levels={GEO.portal} color={C.portal} op={portalOp} t={t} t0={T.portal} pivot={PORTAL[0].curve.getPointAt(1)} />
        <Tree levels={GEO.artery} color={C.artery} op={arteryOp} t={t} t0={T.artery} pivot={PORTAL[0].curve.getPointAt(1)} />
        <Tree levels={GEO.hepatic} color={C.hep} op={hepOp} t={t} t0={T.hepatic} pivot={HEPATIC[0].curve.getPointAt(0)} />
        <Tree levels={GEO.bile} color={C.bile} op={bileOp} t={t} t0={T.ducts} pivot={PORTAL[0].curve.getPointAt(1)} />
        {hidden > 0.5 && (
          <>
            <Flows flows={FLOWS.portal} mat={DOT.portal} t={t} t0={T.portal} op={portalOp} />
            <Flows flows={FLOWS.artery} mat={DOT.artery} t={t} t0={T.artery} op={arteryOp} />
            <Flows flows={FLOWS.hep} mat={DOT.hep} t={t} t0={T.hepatic} op={hepOp} />
            <Flows flows={FLOWS.bile} mat={DOT.bile} t={t} t0={T.ducts} op={bileOp} />
          </>
        )}

        {/* túi mật và ống túi mật */}
        <group position={[GB_NECK.x, GB_NECK.y, GB_NECK.z]} quaternion={GB_QUAT} scale={Math.max(gbP, 0.0001)} visible={gbP > 0.01}>
          <group scale={[1 + 0.12 * q, 1 - 0.2 * q, 1 + 0.12 * q]}>
            <ToonMesh geometry={GEO.gb} color={C.gb} opacity={gbOp} outline={4} castShadow />
          </group>
        </group>
        {gbP > 0.5 && <ToonMesh geometry={GEO.cystic} color={C.bile} opacity={gbOp} outline={3} />}
        {/* mật chảy từ túi mật xuống ruột non */}
        {t > T.drip - 0.4 && t < T.solid + 0.5 &&
          Array.from({length: 6}, (_, i) => {
            const u = ((t - T.drip) * 0.55 + i / 6) % 1;
            if (t < T.drip) return null;
            const p = GB_FLOW.getPointAt(u);
            return <mesh key={i} geometry={GEO.sphere} material={DOT.bile} position={p} scale={0.16} />;
          })}
      </group>

      <Lobule t={t} />

      {/* mảnh gan bị cắt bay đi */}
      {chunkP > 0 && chunkP < 1 && (
        <ToonMesh geometry={GEO.sphere} color={C.liverR} opacity={Math.max(0.01, 1 - chunkP * 0.95)} position={[-4.2 - 5 * chunkP, 1.6 + 6 * chunkP - 4 * chunkP * chunkP, 1.0]} rotation={[chunkP * 4, chunkP * 3, 0]} scale={[1.9, 1.3, 1.2]} outline={0} />
      )}

      {/* tia sáng khi gan lớn lại */}
      {spark &&
        Array.from({length: 14}, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const f = clamp01((t - T.regrow - 0.5) / 1.7);
          const r = 3.2 + f * 3.4;
          return <ToonMesh key={i} geometry={GEO.octa} color={raw("#FFD23C")} position={[LIVER_C.x + Math.cos(a) * r * 1.25, LIVER_C.y + Math.sin(a) * r * 0.7, 2.2]} rotation={[t * 3, t * 2 + i, 0]} scale={0.3 * (1 - f)} outline={0} />;
        })}

      {/* màng bảo vệ xanh quanh gan */}
      {shield > 0.01 && <ToonMesh geometry={GEO.sphere} color={raw("#7BE495")} opacity={0.14 * shield} rim={shield} rimColor={raw("#1FAE6A")} position={[LIVER_C.x, LIVER_C.y - 0.3, 0]} scale={[4.5 * shield, 3.3 * shield, 3.3 * shield]} depthWrite={false} renderOrder={8} outline={0} />}

      {/* hoa giấy chúc mừng */}
      {t >= T.party &&
        Array.from({length: 46}, (_, i) => {
          const r1 = (i * 0.6180339) % 1;
          const r2 = (i * 0.7548776) % 1;
          const y = 10 - ((((t - T.party) * (2.2 + r2 * 2.2) + r1 * 18) % 18));
          return <mesh key={i} geometry={GEO.box} material={DOT.confetti[i % 6]} position={[(r1 - 0.5) * 16 + Math.sin(t * 1.6 + i) * 0.7, y, 1.5 + (r2 - 0.5) * 6]} rotation={[t * 3 + i, t * 2.2, i]} scale={[0.3, 0.18, 0.04]} />;
        })}
    </>
  );
};

export const GanLapVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();
  const bg = useMemo(() => 'linear-gradient(180deg, #bfe6fb 0%, #7fc2ee 50%, #4a92d6 100%)', []);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: bg}} />
      <Bubbles t={t} />
      <AbsoluteFill>
        <ThreeCanvas width={WIDTH} height={HEIGHT} shadows linear flat dpr={1} camera={{fov: 32, near: 0.1, far: 140, position: [0, 3, 30]}} gl={{antialias: true}}>
          <Scene t={t} />
        </ThreeCanvas>
      </AbsoluteFill>
      <GanOverlay t={t} frame={frame} />
    </AbsoluteFill>
  );
};

/* V005 bản 3D: dựng bằng @remotion/three (three.js), toàn bộ hình khối sinh bằng code, tô bóng toon + viền đen + bóng đổ xuống nền.
   Lớp phủ 2D (nhãn, phụ đề, thẻ, mặt máy CT, bong bóng...) dùng chung với bản 2D: chung/lop-phu.tsx. */
import {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {useFonts} from '../../src/common/fonts';
import {FPS, P} from '../../src/timeline';
import {PhoiOverlay, NODULE_NEUTRAL, NODULE_ORANGE, dimAt, sfxList, type Anchors} from '../chung/lop-phu';
import {E, NODE_NEUTRAL_AT, NODULE_LEVEL, S, SCAN_DUR, SCAN_FROM, SCAR, T_NODE, W, scanLevel, smooth, timeline, ringAt as ringAtShared} from '../chung/timeline';
import {ToonMesh, shared, HEIGHT, WIDTH} from './chat-lieu';
import {CT_RING, LOBES, TREE, buildBody, buildCartilageRings, buildCarinaFloor, buildCtRing, buildCtStripe, buildTracheaMembrane} from './giai-phau';
import {T_EXIT0, T_EXIT1, az, cameraAt, lampAt, project} from './may-quay';

export const id = 'phoi-3d';
export const durationInFrames = Math.ceil(timeline.total * FPS);

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const sm = (t: number, a: number, d: number) => smooth(P(t, a, d, (x) => x));

/* Màu (mã sRGB) */
const C = {
  membrane: '#F7B9A3',
  cartilage: '#FFF1D6',
  tube: '#FFAE86',
  alveoli: '#FF78A0',
  lobe: '#FF86AB',
  nerve: '#FFD23C',
  ring: '#F4F6FA',
  stripe: '#1FAE9B',
  nodule: '#FF8A1F',
  ghost: '#EAF6FF',
};

/* ---------- dữ liệu hình học dựng một lần ---------- */
const GEO = {
  membrane: buildTracheaMembrane(),
  rings: buildCartilageRings(),
  carina: buildCarinaFloor(),
  lobe: new THREE.SphereGeometry(1, 56, 38),
  ctRing: buildCtRing(),
  ctStripe: buildCtStripe(),
  body: buildBody(),
  sphere: new THREE.SphereGeometry(1, 24, 16),
  disc: new THREE.CircleGeometry(1, 56),
};

/* ---------- máy CT quét (cảnh 5) và xuất hiện lại ở cảnh 8 ---------- */
const Y_BOTTOM = -2.9;
const Y_TOP = 1.6;
const levelToY = (l: number) => Y_BOTTOM + (Y_TOP - Y_BOTTOM) * l;
const NODULE_POS = V(-1.3, levelToY(NODULE_LEVEL), 0.25);

const ringAt = (t: number) => {
  const r = ringAtShared(t);
  return {k: r.k, y: levelToY(r.level)};
};

const SLICES = 12;

const CameraRig = ({t}: {t: number}) => {
  const {camera} = useThree();
  const c = cameraAt(t);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.copy(c.eye);
  cam.quaternion.copy(c.quat);
  cam.fov = c.fov;
  cam.near = 0.02;
  cam.far = 90;
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return null;
};

const Scene = ({t}: {t: number}) => {
  const exited = t >= T_EXIT0;
  const lamp = lampAt(t);
  shared.uTime.value = t;
  shared.uLamp.value = lamp;
  shared.uFogK.value = 0.22 * lamp;

  const breath = 1 + 0.02 * Math.sin((2 * Math.PI * t) / 3.4);
  const lobeFade = sm(t, T_EXIT0 + 0.3, 2.0);
  const tubeOp = 1 - 0.72 * (sm(t, T_EXIT0 - 0.3, 0.9) - sm(t, T_EXIT1 - 0.4, 1.4));
  const nerveOp = sm(t, W(2, 'ít') - 0.2, 0.6) * (1 - sm(t, S(4) - 1, 1));
  const floorOp = 0.3 * sm(t, T_EXIT1 - 1, 2);
  const bodyFade = sm(t, S(8) - 0.2, 1.5);

  const ring = ringAt(t);
  const scanning = t >= SCAN_FROM - 0.2 && t < E(5) + 0.8;
  const nodVis = t >= T_NODE - 0.1 && t <= SCAR.to;
  const nodGrow = sm(t, T_NODE - 0.1, 0.25);
  const neutral = sm(t, NODE_NEUTRAL_AT, 0.4);
  const nodColor = neutral > 0.5 ? NODULE_NEUTRAL : NODULE_ORANGE;
  const halo = nodVis ? (1 - neutral) * (0.3 + 0.12 * Math.sin(t * 7)) : 0;

  return (
    <>
      <CameraRig t={t} />
      <directionalLight position={[-4, 10, -6]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-camera-near={1} shadow-camera-far={30} shadow-radius={6} shadow-bias={-0.0004} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial opacity={floorOp} color="#0b2a4a" />
      </mesh>

      {/* khí quản */}
      <ToonMesh geometry={GEO.membrane} color={C.membrane} doubleSide outline={exited ? 5 : 0} />
      <ToonMesh geometry={GEO.rings} color={C.cartilage} outline={5} />
      <ToonMesh geometry={GEO.carina} color={C.membrane} doubleSide outline={0} />

      {/* hai phổi: cây phế quản, phế nang, thuỳ */}
      <group scale={[1 + 0.5 * (breath - 1), breath, 1 + 0.5 * (breath - 1)]}>
        <ToonMesh geometry={TREE.tubes} color={C.tube} doubleSide opacity={tubeOp} outline={exited && t > T_EXIT1 - 0.4 ? 4 : 0} />
        <ToonMesh geometry={TREE.rings} color={C.cartilage} outline={3} opacity={tubeOp} />
        <ToonMesh geometry={TREE.alveoli} color={C.alveoli} breath={0.14} opacity={tubeOp} outline={4} />
        <ToonMesh geometry={TREE.nerves} color={C.nerve} opacity={nerveOp} outline={0} />
        {LOBES.map((l) => (
          <ToonMesh key={l.id} geometry={GEO.lobe} color={C.lobe} opacity={0.58 * lobeFade} rim={lobeFade} outline={0} position={l.c} scale={l.r} castShadow renderOrder={3} depthWrite={false} doubleSide={t < T_EXIT1} />
        ))}
        {nodVis && <ToonMesh geometry={GEO.sphere} color={nodColor} position={[NODULE_POS.x, NODULE_POS.y, NODULE_POS.z]} scale={0.14 * nodGrow} outline={4} renderOrder={4} />}
        {halo > 0.01 && (
          <mesh position={NODULE_POS} scale={0.26 * nodGrow * (1 + 0.15 * Math.sin(t * 7))} renderOrder={5}>
            <sphereGeometry args={[1, 20, 14]} />
            <meshBasicMaterial color={C.nodule} transparent opacity={halo} depthWrite={false} toneMapped={false} />
          </mesh>
        )}
      </group>

      {/* máy CT và các lát cắt */}
      {ring.k > 0.01 && (
        <group position={[0, ring.y, 0]} scale={ring.k}>
          <ToonMesh geometry={GEO.ctRing} color={C.ring} doubleSide outline={6} />
          <ToonMesh geometry={GEO.ctStripe} color={C.stripe} doubleSide outline={0} />
          {scanning && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} scale={CT_RING.ri - 0.2} renderOrder={6}>
              <primitive object={GEO.disc} attach="geometry" />
              <meshBasicMaterial color="#9BE7FF" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
            </mesh>
          )}
        </group>
      )}
      {scanning &&
        Array.from({length: SLICES}, (_, i) => {
          const y = levelToY(1 - (i + 0.5) / SLICES);
          const passed = ring.y < y - 0.05;
          const fade = passed ? 1 - sm(t, E(5) - 0.2, 0.6) : 0;
          if (fade < 0.01) return null;
          return (
            <mesh key={i} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={CT_RING.ri - 0.35} renderOrder={5}>
              <primitive object={GEO.disc} attach="geometry" />
              <meshBasicMaterial color="#9BE7FF" transparent opacity={0.11 * fade} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
            </mesh>
          );
        })}

      {/* thân người mờ (cảnh 8-9) */}
      {bodyFade > 0.01 && GEO.body.map((g, i) => <ToonMesh key={i} geometry={g} color={C.ghost} opacity={0.1 * bodyFade} rim={0.75 * bodyFade} rimColor="#ffffff" outline={0} renderOrder={1} depthWrite={false} />)}
    </>
  );
};

export const Phoi3dVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();

  const dim = dimAt(t);
  const warm = 1 - sm(t, T_EXIT0, 1.4);

  /* điểm neo cho lớp phủ 2D */
  const anchors: Anchors = useMemo(() => ({ct: null, nodule: null, face: null, lungs: {x: 540, y: 700, u: 170}}), []);
  const a: Anchors = {...anchors};
  const ring = ringAt(t);
  if (ring.k > 0.04) {
    const ang = az(t);
    const r = (CT_RING.ro + 0.07) * ring.k;
    const p = project(t, V(Math.sin(ang) * r, ring.y, Math.cos(ang) * r));
    a.ct = {x: p.x, y: p.y, u: p.ppu * ring.k * 1.2};
  }
  const nod = project(t, NODULE_POS);
  a.nodule = {x: nod.x, y: nod.y, u: nod.ppu};
  const lc = project(t, V(0, -0.2, 0));
  a.lungs = {x: lc.x, y: lc.y, u: lc.ppu};
  const eL = project(t, V(-1.0, 0.65, 0.62));
  const eR = project(t, V(1.0, 0.55, 0.62));
  const mo = project(t, V(0, -0.35, 0.45));
  a.face = {eyeL: eL, eyeR: eR, mouth: mo, u: eL.ppu * 0.95};

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #9ad6f7 0%, #62aee8 52%, #3a82cb 100%)'}} />
      {warm > 0.001 && <AbsoluteFill style={{background: 'linear-gradient(180deg, #6e2340 0%, #b44a63 60%, #e0826e 100%)', opacity: warm}} />}
      <AbsoluteFill style={{filter: dim > 0.01 ? `blur(${(6 * dim).toFixed(1)}px)` : undefined}}>
        <ThreeCanvas width={WIDTH} height={HEIGHT} shadows linear flat dpr={1} camera={{fov: 66, near: 0.02, far: 90, position: [0, 3, 0]}} gl={{antialias: true}}>
          <Scene t={t} />
        </ThreeCanvas>
      </AbsoluteFill>
      <PhoiOverlay t={t} frame={frame} a={a} sfx={sfxList([{t: T_EXIT0 + 0.2, src: 'sfx/whoosh-02.wav', v: 0.3}])} />
    </AbsoluteFill>
  );
};

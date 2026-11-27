/* V014 "Lắp chiếc răng: vì sao sâu răng?" (video 3D dài): dựng bằng @remotion/three (three.js), hình khối sinh bằng code (giai-phau.ts),
   tô bóng toon + viền đen + bóng đổ nhẹ lên tường phía sau, camera một mạch (may-quay.ts), nhãn 2D có đường chỉ (lop-phu.tsx).
   Mạch xuyên suốt: viên đường nhân vật (hanh-trinh.ts) đi cùng mô hình; phần cuối có bàn chải. Dùng lại chất liệu toon của V005. */
import {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {useFonts} from '../../src/common/fonts';
import {FPS} from '../../src/timeline';
import {ToonMesh, shared, HEIGHT, WIDTH} from '../../V005 - 2026-11-26 - phoi-tam-soat/canh-3d/chat-lieu';
import {C} from './mau';
import {GEO, Sparks, V, basic} from './chung';
import {Brush, Floss, Mirror, PasteTube, SugarCube} from './nhan-vat';
import {HookTooth, ToothModel} from './rang';
import {Stage} from './san-khau';
import {brushAt, brushClean, mirrorAt, modelScale, sugarAt, tubeAt, TUBE_POSE} from './hanh-trinh';
import {cameraAt} from './may-quay';
import {Bubbles, LapChiecRangOverlay} from './lop-phu';
import {T, pop, sm, smooth, timeline, win} from './moc';

export const id = 'lap-chiec-rang';
export const durationInFrames = Math.ceil(timeline.total * FPS);

const CONFETTI = ['#FF8A1F', '#FFD23C', '#2FC46B', '#1F8FE8', '#FF5C8A', '#7B4FE0'].map((c) => basic(c));

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

const MODEL_PIVOT = V(0, -0.4, 0);
const WALL_Z = -3.2;

/** Viên đường nhỏ rơi xuống mũi nhai ở cảnh "ăn vặt", mỗi lần chạm là một đợt axit */
const DROPS = (() => [T.limit + 0.3, T.snack, T.everyTime + 0.2])();
const FALL_X = [-0.95, -0.3, -1.45];
const MiniFalls = ({t}: {t: number}) => (
  <>
    {DROPS.map((t0, i) => {
      const f = (t - t0) / 0.8;
      if (f < 0 || f > 2.1) return null;
      const lx = FALL_X[i];
      if (f < 1) return <ToonMesh key={i} geometry={GEO.cube} color={C.sugar} rimColor={C.sugarRim} position={[lx, 7 - 4.1 * f * f, 0.85]} rotation={[f * 4, f * 3, 0]} scale={0.5} outline={3} />;
      const g = (f - 1) / 1.1;
      return (
        <group key={i}>
          <ToonMesh geometry={GEO.cube} color={C.sugar} rimColor={C.sugarRim} position={[lx, 2.9, 0.85]} scale={[0.5 * (1 + 0.3 * (1 - g)), 0.5 * (1 - g), 0.5]} outline={3} visible={g < 0.8} />
          {Array.from({length: 6}, (_, k) => {
            const a = (k / 6) * Math.PI * 2 + i;
            const r = 0.35 + 0.7 * smooth(g);
            return <ToonMesh key={k} geometry={GEO.dodeca} color={C.acid} rimColor={C.bacteriaDark} position={[lx + Math.cos(a) * r, 3.0 + Math.sin(a) * r * 0.8, 1.0]} rotation={[g * 5 + k, g * 4, 0]} scale={0.13 * (1 - g)} outline={2} />;
          })}
        </group>
      );
    })}
  </>
);

const Scene = ({t}: {t: number}) => {
  shared.uTime.value = t;
  shared.uLamp.value = 0;
  shared.uFogK.value = 0;

  const k = modelScale(t);
  const sugar = sugarAt(t);
  const brush = brushAt(t);
  const tube = tubeAt(t);
  const mirror = mirrorAt(t);
  const clean = brushClean(t);
  const nbr = win(t, T.floss - 0.5, T.limit - 0.2, 0.4);
  const flossK = Math.max(0, pop(t, T.floss - 0.3, 0.5)) * (1 - sm(t, T.limit - 0.6, 0.5));
  const checkK = t < T.detect + 1.2 ? 0 : Math.max(0.0001, pop(t, T.detect + 1.2, 0.5));
  const spark = (a: number, b: number) => win(t, a, b, 0.4);

  return (
    <>
      <CameraRig t={t} />
      <directionalLight position={[-3, 5, 12]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-near={1} shadow-camera-far={60} shadow-radius={6} shadow-bias={-0.0004} />
      {/* tường phía sau chỉ để hứng bóng đổ nhẹ */}
      <mesh position={[0, 0, WALL_Z]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.06} color="#0b2a4a" />
      </mesh>

      <HookTooth t={t} />

      {/* mô hình cắt góc: thu nhỏ biến mất khi vào cảnh phóng to và lúc đặt lại */}
      <group position={[MODEL_PIVOT.x * (1 - k), MODEL_PIVOT.y * (1 - k), MODEL_PIVOT.z * (1 - k)]} scale={k}>
        <ToothModel t={t} brushClean={clean} />
        {nbr > 0.01 && <ToonMesh geometry={GEO.sphere} color={C.ghost} rimColor={C.ghost} opacity={0.24 * nbr} rim={1} outline={0} position={[3.45, 1.25, 0]} scale={[1.2, 1.5, 1.2]} renderOrder={1} />}
        {flossK > 0.01 && <Floss o={0.35 * Math.sin((t - T.floss) * 5)} k={flossK} />}
        <MiniFalls t={t} />
      </group>

      <Stage t={t} />

      <SugarCube t={t} p={sugar.p} s={sugar.s} mood={sugar.mood} squash={sugar.squash} tilt={sugar.tilt} />

      {brush.visible && <Brush t={t} p={[brush.p.x, brush.p.y, brush.p.z]} rot={brush.rot} s={brush.s} mood="vui" />}
      {tube.visible && tube.k > 0.01 && (
        <group position={[TUBE_POSE.x, TUBE_POSE.y + 0.12 * Math.sin(t * 2.6), TUBE_POSE.z]} scale={tube.k}>
          <PasteTube p={[0, 0, 0]} rot={0.25} s={0.9} />
        </group>
      )}
      {mirror.k > 0.01 && (
        <group scale={mirror.k}>
          <Mirror t={t} p={[mirror.p.x, mirror.p.y, mirror.p.z]} rot={-0.7} s={0.85} />
        </group>
      )}

      {/* tia sáng flo (xanh lá) quanh thân răng khi nói tới kem có flo; tia mừng khi bắt được lỗ sâu sớm */}
      <Sparks center={V(-1.9, 1.5, 0.9)} n={8} f={(t * 0.9) % 1} radius={1.1} size={0.16 * spark(T.fluoride, T.floss - 0.3)} color={C.flo} seed={31} />
      <Sparks center={V(0.7, 2.3, 0.6)} n={6} f={(t * 1.1) % 1} radius={0.8} size={0.12 * spark(T.detect + 1.0, T.detect + 3.6)} color={C.spark} seed={41} />
      {checkK > 0.001 && (
        <group position={[2.3, 3.0, 1.5]} scale={checkK * 0.8}>
          <ToonMesh geometry={GEO.cube} color={C.check} rimColor="#17803F" position={[-0.32, -0.22, 0]} rotation={[0, 0, -0.78]} scale={[0.34, 0.8, 0.3]} outline={3} />
          <ToonMesh geometry={GEO.cube} color={C.check} rimColor="#17803F" position={[0.28, 0.08, 0]} rotation={[0, 0, 0.78]} scale={[0.34, 1.5, 0.3]} outline={3} />
        </group>
      )}

      {/* hoa giấy chúc mừng */}
      {t >= T.party &&
        Array.from({length: 46}, (_, i) => {
          const r1 = (i * 0.6180339) % 1;
          const r2 = (i * 0.7548776) % 1;
          const y = 12 - (((t - T.party) * (2.2 + r2 * 2.2) + r1 * 22) % 22);
          return <mesh key={i} geometry={GEO.box} material={CONFETTI[i % 6]} position={[(r1 - 0.5) * 18 + Math.sin(t * 1.6 + i) * 0.7, y, 2.5 + (r2 - 0.5) * 6]} rotation={[t * 3 + i, t * 2.2, i]} scale={[0.3, 0.18, 0.04]} />;
        })}
    </>
  );
};

export const LapChiecRangVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();
  const bg = useMemo(() => 'linear-gradient(180deg, #d8f5ec 0%, #9ee0d0 50%, #5fc3c8 100%)', []);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: bg}} />
      <Bubbles t={t} />
      <AbsoluteFill>
        <ThreeCanvas width={WIDTH} height={HEIGHT} shadows linear flat dpr={1} camera={{fov: 32, near: 0.1, far: 140, position: [0, 3, 30]}} gl={{antialias: true}}>
          <Scene t={t} />
        </ThreeCanvas>
      </AbsoluteFill>
      <LapChiecRangOverlay t={t} frame={frame} />
    </AbsoluteFill>
  );
};


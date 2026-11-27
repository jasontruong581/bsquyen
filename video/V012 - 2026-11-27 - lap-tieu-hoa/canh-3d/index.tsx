/* V012 "Láº¯p há»‡ tiÃªu hÃ³a" (video 3D dÃ i): dá»±ng báº±ng @remotion/three (three.js), toÃ n bá»™ hÃ¬nh khá»‘i sinh báº±ng code (giai-phau.ts),
   tÃ´ bÃ³ng toon + viá»n Ä‘en + bÃ³ng Ä‘á»• lÃªn tÆ°á»ng phÃ­a sau, camera bÃ¡m theo viÃªn thá»©c Äƒn (may-quay.ts), nhÃ£n 2D cÃ³ Ä‘Æ°á»ng chá»‰ (lop-phu.tsx).
   Máº¡ch xuyÃªn suá»‘t: viÃªn thá»©c Äƒn Ä‘i tá»« miá»‡ng xuá»‘ng háº­u mÃ´n (hanh-trinh.ts). DÃ¹ng láº¡i cháº¥t liá»‡u toon cá»§a V005 (chat-lieu.tsx). */
import {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {useFonts} from '../../src/common/fonts';
import {FPS} from '../../src/timeline';
import {ToonMesh, shared, HEIGHT, WIDTH} from '../../V005 - 2026-11-26 - phoi-tam-soat/canh-3d/chat-lieu';
import {
  ANUS_POS, BILE_CURVE, COLON_CURVE, COLON_LEN, ESO_CURVE, ESO_R, GB_DIR, GB_NECK, GB_QUAT, LIVER_C, MOUTH_C, PANC_DUCT, Pipe, SI_CURVE, SI_R, STO_CURVE, V, bump,
  buildGallbladder, buildLiver, buildPancreas, buildSpine, buildTeethRow, buildTorso, colonRadius, stomachRadius,
} from './giai-phau';
import {C, raw} from './mau';
import {cameraAt} from './may-quay';
import {Bubbles, TieuHoaOverlay} from './lop-phu';
import {T, S, clamp01, kf, pop, sm, smooth, timeline, win} from './moc';
import {B, bolusAt, bolusU} from './hanh-trinh';
import {STAGE_OFF, Stage} from './san-khau';

export const id = 'lap-tieu-hoa';
export const durationInFrames = Math.ceil(timeline.total * FPS);

const PANC = buildPancreas();
const PIPES = {
  eso: new Pipe(ESO_CURVE, 70, 12),
  sto: new Pipe(STO_CURVE, 110, 22),
  si: new Pipe(SI_CURVE, 760, 12),
  col: new Pipe(COLON_CURVE, 520, 16),
};
const GEO = {
  liver: buildLiver(),
  gb: buildGallbladder(),
  teethU: buildTeethRow(true),
  teethL: buildTeethRow(false),
  torso: buildTorso(),
  spine: buildSpine(),
  sphere: new THREE.SphereGeometry(1, 22, 16),
  box: new THREE.BoxGeometry(1, 1, 1),
  octa: new THREE.OctahedronGeometry(1),
  dodeca: new THREE.DodecahedronGeometry(1),
  ring: new THREE.TorusGeometry(1, 0.26, 8, 28),
  lips: new THREE.TorusGeometry(1, 0.17, 12, 44),
  cavity: new THREE.CircleGeometry(1, 36),
  smile: new THREE.TorusGeometry(0.4, 0.07, 8, 28, Math.PI),
  mouthOpen: new THREE.CircleGeometry(0.42, 24, Math.PI, Math.PI),
  anus: new THREE.TorusGeometry(0.34, 0.1, 10, 28),
  bileDuct: new THREE.TubeGeometry(BILE_CURVE, 20, 0.055, 8, false),
  pancDuct: new THREE.TubeGeometry(PANC_DUCT, 12, 0.05, 8, false),
  gland: new THREE.SphereGeometry(1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
};

const basic = (color: string) => new THREE.MeshBasicMaterial({color: raw(color), toneMapped: false});
const DOT = {
  saliva: basic('#BFE8FF'),
  bile: basic('#8EE05A'),
  juice: basic('#FFD23C'),
  confetti: ['#FF8A1F', '#FFD23C', '#2FC46B', '#1F8FE8', '#FF5C8A', '#7B4FE0'].map(basic),
};

/** BÆ¡m dáº¡ dÃ y: sÃ³ng co tháº¯t cháº¡y vá» phÃ­a mÃ´n vá»‹, giá»¯ nhá»‹p trong cáº£ Ä‘oáº¡n dáº¡ dÃ y */
const fract = (x: number) => x - Math.floor(x);

const stomachSqueeze = (t: number) => {
  const period = 2.4;
  const ph = (((t - B.stoSettle) % period) + period) % period / period;
  return {c: 0.45 + 0.5 * ph, on: sm(t, T.churn - 0.2, 0.5) * (1 - sm(t, B.stoLeave, 0.6))};
};

/* ---------- sÃ³ng nhu Ä‘á»™ng toÃ n Ä‘Æ°á»ng á»‘ng (cáº£nh 12) ---------- */
const WAVE_T0 = T.peristalsis - 0.1;
const waveGate = (t: number) => win(t, WAVE_T0, T.meters + 1.4, 0.6);
const waveU = (t: number, k: number, n: number, speed: number) => (k / n + Math.max(0, t - WAVE_T0) * speed) % 1;
const WAVES = {
  eso: {n: 2, v: 0.22},
  sto: {n: 2, v: 0.3},
  si: {n: 7, v: 0.065},
  col: {n: 5, v: 0.05},
};
const waveBumps = (t: number, u: number, w: {n: number; v: number}, width: number, gate: number) => {
  let s = 0;
  for (let k = 0; k < w.n; k++) s += bump(u, waveU(t, k, w.n, w.v), width);
  return s * gate;
};

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

/* ---------- má»™t cÆ¡ quan: bÃ³ng má» (báº£n váº½) â†’ bay vÃ o vÃ  náº£y ra Ä‘áº·c ---------- */
type OrganProps = {
  t: number;
  ta: number;
  geometry: THREE.BufferGeometry;
  color: string;
  rimColor?: string;
  from: [number, number, number];
  pivot: THREE.Vector3;
  /** 0 = Ä‘áº·c, 1 = trong suá»‘t Ä‘á»ƒ tháº¥y bÃªn trong */
  see?: number;
  outline?: number;
  shadow?: boolean;
  noGhost?: boolean;
};
const Organ = ({t, ta, geometry, color, rimColor, from, pivot, see = 0, outline = 4, shadow = true, noGhost = false}: OrganProps) => {
  const sol = t < ta ? 0 : pop(t, ta, 0.65);
  const k = Math.max(0.0001, sol);
  const off = 1 - clamp01(sol);
  const ghost = noGhost ? 0 : sm(t, 0.6, 1.2) * (1 - sm(t, ta - 0.05, 0.25));
  const op = 1 - 0.62 * see;
  return (
    <>
      {ghost > 0.01 && <ToonMesh geometry={geometry} color={C.ghost} rimColor={C.ghost} opacity={0.2 * ghost} rim={1} outline={0} renderOrder={1} />}
      {t >= ta - 0.02 && (
        <group position={[from[0] * off + pivot.x * (1 - k), from[1] * off + pivot.y * (1 - k), from[2] * off + pivot.z * (1 - k)]} scale={k}>
          <ToonMesh geometry={geometry} color={color} rimColor={rimColor} opacity={op} rim={see > 0.02 ? 1 : 0} outline={outline} castShadow={shadow} depthWrite={see < 0.02} renderOrder={see > 0.02 ? 3 : undefined} />
        </group>
      )}
    </>
  );
};

/* ---------- viÃªn thá»©c Äƒn cÃ³ máº·t ---------- */
const Bolus = ({t}: {t: number}) => {
  const b = bolusAt(t);
  if (!b.visible) return null;
  const col = t < B.colIn ? C.cream : C.beige;
  const blink = (t % 3.1) < 0.12 ? 0.15 : 1;
  const sq = 1 - 0.28 * b.chew;
  const wide = 1 + 0.16 * b.chew;
  const wob = 1 + 0.04 * Math.sin(t * 7);
  return (
    <group position={b.p} scale={b.s}>
      <group scale={[wide * wob, sq / wob, wide]}>
        <ToonMesh geometry={GEO.sphere} color={col} outline={3} depthTest={false} opacity={0.998} renderOrder={30} />
      </group>
      {b.face && (
        <group position={[0, 0.05, 0.9]} scale={0.9}>
          {[-0.34, 0.34].map((x) => (
            <group key={x} position={[x, 0.2, 0.1]}>
              <ToonMesh geometry={GEO.sphere} color={C.white} scale={[0.27, 0.32 * blink * (b.mood === 'ngac' ? 1.25 : 1), 0.1]} outline={0} depthTest={false} opacity={0.998} renderOrder={31} />
              <ToonMesh geometry={GEO.sphere} color={C.pupil} position={[0.04 * Math.sin(t * 1.3), -0.02, 0.1]} scale={[0.12, 0.14 * Math.max(blink, 0.3), 0.05]} outline={0} depthTest={false} opacity={0.998} renderOrder={32} />
            </group>
          ))}
          {b.mood === 'ngac' ? (
            <ToonMesh geometry={GEO.sphere} color={C.dark} position={[0, -0.25, 0.1]} scale={[0.13, 0.17, 0.05]} outline={0} depthTest={false} opacity={0.998} renderOrder={31} />
          ) : (
            <ToonMesh geometry={GEO.smile} color={C.dark} position={[0, -0.12, 0.08]} rotation={[0, 0, Math.PI + 0.08]} scale={[b.mood === 'vui' ? 1.1 : 0.8, b.mood === 'vui' ? 1.1 : 0.8, 1]} outline={0} depthTest={false} opacity={0.998} renderOrder={31} />
          )}
        </group>
      )}
    </group>
  );
};

/* ---------- miá»‡ng ---------- */
const Mouth = ({t}: {t: number}) => {
  const jaw = t > T.teeth - 0.4 && t < T.softBall + 0.3 ? 0.5 + 0.5 * Math.sin(t * 9) : 0;
  const lower = -0.1 * jaw + 0.06;
  const tUp = t < T.teeth - 0.15 ? 0 : pop(t, T.teeth - 0.15, 0.5);
  const tTo = t < T.tongue - 0.15 ? 0 : pop(t, T.tongue - 0.15, 0.5);
  const open = t > B.swallow && t < B.swallow + 1.2 ? 1 : 0;
  return (
    <group position={[MOUTH_C.x, MOUTH_C.y, MOUTH_C.z]} scale={0.66}>
      <ToonMesh geometry={GEO.cavity} color={C.cavity} scale={[1.25, 0.8, 1]} position={[0, 0, -0.08]} outline={0} />
      {/* lÆ°á»¡i */}
      <group scale={Math.max(0.0001, tTo)} position={[0, -0.42, 0]}>
        <ToonMesh geometry={GEO.sphere} color={C.tongue} scale={[0.85, 0.32 + 0.03 * jaw, 0.5]} position={[0, 0.03 * jaw, 0.05]} outline={3} />
      </group>
      {/* rÄƒng trÃªn, rÄƒng dÆ°á»›i (hÃ m dÆ°á»›i nhai nhá»‹p nhÃ ng) */}
      {tUp > 0 && (
        <group scale={Math.max(0.0001, tUp)}>
          <ToonMesh geometry={GEO.teethU} color={C.tooth} position={[0, 0, 0.02]} outline={2} />
          <group position={[0, lower - open * 0.06, 0.02]}>
            <ToonMesh geometry={GEO.teethL} color={C.tooth} outline={2} />
          </group>
        </group>
      )}
      <ToonMesh geometry={GEO.lips} color={C.lip} scale={[1.33, 0.88, 0.8]} outline={4} />
    </group>
  );
};

/* ---------- tuyáº¿n dáº¡ dÃ y, axit, enzym ---------- */
const GLANDS = Array.from({length: 22}, (_, i) => ({u: 0.18 + 0.6 * ((i * 0.618) % 1), a: i * 2.4}));
const StomachContent = ({t}: {t: number}) => {
  if (t < T.glands - 0.3 || t > B.stoLeave + 0.5) return null;
  const grow = pop(t, T.glands, 0.6);
  const fade = 1 - sm(t, B.stoLeave - 0.4, 0.6);
  const bolus = bolusAt(t);
  const els: JSX.Element[] = [];
  GLANDS.forEach((g, i) => {
    const r = stomachRadius(g.u) * 0.97;
    const {p, dir} = PIPES.sto.surface(g.u, g.a, r);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().negate());
    const s = Math.max(0.0001, grow * fade) * 0.16;
    els.push(<ToonMesh key={`g${i}`} geometry={GEO.gland} color={raw('#FF9BB8')} position={[p.x, p.y, p.z]} quaternion={q} scale={s} outline={0} />);
    if (t > T.acid - 0.1) {
      // giá»t axit tiáº¿t ra tá»« tuyáº¿n, bay vÃ o lÃ²ng dáº¡ dÃ y rá»“i vÃ²ng vá» phÃ­a viÃªn thá»©c Äƒn
      const f = ((t - T.acid) * 0.45 + i * 0.137) % 1;
      const inward = dir.clone().negate();
      const target = bolus.p.clone().add(V(0.25 * Math.cos(i), 0.2 * Math.sin(i * 1.7), 0.1));
      const pos = p.clone().addScaledVector(inward, 0.1).lerp(target, smooth(f) * 0.85);
      els.push(<ToonMesh key={`a${i}`} geometry={GEO.dodeca} color={C.acid} position={[pos.x, pos.y, pos.z]} rotation={[t * 3 + i, t * 2, 0]} scale={0.085 * Math.sin(Math.PI * f) * fade} outline={2} />);
    }
  });
  // enzym: cÃ¡c tia nhá» mÃ u vÃ ng "cáº¯t" viÃªn thá»©c Äƒn thÃ nh máº£nh
  if (t > T.enzymeSt - 0.2) {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + t * 2.4;
      const rr = 0.38 + 0.08 * Math.sin(t * 5 + i);
      els.push(<ToonMesh key={`e${i}`} geometry={GEO.octa} color={C.enzyme} position={[bolus.p.x + Math.cos(a) * rr, bolus.p.y + Math.sin(a * 1.2) * rr * 0.8, bolus.p.z + 0.18 * Math.sin(a)]} rotation={[a, t * 4, 0]} scale={[0.07, 0.15, 0.07]} outline={2} />);
    }
  }
  return <>{els}</>;
};

/* ---------- cáº£nh toÃ n bá»™ ---------- */
const WALL_Z = -2.95;
const AWAY_PIVOT = V(0, -1.5, 0);

const Scene = ({t}: {t: number}) => {
  shared.uTime.value = t;
  shared.uLamp.value = 0;
  shared.uFogK.value = 0;

  const gate = waveGate(t);
  const bu = {eso: bolusU(t, 'eso'), si: bolusU(t, 'si'), col: bolusU(t, 'col')};
  const sq = stomachSqueeze(t);

  /* cáº­p nháº­t bÃ¡n kÃ­nh cÃ¡c á»‘ng theo thá»i gian: chá»— phÃ¬nh nhu Ä‘á»™ng cháº¡y theo viÃªn thá»©c Äƒn vÃ  sÃ³ng co bÃ³p */
  PIPES.eso.update((u) => ESO_R * (1 + 0.65 * bump(u, bu.eso, 0.07) * (bu.eso >= 0 ? 1 : 0) + 0.45 * waveBumps(t, u, WAVES.eso, 0.05, gate)));
  PIPES.sto.update((u) => {
    const churn = 1 - 0.1 * sq.on * bump(u, sq.c, 0.07) + 0.03 * sq.on * Math.sin(t * 3.2 + u * 6);
    const peri = 1 + 0.18 * waveBumps(t, 0.3 + 0.7 * u, WAVES.sto, 0.05, gate);
    return stomachRadius(u) * churn * peri;
  });
  PIPES.si.update((u) => SI_R * (1 + 0.5 * bump(u, bu.si, 0.016) * (bu.si >= 0 ? 1 : 0) + 0.38 * waveBumps(t, u, WAVES.si, 0.012, gate) + 0.02 * Math.sin(u * 480)));
  PIPES.col.update((u) => colonRadius(u) * (1 + 0.28 * bump(u, bu.col, 0.018) * (bu.col >= 0 ? 1 : 0) + 0.2 * waveBumps(t, u, WAVES.col, 0.022, gate)));

  const stoSee = sm(t, S(4) + 0.4, 0.6) * (1 - sm(t, B.stoLeave - 0.2, 0.7));
  const esoSee = sm(t, B.esoIn - 0.4, 0.4) * (1 - sm(t, B.esoOut - 0.1, 0.4)) * 0.7;

  const bile = t > T.bileDrop - 0.2 && t < T.zoomIn + 2;
  const gbq = t > T.bileDrop ? Math.sin(Math.PI * clamp01((t - T.bileDrop) / 1.2)) ** 2 : 0;
  const gbP = t < T.gallbladder - 0.1 ? 0 : pop(t, T.gallbladder - 0.1, 0.6);
  const colP = t < T.colon - 0.2 ? 0 : pop(t, T.colon - 0.2, 0.65);
  const anusP = t < T.rectum - 0.1 ? 0 : pop(t, T.rectum - 0.1, 0.6);
  const exitPulse = t > T.exit + 0.8 ? 1 + 0.35 * Math.sin(Math.PI * clamp01((t - T.exit - 0.8) / 0.8)) : 1;
  /* vào sân khấu nhung mao thì các cơ quan thu nhỏ biến mất, khi lùi ra thì lắp lại */
  const awayK = Math.max(0.0001, 1 - sm(t, T.zoomIn + 0.1, 0.5) * (1 - sm(t, STAGE_OFF - 0.3, 0.7)));
  const hop = t >= T.party ? Math.abs(Math.sin((t - T.party) * 4)) * 0.18 * Math.min(1, (t - T.party) / 0.3) : 0;

  return (
    <>
      <CameraRig t={t} />
      <directionalLight position={[-3, 5, 12]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-near={1} shadow-camera-far={60} shadow-radius={6} shadow-bias={-0.0004} />
      {/* tÆ°á»ng phÃ­a sau chá»‰ Ä‘á»ƒ há»©ng bÃ³ng Ä‘á»• cá»§a cÃ¡c cÆ¡ quan */}
      <mesh position={[0, 0, WALL_Z]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <shadowMaterial opacity={0.07} color="#0b2a4a" />
      </mesh>

      {/* thÃ¢n ngÆ°á»i má» vÃ  cá»™t sá»‘ng lÃ m bá»‘i cáº£nh */}
      <ToonMesh geometry={GEO.torso} color={raw('#F3FAFF')} rimColor={raw('#FFFFFF')} opacity={0.16} rim={1} outline={0} renderOrder={0} />
      <ToonMesh geometry={GEO.spine} color={C.ghost} rimColor={C.white} opacity={0.2} rim={1} outline={0} renderOrder={0} />

      <group position={[AWAY_PIVOT.x * (1 - awayK), AWAY_PIVOT.y * (1 - awayK) + hop, AWAY_PIVOT.z * (1 - awayK)]} scale={awayK}>
        <Mouth t={t} />

        <Organ t={t} ta={T.esoph - 0.15} geometry={PIPES.eso.geometry} color={C.eso} rimColor={raw('#9A5A12')} from={[-9, 3, 0]} pivot={V(0, 3.5, 0)} see={esoSee} outline={4} />
        <Organ t={t} ta={T.stomach - 0.2} geometry={PIPES.sto.geometry} color={C.stomach} rimColor={C.stomachRim} from={[9, 1, 0]} pivot={V(1.2, 1.5, 0)} see={stoSee} outline={5} />
        <Organ t={t} ta={T.smallInt - 0.2} geometry={PIPES.si.geometry} color={C.si} rimColor={C.siRim} from={[0, -9, 0]} pivot={V(0, -2, 0)} outline={4} />
        <Organ t={t} ta={T.liver - 0.2} geometry={GEO.liver} color={C.liver} rimColor={raw('#8A3320')} from={[-9, 6, 0]} pivot={LIVER_C} outline={5} />
        <Organ t={t} ta={T.pancreas - 0.2} geometry={PANC.pipe.geometry} color={C.pancreas} rimColor={raw('#B07A00')} from={[9, -2, 0]} pivot={V(0.5, -0.5, 0)} outline={4} />
        <Organ t={t} ta={T.colon - 0.2} geometry={PIPES.col.geometry} color={C.colon} rimColor={C.colonRim} from={[0, -10, 0]} pivot={V(0, -2.6, 0)} outline={5} />

        {/* tÃºi máº­t */}
        <ToonMesh geometry={GEO.gb} color={C.gb} outline={4} castShadow position={[GB_NECK.x, GB_NECK.y, GB_NECK.z]} quaternion={GB_QUAT} scale={[Math.max(gbP, 0.0001) * (1 + 0.14 * gbq), Math.max(gbP, 0.0001) * (1 - 0.22 * gbq), Math.max(gbP, 0.0001) * (1 + 0.14 * gbq)]} visible={gbP > 0.01} />
        {/* á»‘ng máº­t vÃ  á»‘ng tá»¥y cháº£y vÃ o tÃ¡ trÃ ng */}
        {gbP > 0.5 && (
          <>
            <ToonMesh geometry={GEO.bileDuct} color={C.duct} outline={2} />
            <ToonMesh geometry={GEO.pancDuct} color={C.pancreas} outline={2} />
          </>
        )}
        {bile && (
          <>
            {Array.from({length: 6}, (_, i) => {
              const u = fract((t - T.bileDrop) * 0.5 + i / 6);
              const p = BILE_CURVE.getPointAt(u);
              return <mesh key={`b${i}`} geometry={GEO.sphere} material={DOT.bile} position={p} scale={0.1} />;
            })}
            {Array.from({length: 4}, (_, i) => {
              const u = fract((t - T.pancreas) * 0.55 + i / 4);
              const p = PANC_DUCT.getPointAt(u);
              return <mesh key={`j${i}`} geometry={GEO.sphere} material={DOT.juice} position={p} scale={0.1} />;
            })}
          </>
        )}

        {/* cá»­a ra */}
        {anusP > 0.01 && (
          <group position={[ANUS_POS.x, ANUS_POS.y - 0.02, ANUS_POS.z]} scale={Math.max(0.0001, anusP) * exitPulse}>
            <ToonMesh geometry={GEO.anus} color={C.rectum} rotation={[Math.PI / 2, 0, 0]} outline={3} />
          </group>
        )}

        <StomachContent t={t} />
        <SalivaAndEnzymes t={t} />
        <PeristalsisRings t={t} gate={gate} />
        <ExitSparkles t={t} />
        <Bolus t={t} />
      </group>

      <Stage t={t} />

      {/* hoa giáº¥y chÃºc má»«ng */}
      {t >= T.party &&
        Array.from({length: 46}, (_, i) => {
          const r1 = (i * 0.6180339) % 1;
          const r2 = (i * 0.7548776) % 1;
          const y = 12 - (((t - T.party) * (2.2 + r2 * 2.2) + r1 * 22) % 22);
          return <mesh key={i} geometry={GEO.box} material={DOT.confetti[i % 6]} position={[(r1 - 0.5) * 18 + Math.sin(t * 1.6 + i) * 0.7, y, 2.5 + (r2 - 0.5) * 6]} rotation={[t * 3 + i, t * 2.2, i]} scale={[0.3, 0.18, 0.04]} />;
        })}
    </>
  );
};

/* nÆ°á»›c bá»t (giá»t xanh nháº¡t quanh viÃªn thá»©c Äƒn) vÃ  enzym trong miá»‡ng */
const SalivaAndEnzymes = ({t}: {t: number}) => {
  if (t < T.saliva - 0.1 || t > B.swallow + 0.4) return null;
  const b = bolusAt(t);
  const fade = sm(t, T.saliva - 0.1, 0.4) * (1 - sm(t, B.swallow - 0.2, 0.5));
  return (
    <>
      {Array.from({length: 9}, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + t * 1.2;
        const rr = 0.52 + 0.1 * Math.sin(t * 3 + i * 2);
        return <ToonMesh key={`w${i}`} geometry={GEO.sphere} color={C.saliva} position={[b.p.x + Math.cos(a) * rr * 1.2, b.p.y + Math.sin(a) * rr * 0.7 + 0.1, b.p.z + 0.2]} scale={0.09 * fade * (1 + 0.2 * Math.sin(t * 5 + i))} outline={2} />;
      })}
      {t > T.enzymeMouth - 0.2 &&
        Array.from({length: 7}, (_, i) => {
          const a = (i / 7) * Math.PI * 2 - t * 2.6;
          const rr = 0.62 + 0.07 * Math.sin(t * 4 + i);
          return <ToonMesh key={`z${i}`} geometry={GEO.octa} color={C.enzyme} position={[b.p.x + Math.cos(a) * rr * 1.15, b.p.y + Math.sin(a) * rr * 0.75, b.p.z + 0.3]} rotation={[a, t * 4, 0]} scale={[0.07, 0.16, 0.07]} outline={2} />;
        })}
    </>
  );
};

/* vÃ²ng cam cháº¡y dá»c á»‘ng: hÃ¬nh dung sÃ³ng nhu Ä‘á»™ng (cáº£nh 12) */
const PeristalsisRings = ({t, gate}: {t: number; gate: number}) => {
  if (gate < 0.05) return null;
  const rings: JSX.Element[] = [];
  const add = (key: string, curve: THREE.Curve<THREE.Vector3>, w: {n: number; v: number}, radius: (u: number) => number, mapU: (u: number) => number = (u) => u) => {
    for (let k = 0; k < w.n; k++) {
      const u = mapU(waveU(t, k, w.n, w.v));
      if (u < 0.02 || u > 0.98) continue;
      const p = curve.getPointAt(u);
      const tg = curve.getTangentAt(u).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), tg);
      const r = radius(u) * 1.12 + 0.03;
      rings.push(<ToonMesh key={`${key}${k}`} geometry={GEO.ring} color={C.wave} position={[p.x, p.y, p.z]} quaternion={q} scale={r * gate} outline={2} />);
    }
  };
  add('e', ESO_CURVE, WAVES.eso, (u) => ESO_R * (1 + 0.45 * bump(u, u, 1)));
  add('s', STO_CURVE, WAVES.sto, stomachRadius, (u) => 0.3 + 0.7 * u);
  add('i', SI_CURVE, WAVES.si, () => SI_R * 1.3);
  add('c', COLON_CURVE, WAVES.col, (u) => colonRadius(u) * 1.2);
  return <>{rings}</>;
};

/* tia sÃ¡ng nhá» khi viÃªn bÃ£ ra ngoÃ i: nháº¹ nhÃ ng, chá»‰ lÃ  Ã¡nh láº¥p lÃ¡nh */
const ExitSparkles = ({t}: {t: number}) => {
  const a0 = B.exit + 0.9;
  if (t < a0 || t > a0 + 1.8) return null;
  const f = clamp01((t - a0) / 1.8);
  return (
    <>
      {Array.from({length: 10}, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const r = 0.2 + f * 0.9;
        return <ToonMesh key={i} geometry={GEO.octa} color={raw('#FFD23C')} position={[ANUS_POS.x + Math.cos(a) * r, ANUS_POS.y - 0.5 + Math.sin(a) * r * 0.8, ANUS_POS.z + 0.2]} rotation={[t * 3, t * 2 + i, 0]} scale={0.1 * (1 - f)} outline={0} />;
      })}
    </>
  );
};

export const TieuHoaVideo = () => {
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
      <TieuHoaOverlay t={t} frame={frame} />
    </AbsoluteFill>
  );
};


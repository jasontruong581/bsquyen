/* "Sân khấu" phóng to thành ruột non (cảnh 8-9): tấm niêm mạc phủ nhung mao đung đưa, một nhung mao lớn (trong suốt) có mạch máu nhỏ,
   chất dinh dưỡng thấm qua thành rồi theo máu chảy ra mạch lớn. Đặt ở phía trước bụng (STAGE) để camera lao vào mà không đụng các cơ quan. */
import * as THREE from 'three';
import {ToonMesh} from '../../V005 - 2026-11-26 - phoi-tam-soat/canh-3d/chat-lieu';
import {
  CAP_DOWN, CAP_UP, HERO, STAGE, VESSEL, VILLI_ROWS, buildMucosa, buildTube, buildVillus, buildVilliRows, mulberry, villiRowZ, V,
} from './giai-phau';
import {C, raw} from './mau';
import {S, T, clamp01, kf, pop, sm} from './moc';

export const STAGE_ON = T.zoomIn + 0.5;
export const STAGE_OFF = S(10);
export const stageScale = (t: number) => (t < STAGE_ON ? 0 : pop(t, STAGE_ON, 0.7) * (1 - sm(t, STAGE_OFF - 0.1, 0.7)));
/** Toạ độ thế giới của một điểm trong sân khấu */
export const stageWorld = (p: THREE.Vector3) => p.clone().add(STAGE);
export const heroWorld = (y: number) => stageWorld(V(HERO.x, y * HERO.s, HERO.z));

const GEO = {
  rows: buildVilliRows(),
  mucosa: buildMucosa(),
  villus: buildVillus(),
  capUp: buildTube(CAP_UP, 0.03, 30, 8),
  capDown: buildTube(CAP_DOWN, 0.03, 30, 8),
  vessel: buildTube(VESSEL, 0.17, 60, 10),
  sphere: new THREE.SphereGeometry(1, 16, 12),
  octa: new THREE.OctahedronGeometry(1),
};
const BASIC = {
  blood: new THREE.MeshBasicMaterial({color: raw('#FF2E43'), toneMapped: false}),
  nutrient: new THREE.MeshBasicMaterial({color: raw('#FFD23C'), toneMapped: false}),
  green: new THREE.MeshBasicMaterial({color: raw('#9BF08C'), toneMapped: false}),
};

const rand = mulberry(11);
const N_NUT = 14;
const NUT = Array.from({length: N_NUT}, (_, i) => ({
  x: (rand() - 0.5) * 3.4,
  y: 2.0 + rand() * 1.5,
  z: 1.8 + rand() * 1.9,
  side: i % 2 ? 1 : -1,
  delay: i * 0.17,
  gold: i % 3 !== 0,
}));
const CHYME = Array.from({length: 6}, () => ({x: (rand() - 0.5) * 4, y: 1.8 + rand() * 1.6, z: -2 + rand() * 5, r: 0.13 + rand() * 0.1, ph: rand() * 6}));
const SPARK = Array.from({length: 18}, () => ({x: (rand() - 0.5) * 5.4, y: 1.4 + rand() * 1.6, z: -3 + rand() * 6, ph: rand() * 6}));

const heroLocal = (p: THREE.Vector3) => V(HERO.x + p.x * HERO.s, p.y * HERO.s, HERO.z + p.z * HERO.s);

/** Vị trí hạt dinh dưỡng thứ i (toạ độ sân khấu): lơ lửng trong lòng ruột → thấm qua thành nhung mao → chảy vào mao mạch → ra mạch lớn */
const nutrientPos = (n: (typeof NUT)[number], i: number, t: number) => {
  const a0 = T.absorb + n.delay;
  const float = V(n.x + 0.16 * Math.sin(t * 1.7 + i), n.y + 0.2 * Math.sin(t * 1.3 + 2 * i), n.z + 0.12 * Math.cos(t * 1.1 + i));
  if (t < a0) return {p: float, vis: t > T.surface + 0.2 + i * 0.05, rest: true};
  const wall = heroLocal(V(0.18 * n.side, 0.62, 0));
  if (t < a0 + 1.0) {
    const f = sm(t, a0, 1.0);
    return {p: float.clone().lerp(wall, f), vis: true, rest: false};
  }
  const loopT = 1.5;
  if (t < a0 + 1.0 + loopT) {
    const f = (t - a0 - 1.0) / loopT;
    const p = f < 0.5 ? CAP_UP.getPointAt(0.55 + 0.45 * (f / 0.5)) : CAP_DOWN.getPointAt((f - 0.5) / 0.5);
    return {p: heroLocal(p), vis: true, rest: false};
  }
  const f = clamp01((t - a0 - 1.0 - loopT) / 2.6);
  return {p: VESSEL.getPointAt(0.5 + 0.5 * f).add(V(0, 0.02, 0)), vis: f < 1, rest: false};
};

export const Stage = ({t}: {t: number}) => {
  const sc = stageScale(t);
  if (sc < 0.01) return null;
  const heroOp = kf([[T.capillary - 0.3, 1], [T.capillary + 0.5, 0.4]], t);
  const heroTrans = heroOp < 0.99;
  const heroP = t < T.villiUp ? 0.0001 : Math.max(0.0001, pop(t, T.villiUp + 0.9, 0.6));
  const capP = t < T.capillary ? 0 : Math.max(0.0001, pop(t, T.capillary, 0.5));
  const dots: JSX.Element[] = [];
  if (t > T.capillary + 0.5) {
    for (let k = 0; k < 7; k++) {
      const f = (k / 7 + (t - T.capillary) * 0.32) % 1;
      const p = f < 0.5 ? CAP_UP.getPointAt(f * 2) : CAP_DOWN.getPointAt((f - 0.5) * 2);
      dots.push(<mesh key={`d${k}`} geometry={GEO.sphere} material={BASIC.blood} position={heroLocal(p)} scale={0.055 * HERO.s} />);
    }
    for (let k = 0; k < 6; k++) {
      const f = (k / 6 + (t - T.capillary) * 0.2) % 1;
      dots.push(<mesh key={`v${k}`} geometry={GEO.sphere} material={BASIC.blood} position={VESSEL.getPointAt(0.35 + 0.65 * f).add(V(0, 0.2, 0))} scale={0.075} />);
    }
  }
  const nuts = NUT.map((n, i) => {
    const s = nutrientPos(n, i, t);
    if (!s.vis) return null;
    const r = (s.rest ? 0.085 : 0.07) * (1 + 0.15 * Math.sin(t * 6 + i));
    return <ToonMesh key={`n${i}`} geometry={n.gold ? GEO.sphere : GEO.octa} color={n.gold ? C.nutrient : raw('#7BE06B')} position={[s.p.x, s.p.y, s.p.z]} rotation={[t * 2 + i, t * 1.6, 0]} scale={r} outline={3} />;
  });
  // cục thức ăn dở dang trôi trong lòng ruột, nhỏ dần khi chất dinh dưỡng được lấy đi
  const shrink = 1 - 0.75 * sm(t, T.surface, T.absorb + 2 - T.surface);
  const chyme = CHYME.map((c, i) => (
    <ToonMesh key={`c${i}`} geometry={GEO.sphere} color={C.cream} position={[c.x + 0.3 * Math.sin(t * 0.7 + c.ph), c.y + 0.15 * Math.sin(t * 1.1 + c.ph), c.z]} scale={[c.r * shrink * 1.2, c.r * shrink * 0.85, c.r * shrink]} outline={3} />
  ));
  const sparks = t > T.surface - 0.2 && t < T.capillary
    ? SPARK.map((s, i) => {
        const a = (0.5 + 0.5 * Math.sin(t * 4 + s.ph)) * sm(t, T.surface - 0.2, 0.5) * (1 - sm(t, T.capillary - 0.5, 0.5));
        return <ToonMesh key={`s${i}`} geometry={GEO.octa} color={C.nutrient} position={[s.x, s.y + 0.15 * Math.sin(t * 1.2 + s.ph), s.z]} rotation={[t * 2 + s.ph, t * 3, 0]} scale={0.1 * a} outline={0} />;
      })
    : null;

  return (
    <group position={[STAGE.x, STAGE.y, STAGE.z]} scale={sc}>
      <ToonMesh geometry={GEO.mucosa} color={C.mucosa} outline={5} />
      {GEO.rows.map((g, r) => {
        const grow = t < T.villiUp ? 0.0001 : Math.max(0.0001, pop(t, T.villiUp + 0.11 * (VILLI_ROWS - 1 - r), 0.6));
        return (
          <group key={r} position={[0, 0, villiRowZ(r)]} rotation={[0.05 * Math.sin(t * 1.9 + r * 0.9), 0, 0.07 * Math.sin(t * 2.3 + r * 0.7)]} scale={[1, grow, 1]}>
            <ToonMesh geometry={g} color={C.villi} outline={3} />
          </group>
        );
      })}
      {/* nhung mao lớn có mao mạch */}
      <group position={[HERO.x, 0, HERO.z]} scale={HERO.s * heroP} rotation={[0.03 * Math.sin(t * 1.6), 0, 0.05 * Math.sin(t * 2.1)]}>
        <ToonMesh geometry={GEO.villus} color={C.villi} opacity={heroOp} rim={heroTrans ? 1 : 0} rimColor={raw('#2F8F58')} outline={4} depthWrite={!heroTrans} renderOrder={4} />
        {capP > 0 && (
          <group scale={capP}>
            <ToonMesh geometry={GEO.capUp} color={C.capUp} outline={2} />
            <ToonMesh geometry={GEO.capDown} color={C.capDown} outline={2} />
          </group>
        )}
      </group>
      {capP > 0 && <ToonMesh geometry={GEO.vessel} color={C.vessel} outline={4} scale={[capP, 1, 1]} />}
      {dots}
      {nuts}
      {chyme}
      {sparks}
    </group>
  );
};

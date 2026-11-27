/* V013 "Lắp tử cung và buồng trứng" (video 3D dài): dựng bằng @remotion/three (three.js), toàn bộ hình khối sinh bằng code (giai-phau.ts),
   tô bóng toon + viền đen + bóng đổ nhẹ lên tường phía sau, camera một mạch (may-quay.ts), nhãn 2D có đường chỉ (lop-phu.tsx).
   Mạch xuyên suốt: quả trứng nhân vật đi từ nang trứng, qua vòi trứng, vào khoang tử cung (hanh-trinh.ts). Dùng lại chất liệu toon của V005. */
import {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {useFonts} from '../../src/common/fonts';
import {FPS} from '../../src/timeline';
import {ToonMesh, shared, HEIGHT, WIDTH} from '../../V005 - 2026-11-26 - phoi-tam-soat/canh-3d/chat-lieu';
import {
  CAV_C, FINGER_N, FOLLICLES, FOLLICLE_DIR, FOLLICLE_W, FUNNEL, OVARY_C, OVARY_R, V, buildCanal, buildCavityBack, buildCervix, buildLining, buildOvary, buildPear,
  buildPelvis, buildStem, buildUterusWall, cavityHalf, finger, makeFingerGeometry, makeTubePipe, mulberry, tubeCurve, LINING_THICK, LINING_THIN,
} from './giai-phau';
import {C, raw} from './mau';
import {cameraAt} from './may-quay';
import {Bubbles, TuCungOverlay} from './lop-phu';
import {T, clamp01, kf, pop, sm, smooth, timeline, win} from './moc';
import {B, eggAt, HOME} from './hanh-trinh';

export const id = 'lap-tu-cung';
export const durationInFrames = Math.ceil(timeline.total * FPS);

const GEO = {
  wall: buildUterusWall(),
  back: buildCavityBack(),
  ao: buildLining(0.93),
  thin: buildLining(LINING_THIN),
  thick: buildLining(LINING_THICK),
  cervix: buildCervix(),
  canal: buildCanal(),
  ovary: buildOvary(),
  pelvis: buildPelvis(),
  pear: buildPear(),
  stem: buildStem(),
  finger: makeFingerGeometry(),
  tubeR: makeTubePipe(1).geometry,
  tubeL: makeTubePipe(-1).geometry,
  sphere: new THREE.SphereGeometry(1, 24, 18),
  octa: new THREE.OctahedronGeometry(1),
  dodeca: new THREE.DodecahedronGeometry(1),
  box: new THREE.BoxGeometry(1, 1, 1),
  smile: new THREE.TorusGeometry(0.4, 0.07, 8, 28, Math.PI),
  ring: new THREE.TorusGeometry(1, 0.08, 8, 40),
  glow: new THREE.TorusGeometry(1, 0.045, 8, 48),
};

const basic = (color: string) => new THREE.MeshBasicMaterial({color: raw(color), toneMapped: false});
const DOT = {
  confetti: ['#FF8A1F', '#FFD23C', '#2FC46B', '#1F8FE8', '#FF5C8A', '#7B4FE0'].map(basic),
  glow: new THREE.MeshBasicMaterial({color: raw('#B79BFF'), toneMapped: false, transparent: true}),
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

/* ---------- một bộ phận: bóng mờ (bản vẽ) → bay vào và nảy ra đặc ---------- */
const ghostAlpha = (t: number, ta: number) => sm(t, 0.6, 1.2) * (1 - sm(t, ta - 0.05, 0.25));
const Pop = ({t, ta, from, pivot, dur = 0.65, children}: {t: number; ta: number; from: [number, number, number]; pivot: THREE.Vector3; dur?: number; children: React.ReactNode}) => {
  if (t < ta - 0.02) return null;
  const sol = pop(t, ta, dur);
  const k = Math.max(0.0001, sol);
  const off = 1 - clamp01(sol);
  return (
    <group position={[from[0] * off + pivot.x * (1 - k), from[1] * off + pivot.y * (1 - k), from[2] * off + pivot.z * (1 - k)]} scale={k}>
      {children}
    </group>
  );
};
const Ghost = ({t, ta, geometry, position, scale}: {t: number; ta: number; geometry: THREE.BufferGeometry; position?: [number, number, number]; scale?: [number, number, number]}) => {
  const g = ghostAlpha(t, ta);
  if (g < 0.01) return null;
  return <ToonMesh geometry={geometry} color={C.ghost} rimColor={C.ghost} opacity={0.22 * g} rim={1} outline={0} renderOrder={1} position={position} scale={scale} />;
};

/* ---------- gương mặt nhân vật (quả lê, quả trứng) ---------- */
const Face = ({t, mood = 'vui', z = 0.9, depth = false}: {t: number; mood?: 'vui' | 'tinh' | 'ngac'; z?: number; depth?: boolean}) => {
  const blink = t % 3.1 < 0.12 ? 0.15 : 1;
  const common = {outline: 0, depthTest: depth, opacity: 0.998, renderOrder: depth ? undefined : 32};
  return (
    <group position={[0, 0.02, z]}>
      {[-0.34, 0.34].map((x) => (
        <group key={x} position={[x, 0.2, 0.1]}>
          <ToonMesh geometry={GEO.sphere} color={C.white} scale={[0.27, 0.32 * blink * (mood === 'ngac' ? 1.25 : 1), 0.1]} {...common} />
          <ToonMesh geometry={GEO.sphere} color={C.pupil} position={[0.04 * Math.sin(t * 1.3), -0.02, 0.1]} scale={[0.12, 0.14 * Math.max(blink, 0.3), 0.05]} {...common} />
        </group>
      ))}
      {[-0.62, 0.62].map((x) => (
        <ToonMesh key={x} geometry={GEO.sphere} color={C.cheek} position={[x, -0.12, 0.05]} scale={[0.17, 0.1, 0.05]} {...common} />
      ))}
      {mood === 'ngac' ? (
        <ToonMesh geometry={GEO.sphere} color={C.dark} position={[0, -0.25, 0.1]} scale={[0.13, 0.17, 0.05]} {...common} />
      ) : (
        <ToonMesh geometry={GEO.smile} color={C.dark} position={[0, -0.12, 0.08]} rotation={[0, 0, Math.PI + 0.08]} scale={[mood === 'vui' ? 1.1 : 0.8, mood === 'vui' ? 1.1 : 0.8, 1]} {...common} />
      )}
    </group>
  );
};

/* ---------- quả lê mở đầu: bằng cỡ cơ quan sẽ lắp ---------- */
const Pear = ({t}: {t: number}) => {
  if (t > T.pearAway + 0.8) return null;
  const inK = Math.max(0.0001, pop(t, 0.1, 0.6));
  const away = sm(t, T.pearAway - 0.05, 0.7);
  const k = inK * (1 - away);
  const wob = 0.07 * Math.sin(t * 2.6);
  const squash = 1 - 0.12 * Math.sin(Math.PI * clamp01((t - T.pearAway + 0.1) / 0.35));
  return (
    <group position={[0, -1.35 + 3.0 * away * away, 0.5]} rotation={[0, t * 0.5, wob]} scale={[k / squash, k * squash, k]}>
      <ToonMesh geometry={GEO.pear} color={C.pear} rimColor={C.pearRim} outline={5} castShadow />
      <group position={[0, 2.38, 0]} rotation={[0, 0, -0.35]}>
        <ToonMesh geometry={GEO.stem} color={C.stem} outline={3} />
      </group>
      <ToonMesh geometry={GEO.sphere} color={C.leaf} position={[0.42, 2.62, 0.05]} rotation={[0, 0, -0.5]} scale={[0.4, 0.15, 0.22]} outline={3} />
      <group rotation={[0, -t * 0.5, 0]}>
        <group position={[0, 0.95, 0]} scale={0.95}>
          <Face t={t} z={0.88} depth />
        </group>
      </group>
    </group>
  );
};

/* ---------- quả trứng nhân vật ---------- */
const EggChar = ({t}: {t: number}) => {
  const e = eggAt(t);
  if (!e.visible || e.s < 0.01) return null;
  const wob = 1 + 0.04 * Math.sin(t * 7);
  return (
    <group position={e.p} scale={e.s}>
      <ToonMesh geometry={GEO.sphere} color={C.eggHalo} rimColor={C.eggHalo} opacity={0.3} rim={1} outline={0} scale={1.3} depthTest={false} renderOrder={29} />
      <group scale={[wob, 1 / wob, wob]}>
        <ToonMesh geometry={GEO.sphere} color={C.egg} outline={3} depthTest={false} opacity={0.998} renderOrder={30} />
      </group>
      <Face t={t} mood={e.mood} />
    </group>
  );
};

/* ---------- tia sáng nhỏ (tan thành sao, thụ tinh, nang nứt) ---------- */
const Sparks = ({center, n, f, radius, size, color = C.spark, seed = 3, top = true}: {center: THREE.Vector3; n: number; f: number; radius: number; size: number; color?: string; seed?: number; top?: boolean}) => {
  if (f <= 0 || f >= 1) return null;
  const r = mulberry(seed);
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + r() * 0.6;
        const rr = radius * (0.35 + 0.65 * smooth(f)) * (0.8 + 0.4 * r());
        return <ToonMesh key={i} geometry={GEO.octa} color={color} position={[center.x + Math.cos(a) * rr, center.y + Math.sin(a) * rr * 0.9, center.z + 0.2]} rotation={[f * 6 + i, f * 5, 0]} scale={size * (1 - f)} outline={0} depthTest={!top} renderOrder={top ? 28 : undefined} />;
      })}
    </>
  );
};

/* ---------- tua vòi: ngón thon xếp quanh miệng phễu, đung đưa, ôm lấy quả trứng ---------- */
const Fingers = ({t, s}: {t: number; s: 1 | -1}) => {
  if (t < T.funnel - 0.05) return null;
  const F = FUNNEL(s);
  const amp = 0.14 + 0.34 * win(t, T.sweep - 0.2, T.sweep + 1.9, 0.3) + (s === 1 ? 0.18 * win(t, T.catch - 0.3, T.enter + 0.6, 0.3) : 0);
  const embrace = s === 1 ? sm(t, T.catch, 0.8) * (1 - sm(t, T.enter + 0.7, 0.8)) : 0;
  return (
    <>
      {Array.from({length: FINGER_N}, (_, i) => {
        const a = (i / FINGER_N) * Math.PI * 2 + 0.3;
        const f = finger(i);
        const grow = Math.max(0.0001, pop(t, T.funnel + 0.07 * i, 0.5));
        const dir = V(-0.46 * s, -0.89, 0).add(V(Math.cos(a), 0, Math.sin(a)).multiplyScalar(0.55));
        if (embrace > 0) dir.lerp(V(-0.15 * s, -1, 0.12), embrace * 0.7);
        dir.normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(V(0, -1, 0), dir).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), amp * Math.sin(t * 2.6 + f.ph)));
        return <ToonMesh key={i} geometry={GEO.finger} color={C.finger} position={[F.x + Math.cos(a) * 0.22, F.y - 0.15, F.z + Math.sin(a) * 0.22]} quaternion={q} scale={f.len * grow} outline={3} castShadow />;
      })}
    </>
  );
};

/* ---------- buồng trứng + các nang trứng ---------- */
const Follicles = ({t, s}: {t: number; s: 1 | -1}) => {
  const out: JSX.Element[] = [];
  FOLLICLES.forEach((fo, i) => {
    const hero = s === 1 && i === 0;
    const grow = t < T.follicles + 0.1 * i ? 0 : Math.max(0.0001, pop(t, T.follicles + 0.1 * i, 0.5));
    if (grow <= 0) return;
    let r = fo.r;
    if (hero) {
      r = kf([[T.bulge, 0.3], [T.bulge + 1.9, 0.6]], t);
      if (t > T.burst) r = kf([[T.burst, 0.6], [T.burst + 0.3, 0.17]], t);
    }
    const n = V(fo.p.x / OVARY_R.x, fo.p.y / OVARY_R.y, fo.p.z / OVARY_R.z).normalize();
    const c = V(fo.p.x * s * OVARY_R.x, fo.p.y * OVARY_R.y, fo.p.z * OVARY_R.z).add(V(n.x * s, n.y, n.z).multiplyScalar(0.2 * r));
    const key = 0.72;
    out.push(
      <group key={i} position={[c.x, c.y, c.z]} scale={r * grow}>
        <ToonMesh geometry={GEO.sphere} color={C.follicle} rimColor={C.follicleRim} opacity={key} rim={1} outline={0} renderOrder={3} />
        {!hero && <ToonMesh geometry={GEO.sphere} color={C.egg} position={[0, 0, 0.1]} scale={0.33} outline={2} />}
      </group>,
    );
  });
  return <>{out}</>;
};
const Ovary = ({t, s}: {t: number; s: 1 | -1}) => {
  const ta = T.ovaries + (s === 1 ? 0 : 0.2);
  const c: [number, number, number] = [OVARY_C.x * s, OVARY_C.y, OVARY_C.z];
  return (
    <>
      <Ghost t={t} ta={ta - 0.1} geometry={GEO.ovary} position={c} scale={[OVARY_R.x, OVARY_R.y, OVARY_R.z]} />
      <Pop t={t} ta={ta - 0.1} from={[9 * s, -1.5, 0]} pivot={V(c[0], c[1], c[2])}>
        <group position={c}>
          <ToonMesh geometry={GEO.ovary} color={C.ovary} rimColor={C.ovaryRim} scale={[OVARY_R.x, OVARY_R.y, OVARY_R.z]} outline={5} castShadow />
          <Follicles t={t} s={s} />
        </group>
      </Pop>
    </>
  );
};

/* ---------- vòi trứng ---------- */
const Tube = ({t, s}: {t: number; s: 1 | -1}) => {
  const see = s === 1 ? sm(t, B.mouth1 - 0.3, 0.4) * (1 - sm(t, B.tube1 - 0.2, 0.5)) : 0;
  const geom = s === 1 ? GEO.tubeR : GEO.tubeL;
  const rings: JSX.Element[] = [];
  const tp = clamp01((t - T.length) / 2.0);
  if (tp > 0 && tp < 1) {
    const curve = tubeCurve(s);
    for (let k = 0; k < 3; k++) {
      const u = clamp01(tp * 1.15 - k * 0.12);
      if (u <= 0 || u >= 1) continue;
      const p = curve.getPointAt(u);
      const q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), curve.getTangentAt(u).normalize());
      rings.push(<ToonMesh key={k} geometry={GEO.ring} color={C.spark} position={[p.x, p.y, p.z]} quaternion={q} scale={0.15 + 0.12 * Math.min(1, u * 1.3) + 0.1} outline={2} />);
    }
  }
  return (
    <>
      <Ghost t={t} ta={T.tubes - 0.1} geometry={geom} />
      <Pop t={t} ta={T.tubes - 0.1} from={[9 * s, 3, 0]} pivot={V(2.6 * s, 1.5, 0)}>
        <ToonMesh geometry={geom} color={C.tube} rimColor={C.tubeRim} opacity={1 - 0.45 * see} rim={see > 0.02 ? 1 : 0} outline={4} castShadow depthWrite={see < 0.02} renderOrder={see > 0.02 ? 3 : undefined} />
        {rings}
      </Pop>
      <Fingers t={t} s={s} />
    </>
  );
};

/* ---------- mảnh lớp lót bong ra và giọt nhẹ chảy qua ống hẹp (màu hồng nhạt, không đỏ) ---------- */
const FLK = (() => {
  const r = mulberry(9);
  return Array.from({length: 14}, (_, i) => {
    const y = 0.8 - 2.1 * r();
    const x = (i % 2 ? 1 : -1) * cavityHalf(y) * (0.25 + 0.55 * r());
    return {p0: V(x, y, 0.64), pool: V((r() - 0.5) * 0.36, -1.0 - 0.7 * r(), 0.64), ph: r() * 6, sz: 0.2 + 0.09 * r()};
  });
})();
const Flakes = ({t}: {t: number}) => {
  if (t < T.shed || t > T.blood + 4.2) return null;
  const els: JSX.Element[] = [];
  FLK.forEach((f, i) => {
    const t0 = T.shed + 0.2 + i * 0.09;
    const tl = T.blood + 0.1 + i * 0.1;
    if (t < t0) return;
    const grow = sm(t, t0, 0.3);
    let p: THREE.Vector3;
    let sc = f.sz * grow;
    if (t < tl) {
      const q = sm(t, t0, 1.5);
      p = f.p0.clone().lerp(f.pool, q).add(V(0.05 * Math.sin(t * 2 + f.ph), 0.05 * Math.cos(t * 1.7 + f.ph), 0));
    } else {
      const u = clamp01((t - tl) / 2.2);
      const pts = [f.pool, V(0, -1.9, 0.62), V(0, -2.5, 0.8), V(0, -3.6, 0.82), V(0, -4.7, 0.82)];
      const seg = u * (pts.length - 1);
      const k = Math.min(pts.length - 2, Math.floor(seg));
      p = pts[k].clone().lerp(pts[k + 1], smooth(seg - k));
      sc *= 1 - sm(t, tl + 1.6, 0.6);
    }
    if (sc < 0.002) return;
    els.push(<ToonMesh key={i} geometry={GEO.dodeca} color={i % 3 ? C.flake : C.drop} position={[p.x, p.y, p.z]} rotation={[t * 1.5 + i, t + i, 0]} scale={[sc, sc * 0.7, sc * 0.6]} outline={2} />);
  });
  return <>{els}</>;
};

/* ---------- cảnh toàn bộ ---------- */
const WALL_Z = -2.6;
const PIV = CAV_C;

const Scene = ({t}: {t: number}) => {
  shared.uTime.value = t;
  shared.uLamp.value = 0;
  shared.uFogK.value = 0;

  // tử cung co bóp nhẹ ở lời "co bóp"
  const sqF = clamp01((t - T.squeeze) / 1.3);
  const sq = t > T.squeeze && t < T.squeeze + 1.3 ? Math.sin(Math.PI * 2 * sqF) ** 2 * Math.sin(Math.PI * sqF) : 0;
  const thinK = t < T.liningThin ? 0 : Math.max(0.0001, pop(t, T.liningThin, 0.6));
  const thickK = t < T.liningThick ? 0 : Math.max(0.0001, pop(t, T.liningThick, 0.7));
  const thickFade = 1 - sm(t, T.shed + 0.2, 0.9);
  const eggT = eggAt(t);
  const cervP = t < T.cervix - 0.2 ? 0 : 1;
  const canalGlow = win(t, T.canal - 0.1, T.canal + 2.2, 0.3);
  const glow = win(t, T.screening - 0.1, T.screening + 3.6, 0.4);
  DOT.glow.opacity = glow * (0.65 + 0.3 * Math.sin(t * 5));

  return (
    <>
      <CameraRig t={t} />
      <directionalLight position={[-3, 5, 12]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-near={1} shadow-camera-far={60} shadow-radius={6} shadow-bias={-0.0004} />
      {/* tường phía sau chỉ để hứng bóng đổ nhẹ */}
      <mesh position={[0, 0, WALL_Z]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.06} color="#2a2a6a" />
      </mesh>

      {/* khung chậu mờ làm bối cảnh */}
      <ToonMesh geometry={GEO.pelvis} color={C.pelvis} rimColor={C.pelvisRim} opacity={0.34 * sm(t, 0.25, 0.9)} rim={1} outline={0} renderOrder={0} />

      <Pear t={t} />

      {/* tử cung: thành cơ dày có khoang rỗng, nền khoang và lớp lót */}
      <Ghost t={t} ta={T.uterus} geometry={GEO.wall} />
      <Pop t={t} ta={T.uterus} from={[0, 9, 0]} pivot={V(0, 0, 0)}>
        <group position={[PIV.x, PIV.y, PIV.z]} scale={[1 - 0.07 * sq, 1 + 0.035 * sq, 1]}>
          <group position={[-PIV.x, -PIV.y, -PIV.z]}>
            <ToonMesh geometry={GEO.wall} color={C.wall} rimColor={C.wallRim} outline={5} castShadow />
            <ToonMesh geometry={GEO.back} color={C.cavity} outline={0} />
            <ToonMesh geometry={GEO.ao} color={C.cavityDark} outline={0} />
            {thinK > 0.001 && (
              <group position={[0, PIV.y * (1 - thinK), 0]} scale={thinK}>
                <ToonMesh geometry={GEO.thin} color={C.lining} outline={0} />
              </group>
            )}
            {thickK > 0.001 && thickFade > 0.01 && (
              <group position={[0, PIV.y * (1 - thickK), 0]} scale={thickK}>
                <ToonMesh geometry={GEO.thick} color={C.lining} opacity={thickFade} outline={0} />
              </group>
            )}
          </group>
        </group>
      </Pop>

      {/* cổ tử cung và ống hẹp (lắp ở cuối) */}
      <Ghost t={t} ta={T.cervix} geometry={GEO.cervix} />
      {cervP > 0 && (
        <Pop t={t} ta={T.cervix - 0.2} from={[0, -9, 0]} pivot={V(0, -2.7, 0)}>
          <ToonMesh geometry={GEO.cervix} color={C.cervix} rimColor={C.cervixRim} outline={5} castShadow />
          <ToonMesh geometry={GEO.canal} color={canalGlow > 0.3 ? raw('#8D6BE6') : C.canal} outline={2} />
        </Pop>
      )}
      {glow > 0.01 && <mesh geometry={GEO.glow} material={DOT.glow} position={[0, -2.7, 0.75]} scale={[1.15 + 0.06 * Math.sin(t * 5), 1.85 + 0.08 * Math.sin(t * 5), 1]} />}

      <Ovary t={t} s={1} />
      <Ovary t={t} s={-1} />
      <Tube t={t} s={1} />
      <Tube t={t} s={-1} />

      <Flakes t={t} />
      <EggChar t={t} />
      {/* tia sáng: nang nứt, nơi gặp nhau trong vòi, quả trứng tan */}
      <Sparks center={FOLLICLE_W.clone().add(FOLLICLE_DIR.clone().multiplyScalar(0.5))} n={9} f={clamp01((t - T.burst) / 1.4)} radius={0.9} size={0.09} color={C.follicle} seed={5} top={false} />
      <Sparks center={t > T.meet - 0.2 ? eggAt(T.meet + 0.1).p : HOME} n={10} f={clamp01((t - (T.meet - 0.1)) / 1.5)} radius={0.8} size={0.12} seed={7} />
      <Sparks center={eggT.p} n={8} f={eggT.fade > 0 ? eggT.fade : 0} radius={0.8} size={0.13} seed={11} />

      {/* hoa giấy chúc mừng */}
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

export const TuCungVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();
  const bg = useMemo(() => 'linear-gradient(180deg, #d9eeff 0%, #b4c3f4 52%, #8e9be6 100%)', []);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: bg}} />
      <Bubbles t={t} />
      <AbsoluteFill>
        <ThreeCanvas width={WIDTH} height={HEIGHT} shadows linear flat dpr={1} camera={{fov: 32, near: 0.1, far: 140, position: [0, 3, 30]}} gl={{antialias: true}}>
          <Scene t={t} />
        </ThreeCanvas>
      </AbsoluteFill>
      <TuCungOverlay t={t} frame={frame} />
    </AbsoluteFill>
  );
};


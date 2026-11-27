/* Mô hình chiếc răng cắt bỏ một góc: các lớp lắp lần lượt (tủy, ngà, men, xê măng, xương hàm, dây chằng, nướu), thần kinh và mạch máu,
   mảng bám và vi khuẩn, lỗ sâu lan dần, và chiếc răng nguyên vẹn có mặt ở đoạn mở đầu. */
import * as THREE from 'three';
import {ToonMesh} from '../../V005 - 2026-11-26 - phoi-tam-soat/canh-3d/chat-lieu';
import {DECAY_PATH, NERVE_R, Pipe, VESSEL_R, buildVessel, crownSurface, decayRadius, tooth, V} from './giai-phau';
import {C} from './mau';
import {Bacterium} from './nhan-vat';
import {Face, GEO, Ghost, Pop, Sparks, basic} from './chung';
import {T, clamp01, pop, sm, smooth, win} from './moc';
import {TOP, decayGrow} from './hanh-trinh';

const L = tooth();
const SEAM = new THREE.MeshBasicMaterial({color: '#0b1c2e', side: THREE.DoubleSide});

type LayerData = (typeof L)['pulp'];
const Seams = ({l}: {l: LayerData}) => (
  <>
    <mesh geometry={l.seamZ} material={SEAM} />
    <mesh geometry={l.seamX} material={SEAM} />
  </>
);

const GEOM = {
  nerve: buildVessel(NERVE_R, 1, 0.055),
  vessel: buildVessel(VESSEL_R, -1, 0.05),
};
const DECAY_PIPE = new Pipe(DECAY_PATH, 60, 12);
const CRUMB_MAT = basic('#F1FAFF');

type Part = {key: 'pulp' | 'dentin' | 'enamel' | 'cement' | 'bone' | 'ligament' | 'gum'; ta: number; from: [number, number, number]; color: string; rim?: string; outline?: number};
const PARTS: Part[] = [
  {key: 'pulp', ta: T.pulp - 0.25, from: [-9, 2, 0], color: C.pulp, rim: C.pulpRim},
  {key: 'dentin', ta: T.dentin - 0.7, from: [9, 3, 0], color: C.dentin, rim: C.dentinRim},
  {key: 'enamel', ta: T.enamel - 0.9, from: [0, 9, 0], color: C.enamel, rim: C.enamelRim},
  {key: 'cement', ta: T.cement - 0.4, from: [-9, -2, 0], color: C.cement},
  {key: 'bone', ta: T.bone - 0.5, from: [0, -9, 0], color: C.bone, rim: C.boneRim},
  {key: 'ligament', ta: T.ligament - 0.3, from: [9, -3, 0], color: C.ligament},
  {key: 'gum', ta: T.gum - 0.5, from: [-9, 1, 0], color: C.gum, rim: C.gumRim},
];
const PIVOT = V(0, 0, 0);

/* điểm đặt vi khuẩn và mảng bám trên mặt thân răng phía nhìn thấy (góc trước-trái chưa bị cắt) */
const BAC = [
  [-1, 0.15, 1.0],
  [-0.5, 0.9, 0.8],
  [-1.0, 0.9, 0.3],
  [-0.25, 0.25, 1.0],
  [-0.1, 1.0, 0.95],
].map((d, i) => {
  const {p, n} = crownSurface(V(d[0], d[1], d[2]));
  return {p: p.clone().addScaledVector(n, 0.2), n, s: 0.26 + 0.03 * (i % 2), ph: i * 1.7};
});
const PATCH = [
  [-1.4, 0.0, 0.7, 0.7],
  [-1, 0.15, 1, 0.62],
  [-0.65, 0.55, 1, 0.55],
  [-0.4, -0.05, 1, 0.55],
  [-0.9, 1.0, 0.5, 0.6],
  [-0.5, 0.9, 0.8, 0.5],
  [-0.1, 1.0, 0.95, 0.5],
].map(([x, y, z, r]) => {
  const {p, n} = crownSurface(V(x, y, z));
  return {p: p.clone().addScaledVector(n, 0.05), q: new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), n), r};
});

const crumbs = Array.from({length: 8}, (_, i) => ({
  v: V(0.5 + 1.2 * Math.cos(i * 2.3), 1.6 + 1.0 * ((i * 0.37) % 1), 0.8 + 0.5 * Math.sin(i * 1.7)),
  r: 0.1 + 0.05 * ((i * 0.61) % 1),
}));

/** Mảng bám và vi khuẩn trên mặt răng (đoạn mở đầu của phần "vì sao sâu răng") */
const filmOpacity = (t: number) => {
  if (t < T.plaque) return 0;
  return 0.5 * sm(t, T.plaque, 0.8);
};

export const ToothModel = ({t, brushClean = 0, showFilm = true, showBac = true}: {t: number; brushClean?: number; showFilm?: boolean; showBac?: boolean}) => {
  const grow = decayGrow(t);
  const pulpPulse = t > T.nearNerve && t < T.notSure + 1.5 ? 1 + 0.05 * Math.sin(t * 9) : 1;
  // lớp màng bám phủ trên men, trong suốt nhẹ, tím nhạt
  const film = showFilm ? filmOpacity(t) * (1 - brushClean) : 0;
  const eatWin = win(t, T.meal, T.zoomIn + 0.1, 0.4);
  const pains = t > T.painful - 0.2 && t < T.notSure + 1.8;
  const nerveSpark = pains ? clamp01((t - (T.painful - 0.2)) / 0.4) * (1 - sm(t, T.notSure + 1.0, 0.8)) : 0;

  DECAY_PIPE.update((u) => decayRadius(u, grow));
  const parts = PARTS.map((p) => {
    const l = L[p.key];
    return (
      <group key={p.key}>
        <Ghost t={t} ta={p.ta} geometry={l.body} op={p.key === 'bone' || p.key === 'gum' ? 0.16 : 0.22} />
        <Pop t={t} ta={p.ta} from={p.from} pivot={PIVOT}>
          <ToonMesh geometry={l.body} color={p.color} rimColor={p.rim} outline={p.key === 'ligament' ? 2 : 4} castShadow={p.key !== 'ligament'} scale={p.key === 'pulp' ? pulpPulse : 1} />
          <Seams l={l} />
        </Pop>
      </group>
    );
  });

  return (
    <>
      {parts}
      {/* thần kinh (vàng) và mạch máu (đỏ) trong ống tủy */}
      <Pop t={t} ta={T.vessels - 0.15} from={[0, -7, 0]} pivot={PIVOT} dur={0.55}>
        <ToonMesh geometry={GEOM.vessel} color={C.vessel} outline={2} />
      </Pop>
      <Pop t={t} ta={T.nerve - 0.1} from={[0, -7, 0]} pivot={PIVOT} dur={0.55}>
        <ToonMesh geometry={GEOM.nerve} color={C.nerve} outline={2} />
      </Pop>

      {/* mảng bám: những mảng lầy nhầy tím nhạt, trong suốt, dính trên mặt răng nhìn thấy được */}
      {film > 0.01 &&
        PATCH.map((q, i) => {
          const g = sm(t, T.plaque + 0.12 * i, 0.5);
          return (
            <group key={i} position={[q.p.x, q.p.y, q.p.z]} quaternion={q.q} scale={[q.r * 1.15 * g, q.r * 0.85 * g, 0.2 * g]}>
              <ToonMesh geometry={GEO.sphere} color={C.plaque} rimColor={C.bacteria} opacity={film} rim={1} outline={0} renderOrder={5} />
            </group>
          );
        })}

      {/* vi khuẩn bám trên mảng bám */}
      {showBac &&
        BAC.map((b, i) => {
          const a = T.bacteria + 0.22 * i;
          const k = t < a ? 0 : pop(t, a, 0.5);
          const gone = brushClean > 0 ? 1 - sm(brushClean, 0.15 + 0.12 * i, 0.3) : 1;
          const chew = eatWin;
          const off = V(0.05 * Math.sin(t * 2 + b.ph), 0.03 * Math.abs(Math.sin(t * 4.4 + b.ph)), 0);
          return <Bacterium key={i} t={t} p={b.p.clone().add(off)} s={b.s * Math.max(0, k) * gone} ph={b.ph} chew={chew} />;
        })}

      {/* vụn đường bay từ viên đường tới vi khuẩn, rồi giọt axit thấm vào men */}
      {t > T.sugar - 0.1 && t < T.zoomIn + 0.3 &&
        [0, 1, 2].map((k) => {
          const t0 = T.sugar + 0.35 * k;
          const f = clamp01((t - t0) / 0.9);
          if (f <= 0 || f >= 1) return null;
          const b = BAC[(k * 2) % BAC.length];
          const p = TOP.clone().lerp(b.p, smooth(f));
          p.y += 0.6 * Math.sin(Math.PI * f);
          return <ToonMesh key={`u${k}`} geometry={GEO.cube} color={C.sugar} rimColor={C.sugarRim} position={[p.x, p.y, p.z]} rotation={[t * 3, t * 2, 0]} scale={0.17} outline={2} />;
        })}
      {t > T.acid - 0.3 && t < T.zoomIn + 0.3 &&
        BAC.map((b, i) => {
          const f = (((t - T.acid) * 0.9 + i * 0.27) % 1 + 1) % 1;
          const p = b.p.clone().addScaledVector(b.n, 0.2 - 0.45 * f);
          return <ToonMesh key={`a${i}`} geometry={GEO.dodeca} color={C.acid} rimColor={C.bacteriaDark} position={[p.x, p.y, p.z]} rotation={[t * 3 + i, t * 2, 0]} scale={0.1 * Math.sin(Math.PI * f) * sm(t, T.acid - 0.3, 0.4)} outline={2} />;
        })}

      {/* lỗ sâu: vệt tối nằm trên mặt cắt, lan từ rãnh nhai xuống men, ngà rồi tủy */}
      {grow > 0.005 && (
        <group scale={[1, 1, 0.5]} position={[0, 0, 0.0]}>
          <ToonMesh geometry={DECAY_PIPE.geometry} color={C.decay} rimColor="#2E1E33" outline={0} renderOrder={6} />
        </group>
      )}
      {/* mảnh men vỡ ra khi lỗ sâu hình thành */}
      {t > T.hole - 0.1 && t < T.hole + 1.9 &&
        crumbs.map((c, i) => {
          const tau = t - T.hole - 0.05 * i;
          if (tau < 0) return null;
          const p = V(0.62 + c.v.x * 0.45 * tau, 2.35 + c.v.y * 0.5 * tau - 1.9 * tau * tau, 0.35 + c.v.z * 0.5 * tau);
          const sc = c.r * (1 - sm(tau, 0.9, 0.7));
          return <mesh key={i} geometry={GEO.dodeca} material={CRUMB_MAT} position={p} rotation={[tau * 4 + i, tau * 3, 0]} scale={sc} />;
        })}
      {/* thần kinh bị kích thích khi lỗ sâu chạm tủy: vài tia sáng nhỏ quanh sừng tủy */}
      {nerveSpark > 0 && <Sparks center={V(0.9, 1.75, 0.3)} n={9} f={(t * 1.6) % 1} radius={1.1} size={0.15 * nerveSpark} seed={21} color={C.nerve} />}
    </>
  );
};

/* ---------- chiếc răng nguyên vẹn mở đầu, có mặt ---------- */
export const HookTooth = ({t}: {t: number}) => {
  if (t > T.build + 1.6) return null;
  const inK = Math.max(0.0001, pop(t, 0.1, 0.6));
  const away = sm(t, T.build - 0.05, 0.7);
  const k = inK * (1 - away);
  const squash = 1 - 0.1 * Math.sin(Math.PI * clamp01((t - T.build + 0.1) / 0.35));
  const bounce = 0.12 * Math.abs(Math.sin(t * 2.4));
  return (
    <group position={[0, -0.9 + bounce + 3.2 * away * away, 0.5]} rotation={[0, Math.sin(t * 0.9) * 0.5, 0.04 * Math.sin(t * 2.6)]} scale={[k / squash, k * squash, k]}>
      <ToonMesh geometry={L.crownWhole} color={C.enamel} rimColor={C.enamelRim} outline={5} castShadow />
      <ToonMesh geometry={L.rootWhole} color={C.cement} outline={5} castShadow />
      <group position={[0, 1.15, 0]}>
        <Face t={t} z={1.5} scale={1.45} depth />
      </group>
    </group>
  );
};



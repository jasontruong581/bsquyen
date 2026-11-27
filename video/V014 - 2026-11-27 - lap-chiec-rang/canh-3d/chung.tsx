/* Phần dùng chung trong V014: bóng mờ rồi nảy ra đặc, gương mặt nhân vật, tia sáng, vật liệu không bóng. */
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {ToonMesh} from '../../V005 - 2026-11-26 - phoi-tam-soat/canh-3d/chat-lieu';
import {C, raw} from './mau';
import {V, mulberry} from './giai-phau';
import {clamp01, pop, sm, smooth} from './moc';

export {V, mulberry};

const rb = (w: number, h: number, d: number, r: number) => {
  const g = new RoundedBoxGeometry(w, h, d, 5, r);
  g.deleteAttribute('uv');
  return g;
};

export const GEO = {
  sphere: new THREE.SphereGeometry(1, 24, 18),
  octa: new THREE.OctahedronGeometry(1),
  dodeca: new THREE.DodecahedronGeometry(1),
  box: new THREE.BoxGeometry(1, 1, 1),
  smile: new THREE.TorusGeometry(0.4, 0.07, 8, 28, Math.PI),
  ring: new THREE.TorusGeometry(1, 0.06, 8, 48),
  cube: rb(1, 1, 1, 0.16),
  capsule: new THREE.CapsuleGeometry(0.5, 0.6, 6, 14),
};
GEO.capsule.deleteAttribute('uv');

export const basic = (color: string, transparent = false) => new THREE.MeshBasicMaterial({color: raw(color), toneMapped: false, transparent});

/* ---------- một bộ phận: bóng mờ (bản vẽ) → bay vào và nảy ra đặc ---------- */
export const ghostAlpha = (t: number, ta: number, from = 0.6) => sm(t, from, 1.2) * (1 - sm(t, ta - 0.05, 0.25));

export const Pop = ({t, ta, from, pivot, dur = 0.65, children}: {t: number; ta: number; from: [number, number, number]; pivot: THREE.Vector3; dur?: number; children: React.ReactNode}) => {
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

export const Ghost = ({t, ta, geometry, op = 0.2, position}: {t: number; ta: number; geometry: THREE.BufferGeometry; op?: number; position?: [number, number, number]}) => {
  const g = ghostAlpha(t, ta);
  if (g < 0.01) return null;
  return <ToonMesh geometry={geometry} color={C.ghost} rimColor={C.ghost} opacity={op * g} rim={1} outline={0} renderOrder={1} position={position} />;
};

/* ---------- gương mặt nhân vật ---------- */
export type Mood = 'vui' | 'tinh' | 'ngac' | 'lo' | 'trung';
export const Face = ({t, mood = 'vui', z = 0.9, depth = false, scale = 1}: {t: number; mood?: Mood; z?: number; depth?: boolean; scale?: number}) => {
  const blink = t % 3.1 < 0.12 ? 0.15 : 1;
  const common = {outline: 0, depthTest: depth, opacity: 0.998, renderOrder: depth ? undefined : 32};
  const big = mood === 'ngac' ? 1.25 : 1;
  return (
    <group position={[0, 0.02, z]} scale={scale}>
      {[-0.34, 0.34].map((x) => (
        <group key={x} position={[x, 0.2, 0.1]}>
          <ToonMesh geometry={GEO.sphere} color={C.white} scale={[0.27, 0.32 * blink * big, 0.1]} {...common} />
          <ToonMesh geometry={GEO.sphere} color={C.pupil} position={[0.04 * Math.sin(t * 1.3), mood === 'lo' ? -0.07 : -0.02, 0.1]} scale={[0.12, 0.14 * Math.max(blink, 0.3), 0.05]} {...common} />
        </group>
      ))}
      {[-0.62, 0.62].map((x) => (
        <ToonMesh key={x} geometry={GEO.sphere} color={C.cheek} position={[x, -0.12, 0.05]} scale={[0.17, 0.1, 0.05]} {...common} />
      ))}
      {mood === 'ngac' ? (
        <ToonMesh geometry={GEO.sphere} color={C.dark} position={[0, -0.25, 0.1]} scale={[0.13, 0.17, 0.05]} {...common} />
      ) : mood === 'trung' ? (
        <ToonMesh geometry={GEO.cube} color={C.dark} position={[0, -0.22, 0.1]} scale={[0.3, 0.06, 0.04]} {...common} />
      ) : mood === 'lo' ? (
        <ToonMesh geometry={GEO.smile} color={C.dark} position={[0, -0.34, 0.08]} rotation={[0, 0, 0.08]} scale={[0.7, 0.55, 1]} {...common} />
      ) : (
        <ToonMesh geometry={GEO.smile} color={C.dark} position={[0, -0.12, 0.08]} rotation={[0, 0, Math.PI + 0.08]} scale={[mood === 'vui' ? 1.1 : 0.8, mood === 'vui' ? 1.1 : 0.8, 1]} {...common} />
      )}
    </group>
  );
};

/* ---------- tia sáng nhỏ ---------- */
export const Sparks = ({center, n, f, radius, size, color = C.spark, seed = 3, top = true}: {center: THREE.Vector3; n: number; f: number; radius: number; size: number; color?: string; seed?: number; top?: boolean}) => {
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

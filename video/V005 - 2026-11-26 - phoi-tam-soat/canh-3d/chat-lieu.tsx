/* Chất liệu "toon" (màu phẳng theo dải sáng) + viền đen dày làm bằng vỏ lật ngược (inverted hull) có độ dày cố định theo điểm ảnh.
   - ToonMesh: một vật có thân tô bóng toon và (tuỳ chọn) lớp viền đen phía sau.
   - Chế độ "rim": vật trong suốt (phổi, thân người mờ) có viền tối ở mép thay cho vỏ lật ngược, vì vỏ lật ngược sẽ nhìn xuyên qua thân.
   - `shared`: các giá trị dùng chung cho mọi vật (thời gian, đèn pin của camera, sương mù trong lòng ống). Đặt lại mỗi khung hình.
   Màu ghi thẳng theo mã sRGB (tắt quản lý màu của three, canvas dùng `linear flat`) để khớp bảng màu CSS/2D. */
import {useMemo} from 'react';
import * as THREE from 'three';

THREE.ColorManagement.enabled = false;

export const WIDTH = 1080;
export const HEIGHT = 1920;

export const shared = {
  uTime: {value: 0},
  /** 0 = chỉ ánh sáng ngoài trời, 1 = đèn pin gắn trên camera (trong lòng ống) */
  uLamp: {value: 0},
  uFogK: {value: 0},
  uFogColor: {value: new THREE.Color('#b8506a')},
  uLight: {value: new THREE.Vector3(0.35, 0.8, 0.55).normalize()},
  uRes: {value: new THREE.Vector2(WIDTH, HEIGHT)},
};

const toonVert = /* glsl */ `
#ifdef USE_BREATH
attribute vec3 aCenter;
attribute float aPhase;
uniform float uBreath;
#endif
uniform float uTime;
varying vec3 vN;
varying vec3 vP;
void main() {
  vec3 p = position;
#ifdef USE_BREATH
  float s = 1.0 + uBreath * sin(uTime * 5.2 + aPhase);
  p = aCenter + (position - aCenter) * s;
#endif
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vP = wp.xyz;
  vN = normalize(transpose(inverse(mat3(modelMatrix))) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const toonFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uRim;
uniform vec3 uRimColor;
uniform vec3 uLight;
uniform float uLamp;
uniform float uFogK;
uniform vec3 uFogColor;
uniform vec2 uRes;
varying vec3 vN;
varying vec3 vP;
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 toCam = cameraPosition - vP;
  float d = length(toCam);
  vec3 v = toCam / d;
  float ndl = dot(n, normalize(uLight)) * 0.5 + 0.5;
  float key = ndl > 0.74 ? 1.0 : (ndl > 0.46 ? 0.84 : 0.68);
  float lamp = clamp(1.6 / (1.0 + 0.22 * d * d) * (0.7 + 0.3 * abs(dot(n, v))), 0.0, 1.0);
  float lampB = 0.5 + 0.58 * lamp;
  float kb = key > 0.99 ? 1.0 : (key > 0.8 ? 0.72 : 0.42);
  float shade = mix(key, lampB * (0.62 + 0.38 * kb), uLamp);
  vec3 col = uColor * shade;
  // trong lòng ống: tối dần về mép khung, để vách ống áp sát vẫn có độ chuyển sắc thay vì một mảng màu phẳng
  vec2 sc = gl_FragCoord.xy / uRes * 2.0 - 1.0;
  col *= mix(1.0, 1.0 - 0.34 * smoothstep(0.15, 1.3, length(sc * vec2(0.8, 0.5))), uLamp);
  col = mix(col, uFogColor, 1.0 - exp(-uFogK * d));
  float a = uOpacity;
  if (uRim > 0.0) {
    float r = 1.0 - smoothstep(0.16, 0.3, abs(dot(n, v)));
    col = mix(col, uRimColor, r);
    a = mix(uOpacity, 1.0, r * uRim);
  }
  gl_FragColor = vec4(col, a);
}
`;

const hullVert = /* glsl */ `
#ifdef USE_BREATH
attribute vec3 aCenter;
attribute float aPhase;
uniform float uBreath;
#endif
uniform float uTime;
uniform float uPx;
uniform vec2 uRes;
void main() {
  vec3 p = position;
#ifdef USE_BREATH
  float s = 1.0 + uBreath * sin(uTime * 5.2 + aPhase);
  p = aCenter + (position - aCenter) * s;
#endif
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  vec3 nv = normalize(normalMatrix * normal);
  vec2 dir = (projectionMatrix * vec4(nv, 0.0)).xy;
  float l = length(dir);
  if (l > 1e-5) clip.xy += dir / l * uPx * 2.0 / uRes * clip.w;
  gl_Position = clip;
}
`;

const hullFrag = /* glsl */ `
uniform vec3 uColor;
void main() { gl_FragColor = vec4(uColor, 1.0); }
`;

export const OUTLINE = '#0b1c2e';

type Static = {color: string; rimColor?: string; breath?: number; doubleSide?: boolean; depthWrite?: boolean; depthTest?: boolean};

const makeToon = (o: Static) => {
  const defines = o.breath ? {USE_BREATH: ''} : {};
  const body = new THREE.ShaderMaterial({
    vertexShader: toonVert,
    fragmentShader: toonFrag,
    defines,
    side: o.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: o.depthWrite ?? true,
    depthTest: o.depthTest ?? true,
    uniforms: {
      uColor: {value: new THREE.Color(o.color)},
      uOpacity: {value: 1},
      uRim: {value: 0},
      uRimColor: {value: new THREE.Color(o.rimColor ?? OUTLINE)},
      uBreath: {value: o.breath ?? 0},
      uTime: shared.uTime,
      uLight: shared.uLight,
      uLamp: shared.uLamp,
      uFogK: shared.uFogK,
      uFogColor: shared.uFogColor,
      uRes: shared.uRes,
    },
  });
  const hull = new THREE.ShaderMaterial({
    vertexShader: hullVert,
    fragmentShader: hullFrag,
    defines,
    side: THREE.BackSide,
    depthTest: o.depthTest ?? true,
    polygonOffset: true,
    polygonOffsetFactor: 3,
    polygonOffsetUnits: 3,
    uniforms: {
      uColor: {value: new THREE.Color(OUTLINE)},
      uPx: {value: 0},
      uBreath: {value: o.breath ?? 0},
      uTime: shared.uTime,
      uRes: shared.uRes,
    },
  });
  return {body, hull};
};

type Props = {
  geometry: THREE.BufferGeometry;
  color: string;
  /** độ đặc (mặc định 1) */
  opacity?: number;
  /** viền tối ở mép cho vật trong suốt (0 = tắt, 1 = đủ đậm) */
  rim?: number;
  rimColor?: string;
  /** biên độ phồng xẹp của từng cầu (cần thuộc tính aCenter/aPhase trên hình học) */
  breath?: number;
  doubleSide?: boolean;
  /** độ dày viền (điểm ảnh); 0 = không viền */
  outline?: number;
  depthWrite?: boolean;
  /** false: vẽ đè lên mọi vật (nhìn xuyên thành cơ quan), dùng cho viên thức ăn */
  depthTest?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  quaternion?: THREE.Quaternion;
  scale?: number | [number, number, number];
  castShadow?: boolean;
  renderOrder?: number;
  visible?: boolean;
};

/** Vật toon có viền. Các tham số đổi theo khung hình (opacity, rim, outline) được ghi thẳng vào uniform mỗi lần dựng. */
export const ToonMesh = ({geometry, color, opacity = 1, rim = 0, rimColor, breath = 0, doubleSide = false, outline = 6, depthWrite, depthTest = true, position, rotation, quaternion, scale, castShadow = false, renderOrder, visible = true}: Props) => {
  const {body, hull} = useMemo(() => makeToon({color, rimColor, breath, doubleSide, depthWrite: depthWrite ?? rim === 0, depthTest}), [color, rimColor, breath, doubleSide, depthWrite, depthTest, rim === 0]);
  body.uniforms.uOpacity.value = opacity;
  body.uniforms.uRim.value = rim;
  body.transparent = opacity < 0.999 || rim > 0;
  const showHull = outline > 0 && opacity > 0.98 && rim === 0;
  hull.uniforms.uPx.value = outline;
  return (
    <group position={position} rotation={rotation} quaternion={quaternion} scale={scale} visible={visible && (opacity > 0.003 || rim > 0.003)}>
      <mesh geometry={geometry} material={body} castShadow={castShadow} renderOrder={renderOrder} />
      {showHull && <mesh geometry={geometry} material={hull} renderOrder={renderOrder} />}
    </group>
  );
};

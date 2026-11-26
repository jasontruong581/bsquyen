/* Đạo cụ của V008 (toạ độ thế giới): bảng tổng đài có núm âm lượng 3 nấc + loa "tiếng đau" (cảnh 4, 9, 10), bốn trạm phát tín hiệu (cảnh 3),
   ba biển báo trên đường dây (cảnh 5–7), dải "đúng chỉ định" (cảnh 7), biển cảnh giác + bàn tay chỉ vào "BÁC SĨ" (cảnh 8). Không hộp thuốc, không ống tiêm, không khối u. */
import {spring} from 'remotion';
import {FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {FPS, P} from '../../src/timeline';
import {pathAt, uNear} from './Path';
import {NOTCH, T, clamp01, knobAngle, loud, smooth} from './Motion';
import {E, S, W} from './timeline';

const sp = (frame: number, at: number, damping = 12, stiffness = 150) => spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping, stiffness}});
const f1 = (n: number) => n.toFixed(1);

/* ============================ bảng tổng đài ============================ */
export const CON = {x: 10, y: 262};

const Pill = ({x, label, lit, ghost}: {x: number; label: string; lit: number; ghost: number}) => (
  <g transform={`translate(${x} 116)`} opacity={ghost + (1 - ghost) * lit}>
    <rect x={-58} y={-21} width={116} height={42} rx={21} fill={lit > 0.5 ? '#FFD34D' : '#EAF0FB'} stroke={NAVY} strokeWidth={4.5} />
    <text x={0} y={9} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={23} fill={NAVY}>
      {label}
    </text>
  </g>
);

export const Console = ({t, frame, fade = 1}: {t: number; frame: number; fade?: number}) => {
  const L = loud(t);
  const ang = knobAngle(t);
  const ghost = 0.4 * smooth(P(t, S(4) - 1.4, 0.8));
  const lit = T.tag.map((a) => smooth(P(t, a, 0.2)));
  const morphin = Math.min(1, t >= T.morphin - 0.05 ? sp(frame, T.morphin, 11) : 0);
  const heavy = smooth(P(t, T.heavy, 0.3)) * (1 - smooth(P(t, T.heavy + 1.2, 0.4)));
  const who = Math.min(1, t >= W(4, 'WHO') - 0.2 ? sp(frame, W(4, 'WHO') - 0.15, 11) : 0);
  const check = Math.min(1, t >= T.essential ? sp(frame, T.essential, 10) : 0);
  const lock = Math.min(1, t >= W(9, 'tự') - 0.15 && t < S(10) + 0.2 ? sp(frame, W(9, 'tự') - 0.1, 9) : 0);
  const bars = Array.from({length: 7}, (_, i) => {
    const h = 6 + 44 * L * (0.45 + 0.55 * Math.abs(Math.sin(t * (4.2 + i * 1.1) + i * 1.7)));
    return h;
  });
  const barColor = (i: number) => (L > 0.55 ? (i > 4 ? '#FF6A3A' : '#FFB347') : '#7EDDB9');
  return (
    <g transform={`translate(${CON.x} ${CON.y})`} opacity={fade}>
      {/* sóng "tiếng đau" toả ra từ loa: nhỏ dần theo âm lượng */}
      {[0, 1, 2].map((i) => {
        const k = ((t * 0.9 + i / 3) % 1 + 1) % 1;
        return <path key={i} d={`M ${-190 - k * 56} ${-150 - k * 34} Q ${-212 - k * 60} ${-126} ${-190 - k * 56} ${-100 + k * 34}`} fill="none" stroke="#FF7A2B" strokeWidth={8} strokeLinecap="round" opacity={(1 - k) * L * 0.9} />;
      })}
      {/* thân bảng: bóng, viền sáng, mặt xanh */}
      <rect x={-196} y={-178} width={412} height={346} rx={46} fill={NAVY} opacity={0.2} />
      <rect x={-206} y={-190} width={412} height={346} rx={46} fill="url(#g8-bezel)" stroke={NAVY} strokeWidth={7} />
      <rect x={-190} y={-174} width={380} height={314} rx={34} fill="url(#g8-device)" stroke={NAVY} strokeWidth={5} />
      <path d="M -170 -160 H 150" stroke="#fff" strokeOpacity={0.45} strokeWidth={5} strokeLinecap="round" />
      {[-176, 176].map((x) => (
        <circle key={x} cx={x} cy={-160} r={6} fill="#DDE6F6" stroke={NAVY} strokeWidth={2.5} />
      ))}
      {/* cổng cắm dây cáp ở mép phải */}
      <rect x={190} y={-82} width={26} height={56} rx={10} fill="#2B3F6B" stroke={NAVY} strokeWidth={5} />
      {/* loa */}
      <rect x={-166} y={-150} width={168} height={72} rx={20} fill="#243764" stroke={NAVY} strokeWidth={5} />
      {bars.map((h, i) => (
        <rect key={i} x={-148 + i * 21} y={-86 - h} width={13} height={h} rx={5} fill={barColor(i)} />
      ))}
      {/* huy hiệu WHO */}
      <g transform={`translate(116 -114) scale(${Math.max(0.01, who)})`} opacity={Math.min(1, who)}>
        <circle r={42} fill="#fff" stroke={NAVY} strokeWidth={5} />
        <circle r={35} fill="#E4F1FF" />
        <text y={8} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={21} fill={NAVY}>
          WHO
        </text>
        {check > 0.01 && (
          <g transform={`translate(34 -34) scale(${Math.min(1.1, check)})`}>
            <circle r={17} fill="#3DBE8B" stroke={NAVY} strokeWidth={4} />
            <path d="M -8 0 L -2 7 L 9 -7" fill="none" stroke="#fff" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </g>
      {/* núm: vòng chia nấc, mũi tên chỉ, nắp núm */}
      <g>
        {NOTCH.map((a, i) => {
          const on = ang >= a - 2;
          const r = (a * Math.PI) / 180;
          return (
            <g key={i}>
              <path d={`M ${f1(Math.sin(r) * 80)} ${f1(-Math.cos(r) * 80)} L ${f1(Math.sin(r) * 98)} ${f1(-Math.cos(r) * 98)}`} stroke={on ? '#FFD34D' : '#102A4F'} strokeWidth={9} strokeLinecap="round" />
            </g>
          );
        })}
        <circle r={72} fill={NAVY} />
        <circle r={67} fill="#DDE6F6" />
        <g transform={`rotate(${ang.toFixed(2)})`}>
          {Array.from({length: 14}, (_, i) => (
            <circle key={i} cy={-55} r={9} fill="#C9D5EC" stroke={NAVY} strokeWidth={4} transform={`rotate(${(i * 360) / 14})`} />
          ))}
          <circle r={57} fill="url(#g8-knob)" stroke={NAVY} strokeWidth={0} />
          <circle r={57} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={4} transform="translate(-2 -2) scale(0.9)" />
          <path d="M 0 -16 L 0 -52" stroke={NAVY} strokeWidth={18} strokeLinecap="round" />
          <path d="M 0 -16 L 0 -52" stroke={ORANGE} strokeWidth={9} strokeLinecap="round" />
          <circle r={13} fill="#fff" stroke={NAVY} strokeWidth={4.5} />
        </g>
      </g>
      {/* ba nấc: nhẹ, vừa, nặng */}
      <Pill x={-124} label="1 NHẸ" lit={lit[0]} ghost={ghost} />
      <Pill x={0} label="2 VỪA" lit={lit[1]} ghost={ghost} />
      <Pill x={124} label="3 NẶNG" lit={Math.max(lit[2], heavy)} ghost={ghost} />
      {/* nấc 3 gắn "MORPHIN" */}
      <g transform={`translate(124 ${176}) scale(${Math.max(0.01, morphin)})`} opacity={Math.min(1, morphin)}>
        <path d="M -12 -16 L 0 -30 L 12 -16 Z" fill={NAVY} />
        <rect x={-92} y={-16} width={184} height={46} rx={23} fill="#E9502E" stroke={NAVY} strokeWidth={5} />
        <text x={0} y={17} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill="#fff" letterSpacing={1}>
          MORPHIN
        </text>
      </g>
      {/* ổ khoá: không tự xoay núm (cảnh 9) */}
      {lock > 0.01 && (
        <g transform={`translate(78 -60) scale(${Math.max(0.01, lock) * (1 + 0.04 * Math.sin(t * 6))})`}>
          <circle r={38} fill="#fff" stroke={NAVY} strokeWidth={5} />
          <path d="M -13 -4 V -14 C -13 -30 13 -30 13 -14 V -4" fill="none" stroke={NAVY} strokeWidth={7} strokeLinecap="round" />
          <rect x={-20} y={-6} width={40} height={30} rx={8} fill="#FFC93C" stroke={NAVY} strokeWidth={5} />
          <circle cy={8} r={4.5} fill={NAVY} />
        </g>
      )}
    </g>
  );
};

/* ============================ bốn trạm phát tín hiệu (cảnh 3) ============================ */
type StationIcon = 'squeeze' | 'bone' | 'nerve' | 'care';
const STATIONS: {x: number; y: number; tag: string; icon: StationIcon; to: [number, number]}[] = [
  {x: 395, y: 1275, tag: 'Chèn ép', icon: 'squeeze', to: [470, 1116]},
  {x: 540, y: 925, tag: 'Xương', icon: 'bone', to: [706, 936]},
  {x: 495, y: 740, tag: 'Thần kinh', icon: 'nerve', to: [722, 790]},
  {x: 470, y: 548, tag: 'Điều trị', icon: 'care', to: [706, 600]},
];

const StationIconSvg = ({icon}: {icon: StationIcon}) => {
  if (icon === 'squeeze')
    return (
      <g>
        <path d="M 0 -30 C -9 -12 9 12 0 30" fill="none" stroke={ORANGE} strokeWidth={8} strokeLinecap="round" />
        <path d="M -34 -14 L -12 0 L -34 14 Z" fill={NAVY} stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />
        <path d="M 34 -14 L 12 0 L 34 14 Z" fill={NAVY} stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />
      </g>
    );
  if (icon === 'bone')
    return (
      <g transform="rotate(-38)" fill="#fff" stroke={NAVY} strokeWidth={4.5} strokeLinejoin="round">
        <rect x={-22} y={-8} width={44} height={16} rx={4} />
        {[-1, 1].map((sx) =>
          [-1, 1].map((sy) => <circle key={`${sx}${sy}`} cx={sx * 24} cy={sy * 8} r={9} />),
        )}
        <rect x={-18} y={-5} width={36} height={10} fill="#fff" stroke="none" />
      </g>
    );
  if (icon === 'nerve')
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M -28 18 L -8 4 L -14 -4 L 4 -18" stroke={NAVY} strokeWidth={9} />
        <path d="M -28 18 L -8 4 L -14 -4 L 4 -18" stroke="#FFC93C" strokeWidth={4.5} />
        <path d="M 14 -8 L 20 -2 L 28 -12" stroke={ORANGE} strokeWidth={5} />
        <path d="M 12 12 L 24 18 M 18 22 L 28 10" stroke={ORANGE} strokeWidth={4.5} />
      </g>
    );
  return (
    <g>
      <rect x={-27} y={-27} width={54} height={54} rx={14} fill="#5DC7B0" stroke={NAVY} strokeWidth={4.5} />
      <path d="M -4 -17 H 4 V -4 H 17 V 4 H 4 V 17 H -4 V 4 H -17 V -4 H -4 Z" fill="#fff" stroke={NAVY} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
};

export const Stations = ({t, frame}: {t: number; frame: number}) => {
  const out = 1 - smooth(P(t, S(4) - 0.7, 0.6));
  if (out < 0.01) return null;
  return (
    <g opacity={out}>
      {STATIONS.map((s, i) => {
        const a0 = T.st[i];
        if (t < a0 - 0.05) return null;
        const k = Math.min(1.1, sp(frame, a0, 10));
        const to = pathAt(uNear(s.to[0], s.to[1]));
        const mx = (s.x + to.x) / 2;
        const wire = `M ${s.x} ${s.y} Q ${f1(mx)} ${f1(s.y + (to.y - s.y) * 0.9 + 40)} ${f1(to.x)} ${f1(to.y)}`;
        const run = clamp01((t - a0) / 0.5);
        const pulse = ((t - a0) * 1.4) % 1;
        return (
          <g key={i}>
            <path d={wire} fill="none" stroke={NAVY} strokeOpacity={0.5} strokeWidth={11} strokeLinecap="round" opacity={run} />
            <path d={wire} fill="none" stroke="#FFE58A" strokeWidth={6} strokeLinecap="round" opacity={run} />
            <path d={wire} fill="none" stroke="#FF5A1F" strokeWidth={8} strokeLinecap="round" strokeDasharray="22 170" strokeDashoffset={-(t - a0) * 150} opacity={run} />
            <g transform={`translate(${s.x} ${s.y}) scale(${Math.max(0.01, k)})`}>
              {[0, 1].map((r) => {
                const q = (((t - a0) * 0.8 + r / 2) % 1 + 1) % 1;
                return <circle key={r} r={62 + q * 50} fill="none" stroke="#FF7A2B" strokeWidth={6 * (1 - q) + 1} opacity={(1 - q) * 0.8} />;
              })}
              <circle r={72} fill="url(#g8-glow)" opacity={0.55 + 0.25 * Math.sin(t * 5 + i)} />
              <circle r={60} fill={NAVY} />
              <circle r={53} fill="#fff" />
              <circle r={53} fill="none" stroke="#FFB067" strokeWidth={5} strokeDasharray="12 10" strokeDashoffset={-t * 14} />
              <g transform="scale(1.3)">
                <StationIconSvg icon={s.icon} />
              </g>
              <g transform="translate(0 100)">
                <rect x={-96} y={-27} width={192} height={54} rx={27} fill="rgba(255,255,255,0.96)" stroke={NAVY} strokeWidth={5} />
                <text y={12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={35} fill={NAVY}>
                  {s.tag}
                </text>
              </g>
            </g>
            <circle cx={to.x} cy={to.y} r={10 + 8 * pulse} fill="none" stroke="#FF5A1F" strokeWidth={4} opacity={(1 - pulse) * run} />
          </g>
        );
      })}
    </g>
  );
};

/* ============================ ba biển báo (cảnh 5–7) ============================ */
type SignIcon = 'bars' | 'chain' | 'loop';
export const SIGNS: {y: number; label: string; color: string; icon: SignIcon}[] = [
  {y: 800, label: 'QUEN THUỐC', color: '#BFE0FF', icon: 'bars'},
  {y: 660, label: 'LỆ THUỘC', color: '#FFE3A8', icon: 'chain'},
  {y: 520, label: 'NGHIỆN', color: '#FFC2C8', icon: 'loop'},
];
const SIGN_X = 270;
const SIGN_W = 405;
const SIGN_H = 112;

export const SignIconSvg = ({icon, t}: {icon: SignIcon; t: number}) => {
  if (icon === 'bars')
    return (
      <g>
        {[44, 34, 24, 15].map((h, i) => (
          <rect key={i} x={-26 + i * 15} y={22 - h} width={10} height={h} rx={4} fill={NAVY} opacity={0.95 - i * 0.22} />
        ))}
        <path d="M -28 -26 L 22 -26" stroke={ORANGE} strokeWidth={0} />
      </g>
    );
  if (icon === 'chain')
    return (
      <g fill="none" stroke={NAVY} strokeWidth={6.5} strokeLinejoin="round" transform={`rotate(${-35 + 4 * Math.sin(t * 2)})`}>
        <rect x={-26} y={-9} width={34} height={20} rx={10} />
        <rect x={-8} y={-9} width={34} height={20} rx={10} />
      </g>
    );
  return (
    <g transform={`rotate(${(t * 70) % 360})`} fill="none" stroke={NAVY} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M 18 -12 A 22 22 0 1 0 22 6" />
      <path d="M 26 -22 L 18 -10 L 31 -7 Z" fill={NAVY} />
    </g>
  );
};

export const Signs = ({t, frame}: {t: number; frame: number}) => {
  const out = 1 - smooth(P(t, S(8) - 0.5, 0.5));
  if (out < 0.01) return null;
  const split = smooth(P(t, T.split, 0.8));
  return (
    <g opacity={out}>
      {SIGNS.map((s, i) => {
        const a0 = T.sign[i];
        if (t < a0 - 0.05) return null;
        const k = Math.min(1.08, sp(frame, a0, 11));
        const third = i === 2;
        const dx = third ? -150 * split : 0;
        const dy = third ? -10 * split : 0;
        const dim = !third && t >= T.split ? 0.5 : 1;
        const hot = third && t >= T.split ? 1 : 0;
        const nerveX = pathAt(uNear(716, s.y)).x;
        const stemEnd = SIGN_X + SIGN_W;
        return (
          <g key={i} opacity={dim} transform={`translate(0 ${(1 - Math.min(1, k)) * 40})`}>
            {/* cọc nối biển báo vào đường dây (kéo dãn khi biển báo tách ra) */}
            <path d={`M ${stemEnd + dx} ${s.y + dy} H ${nerveX}`} stroke={NAVY} strokeWidth={14} strokeLinecap="round" strokeDasharray={third && split > 0.05 ? '4 20' : undefined} opacity={third && split > 0.6 ? 0.55 : 1} />
            <path d={`M ${stemEnd + dx} ${s.y + dy} H ${nerveX}`} stroke="#9FB2D6" strokeWidth={6} strokeLinecap="round" strokeDasharray={third && split > 0.05 ? '4 20' : undefined} opacity={third && split > 0.6 ? 0.55 : 1} />
            <g transform={`translate(${dx} ${dy}) translate(${SIGN_X + SIGN_W / 2} ${s.y}) scale(${Math.max(0.01, k)}) translate(${-(SIGN_X + SIGN_W / 2)} ${-s.y})`}>
              <rect x={SIGN_X + 7} y={s.y - SIGN_H / 2 + 10} width={SIGN_W} height={SIGN_H} rx={34} fill={NAVY} opacity={0.18} />
              <rect x={SIGN_X} y={s.y - SIGN_H / 2} width={SIGN_W} height={SIGN_H} rx={34} fill={s.color} stroke={NAVY} strokeWidth={7} />
              {hot > 0 && <rect x={SIGN_X - 8} y={s.y - SIGN_H / 2 - 8} width={SIGN_W + 16} height={SIGN_H + 16} rx={40} fill="none" stroke="#FFB067" strokeWidth={6} strokeDasharray="14 10" strokeDashoffset={-t * 20} />}
              <g transform={`translate(${SIGN_X + 60} ${s.y})`}>
                <circle r={42} fill="#fff" stroke={NAVY} strokeWidth={5} />
                <SignIconSvg icon={s.icon} t={t} />
              </g>
              <text x={SIGN_X + 118} y={s.y + 12} fontFamily={FONT} fontWeight={900} fontSize={35} fill={NAVY}>
                {s.label}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};

/** Dải "ĐÚNG CHỈ ĐỊNH · CÓ BÁC SĨ THEO DÕI" ngay dưới các biển báo (cảnh 7) */
export const Ribbon = ({t, frame}: {t: number; frame: number}) => {
  const a0 = T.shield;
  const out = 1 - smooth(P(t, E(7) - 0.1, 0.4));
  if (t < a0 - 0.05 || out < 0.01) return null;
  const k = Math.min(1.06, sp(frame, a0, 12));
  return (
    <g transform={`translate(510 985) scale(${Math.max(0.01, k)})`} opacity={out}>
      <rect x={-272} y={-58} width={552} height={128} rx={40} fill={NAVY} opacity={0.18} />
      <rect x={-280} y={-66} width={560} height={128} rx={40} fill="#fff" stroke={NAVY} strokeWidth={6.5} />
      <g transform="translate(-218 -2)">
        <path d="M 0 -44 C 18 -34 34 -32 44 -32 C 44 8 32 32 0 48 C -32 32 -44 8 -44 -32 C -34 -32 -18 -34 0 -44 Z" fill="#5DC7B0" stroke={NAVY} strokeWidth={5.5} strokeLinejoin="round" />
        <path d="M -17 2 L -5 14 L 19 -12" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text x={-150} y={-16} fontFamily={FONT} fontWeight={900} fontSize={42} fill={NAVY}>
        ĐÚNG CHỈ ĐỊNH
      </text>
      <text x={-150} y={32} fontFamily={FONT} fontWeight={800} fontSize={35} fill="#E2561B">
        CÓ BÁC SĨ THEO DÕI
      </text>
    </g>
  );
};

/* ============================ cảnh 8: cảnh giác, bàn tay chỉ vào "BÁC SĨ" ============================ */
const DOC = {x: 560, y: 900};
const CAUTION = {x: 345, y: 770};
const HAND = {x: 280, y: 945};

export const Doctor = ({t, frame}: {t: number; frame: number}) => {
  const a0 = T.caution;
  const out = 1 - smooth(P(t, E(8) - 0.15, 0.4));
  if (t < a0 - 0.05 || out < 0.01) return null;
  const kc = Math.min(1.1, sp(frame, a0, 10));
  const kd = Math.min(1.08, t >= T.doc - 0.2 ? sp(frame, T.doc - 0.2, 11) : 0);
  const kh = Math.min(1.05, t >= T.doc - 0.05 ? sp(frame, T.doc - 0.05, 12) : 0);
  const tap = 7 * Math.sin((t - T.doc) * 5);
  const shake = Math.sin(t * 9) * 3 * (1 - smooth(P(t, a0 + 1.4, 0.5)));
  return (
    <g opacity={out}>
      {/* biển cảnh giác nhỏ */}
      <g transform={`translate(${CAUTION.x} ${CAUTION.y}) rotate(${shake.toFixed(2)}) scale(${Math.max(0.01, kc)})`}>
        <path d="M 0 -50 L 52 36 H -52 Z" fill={NAVY} opacity={0.18} transform="translate(7 10)" strokeLinejoin="round" stroke={NAVY} strokeWidth={7.5} />
        <path d="M 0 -50 L 52 36 H -52 Z" fill="#FFC93C" stroke={NAVY} strokeWidth={7.5} strokeLinejoin="round" />
        <text y={22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={64} fill={NAVY}>
          !
        </text>
      </g>
      {/* biển "BÁC SĨ" */}
      <g transform={`translate(${DOC.x} ${DOC.y}) scale(${Math.max(0.01, kd)})`}>
        <rect x={-146} y={-52} width={304} height={120} rx={40} fill={NAVY} opacity={0.18} />
        <rect x={-154} y={-60} width={304} height={120} rx={40} fill="#fff" stroke={NAVY} strokeWidth={7} />
        <g transform="translate(-92 0)">
          <circle r={42} fill="#DDF3F7" stroke={NAVY} strokeWidth={5} />
          <circle cy={-12} r={15} fill="#FFD7BD" stroke={NAVY} strokeWidth={4} />
          <path d="M -26 30 C -26 8 26 8 26 30 Z" fill="#fff" stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />
          <path d="M -4 14 L 0 24 L 4 14" fill="none" stroke="#3FA7C9" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 12 16 H 20 M 16 12 V 20" stroke="#E2561B" strokeWidth={3.5} strokeLinecap="round" />
        </g>
        <text x={-34} y={14} fontFamily={FONT} fontWeight={900} fontSize={46} fill={NAVY}>
          BÁC SĨ
        </text>
      </g>
      {/* bàn tay chỉ về phía biển */}
      <g transform={`translate(${HAND.x + tap * 0.6} ${HAND.y - tap * 0.15}) rotate(-17) scale(${Math.max(0.01, kh) * 1.25})`}>
        <g strokeLinejoin="round" strokeLinecap="round" fill="#FFD7BD" stroke={NAVY} strokeWidth={6}>
          <rect x={-34} y={-32} width={34} height={70} rx={8} fill="#fff" />
          <rect x={-2} y={-24} width={70} height={54} rx={20} />
          <rect x={46} y={-26} width={88} height={22} rx={11} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={36} y={0 + i * 11} width={40} height={14} rx={7} />
          ))}
          <rect x={4} y={-40} width={44} height={18} rx={9} transform="rotate(-18 14 -30)" />
        </g>
      </g>
    </g>
  );
};

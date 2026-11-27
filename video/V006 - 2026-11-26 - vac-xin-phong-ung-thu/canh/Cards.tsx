/* Hai thẻ duy nhất của V006.
   Thẻ 1 (cảnh 5): biểu đồ cột "90% so với 5–10%", ghi nguồn WHO ngay cạnh biểu đồ. Đặt TRONG thế giới như một tấm bảng cắm trên mặt tường
   (camera dolly sang), nên không che mô hình.
   Thẻ 2 (cảnh 10): ba ô theo độ tuổi, toạ độ màn hình (nằm trong y 690–1130, lề phải 160). */
import {spring} from 'remotion';
import {FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {FPS, P} from '../../src/timeline';
import {Icon} from './Props';
import {E, S, W} from './timeline';
import {SURF} from './World';

const smooth = (p: number) => p * p * (3 - 2 * p);
const sp = (frame: number, at: number, damping = 12) => spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping, stiffness: 150}});

/* ---------- Thẻ 1: bảng biểu đồ (tọa độ thế giới) ---------- */
export const BOARD = {x: 1010, y: 565, w: 540, h: 400};
const BASE_Y = 70; // đường nền của cột (toạ độ cục bộ)
const MAX_H = 120; // cao của 100%
export const Chart = ({t}: {t: number}) => {
  const a0 = S(5);
  const out = smooth(P(t, E(5) - 0.1, 0.4));
  if (t < a0 - 0.05 || t > E(5) + 0.4) return null;
  const grow = smooth(P(t, a0, 0.6));
  const s = grow * (1 - 0.4 * out);
  const b1 = smooth(P(t, W(5, '90') - 0.1, 0.9));
  const b2 = smooth(P(t, W(5, '5') - 0.1, 0.9));
  const wob = 1 + 0.012 * Math.sin(t * 2.6);
  const h1 = MAX_H * 0.9 * b1;
  const h2a = MAX_H * 0.05 * b2;
  const h2b = MAX_H * 0.1 * b2;
  return (
    <g transform={`translate(${BOARD.x} ${SURF}) scale(${s * wob})`} opacity={1 - out}>
      <g transform={`translate(0 ${-(SURF - BOARD.y)})`}>
        {/* chân bảng */}
        <rect x={-190} y={BOARD.h / 2 - 6} width={34} height={SURF - BOARD.y - BOARD.h / 2 + 8} rx={8} fill="#B97B4B" stroke={NAVY} strokeWidth={6} />
        <rect x={156} y={BOARD.h / 2 - 6} width={34} height={SURF - BOARD.y - BOARD.h / 2 + 8} rx={8} fill="#B97B4B" stroke={NAVY} strokeWidth={6} />
        <rect x={-BOARD.w / 2 + 12} y={-BOARD.h / 2 + 18} width={BOARD.w} height={BOARD.h} rx={40} fill={NAVY} opacity={0.16} />
        <rect x={-BOARD.w / 2} y={-BOARD.h / 2} width={BOARD.w} height={BOARD.h} rx={40} fill="#FFFDF6" stroke={NAVY} strokeWidth={9} />
        <path d={`M ${-BOARD.w / 2 + 14} ${-BOARD.h / 2 + 100} V ${-BOARD.h / 2 + 50} Q ${-BOARD.w / 2 + 14} ${-BOARD.h / 2 + 14} ${-BOARD.w / 2 + 50} ${-BOARD.h / 2 + 14} H ${BOARD.w / 2 - 50} Q ${BOARD.w / 2 - 14} ${-BOARD.h / 2 + 14} ${BOARD.w / 2 - 14} ${-BOARD.h / 2 + 50} V ${-BOARD.h / 2 + 100} Z`} fill="#FFE9D2" />
        {/* tiêu đề */}
        <text x={0} y={-152} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={31} fill={NAVY}>
          Nhiễm viêm gan B
        </text>
        <text x={0} y={-116} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={31} fill={NAVY}>
          thành mạn tính
        </text>
        {/* trục và vạch 100% */}
        <path d={`M -232 ${BASE_Y - MAX_H} H 232`} stroke="#C7D2DD" strokeWidth={3} strokeDasharray="6 10" />
        <text x={-236} y={BASE_Y - MAX_H - 6} fontFamily={FONT} fontWeight={700} fontSize={20} fill="#6C7C8C">
          100%
        </text>
        <path d={`M -232 ${BASE_Y} H 232`} stroke={NAVY} strokeWidth={6} strokeLinecap="round" />
        {/* cột 1: 90% */}
        <rect x={-165} y={BASE_Y - h1} width={120} height={h1} rx={14} fill={ORANGE} stroke={NAVY} strokeWidth={6} />
        <rect x={-155} y={BASE_Y - h1 + 8} width={20} height={Math.max(0, h1 - 16)} rx={8} fill="#fff" opacity={0.35} />
        {b1 > 0.5 && (
          <text x={-105} y={BASE_Y - h1 - 12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={52} fill={NAVY} opacity={smooth((b1 - 0.5) * 2)}>
            90%
          </text>
        )}
        <text x={-105} y={BASE_Y + 36} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={25} fill={NAVY}>
          Trẻ nhiễm
        </text>
        <text x={-105} y={BASE_Y + 64} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={25} fill={NAVY}>
          quanh lúc sinh
        </text>
        {/* cột 2: 5–10% (đoạn đậm tới 5%, đoạn nhạt tới 10%) */}
        <rect x={45} y={BASE_Y - h2b} width={120} height={h2b} rx={5} fill="#9ADCD6" stroke={NAVY} strokeWidth={5} />
        <rect x={45} y={BASE_Y - h2a} width={120} height={h2a} rx={4} fill="#1F9E96" stroke={NAVY} strokeWidth={5} />
        {b2 > 0.5 && (
          <text x={105} y={BASE_Y - h2b - 14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill={NAVY} opacity={smooth((b2 - 0.5) * 2)}>
            5–10%
          </text>
        )}
        <text x={105} y={BASE_Y + 36} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={25} fill={NAVY}>
          Người lớn
        </text>
        {/* nguồn ngay cạnh biểu đồ */}
        <text x={BOARD.w / 2 - 24} y={BOARD.h / 2 - 22} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={26} fill="#4A5D70">
          Nguồn: WHO
        </text>
      </g>
    </g>
  );
};

/* ---------- Thẻ 2: ba ô theo độ tuổi ---------- */
const C2 = {x: 56, y: 690, w: 864, h: 440};
const ROW_H = 140;
const Frame = ({x, y, w, h}: {x: number; y: number; w: number; h: number}) => (
  <g>
    <rect x={x + 6} y={y + 12} width={w} height={h} rx={44} fill={NAVY} opacity={0.14} />
    <rect x={x} y={y} width={w} height={h} rx={44} fill="rgba(255,255,255,0.95)" stroke={NAVY} strokeWidth={6} />
  </g>
);

export const Card2 = ({t, frame}: {t: number; frame: number}) => {
  const a0 = S(10) + 0.3;
  if (t < a0 - 0.05) return null;
  const inn = sp(frame, a0, 13);
  const out = smooth(P(t, E(10) + 0.02, 0.35));
  const rows = [
    {at: a0 + 0.05, age: 'Sơ sinh', lines: ['Mũi viêm gan B']},
    {at: a0 + 0.4, age: '9–14 tuổi', lines: ['Vắc-xin HPV']},
    {at: a0 + 0.75, age: 'Người lớn', lines: ['Xét nghiệm rồi hỏi bác sĩ', 'về tiêm bù']},
  ];
  const hot = smooth(P(t, S(10) + 1.0, 0.3));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(0 ${(1 - Math.min(1, inn)) * 70})`} opacity={Math.min(1, inn) * (1 - out)}>
        <Frame {...C2} />
        <path d={`M ${C2.x + 98} ${C2.y + 82} V ${C2.y + 82 + ROW_H * 2}`} stroke={NAVY} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" opacity={0.5} />
        {rows.map((r, i) => {
          const s = sp(frame, r.at, 11);
          const y = C2.y + 82 + i * ROW_H;
          const lit = i === 2 ? hot : 0;
          return (
            <g key={i} transform={`translate(0 ${y})`} opacity={Math.min(1, s)}>
              {lit > 0.01 && <rect x={C2.x + 20} y={-62} width={C2.w - 40} height={124} rx={32} fill="#FFE9D6" opacity={lit} />}
              <g transform={`translate(${C2.x + 98} 0) scale(${s})`}>
                <circle r={50} fill="#FFF3E4" stroke={NAVY} strokeWidth={6} />
                {i === 0 && (
                  <g transform="scale(0.42)">
                    <Icon kind="baby" t={0} />
                  </g>
                )}
                {i === 1 && (
                  <g>
                    <g transform="translate(-17 2) scale(0.27)">
                      <Icon kind="female" t={0} />
                    </g>
                    <g transform="translate(17 2) scale(0.27)">
                      <Icon kind="male" t={0} />
                    </g>
                  </g>
                )}
                {i === 2 && (
                  <g transform="rotate(16)">
                    <rect x={-15} y={-38} width={30} height={76} rx={15} fill="#fff" stroke={NAVY} strokeWidth={5} />
                    <rect x={-12} y={-4} width={24} height={40} rx={12} fill="#D63A3A" />
                    <rect x={-18} y={-46} width={36} height={14} rx={6} fill={ORANGE} stroke={NAVY} strokeWidth={4} />
                  </g>
                )}
              </g>
              <text x={C2.x + 190} y={-18} fontFamily={FONT} fontWeight={900} fontSize={42} fill={i === 2 ? ORANGE : NAVY} stroke="#fff" strokeWidth={0}>
                {r.age}
              </text>
              {r.lines.map((l, k) => (
                <text key={k} x={C2.x + 190} y={22 + k * 36} fontFamily={FONT} fontWeight={800} fontSize={31} fill={NAVY}>
                  {l}
                </text>
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

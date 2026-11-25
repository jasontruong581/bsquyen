/* Thế giới giải phẫu nhìn nghiêng (mặt quay sang trái): miệng -> họng -> nắp thanh quản -> thực quản -> dạ dày dọc một đường thẳng đứng.
   Các ống dùng chung một lớp viền (vẽ viền dày rồi tô lòng ống đè lên) nên chỗ hai ống nối nhau liền một khối. */
import {type ReactNode} from 'react';
import {NAVY} from '../../src/common/overlays';
import {EH, XE, XT, Y_END, Y_TOP, type Sq, tubeD} from './geometry';
import {scopeAlong} from './motion';

export const SKIN = '#FFE3D0';
const LUMEN = '#F9C6C6';
const AIR = '#D3E5F7';
const ROSE = '#D9576A';
const TONGUE = '#EE8A97';
const ACID = '#E4EE9A';

const HEAD =
  'M 420 1450 L 420 1040 C 420 980 400 940 350 925 C 310 915 285 900 274 872 C 262 845 262 815 272 790 L 268 744 C 262 725 258 712 248 704 C 232 700 218 690 214 668 C 212 650 226 628 240 600 C 250 575 256 540 266 505 C 270 470 262 430 282 380 C 320 250 420 170 560 150 C 720 130 850 230 850 410 C 850 520 830 600 825 700 C 820 790 790 850 782 900 L 782 1450 C 782 1530 870 1560 905 1640 L 930 3650 L 250 3650 L 280 1640 C 310 1560 420 1530 420 1450 Z';
const HAIR = 'M 282 400 C 320 250 420 170 560 150 C 720 130 850 230 850 410 C 850 460 846 500 840 540 C 790 480 720 440 650 380 C 560 400 400 400 300 450 Z';
/* miệng + họng: một kênh liền */
const CHANNEL = 'M 270 738 C 360 700 480 688 570 688 C 650 688 702 715 702 790 L 702 990 L 548 990 L 548 835 C 520 806 430 814 330 804 C 300 801 285 790 272 780 Z';
const TONGUE_D = 'M 548 835 C 520 806 430 814 330 804 C 300 801 285 796 276 802 C 300 880 440 925 548 905 Z';
const TRACHEA = `M ${XT - 48} 955 H ${XT + 48} V 2160 H ${XT - 48} Z`;
const STOMACH = 'M 585 2800 C 520 2830 400 2930 390 3090 C 380 3250 470 3390 640 3390 C 800 3390 900 3260 890 3100 C 880 2940 780 2820 700 2800 Z';
const LUNG_L = 'M 440 1700 C 330 1700 280 1850 285 2100 C 290 2350 330 2540 440 2520 C 460 2400 455 1900 440 1700 Z';
const LUNG_R = 'M 715 1720 C 830 1720 905 1880 900 2100 C 895 2350 850 2540 715 2520 C 690 2400 700 1900 715 1720 Z';

type WorldProps = {
  t: number;
  sq: Sq[];
  epiglottis: number;
  noEntry: number;
  water: {front: number; top: number; opacity: number} | null;
  scopeLen: number;
  refluxFrom: number;
  refluxTo: number;
  children?: ReactNode;
};

export const World = ({t, sq, epiglottis, noEntry, water, scopeLen, refluxFrom, refluxTo, children}: WorldProps) => {
  const eso = tubeD(XE, Y_TOP - 5, Y_END, sq, EH);
  const waveTop = (x: number) => 3205 + 9 * Math.sin(x / 38 + t * 2.4);
  const pool = `M 370 ${waveTop(370)} ${Array.from({length: 27}, (_, i) => `L ${380 + i * 20} ${waveTop(380 + i * 20).toFixed(1)}`).join(' ')} L 910 3420 L 370 3420 Z`;
  const scope = scopeLen > 1 ? scopeAlong(scopeLen) : null;
  const scopeD = scope ? scope.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') : '';
  const tip = scope ? scope[scope.length - 1] : [0, 0];

  const drops = Array.from({length: 7}, (_, i) => {
    const p = ((t - refluxFrom) * 0.55 + i * 0.14) % 1;
    if (t < refluxFrom || t > refluxTo || p < 0) return null;
    const fade = Math.min(1, p * 5) * Math.min(1, (1 - p) * 4);
    return {x: 640 + 22 * Math.sin(p * 9 + i * 1.7), y: 3170 - p * 560, r: 9 + (i % 3) * 3, o: fade * 0.9};
  });

  return (
    <g>
      {/* thân: đầu, cổ, ngực */}
      <path d={HEAD} fill={SKIN} stroke={NAVY} strokeWidth={8} strokeLinejoin="round" />
      <path d={HAIR} fill="#4B3F5E" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 276 540 q 14 -14 30 -2" fill="none" stroke={NAVY} strokeWidth={6} strokeLinecap="round" />
      <circle cx={300} cy={548} r={11} fill="#fff" stroke={NAVY} strokeWidth={4} />
      <circle cx={297} cy={549} r={5.5} fill={NAVY} />
      <path d="M 232 684 q 10 4 18 -2" fill="none" stroke="#C98A6B" strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={742} cy={590} rx={34} ry={52} fill="#F7C9AE" stroke={NAVY} strokeWidth={6} />
      <path d="M 740 560 q -16 20 0 44" fill="none" stroke="#D99B7C" strokeWidth={5} strokeLinecap="round" />

      {/* phổi và phế quản (phía sau) */}
      <path d={LUNG_L} fill="#E4EEFA" stroke="#8FB0D8" strokeWidth={6} />
      <path d={LUNG_R} fill="#E4EEFA" stroke="#8FB0D8" strokeWidth={6} />
      <path d={`M ${XT} 2140 C ${XT} 2220 440 2250 395 2330`} fill="none" stroke={NAVY} strokeWidth={54} strokeLinecap="round" />
      <path d={`M ${XT} 2140 C ${XT} 2220 600 2230 775 2330`} fill="none" stroke={NAVY} strokeWidth={54} strokeLinecap="round" />
      <path d={`M ${XT} 2140 C ${XT} 2220 440 2250 395 2330`} fill="none" stroke={AIR} strokeWidth={38} strokeLinecap="round" />
      <path d={`M ${XT} 2140 C ${XT} 2220 600 2230 775 2330`} fill="none" stroke={AIR} strokeWidth={38} strokeLinecap="round" />

      {/* viền chung của kênh miệng-họng, khí quản, thực quản, dạ dày */}
      <g fill={NAVY} stroke={NAVY} strokeWidth={16} strokeLinejoin="round">
        <path d={CHANNEL} />
        <path d={TRACHEA} />
        <path d={eso} />
        <path d={STOMACH} />
      </g>
      <path d={CHANNEL} fill={LUMEN} />
      <path d={TRACHEA} fill={AIR} />
      <path d={eso} fill={LUMEN} />
      <path d={STOMACH} fill={LUMEN} />
      {/* các vòng sụn của khí quản */}
      {Array.from({length: 38}, (_, i) => (
        <path key={i} d={`M ${XT - 40} ${1000 + i * 30} H ${XT + 40}`} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.75} />
      ))}
      {/* cửa miệng: xoá nét viền ở chỗ mở miệng */}
      <rect x={262} y={746} width={22} height={32} fill={LUMEN} />
      <path d={TONGUE_D} fill={TONGUE} stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 330 828 q 60 14 130 6" fill="none" stroke="#D8707F" strokeWidth={5} strokeLinecap="round" />
      <rect x={276} y={736} width={20} height={30} rx={5} fill="#fff" stroke={NAVY} strokeWidth={3.5} />
      <rect x={276} y={780} width={20} height={24} rx={5} fill="#fff" stroke={NAVY} strokeWidth={3.5} />
      <ellipse cx={266} cy={726} rx={21} ry={14} fill="#E8707F" stroke={NAVY} strokeWidth={5} />
      <ellipse cx={268} cy={796} rx={23} ry={16} fill="#E8707F" stroke={NAVY} strokeWidth={5} />

      {/* dạ dày: nước axit */}
      <clipPath id="khoang-da-day">
        <path d={STOMACH} />
      </clipPath>
      <g clipPath="url(#khoang-da-day)">
        <path d={pool} fill={ACID} opacity={0.95} />
        {[0, 1, 2, 3, 4].map((i) => {
          const p = (t * 0.35 + i * 0.21) % 1;
          return <circle key={i} cx={470 + i * 90 + 12 * Math.sin(t * 2 + i)} cy={3400 - p * 190} r={7 + (i % 3) * 3} fill="#fff" opacity={0.6 * (1 - p)} />;
        })}
      </g>

      {/* ngụm nước chảy trong lòng thực quản */}
      {water && (
        <>
          <clipPath id="long-thuc-quan">
            <path d={eso} />
          </clipPath>
          <g clipPath="url(#long-thuc-quan)" opacity={water.opacity}>
            <rect x={XE - 80} y={water.top} width={160} height={Math.max(0, water.front - water.top)} fill="#7FC0F2" opacity={0.85} />
            <path d={`M ${XE - 80} ${water.front} q 20 22 40 0 t 40 0 t 40 0 t 40 0 V ${water.front - 30} H ${XE - 80} Z`} fill="#A9D8FA" opacity={0.9} />
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={XE - 30 + (i % 2) * 55 + 6 * Math.sin(t * 6 + i)} cy={water.front - 40 - i * 55} r={6 + (i % 2) * 3} fill="#fff" opacity={0.7} />
            ))}
          </g>
        </>
      )}

      {/* axit trào lên (cảnh 7) */}
      {drops.map((d, i) => (d ? <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={ACID} stroke="#B3C25A" strokeWidth={3} opacity={d.o} /> : null))}

      {children}

      {/* nắp thanh quản: dựng đứng khi mở, gập sang che đường thở khi đóng */}
      <g transform={`translate(548 988) rotate(${-90 * epiglottis})`}>
        <path d="M 0 0 C -24 -18 -30 -64 0 -92 C 30 -64 24 -18 0 0 Z" fill={ROSE} stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
      </g>
      {noEntry > 0.01 && (
        <g transform={`translate(${XT} 1090) scale(${noEntry})`} opacity={noEntry}>
          <circle r={32} fill="#fff" stroke="#D64545" strokeWidth={9} />
          <path d="M -22 22 L 22 -22" stroke="#D64545" strokeWidth={9} strokeLinecap="round" />
          <path d="M -12 -2 q 12 -10 24 0" fill="none" stroke="#9DB4D0" strokeWidth={5} strokeLinecap="round" />
        </g>
      )}

      {/* ống nội soi mềm */}
      {scope && (
        <g>
          <path d={scopeD} fill="none" stroke={NAVY} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
          <path d={scopeD} fill="none" stroke="#5E7288" strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
          <path d={scopeD} fill="none" stroke="#9FB2C6" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} transform="translate(0 -6)" />
          <circle cx={tip[0]} cy={tip[1] + 4} r={44} fill="#FFE98A" opacity={0.35} />
          <circle cx={tip[0]} cy={tip[1] + 4} r={16} fill="#FFF3B0" stroke={NAVY} strokeWidth={5} />
        </g>
      )}
    </g>
  );
};

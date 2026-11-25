/* Thế giới A: dạ dày có mặt, ngồi trong bồn axit sủi bọt. Toạ độ thế giới 1080 x 1920.
   danger 0..1: hoảng lên khi nghe "tự tiêu hoá chính mình"; relief 0..1: nhẹ nhõm, mỉm cười (cảnh cuối). */
import {NAVY} from '../../src/common/overlays';

const OUTER =
  'M 452 430 C 380 372, 262 410, 246 560 C 232 760, 300 990, 440 1082 C 590 1182, 790 1140, 866 996 C 900 930, 918 872, 900 826 ' +
  'L 846 800 C 800 884, 690 962, 598 906 C 540 868, 536 640, 540 430 Z';

const TUB_L = 150;
const TUB_R = 950;
const TUB_BOTTOM = 1200;
const SURFACE = 884;

const Face = ({t, danger, relief}: {t: number; danger: number; relief: number}) => {
  const cx = 400;
  const cy = 715;
  const happy = relief > 0.5;
  const shock = danger > 0.5;
  const look: [number, number] = [Math.sin(t * 3) * 8 * (1 - relief), 10 * (1 - relief)];
  const mouth = happy
    ? `M ${cx - 46} ${cy + 66} Q ${cx} ${cy + 116} ${cx + 46} ${cy + 66}`
    : `M ${cx - 50} ${cy + 86} q 12.5 -16 25 0 t 25 0 t 25 0 t 25 0`;
  return (
    <g>
      {[-52, 52].map((dx, i) =>
        happy ? (
          <path key={i} d={`M ${cx + dx - 28} ${cy + 6} Q ${cx + dx} ${cy - 32} ${cx + dx + 28} ${cy + 6}`} fill="none" stroke={NAVY} strokeWidth={9} strokeLinecap="round" />
        ) : (
          <g key={i}>
            <circle cx={cx + dx} cy={cy} r={38} fill="#fff" stroke={NAVY} strokeWidth={7} />
            <circle cx={cx + dx + look[0]} cy={cy + look[1]} r={shock ? 9 : 16} fill={NAVY} />
          </g>
        ),
      )}
      {!happy && <path d={`M ${cx - 92} ${cy - 46} L ${cx - 24} ${cy - 74} M ${cx + 24} ${cy - 74} L ${cx + 92} ${cy - 46}`} stroke={NAVY} strokeWidth={9} strokeLinecap="round" />}
      {shock && !happy ? (
        <ellipse cx={cx} cy={cy + 92} rx={26} ry={34} fill="#7a1f2a" stroke={NAVY} strokeWidth={7} />
      ) : (
        <path d={mouth} fill="none" stroke={NAVY} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {happy && (
        <>
          <circle cx={cx - 98} cy={cy + 52} r={16} fill="#FF8FA3" opacity={0.65} />
          <circle cx={cx + 98} cy={cy + 52} r={16} fill="#FF8FA3" opacity={0.65} />
        </>
      )}
      {/* giọt mồ hôi trượt xuống trán */}
      {!happy &&
        [0, 1, 2].map((i) => {
          const p = (t * 0.9 + i / 3) % 1;
          const x = [cx - 128, cx + 20, cx + 128][i];
          return (
            <g key={i} transform={`translate(${x} ${cy - 105 + p * 120}) scale(${1.25})`} opacity={Math.min(1, p * 5) * (1 - p * 0.7) * (1 - relief)}>
              <path d="M 0 -22 C 12 -2, 14 10, 0 14 C -14 10, -12 -2, 0 -22 Z" fill="#8FD3FF" stroke="#3A8FC8" strokeWidth={3} />
            </g>
          );
        })}
    </g>
  );
};

export const Stomach = ({t, danger = 0, relief = 0}: {t: number; danger?: number; relief?: number}) => {
  const wave = (x: number) => SURFACE + 14 * Math.sin(x / 80 + t * 2.4) + 7 * Math.sin(x / 33 - t * 3.3);
  let acidTop = `M ${TUB_L} ${wave(TUB_L)}`;
  for (let x = TUB_L + 10; x <= TUB_R; x += 10) acidTop += ` L ${x} ${wave(x).toFixed(1)}`;
  const acid = `${acidTop} V ${TUB_BOTTOM - 100} Q ${TUB_R} ${TUB_BOTTOM} ${TUB_R - 100} ${TUB_BOTTOM} H ${TUB_L + 100} Q ${TUB_L} ${TUB_BOTTOM} ${TUB_L} ${TUB_BOTTOM - 100} Z`;
  const tub = `M ${TUB_L} 850 V ${TUB_BOTTOM - 100} Q ${TUB_L} ${TUB_BOTTOM} ${TUB_L + 100} ${TUB_BOTTOM} H ${TUB_R - 100} Q ${TUB_R} ${TUB_BOTTOM} ${TUB_R} ${TUB_BOTTOM - 100} V 850`;
  const shake = 1 - relief;
  const sx = 5 * Math.sin(t * 41) * shake;
  const sy = 4 * Math.sin(t * 37 + 1) * shake;
  const bubbles = Array.from({length: 18}, (_, i) => {
    const period = 1.1 + (i % 5) * 0.25;
    const p = ((t + i * 0.43) % period) / period;
    return {x: TUB_L + 50 + ((i * 163) % 700), y: TUB_BOTTOM - 40 - p * (TUB_BOTTOM - SURFACE - 40), r: 9 + (i % 4) * 5, o: p < 0.9 ? 0.9 : 0, pop: p >= 0.9};
  });
  return (
    <g>
      <g transform={`translate(${sx} ${sy})`}>
        {/* thực quản + tá tràng */}
        <path d="M 452 430 C 450 300, 470 200, 470 60 L 540 60 C 540 200, 540 330, 540 430 Z" fill="#F2A99C" stroke="#A94C47" strokeWidth={8} />
        <path d="M 900 826 C 950 840, 990 900, 1000 990 L 1000 1060 L 940 1060 L 940 1000 C 935 940, 905 900, 846 800 Z" fill="#F2A99C" stroke="#A94C47" strokeWidth={8} />
        <defs>
          <clipPath id="trong-da-day">
            <path d={OUTER} />
          </clipPath>
        </defs>
        <path d={OUTER} fill="#F7B9AC" stroke="#A94C47" strokeWidth={10} strokeLinejoin="round" />
        <g clipPath="url(#trong-da-day)">
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M ${300 + i * 40} ${560 + i * 30} C ${360 + i * 60} ${760 + i * 40}, ${520 + i * 50} ${980 - i * 10}, ${760 + i * 20} ${1000 - i * 40}`} fill="none" stroke="#E58F82" strokeWidth={9} strokeLinecap="round" opacity={0.7} />
          ))}
          {/* thành dạ dày ửng đỏ khi nói "tự tiêu hoá chính mình" */}
          <path d={OUTER} fill="none" stroke="#E8584A" strokeWidth={60} opacity={0.55 * danger} />
        </g>
        <path d={OUTER} fill="none" stroke="#A94C47" strokeWidth={10} strokeLinejoin="round" />
        <Face t={t} danger={danger} relief={relief} />
      </g>

      {/* axit trong bồn (che nửa dưới dạ dày) */}
      <path d={acid} fill="#FFC93C" opacity={0.78} />
      <path d={acidTop} fill="none" stroke="#F2A81D" strokeWidth={8} />
      {bubbles.map((b, i) =>
        b.pop ? (
          <circle key={i} cx={b.x} cy={SURFACE + 6} r={b.r + 8} fill="none" stroke="#FFF3C4" strokeWidth={4} opacity={0.8} />
        ) : (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="#FFF3C4" stroke="#F2A81D" strokeWidth={3} opacity={b.o} />
        ),
      )}
      {/* giọt axit nảy lên khỏi mặt bồn */}
      {[0, 1, 2, 3, 4].map((i) => {
        const p = (t * 1.4 + i * 0.29) % 1;
        const x = TUB_L + 120 + i * 150 + 20 * Math.sin(i * 3 + t);
        return <circle key={i} cx={x} cy={SURFACE - 8 - 80 * Math.sin(Math.PI * p)} r={9} fill="#FFC93C" stroke="#F2A81D" strokeWidth={3} opacity={1 - p * 0.5} />;
      })}

      {/* bồn */}
      <path d={tub} fill="none" stroke={NAVY} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
      <path d={tub} fill="none" stroke="#EAF4FF" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={TUB_L - 24} y={832} width={60} height={26} rx={13} fill="#EAF4FF" stroke={NAVY} strokeWidth={7} />
      <rect x={TUB_R - 36} y={832} width={60} height={26} rx={13} fill="#EAF4FF" stroke={NAVY} strokeWidth={7} />
      <rect x={TUB_L + 60} y={TUB_BOTTOM + 14} width={60} height={34} rx={10} fill="#EAF4FF" stroke={NAVY} strokeWidth={7} />
      <rect x={TUB_R - 120} y={TUB_BOTTOM + 14} width={60} height={34} rx={10} fill="#EAF4FF" stroke={NAVY} strokeWidth={7} />
    </g>
  );
};

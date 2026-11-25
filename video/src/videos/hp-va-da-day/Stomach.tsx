/* Thế giới A: toàn cảnh dạ dày, có acid sóng sánh bên trong. Toạ độ thế giới 1080 x 1920. */
const OUTER =
  'M 452 430 C 380 372, 262 410, 246 560 C 232 760, 300 990, 440 1082 C 590 1182, 790 1140, 866 996 C 900 930, 918 872, 900 826 ' +
  'L 846 800 C 800 884, 690 962, 598 906 C 540 868, 536 640, 540 430 Z';

export const Stomach = ({t, danger = 0}: {t: number; danger?: number}) => {
  const wave = (x: number) => 870 + 16 * Math.sin(x / 80 + t * 2.2) + 8 * Math.sin(x / 33 - t * 3.1);
  let liquid = `M 200 ${wave(200)}`;
  for (let x = 210; x <= 960; x += 10) liquid += ` L ${x} ${wave(x).toFixed(1)}`;
  liquid += ' L 960 1300 L 200 1300 Z';
  const bubbles = Array.from({length: 14}, (_, i) => {
    const speed = 60 + (i % 5) * 18;
    const cyc = (t * speed + i * 97) % 260;
    return {x: 300 + ((i * 131) % 520), y: 1120 - cyc, r: 7 + (i % 3) * 4, o: Math.min(1, (260 - cyc) / 60)};
  });
  return (
    <g>
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
        {/* nếp niêm mạc */}
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M ${300 + i * 40} ${560 + i * 30} C ${360 + i * 60} ${760 + i * 40}, ${520 + i * 50} ${980 - i * 10}, ${760 + i * 20} ${1000 - i * 40}`} fill="none" stroke="#E58F82" strokeWidth={9} strokeLinecap="round" opacity={0.7} />
        ))}
        <path d={liquid} fill="#FFD24D" opacity={0.85} />
        <path d={liquid} fill="none" stroke="#F2A81D" strokeWidth={6} />
        {bubbles.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="#FFF3C4" stroke="#F2A81D" strokeWidth={3} opacity={b.o} />
        ))}
        {/* thành dạ dày ửng lên khi nói "tự tiêu hoá chính nó" */}
        <path d={OUTER} fill="none" stroke="#E8584A" strokeWidth={60} opacity={0.55 * danger} />
      </g>
      <path d={OUTER} fill="none" stroke="#A94C47" strokeWidth={10} strokeLinejoin="round" />
    </g>
  );
};

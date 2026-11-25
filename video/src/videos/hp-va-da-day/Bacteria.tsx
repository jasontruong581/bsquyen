/* Vi khuẩn HP: thân xoắn uốn sóng (pha chạy theo thời gian để trông như đang xoáy), đuôi có roi. */
export const HP = ({x, y, angle = 0, scale = 1, t, spin = 10, opacity = 1}: {x: number; y: number; angle?: number; scale?: number; t: number; spin?: number; opacity?: number}) => {
  if (scale <= 0.001 || opacity <= 0.001) return null;
  const L = 150;
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const px = -L / 2 + (L * i) / 40;
    const py = 16 * Math.sin((2 * Math.PI * 2.5 * i) / 40 - t * spin);
    pts.push(`${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  const body = pts.join(' ');
  const tailY = 16 * Math.sin(-t * spin);
  const flag = (k: number) => {
    const d: string[] = [];
    for (let i = 0; i <= 16; i++) {
      const px = -L / 2 - 6 - i * 5;
      const py = tailY + (k - 1.5) * 9 + 8 * Math.sin(i * 0.7 - t * 14 + k);
      d.push(`${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return d.join(' ');
  };
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} opacity={opacity}>
      {[0, 1, 2, 3].map((k) => (
        <path key={k} d={flag(k)} fill="none" stroke="#2F6B1F" strokeWidth={4} strokeLinecap="round" />
      ))}
      <path d={body} fill="none" stroke="#2F6B1F" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
      <path d={body} fill="none" stroke="#7CC04B" strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
      <path d={body} fill="none" stroke="#B5E58C" strokeWidth={6} strokeLinecap="round" opacity={0.7} transform="translate(0 -5)" />
    </g>
  );
};

/* Vi khuẩn thường (hình que xám) — dùng để minh hoạ "rất ít vi khuẩn sống nổi" */
export const Rod = ({x, y, angle, scale, opacity}: {x: number; y: number; angle: number; scale: number; opacity: number}) =>
  scale <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} opacity={opacity}>
      <rect x={-55} y={-20} width={110} height={40} rx={20} fill="#B8C2CC" stroke="#6B7785" strokeWidth={5} />
      <circle cx={-15} cy={0} r={6} fill="#8A96A3" />
      <circle cx={18} cy={-3} r={5} fill="#8A96A3" />
    </g>
  );

/* Đám mây kiềm quanh HP */
export const Cloud = ({x, y, r, opacity}: {x: number; y: number; r: number; opacity: number}) =>
  r <= 1 ? null : (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill="url(#kiem)" />
      <circle cx={x} cy={y} r={r} fill="none" stroke="#7E9CF0" strokeWidth={4} strokeDasharray="10 12" opacity={0.6} />
    </g>
  );

/* Bảng màu V012, ghi theo mã sRGB như bảng màu CSS.
   R3F bật quản lý màu của three nên mã hex trong chuỗi bị đổi sang tuyến tính (tối đi khi canvas xuất thẳng); raw đảo ngược phép đổi đó để màu hiện đúng mã đã ghi. */
const linearToSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
export const raw = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(255 * linearToSrgb(v / 255)));
  return '#' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
};

/** Nhóm màu theo brief: cam = thực quản và sóng nhu động; đỏ cam = dạ dày; xanh lá = ruột non và nhung mao; vàng = dịch tiêu hóa; xanh dương = ruột già; hồng = miệng; tím = axit */
export const P0 = {
  cream: '#FFF1C9',
  beige: '#E2CBA3',
  eso: '#FF9A3C',
  stomach: '#F2704E',
  stomachRim: '#8E3220',
  lip: '#FF6F8E',
  tongue: '#FF5C7A',
  white: '#FFFFFF',
  cavity: '#4A1220',
  si: '#54D68E',
  siRim: '#1F7A4A',
  colon: '#5C9DF2',
  colonRim: '#1F4FA0',
  rectum: '#B9805F',
  liver: '#D2603F',
  pancreas: '#FFC83D',
  gb: '#6FE39A',
  duct: '#4FD08A',
  acid: '#A98BFF',
  enzyme: '#FFE14D',
  saliva: '#BFE8FF',
  wave: '#FF8A1F',
  villi: '#86E3A6',
  mucosa: '#FFB5A5',
  capUp: '#FF5A64',
  capDown: '#C93B54',
  vessel: '#E0455C',
  nutrient: '#FFD23C',
  ghost: '#EAF6FF',
  dark: '#2B0B0E',
  pupil: '#101820',
  tooth: '#FFFDF4',
};
export const C = Object.fromEntries(Object.entries(P0).map(([k, v]) => [k, raw(v)])) as typeof P0;

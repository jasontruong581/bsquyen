/* Bảng màu V013 theo nhóm màu của dòng "lắp ráp cơ thể": hồng = mô mềm (thành tử cung, lớp lót), cam = buồng trứng và trứng,
   xanh lá = vòi trứng và tua vòi, tím nhẹ = cổ tử cung, xanh dương = khung chậu, vàng = tín hiệu.
   Ghi theo mã sRGB; raw() đảo phép đổi màu của three để màu hiện đúng mã đã ghi (cùng cách với V012). */
import {raw} from '../../V012 - 2026-11-27 - lap-tieu-hoa/canh-3d/mau';

export {raw};

export const P0 = {
  wall: '#FF93A8',
  wallRim: '#A8344E',
  cavity: '#C94C74',
  cavityDark: '#A93A62',
  lining: '#F2407A',
  cervix: '#B9A0FF',
  cervixRim: '#5B3C9E',
  canal: '#5E3FA6',
  ovary: '#FFA94D',
  ovaryRim: '#9A4A0A',
  follicle: '#FFF8E2',
  follicleRim: '#C2923A',
  tube: '#4FD08A',
  tubeRim: '#1F7A4A',
  finger: '#69E09E',
  egg: '#FFF0C8',
  eggHalo: '#FFE9B0',
  cheek: '#FF9B8A',
  pear: '#D9E85C',
  pearRim: '#6E8A12',
  stem: '#7A4A2A',
  leaf: '#3FC46B',
  ghost: '#EEF6FF',
  pelvis: '#F4FAFF',
  pelvisRim: '#5F86D6',
  spark: '#FFE14D',
  flake: '#FF9DB8',
  drop: '#FFD3E0',
  white: '#FFFFFF',
  dark: '#2B0B0E',
  pupil: '#101820',
};
export const C = Object.fromEntries(Object.entries(P0).map(([k, v]) => [k, raw(v)])) as typeof P0;

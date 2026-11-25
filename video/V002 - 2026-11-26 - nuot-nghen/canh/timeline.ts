import data from '../../public/nuot-nghen/timeline.json';
import {makeTimeline} from '../../src/timeline';

export const {timeline, S, E, W} = makeTimeline(data);

/** Mốc kết thúc của chữ đầu tiên bắt đầu bằng `prefix` trong cảnh n */
export const WE = (n: number, prefix: string) => {
  const p = prefix.toLowerCase().normalize('NFC');
  const hit = timeline.scenes[n - 1].words.find((w) => w.text.toLowerCase().normalize('NFC').startsWith(p));
  if (!hit) throw new Error(`Cảnh ${n}: không có chữ "${prefix}"`);
  return hit.t1;
};

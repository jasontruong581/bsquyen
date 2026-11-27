import data from '../../public/morphin-nghien/timeline.json';
import {makeTimeline} from '../../src/timeline';

export const {timeline, S, E, W} = makeTimeline(data);

/* Cả video nằm trong vùng nghiêm: từ đầu tới hết cảnh 9 có chữ "ung thư", "di căn", "đau", "nghiện". Không bong bóng hài, không mặt cười, không tiếng vui.
   Tin chỉ lo, im lặng, rồi nghỉ ngơi dịu dàng khi âm lượng hạ xuống. Tiếng ping/click nhỏ chỉ để báo mốc. */

import {Composition} from 'remotion';
import {FPS} from './timeline';
import * as hpVaDaDay from '../V001 - 2026-11-25 - hp-va-da-day/canh';
import * as nuotNghen from '../V002 - 2026-11-26 - nuot-nghen/canh';
import * as thuocLa from '../V003 - 2026-11-26 - thuoc-la/canh';
import * as ganThamLang from '../V004 - 2026-11-26 - gan-tham-lang/canh';
import * as vacXinPhongUngThu from '../V006 - 2026-11-26 - vac-xin-phong-ung-thu/canh';

/* Mỗi video là một Composition, id = slug (trùng "slug" trong post.json của thư mục video/V<số> - <ngày> - <slug>/).
   Thêm video mới: import phần canh/ của nó và thêm vào danh sách. */
const videos = [
  {id: hpVaDaDay.id, component: hpVaDaDay.HpVideo, durationInFrames: hpVaDaDay.durationInFrames},
  {id: nuotNghen.id, component: nuotNghen.NuotNghenVideo, durationInFrames: nuotNghen.durationInFrames},
  {id: thuocLa.id, component: thuocLa.ThuocLaVideo, durationInFrames: thuocLa.durationInFrames},
  {id: ganThamLang.id, component: ganThamLang.GanVideo, durationInFrames: ganThamLang.durationInFrames},
  {id: vacXinPhongUngThu.id, component: vacXinPhongUngThu.VacXinVideo, durationInFrames: vacXinPhongUngThu.durationInFrames},
];

export const Root = () => (
  <>
    {videos.map((v) => (
      <Composition key={v.id} id={v.id} component={v.component} durationInFrames={v.durationInFrames} fps={FPS} width={1080} height={1920} />
    ))}
  </>
);

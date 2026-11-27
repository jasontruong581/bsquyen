import {Composition} from 'remotion';
import {FPS} from './timeline';
import * as hpVaDaDay from '../V001 - 2026-11-25 - hp-va-da-day/canh';
import * as nuotNghen from '../V002 - 2026-11-26 - nuot-nghen/canh';
import * as thuocLa from '../V003 - 2026-11-26 - thuoc-la/canh';
import * as ganThamLang from '../V004 - 2026-11-26 - gan-tham-lang/canh';
import * as vacXinPhongUngThu from '../V006 - 2026-11-26 - vac-xin-phong-ung-thu/canh';
import * as polypDaiTrang from '../V007 - 2026-11-26 - polyp-dai-trang/canh';
import * as morphinNghien from '../V008 - 2026-11-26 - morphin-nghien/canh';
import * as tuKhamVu from '../V009 - 2026-11-26 - tu-kham-vu/canh';
import * as chamSocGiamNhe from '../V010 - 2026-11-27 - cham-soc-giam-nhe/canh';
import * as phoi3d from '../V005 - 2026-11-26 - phoi-tam-soat/canh-3d';
import * as phoi2d from '../V005 - 2026-11-26 - phoi-tam-soat/canh-2d';
import * as lapGan from '../V011 - 2026-11-27 - lap-gan/canh-3d';
import * as lapTieuHoa from '../V012 - 2026-11-27 - lap-tieu-hoa/canh-3d';
import * as lapTuCung from '../V013 - 2026-11-27 - lap-tu-cung/canh-3d';
import * as lapChiecRang from '../V014 - 2026-11-27 - lap-chiec-rang/canh-3d';

/* Mỗi video là một Composition, id = slug (trùng "slug" trong post.json của thư mục video/V<số> - <ngày> - <slug>/).
   Thêm video mới: import phần canh/ của nó và thêm vào danh sách. */
const videos = [
  {id: hpVaDaDay.id, component: hpVaDaDay.HpVideo, durationInFrames: hpVaDaDay.durationInFrames},
  {id: nuotNghen.id, component: nuotNghen.NuotNghenVideo, durationInFrames: nuotNghen.durationInFrames},
  {id: thuocLa.id, component: thuocLa.ThuocLaVideo, durationInFrames: thuocLa.durationInFrames},
  {id: ganThamLang.id, component: ganThamLang.GanVideo, durationInFrames: ganThamLang.durationInFrames},
  {id: vacXinPhongUngThu.id, component: vacXinPhongUngThu.VacXinVideo, durationInFrames: vacXinPhongUngThu.durationInFrames},
  {id: polypDaiTrang.id, component: polypDaiTrang.PolypVideo, durationInFrames: polypDaiTrang.durationInFrames},
  {id: morphinNghien.id, component: morphinNghien.MorphinVideo, durationInFrames: morphinNghien.durationInFrames},
  {id: tuKhamVu.id, component: tuKhamVu.KhamVuVideo, durationInFrames: tuKhamVu.durationInFrames},
  {id: chamSocGiamNhe.id, component: chamSocGiamNhe.ChamSocGiamNheVideo, durationInFrames: chamSocGiamNhe.durationInFrames},
  // V005 có hai bản cùng kịch bản (post.json slug "phoi-tam-soat"): id composition = phoi-3d / phoi-2d
  {id: phoi3d.id, component: phoi3d.Phoi3dVideo, durationInFrames: phoi3d.durationInFrames},
  {id: phoi2d.id, component: phoi2d.Phoi2dVideo, durationInFrames: phoi2d.durationInFrames},
  // V011: video 3D dài "lắp ráp cơ thể" (lá gan), một composition id = slug
  {id: lapGan.id, component: lapGan.GanLapVideo, durationInFrames: lapGan.durationInFrames},
  // V012: video 3D dài "lắp ráp cơ thể" (hệ tiêu hóa), viên thức ăn đi từ miệng xuống hậu môn
  {id: lapTieuHoa.id, component: lapTieuHoa.TieuHoaVideo, durationInFrames: lapTieuHoa.durationInFrames},
  // V013: video 3D dài "lắp ráp cơ thể" (tử cung và buồng trứng), quả trứng nhân vật đi từ nang qua vòi trứng vào khoang tử cung
  {id: lapTuCung.id, component: lapTuCung.TuCungVideo, durationInFrames: lapTuCung.durationInFrames},
  // V014: video 3D dài "lắp ráp cơ thể" (chiếc răng hàm, vì sao sâu răng), viên đường nhân vật dẫn truyện
  {id: lapChiecRang.id, component: lapChiecRang.LapChiecRangVideo, durationInFrames: lapChiecRang.durationInFrames},
];

export const Root = () => (
  <>
    {videos.map((v) => (
      <Composition key={v.id} id={v.id} component={v.component} durationInFrames={v.durationInFrames} fps={FPS} width={1080} height={1920} />
    ))}
  </>
);

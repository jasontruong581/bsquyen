import {Composition} from 'remotion';
import {FPS} from './timeline';
import * as hpVaDaDay from '../V001 - 2026-11-25 - hp-va-da-day/canh';

/* Mỗi video là một Composition, id = slug (trùng "slug" trong post.json của thư mục video/V<số> - <ngày> - <slug>/).
   Thêm video mới: import phần canh/ của nó và thêm vào danh sách. */
const videos = [{id: hpVaDaDay.id, component: hpVaDaDay.HpVideo, durationInFrames: hpVaDaDay.durationInFrames}];

export const Root = () => (
  <>
    {videos.map((v) => (
      <Composition key={v.id} id={v.id} component={v.component} durationInFrames={v.durationInFrames} fps={FPS} width={1080} height={1920} />
    ))}
  </>
);

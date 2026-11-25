import {Composition} from 'remotion';
import {FPS} from './timeline';
import * as hpVaDaDay from './videos/hp-va-da-day';

/* Mỗi video là một Composition, id = slug (trùng tên thư mục video/<slug>/). Thêm video mới: import và thêm vào đây. */
const videos = [{id: hpVaDaDay.id, component: hpVaDaDay.HpVideo, durationInFrames: hpVaDaDay.durationInFrames}];

export const Root = () => (
  <>
    {videos.map((v) => (
      <Composition key={v.id} id={v.id} component={v.component} durationInFrames={v.durationInFrames} fps={FPS} width={1080} height={1920} />
    ))}
  </>
);

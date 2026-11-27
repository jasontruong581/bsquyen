/* Trộn âm thanh: giọng đọc từng cảnh, hiệu ứng âm thanh, nhạc nền nhỏ dần vào và ra. */
import {Audio, Sequence, interpolate, staticFile} from 'remotion';
import {FPS, type Timeline} from '../timeline';

export type Sfx = {t: number; src: string; v: number};

// Chủ kênh thấy nhạc nền hơi ồn ở V002 (26/11/2026) nên giảm 20% so với mức 0.1 ban đầu.
const MUSIC_VOLUME = 0.08;

export const Mix = ({tl, sfx, music = 'music/hope-piano.mp3'}: {tl: Timeline; sfx: Sfx[]; music?: string}) => (
  <>
    {tl.scenes.map((s) => (
      <Sequence key={s.id} from={Math.round(s.start * FPS)}>
        <Audio src={staticFile(s.audio)} />
      </Sequence>
    ))}
    {sfx.map((x, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(x.t * FPS))} durationInFrames={FPS * 2}>
        <Audio src={staticFile(x.src)} volume={x.v} />
      </Sequence>
    ))}
    <Audio
      src={staticFile(music)}
      loop
      volume={(f) => MUSIC_VOLUME * interpolate(f, [0, 20, tl.total * FPS - 45, tl.total * FPS], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
    />
  </>
);

export type VideoInfo = {dir: string; slug: string; id: string};
export const VIDEO_ROOT: string;
export function listVideos(): VideoInfo[];
export function findVideo(arg: string | undefined): VideoInfo;

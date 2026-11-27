import data from '../../public/cham-soc-giam-nhe/timeline.json';
import {makeTimeline} from '../../src/timeline';

export const {timeline, S, E, W} = makeTimeline(data);

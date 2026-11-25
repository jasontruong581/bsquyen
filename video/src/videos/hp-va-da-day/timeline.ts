import data from '../../../public/hp-va-da-day/timeline.json';
import {makeTimeline} from '../../timeline';

export const {timeline, S, E, W} = makeTimeline(data);

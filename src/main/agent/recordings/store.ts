import type { Recorder } from '../../recorder';
import type { ExecutionScope } from '../execution/scope';

export const recordingOwners = new WeakMap<Recorder, Map<string, ExecutionScope>>();

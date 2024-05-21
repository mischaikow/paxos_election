import path from 'path';
import { AllChildState, ChildState } from './manager.types.js';

export const CLUSTER_REL_FILENAME = path.resolve('../cluster');
export const MSG_REQ_NEIGHBORS = 'child-request-neighbors';
let lastValue = 3000;

// When adding a new child, we need to make sure the name is unused
// TODO: add a check to make sure the port is available
// TODO: replace childrenNames with children
export function nextAPIPort(children: string[]): string {
  if (children.length === 0) {
    lastValue++;
    children.push(String(lastValue));
    return String(lastValue);
  }

  while (children.includes(String(lastValue))) {
    if (lastValue === 3999) {
      lastValue = 3000;
    }
    lastValue++;
  }

  children.push(String(lastValue));
  return String(lastValue);
}

export function findWSS(childrenWSSPorts: Set<number>): number {
  let nextWSS = 4001;
  while (nextWSS in childrenWSSPorts) {
    nextWSS++;
  }
  return nextWSS;
}

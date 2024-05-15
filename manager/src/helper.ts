import path from 'path';

export const CLUSTER_REL_FILENAME = path.resolve('../cluster');
let lastValue = 3000;

export function addChild(children: string[]): string {
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

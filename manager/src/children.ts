import { AllChildState, ChildState } from './manager.types.js';

export class Children {
  children: AllChildState;

  constructor() {
    this.children = {};
  }

  addChild(): ChildState {
    let newName = 1000;
    let newPortAPI = 3000;
    let newPortWS = 4000;
    for (const [childName, child] of Object.entries(this.children)) {
      newName = Math.max(newName, child.nodeName);
      newPortAPI = Math.max(newPortAPI, child.portApi);
      newPortWS = Math.max(newPortWS, child.portWs);
    }
    newName++;
    newPortAPI++;
    newPortWS++;

    this.children[String(newName)] = {
      nodeName: newName,
      portApi: newPortAPI,
      portWs: newPortWS,
      connection: null,
    };

    return this.children[String(newName)];
  }

  listChildren(): string[] {
    return Object.keys(this.children);
  }

  listLiveChildren(): string[] {
    const ans = [];
    for (const [childName, child] of Object.entries(this.children)) {
      if (child.connection !== null) {
        ans.push(childName);
      }
    }
    return ans;
  }

  listNeighbors(): ChildState[] {
    const ans = [];
    for (const [childName, child] of Object.entries(this.children)) {
      if (child.connection !== null) {
        ans.push(child);
      }
    }
    return ans;
  }
}

import { MSG_REQ_NEIGHBORS } from './helper.js';
import { AllChildState, ChildData, ChildState, ParentChildMessage } from './manager.types.js';

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

  nextAPIPort(childNodeName: string): number {
    let newPortAPI = 3000;
    for (const [childName, child] of Object.entries(this.children)) {
      newPortAPI = Math.max(newPortAPI, child.portApi);
    }
    newPortAPI++;

    this.children[childNodeName].portApi = newPortAPI;
    this.broadcastNeighbors();
    return newPortAPI;
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

  listNeighbors(): ChildData[] {
    const ans: ChildData[] = [];
    for (const [childName, child] of Object.entries(this.children)) {
      if (child.connection !== null) {
        ans.push({
          nodeName: child.nodeName,
          portApi: child.portApi,
          portWs: child.portWs,
        });
      }
    }
    return ans;
  }

  neighborListMessage(): ParentChildMessage {
    return {
      signal: MSG_REQ_NEIGHBORS,
      data: this.listNeighbors(),
    };
  }

  broadcastNeighbors() {
    for (const [childName, child] of Object.entries(this.children)) {
      if (child.connection !== null) {
        child.connection.send(this.neighborListMessage());
      }
    }
  }
}

import { fork } from 'child_process';
import { Child, ChildData, NodeChildData } from './children.types.js';
import { CLUSTER_REL_FILENAME, MSG_PROCESS_EXIT, MSG_REQ_NEIGHBORS, MSG_REQ_NEW_API } from './constants.js';

export class Children {
  children: Child[];
  nextName: number;
  nextPortApi: number;
  nextPortWs: number;

  constructor() {
    this.children = [];
    this.nextName = 1001;
    this.nextPortApi = 3001;
    this.nextPortWs = 4001;
  }

  addChild(): ChildData {
    // TODO: There is a better way of doing this - figure that out
    let newName = this.nextName;
    let newPortApi = this.nextPortApi;
    let newPortWs = this.nextPortWs;
    this.nextName++;
    this.nextPortApi++;
    this.nextPortWs++;

    console.log(`[parent] Going to build ${newName}`);
    const child: Child = {
      name: String(newName),
      portApi: newPortApi,
      portWs: newPortWs,
      connection: fork('dist/server.js', [String(newName), String(newPortApi), String(newPortWs)], {
        cwd: CLUSTER_REL_FILENAME,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_STATE: 'child',
        },
      }),
    };

    child.connection?.on('message', (msg) => {
      if (msg === MSG_REQ_NEIGHBORS) {
        this.broadcastNeighbors();
      } else if (msg === MSG_REQ_NEW_API) {
        this.nextApiPort(child.name);
      } else {
        console.log(`[parent] Child ${child.name} says: ${msg}\n`);
      }
    });

    child.connection?.on('error', (err) => {
      console.log(`[parent] Child ${child.name} error: ${err}\n`);
    });

    this.children.push(child);
    return {
      name: child.name,
      portApi: child.portApi,
      portWs: child.portWs,
    };
  }

  removeChild(childName: string): string {
    const childToRemove = this.children.find((child) => {
      return child.name === childName;
    });
    if (childToRemove?.connection) {
      childToRemove.connection.send({
        signal: MSG_PROCESS_EXIT,
      });
      childToRemove.connection = null;
      return childToRemove.name;
    }
    return 'Did not find child';
  }

  // TODO: There is a better way of doing this as well
  nextApiPort(childNodeName: string): boolean {
    let newPortApi = this.nextPortApi;
    this.nextPortApi++;

    const namedChild = this.children.find((child) => {
      return child.name === childNodeName;
    });
    if (namedChild) {
      namedChild.portApi = newPortApi;
      if (namedChild.connection) {
        console.log(`[parent] Trying to send new api address ${newPortApi}`);
        namedChild.connection.send({
          signal: MSG_REQ_NEW_API,
          data: { newPortApi: namedChild.portApi },
        });
      } else {
        // TODO throw error
      }
      return true;
    }

    return false;
  }

  neighborList(): NodeChildData[] {
    const ans: NodeChildData[] = [];
    for (const child of this.children) {
      if (child.connection !== null) {
        ans.push({
          nodeName: child.name,
          portApi: child.portApi,
          portWs: child.portWs,
        });
      }
    }
    return ans;
  }

  neighborListMessage() {
    return {
      signal: MSG_REQ_NEIGHBORS,
      data: this.neighborList(),
    };
  }

  broadcastNeighbors() {
    const neighborList = this.neighborListMessage();
    for (const child of this.children) {
      if (child.connection !== null) {
        child.connection.send(neighborList);
      }
    }
  }
}

import { fork } from 'child_process';
import { CLUSTER_REL_FILENAME, MSG_REQ_NEIGHBORS } from './helper.js';
import { ChildState, ParentChildMessage } from './manager.types.js';
import { Children } from './children.js';

export async function buildChildNode(children: Children, child: ChildState) {
  if (child.connection !== null) {
    throw new Error('Tried to build a child that already exists!');
  }
  console.log(`Going to build ${child.nodeName}`);
  child.connection = fork('dist/server.js', [String(child.nodeName), String(child.portApi), String(child.portWs)], {
    cwd: CLUSTER_REL_FILENAME,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NODE_STATE: 'child',
    },
  });

  // TODO: add ability for a node to request a new port
  // this is why we feed children into this function.
  child.connection.on('message', (msg) => {
    if (msg === MSG_REQ_NEIGHBORS) {
      child.connection?.send(children.neighborListMessage());
    } else {
      console.log(`child ${child.nodeName} says: ${msg}`);
    }
  });

  child.connection.on('error', (err) => {
    console.log(`child ${child.nodeName} errors: ${err}`);
  });
}

import { spawn } from 'child_process';
import { CLUSTER_REL_FILENAME } from './helper.js';

export async function buildPaxos(nodeName: string): Promise<void> {
  console.log(`going to build ${nodeName}`);
  const buildProcess = spawn('pnpm', ['run child', nodeName], {
    cwd: CLUSTER_REL_FILENAME,
    stdio: 'inherit',
    shell: true,
  });

  buildProcess.on('message', (msg) => {
    console.log(`child ${nodeName} says: ${msg}`);
  });

  buildProcess.on('error', (err) => {
    console.log(`child ${nodeName} errors: ${err}`);
  });

  return;
}

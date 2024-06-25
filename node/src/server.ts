import app, { getNewPortApi, localNode } from './app.js';
import { DOWNTIME } from './constants.js';
import { sleep } from './util.js';

const server = app.listen(app.get('port'), () => {
  console.log(`[${localNode.name}] is running at http://localhost:${app.get('port')}\n`);
});

export async function goDark() {
  server.closeAllConnections();
  await sleep(100);
  server.close(() => {
    console.log(`[${localNode.name}] disconnected`);
  });
  getNewPortApi();
  await sleep(DOWNTIME);
  app.listen(app.get('port'), () => {
    console.log(`[${localNode.name}] is back online`);
  });
}

export default server;

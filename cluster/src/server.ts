import app from './app.js';
import { sleep, DOWNTIME } from './helper.js';

const server = app.listen(app.get('port'), () => {
  console.log(`  App is running at http://localhost:${app.get('port')}\n`);
  console.log('  Press CTRL-C to stop\n');
});

export async function goDark() {
  server.closeAllConnections();
  await sleep(100);
  server.close(() => {
    console.log('disconnected');
  });
  await sleep(DOWNTIME);
  app.listen(app.get('port'), () => {
    console.log('back online');
  });
}

export default server;

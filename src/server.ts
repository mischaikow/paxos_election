import app from './app.js';
import { DOWNTIME } from './helper.js';

const server = app.listen(app.get('port'), () => {
  console.log(`  App is running at http://localhost:${app.get('port')}\n`);
  console.log('  Press CTRL-C to stop\n');
});

export async function goDark() {
  server.close(() => {
    console.log('disconnecting');
  });
  setTimeout(() => {
    app.listen(app.get('port'), () => {
      console.log('back online');
    });
  }, DOWNTIME);
}

export default server;

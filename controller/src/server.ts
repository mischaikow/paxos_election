import app from './app.js';

const server = app.listen(app.get('port'), () => {
  console.log(`  App is running at http://localhost:${app.get('port')}\n`);
  console.log('  Press CTRL-C to stop\n');
});

export default server;

import { WebSocketServer } from 'ws';
import { Leader } from './leader.js';
import { Server } from 'http';

export class WebSocketServers {
  wss;
  clients;
  leader;

  constructor(server: Server, leader: Leader) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Set();
    this.leader = leader;

    this.wss.on('connection', (ws) => {
      console.log('Dashboard connected');

      ws.on('close', () => console.log('Dashboard disconnected'));

      ws.on('message', (message) => {
        console.log(`${message}`);
        if (message.toString() === 'status') {
          console.log(`Received status check, measure ${leader.leader}`);
          if (leader.leader === null) {
            ws.send(`undefined`);
          } else if (leader.leader === leader.me) {
            ws.send(`me`);
          } else {
            ws.send(`defined`);
          }
        } else {
          ws.send('uhhh...');
        }
      });
    });
  }
}

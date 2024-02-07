import { WebSocket, WebSocketServer } from 'ws';
import { Leader } from './leader.js';
import { Server } from 'http';

export class WebSocketServers {
  wss: WebSocketServer;
  clients: Set<WebSocket>;
  leader: Leader;

  constructor(server: Server, leader: Leader) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Set<WebSocket>();
    this.leader = leader;

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log('Dashboard connected');

      ws.on('close', () => console.log('Dashboard disconnected'));

      ws.on('message', (message) => {
        console.log(`${message}`);
        if (message.toString() === 'status') {
          console.log(`Received status check, measure ${leader.leader}`);
          this.leaderElected();
        } else {
          ws.send('uhhh...');
        }
      });
    });
  }

  leaderDown() {
    this.broadcast('leader - undefined');
  }

  leaderElected() {
    if (this.leader.leader === null) {
      this.broadcast(`leader - null`);
    } else {
      this.broadcast(`leader - ${this.leader.leader}`);
    }
  }

  broadcast(message: string) {
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}

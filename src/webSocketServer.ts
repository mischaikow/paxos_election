import { WebSocket, WebSocketServer } from 'ws';
import { Leader } from './leader.js';
import { Server } from 'http';
import { goDark } from './server.js';
import { DOWNTIME } from './helper.js';

export class WebSocketServers {
  wss: WebSocketServer;
  clients: Set<WebSocket>;
  leader: Leader;
  isDark: boolean;

  constructor(server: Server, leader: Leader) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Set<WebSocket>();
    this.leader = leader;
    this.isDark = false;

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log('Dashboard connected');

      ws.on('close', () => console.log('Dashboard disconnected'));

      ws.on('message', (message: string) => {
        if (this.isDark) {
          ws.send('dead');
        } else {
          switch (message.toString()) {
            case 'status':
              // console.log(`Received status check, leader is ${leader.leader}`);
              this.leaderElected();
              break;
            case 'pause':
              console.log(`Going dark`);
              this.isDark = true;
              goDark();
              setTimeout(() => {
                this.isDark = false;
              }, DOWNTIME);
              this.leader.leader = null;
              break;
            default:
              ws.send('pong');
          }
        }
      });
    });
  }

  leaderDown() {
    this.broadcast('lost');
  }

  leaderElected() {
    if (this.leader.leader === null) {
      this.broadcast(`lost`);
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

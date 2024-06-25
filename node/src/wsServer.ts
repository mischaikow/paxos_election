import { WebSocket, WebSocketServer } from 'ws';
import { LocalNode } from './localNode.js';
import { Server } from 'http';
import { goDark } from './server.js';

export class WsServer {
  wss: WebSocketServer;
  clients: Set<WebSocket>;
  localNode: LocalNode;
  isDark: boolean;

  constructor(server: Server, localNode: LocalNode) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Set<WebSocket>();
    this.localNode = localNode;
    this.isDark = false;

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log(`[${localNode.name}] New dashboard connected`);

      ws.on('close', () => console.log(`[${localNode.name}] Dashboard disconnected`));

      ws.on('message', async (message: string) => {
        if (this.isDark) {
          ws.send('dead');
        } else {
          switch (message.toString()) {
            case 'status':
              //
              break;
            case 'pause':
              console.log(`[${this.localNode.name}] WebSocket request - going dark`);
              this.isDark = true;
              await goDark();
              this.isDark = false;
              console.log(`[${this.localNode.name}] WebSocket request - back online`);
              this.localNode.leader = null;
              break;
            default:
              ws.send('pong');
          }
        }
      });
    });
  }

  leaderDownBroadcast(): void {
    if (this.localNode.leader === null) {
      this.broadcast('lost');
    }
  }

  statusBroadcast(): void {
    if (this.localNode.leader === null) {
      this.broadcast('lost');
    } else if (this.localNode.leader.nodeName === this.localNode.name) {
      this.broadcast('iLead');
    } else {
      this.broadcast('found');
    }
  }

  broadcast(message: string): void {
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}

import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';
import { setWss } from './broadcast';

let wss: WebSocketServer | null = null;

export async function GET(req: NextRequest) {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
    setWss(wss);
    wss.on('connection', (ws) => {
      ws.on('message', () => {
        // Optionally handle incoming messages
      });
    });
  }

  // @ts-expect-error - Next.js socket server extension
  if (req.socket && req.socket.server && !req.socket.server.wss) {
    // @ts-expect-error - Next.js socket server extension
    req.socket.server.wss = wss;
    // @ts-expect-error - Next.js socket server extension
    req.socket.server.on('upgrade', (request, socket, head) => {
      if (request.url === '/api/socket') {
        wss!.handleUpgrade(request, socket, head, (ws) => {
            wss!.emit('connection', ws, request);
          });
      }
    });
  }

  return new Response(null, { status: 200 });
} 
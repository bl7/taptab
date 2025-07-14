import { WebSocketServer } from 'ws';

interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  status: string;
  total: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export let wss: WebSocketServer | null = null;

export function setWss(server: WebSocketServer) {
  wss = server;
}

export function broadcastOrder(order: Order) {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'new_order', order }));
      }
    });
  }
} 
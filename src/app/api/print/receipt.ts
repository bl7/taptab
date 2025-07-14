import puppeteer from 'puppeteer';

interface OrderItem {
  quantity: number;
  name: string;
  price: number;
}

interface Order {
  restaurant?: {
    logoUrl?: string;
    name?: string;
  };
  table?: {
    name?: string;
  };
  createdAt: string;
  addedItems?: OrderItem[];
  items: OrderItem[];
  total: number;
  note?: string;
}

export async function generateReceiptPNG(order: Order) {
  const html = getReceiptHTML(order);
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const element = await page.$('#receipt-root');
  if (!element) {
    await browser.close();
    throw new Error('Could not find #receipt-root element in rendered HTML');
  }
  const imageBase64 = await element.screenshot({ encoding: 'base64' });
  await browser.close();
  return imageBase64;
}

function getReceiptHTML(order: Order) {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #fff; color: #000; margin: 0; padding: 0; }
          #receipt-root { width: 350px; padding: 24px; }
          .logo { text-align: center; margin-bottom: 12px; }
          .title { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 8px; }
          .subtitle { text-align: center; margin-bottom: 16px; font-size: 14px; }
          .table { margin-bottom: 8px; }
          .items { margin-bottom: 12px; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .added-section { background: #e6ffe6; border: 1px dashed #2ecc40; padding: 8px; margin-bottom: 12px; }
          .added-title { font-weight: bold; color: #2ecc40; margin-bottom: 4px; }
          .total { font-weight: bold; font-size: 16px; margin-top: 12px; }
          .note { margin-top: 8px; font-size: 13px; }
          .footer { text-align: center; margin-top: 18px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div id="receipt-root">
          <div class="logo">
            ${order.restaurant?.logoUrl ? `<img src='${order.restaurant.logoUrl}' style='max-width:80px;max-height:80px;margin-bottom:8px;' />` : ''}
          </div>
          <div class="title">${order.restaurant?.name || 'Restaurant'}</div>
          <div class="subtitle">Table: <b>${order.table?.name || '-'}</b><br/>${new Date(order.createdAt).toLocaleString()}</div>
          ${order.addedItems && order.addedItems.length > 0 ? `
            <div class="added-section">
              <div class="added-title">Added Items</div>
              ${order.addedItems.map((item: OrderItem) => `
                <div class="item-row">
                  <span>${item.quantity} × ${item.name}</span>
                  <span>$${item.price.toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <div class="items">
            ${order.items.map((item: OrderItem) => `
              <div class="item-row">
                <span>${item.quantity} × ${item.name}</span>
                <span>$${item.price.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">Total: $${order.total.toFixed(2)}</div>
          ${order.note ? `<div class="note">Note: ${order.note}</div>` : ''}
          <div class="footer">Powered by Tirupati POS</div>
        </div>
      </body>
    </html>
  `;
} 
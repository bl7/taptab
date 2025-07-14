import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { PrismaClient } from '@/generated/prisma';
import puppeteer from "puppeteer";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await (getServerSession as unknown as (options: typeof authOptions) => Promise<{ user?: { id: string; email: string; restaurantId?: string | null } } | null>)(authOptions);
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orderId } = await params;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: true,
        restaurant: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate receipt HTML
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 20px;
              background: white;
              color: black;
              width: 264px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
            }
            .restaurant-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .table-info {
              margin-bottom: 15px;
            }
            .items {
              margin-bottom: 15px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .total {
              border-top: 1px solid #000;
              padding-top: 10px;
              font-weight: bold;
              text-align: right;
            }
            .note {
              margin-top: 10px;
              font-style: italic;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 10px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">${order.restaurant.name}</div>
            <div>Receipt</div>
          </div>
          
          <div class="table-info">
            <div>Table: ${order.table?.name || 'N/A'}</div>
            <div>Time: ${new Date(order.createdAt).toLocaleString()}</div>
            <div>Order #: ${order.id.slice(-8)}</div>
          </div>
          
          <div class="items">
            ${order.items.map(item => `
              <div class="item">
                <span>${item.quantity} × ${item.name}</span>
                <span>$${item.price.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="total">
            Total: $${order.total.toFixed(2)}
          </div>
          
          ${order.note ? `<div class="note">Note: ${order.note}</div>` : ''}
          
          <div class="footer">
            Thank you for your order!
          </div>
        </body>
      </html>
    `;

    // Generate PNG using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(receiptHtml);
    // 56mm = ~264px at 120 DPI
    await page.setViewport({ width: 264, height: 800 });
    const pngBuffer = await page.screenshot({
      type: 'png',
    });
    await browser.close();

    // Send to print bridge
    try {
      const printResponse = await fetch('http://localhost:8080/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
        },
        body: pngBuffer,
      });

      if (!printResponse.ok) {
        console.warn(`Print bridge returned ${printResponse.status} - print bridge may not be running`);
        return NextResponse.json({ 
          success: true, 
          warning: "Receipt generated but print bridge is not available" 
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.warn('Print bridge connection failed:', error);
      return NextResponse.json({ 
        success: true, 
        warning: "Receipt generated but print bridge is not available" 
      });
    }
  } catch (error) {
    console.error('Print error:', error);
    return NextResponse.json(
      { error: "Failed to print receipt" },
      { status: 500 }
    );
  }
} 
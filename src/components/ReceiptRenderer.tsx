import React from "react";

interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string | null;
}

interface Order {
  id: string;
  restaurant?: { name?: string | null; logoUrl?: string | null; currency?: string | null };
  table?: { name?: string | null };
  createdAt: string | Date;
  items: OrderItem[];
  total: number;
  note?: string | null;
}

const getCurrencySymbol = (currency?: string) => {
  switch (currency) {
    case 'NPR':
      return '₨';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    default:
      return '$';
  }
};

const ReceiptRenderer: React.FC<{ order: Order }> = ({ order }) => {
  const currencySymbol = getCurrencySymbol(order.restaurant?.currency ?? undefined);
  return (
    <div
      style={{
        width: 320,
        background: "#fff",
        color: "#000",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 13,
        padding: 24,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        margin: "0 auto",
        border: "1px solid #eee",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 12, borderBottom: "1px solid #000", paddingBottom: 8 }}>
        <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 2 }}>
          {order.restaurant?.name || "Restaurant"}
        </div>
        <div style={{ fontSize: 13, marginBottom: 2 }}>Receipt</div>
      </div>
      {/* Table & Time */}
      <div style={{ marginBottom: 10 }}>
        <div>Table: <b>{order.table?.name || "-"}</b></div>
        <div>Time: {new Date(order.createdAt).toLocaleString()}</div>
        <div>Order #: {order.id.slice(-8)}</div>
      </div>
      {/* Items */}
      <div style={{ marginBottom: 10 }}>
        {order.items.map((item) => (
          <div key={item.itemId} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span>
              {item.quantity} × {item.name}
              {item.note ? (
                <span style={{ color: "#1976d2", fontSize: 11, marginLeft: 4 }}>
                  (Note: {item.note})
                </span>
              ) : null}
            </span>
            <span>{currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      {/* Total */}
      <div style={{ borderTop: "1px solid #000", paddingTop: 8, fontWeight: "bold", textAlign: "right", fontSize: 15 }}>
        Total: {currencySymbol}{order.total.toFixed(2)}
      </div>
      {/* Order Note */}
      {order.note && (
        <div style={{ marginTop: 8, fontStyle: "italic", fontSize: 12 }}>
          Note: {order.note}
        </div>
      )}
      {/* Footer */}
      <div style={{ marginTop: 18, textAlign: "center", fontSize: 11, color: "#888", borderTop: "1px solid #000", paddingTop: 8 }}>
        Thank you for your order!
      </div>
    </div>
  );
};

export default ReceiptRenderer; 
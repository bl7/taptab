import React from "react";
import Image from "next/image";

// Types for menu/category/item
interface MenuItem {
  itemId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  badge?: string;
}
interface MenuCategory {
  categoryId: string;
  categoryName: string;
  items: MenuItem[];
}
interface MenuPublicViewProps {
  menu: MenuCategory[];
  onItemClick?: (item: MenuItem) => void;
  cart?: { itemId: string; quantity: number; note?: string }[];
  onAddToCart?: (item: MenuItem) => void;
  onRemoveFromCart?: (itemId: string) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onUpdateNote?: (itemId: string, note: string) => void;
  getBadges?: (item: MenuItem) => { type: string; value: string }[];
}

const BADGE_LABELS: Record<string, string> = {
  nuts: "Nuts",
  dairy: "Dairy",
  gluten: "Gluten",
  soy: "Soy",
  egg: "Egg",
  shellfish: "Shellfish",
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  "gluten-free": "Gluten-Free",
  halal: "Halal",
  kosher: "Kosher",
};

const MenuPublicView: React.FC<MenuPublicViewProps> = ({
  menu,
  onItemClick,
  cart = [],
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onUpdateNote,
  getBadges,
}) => {
  function getCartItem(itemId: string) {
    return cart.find((i) => i.itemId === itemId);
  }
  return (
    <main className="flex-1 w-full max-w-lg mx-auto px-2 pb-32 pt-2">
      {menu.length === 0 && (
        <div className="text-center text-gray-400 py-12">No items found.</div>
      )}
      {menu.map((cat) => (
        <div key={cat.categoryId} className="mb-6">
          <h2 className="text-lg font-bold text-black mb-2 px-1">{cat.categoryName}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cat.items.map((item) => {
              const cartItem = getCartItem(item.itemId);
              const badges = getBadges ? getBadges(item) : [];
              return (
                <div
                  key={item.itemId}
                  className="bg-white rounded-2xl shadow border border-gray-100 flex flex-col items-center p-4"
                >
                  <div
                    className={
                      "w-20 h-20 rounded-full bg-gray-100 mb-2 flex items-center justify-center overflow-hidden" +
                      (onItemClick ? " cursor-pointer" : "")
                    }
                    onClick={onItemClick ? () => onItemClick(item) : undefined}
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-gray-400">🍽️</span>
                    )}
                  </div>
                  <div className="w-full text-center">
                    <div
                      className={
                        "font-semibold text-black text-base mb-1 truncate" +
                        (onItemClick ? " cursor-pointer" : "")
                      }
                      onClick={onItemClick ? () => onItemClick(item) : undefined}
                    >
                      {item.name}
                    </div>
                    {badges.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1 mb-1">
                        {badges.map((b, i) => (
                          <span key={i} className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${b.type === "allergen" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            {BADGE_LABELS[b.value] || b.value}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.description && (
                      <div
                        className={
                          "text-xs text-gray-700 mb-1 line-clamp-2" +
                          (onItemClick ? " cursor-pointer" : "")
                        }
                        onClick={onItemClick ? () => onItemClick(item) : undefined}
                      >
                        {item.description}
                      </div>
                    )}
                    <div className="text-blue-600 font-bold text-lg mb-2">₹ {item.price?.toFixed(2) ?? "--"}</div>
                    {onAddToCart && onRemoveFromCart && onUpdateQuantity ? (
                      !cartItem ? (
                        <button
                          className="w-full bg-blue-600 text-white rounded-full py-2 font-semibold text-sm shadow hover:bg-blue-700 transition"
                          onClick={() => onAddToCart(item)}
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <button
                            className="w-8 h-8 rounded-full bg-gray-200 text-lg font-bold text-black hover:bg-gray-300"
                            onClick={() =>
                              cartItem.quantity === 1
                                ? onRemoveFromCart(item.itemId)
                                : onUpdateQuantity(item.itemId, cartItem.quantity - 1)
                            }
                          >
                            -
                          </button>
                          <span className="font-semibold text-base w-6 text-center text-black">{cartItem.quantity}</span>
                          <button
                            className="w-8 h-8 rounded-full bg-blue-600 text-white text-lg font-bold hover:bg-blue-700"
                            onClick={() => onUpdateQuantity(item.itemId, cartItem.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      )
                    ) : null}
                    {/* Note UI for cart items */}
                    {cartItem && onUpdateNote && (
                      <div className="mt-2 flex flex-col items-center">
                        <button
                          className="text-xs text-blue-600 underline hover:text-blue-800"
                          onClick={() => {
                            const note = prompt("Add a note for this item:", cartItem.note || "");
                            if (note !== null) onUpdateNote(item.itemId, note);
                          }}
                        >
                          {cartItem.note ? `Note: ${cartItem.note}` : "Add note"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </main>
  );
};

export default MenuPublicView; 
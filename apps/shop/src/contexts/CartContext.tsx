import React, { createContext, useContext, useReducer } from "react";
import type { Product, CartItem, CartItemOption } from "@kash/types";

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; item: CartItem }
  | { type: "UPDATE"; id: string; quantity: number }
  | { type: "REMOVE"; id: string }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find(
        (i) =>
          i.product.id === action.item.product.id &&
          i.selected_options.length === 0 &&
          action.item.selected_options.length === 0
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === existing.id
              ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
              : i
          ),
        };
      }
      return { items: [...state.items, action.item] };
    }
    case "UPDATE":
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.id !== action.id) };
      }
      return {
        items: state.items.map((i) =>
          i.id === action.id
            ? { ...i, quantity: action.quantity, total_price: action.quantity * i.unit_price }
            : i
        ),
      };
    case "REMOVE":
      return { items: state.items.filter((i) => i.id !== action.id) };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  total: number;
  count: number;
  addItem: (product: Product, options?: CartItemOption[]) => void;
  updateItem: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue>({} as CartContextValue);

let _idCounter = 0;
function nextId() {
  return `cart-${Date.now()}-${++_idCounter}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const total = state.items.reduce((s, i) => s + i.total_price, 0);
  const count = state.items.reduce((s, i) => s + i.quantity, 0);

  function addItem(product: Product, options: CartItemOption[] = []) {
    const optionsTotal = options.reduce((s, o) => s + o.price_adjustment, 0);
    const unitPrice = product.price + optionsTotal;
    dispatch({
      type: "ADD",
      item: {
        id: nextId(),
        product,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice,
        selected_options: options,
        notes: null,
        order_type_code: null,
      },
    });
  }

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        total,
        count,
        addItem,
        updateItem: (id, qty) => dispatch({ type: "UPDATE", id, quantity: qty }),
        removeItem: (id) => dispatch({ type: "REMOVE", id }),
        clear: () => dispatch({ type: "CLEAR" }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

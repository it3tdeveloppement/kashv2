import type { KioskState, KioskAction } from "../types/kiosk";
import { safeUUID } from "@kash/ui";

export const initialKioskState: KioskState = {
  step: "accueil",
  selectedOrderType: null,
  cart: [],
  pendingProduct: null,
  identifiedCustomer: null,
  loyaltyAccount: null,
  orderNumber: null,
  orderToken: null,
  inactivityTimer: 0,
};

export function kioskReducer(state: KioskState, action: KioskAction): KioskState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };

    case "SELECT_ORDER_TYPE":
      return { ...state, selectedOrderType: action.orderType, step: "menu" };

    case "ADD_TO_CART": {
      const existing = state.cart.find(
        (i) =>
          i.product.id === action.item.product.id &&
          i.selected_options.length === 0 &&
          action.item.selected_options.length === 0
      );
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((i) =>
            i.id === existing.id
              ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
              : i
          ),
        };
      }
      return { ...state, cart: [...state.cart, { ...action.item, id: safeUUID() }] };
    }

    case "UPDATE_CART_ITEM":
      if (action.quantity <= 0) {
        return { ...state, cart: state.cart.filter((i) => i.id !== action.id) };
      }
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.id === action.id
            ? { ...i, quantity: action.quantity, total_price: action.quantity * i.unit_price }
            : i
        ),
      };

    case "REMOVE_FROM_CART":
      return { ...state, cart: state.cart.filter((i) => i.id !== action.id) };

    case "SET_PENDING_PRODUCT":
      return {
        ...state,
        pendingProduct: action.product,
        step: action.product ? "customization" : state.step,
      };

    case "IDENTIFY_CUSTOMER":
      return {
        ...state,
        identifiedCustomer: action.customer,
        loyaltyAccount: action.account,
        step: "payment",
      };

    case "CLEAR_CUSTOMER":
      return { ...state, identifiedCustomer: null, loyaltyAccount: null };

    case "SET_ORDER_RESULT":
      return {
        ...state,
        orderNumber: action.orderNumber,
        orderToken: action.orderToken,
        step: "confirmation",
      };

    case "RESET":
      return { ...initialKioskState };

    default:
      return state;
  }
}

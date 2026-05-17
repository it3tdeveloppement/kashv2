import type { Dispatch } from "react";
import type {
  Product, Category, CustomizationPhase, CustomizationOption, ProductCustomizationPhase,
  PaymentMethod, OrderType, TenantSettings, CartItem, Customer, LoyaltyAccount,
} from "@kash/types";

export type KioskStep =
  | "accueil"
  | "order_type"
  | "menu"
  | "customization"
  | "cart"
  | "loyalty"
  | "payment"
  | "confirmation";

export interface KioskSettings {
  tenantId: string;
  establishmentId: string | null;
  tenantName: string;
  settings: TenantSettings;
  parentSettings: TenantSettings | null;
  products: Product[];
  categories: Category[];
  customizationPhases: CustomizationPhase[];
  customizationOptions: CustomizationOption[];
  productCustomizationPhases: ProductCustomizationPhase[];
  paymentMethods: PaymentMethod[];
  orderTypes: OrderType[];
}

export interface ResolvedKioskSettings {
  tenantId: string;
  tenantName: string;
  welcomeImageUrl: string | null;
  welcomeVideoUrl: string | null;
  primaryColor: string;
  backgroundColor: string;
  logoUrl: string | null;
  defaultCurrency: string;
  offertEnabled: boolean;
  loyaltyEnabled: boolean;
  onlinePaymentEnabled: boolean;
}

export interface KioskState {
  step: KioskStep;
  selectedOrderType: OrderType | null;
  cart: CartItem[];
  pendingProduct: Product | null;
  identifiedCustomer: Customer | null;
  loyaltyAccount: LoyaltyAccount | null;
  orderNumber: string | null;
  orderToken: string | null;
  inactivityTimer: number;
}

export type KioskAction =
  | { type: "SET_STEP"; step: KioskStep }
  | { type: "SELECT_ORDER_TYPE"; orderType: OrderType }
  | { type: "ADD_TO_CART"; item: CartItem }
  | { type: "UPDATE_CART_ITEM"; id: string; quantity: number }
  | { type: "REMOVE_FROM_CART"; id: string }
  | { type: "SET_PENDING_PRODUCT"; product: Product | null }
  | { type: "IDENTIFY_CUSTOMER"; customer: Customer; account: LoyaltyAccount | null }
  | { type: "CLEAR_CUSTOMER" }
  | { type: "SET_ORDER_RESULT"; orderNumber: string; orderToken: string }
  | { type: "RESET" };

export interface StepProps {
  state: KioskState;
  dispatch: Dispatch<KioskAction>;
  settings: KioskSettings;
  resolved: ResolvedKioskSettings;
  cartTotal: number;
  cartCount: number;
}

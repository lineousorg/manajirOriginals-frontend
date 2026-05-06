// lib/gtm.ts

declare global {
  interface Window {
    dataLayer: any[];
  }
}

// ✅ Generic push (safe for SSR)
export const pushToDataLayer = (data: Record<string, any>) => {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
};


// =============================
// 🔥 PAGE VIEW
// =============================
export const trackPageView = (url: string) => {
  pushToDataLayer({
    event: "page_view",
    page_path: url,
  });
};


// =============================
// 🔐 AUTH EVENTS
// =============================
export const trackLogin = (method: string = "email") => {
  pushToDataLayer({
    event: "login",
    method,
  });
};

export const trackSignup = (method: string = "email") => {
  pushToDataLayer({
    event: "sign_up",
    method,
  });
};


// =============================
// 🛒 E-COMMERCE EVENTS
// =============================

// Product type (optional but recommended)
export interface GTMItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_brand?: string;
  item_category?: string;
}


// 👉 View product
export const trackViewItem = (item: GTMItem) => {
  pushToDataLayer({
    event: "view_item",
    ecommerce: {
      items: [item],
    },
  });
};


// 👉 Add to cart
export const trackAddToCart = (item: GTMItem) => {
  pushToDataLayer({
    event: "add_to_cart",
    ecommerce: {
      items: [
        {
          ...item,
          quantity: item.quantity || 1,
        },
      ],
    },
  });
};


// 👉 Remove from cart
export const trackRemoveFromCart = (item: GTMItem) => {
  pushToDataLayer({
    event: "remove_from_cart",
    ecommerce: {
      items: [item],
    },
  });
};


// 👉 Begin checkout
export const trackBeginCheckout = (items: GTMItem[], value: number) => {
  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: {
      value,
      currency: "BDT",
      items,
    },
  });
};


// 👉 Purchase
export const trackPurchase = ({
  transaction_id,
  value,
  items,
}: {
  transaction_id: string;
  value: number;
  items: GTMItem[];
}) => {
  pushToDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id,
      value,
      currency: "BDT",
      items,
    },
  });
};
/**
 * Razorpay Checkout, loaded on demand.
 *
 * The script is only fetched when someone actually starts a top-up, so the rest of the app
 * carries no third-party JavaScript. The publishable key and the order id both come from
 * payment-service (`POST /v1/payments/create-order`) - nothing Razorpay-specific is configured
 * in the frontend, and no secret ever reaches the browser.
 *
 * Completion is NOT decided here: Razorpay's `handler` only tells us the customer finished the
 * Checkout dialog. The payment becomes COMPLETED when Razorpay calls the signed webhook
 * (`POST /api/v1/payments/webhook`), which payment-service verifies.
 */

export const RAZORPAY_CHECKOUT_SRC =
  "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
  };
}

export interface RazorpayCheckoutOptions {
  /** Publishable key id (rzp_test_... / rzp_live_...) from the create-order response. */
  key: string;
  /** Razorpay order id (order_...). With it, Razorpay takes the amount from the order itself. */
  order_id: string;
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  handler?: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (
    event: "payment.failed",
    handler: (response: RazorpayFailureResponse) => void,
  ) => void;
}

type RazorpayConstructor = new (
  options: RazorpayCheckoutOptions,
) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

/** One in-flight load shared by every caller; a second top-up reuses the loaded script. */
let loader: Promise<RazorpayConstructor> | null = null;

export function loadRazorpayCheckout(): Promise<RazorpayConstructor> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Razorpay Checkout can only be loaded in the browser"),
    );
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loader) return loader;

  loader = new Promise<RazorpayConstructor>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_CHECKOUT_SRC}"]`,
    );
    const script = existing ?? document.createElement("script");

    const onLoad = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error("Razorpay Checkout loaded but is unavailable"));
    };
    const onError = () => {
      // Let a later attempt try again (the customer may just have been offline).
      loader = null;
      script.remove();
      reject(new Error("Could not load Razorpay Checkout"));
    };

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    if (!existing) {
      script.src = RAZORPAY_CHECKOUT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return loader;
}

/** Only used by tests, so one test's stub cannot leak into the next. */
export function resetRazorpayLoaderForTests(): void {
  loader = null;
}

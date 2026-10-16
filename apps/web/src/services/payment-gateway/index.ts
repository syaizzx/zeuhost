import { ManualPaymentDriver } from "./manual.driver";
import { TripayPaymentDriver } from "./tripay.driver";
import { MidtransPaymentDriver } from "./midtrans.driver";
import { PaymentGatewayDriver, PaymentProvider } from "./types";

export * from "./types";
export * from "./manual.driver";
export * from "./tripay.driver";
export * from "./midtrans.driver";

export function getActivePaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER || "MANUAL").toUpperCase();
  if (provider === "TRIPAY") return "TRIPAY";
  if (provider === "MIDTRANS") return "MIDTRANS";
  return "MANUAL";
}

export function getPaymentDriver(): PaymentGatewayDriver {
  const provider = getActivePaymentProvider();
  switch (provider) {
    case "TRIPAY":
      return new TripayPaymentDriver();
    case "MIDTRANS":
      return new MidtransPaymentDriver();
    case "MANUAL":
    default:
      return new ManualPaymentDriver();
  }
}

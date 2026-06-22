import paytmGateway from "./gateways/paytm.gateway.js";

const gateways = {
  paytm: paytmGateway
};

export const getPaymentGateway = (gatewayName) => {
  const gateway = gateways[gatewayName];

  if (!gateway) {
    throw new Error("Unsupported payment gateway");
  }

  return gateway;
};
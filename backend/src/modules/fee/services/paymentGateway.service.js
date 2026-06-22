import paytmGateway from "./gateways/paytm.gateway.js";
import phonepeGateway from "./gateways/phonepe.gateway.js";

const gateways = {
  paytm: paytmGateway,
  phonepe: phonepeGateway
};

export const getPaymentGateway = (gatewayName) => {
  const gateway = gateways[gatewayName];

  if (!gateway) {
    throw new Error("Unsupported payment gateway");
  }

  return gateway;
};
import https from "https";
import PaytmChecksum from "paytmchecksum";

const getPaytmHost = () => {
  return process.env.PAYTM_ENV === "production"
    ? "securegw.paytm.in"
    : "securegw-stage.paytm.in";
};

const callPaytmApi = (path, requestBody) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestBody);

    const options = {
      hostname: getPaytmHost(),
      port: 443,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (err) {
          reject(new Error("Invalid JSON response from Paytm"));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
};

const normalizePaytmPaymentMode = (mode) => {
  if (!mode) return "Unknown";

  const normalized = String(mode).toUpperCase();

  if (normalized === "UPI") return "UPI";

  if (
    normalized === "CC" ||
    normalized === "DC" ||
    normalized === "CARD" ||
    normalized === "CREDIT_CARD" ||
    normalized === "DEBIT_CARD"
  ) {
    return "Card";
  }

  if (
    normalized === "NB" ||
    normalized === "NET_BANKING" ||
    normalized === "NETBANKING"
  ) {
    return "Net Banking";
  }

  if (
    normalized === "PPI" ||
    normalized === "WALLET"
  ) {
    return "Wallet";
  }

  return "Unknown";
};

const paytmGateway = {
  createOrder: async (order) => {
    const body = {
      requestType: "Payment",

      mid: process.env.PAYTM_MID,
      websiteName: process.env.PAYTM_WEBSITE,
      industryTypeId: process.env.PAYTM_INDUSTRY_TYPE,
      channelId: process.env.PAYTM_CHANNEL_ID,

      orderId: order.orderId,
      callbackUrl: process.env.PAYTM_CALLBACK_URL,

      txnAmount: {
        value: String(order.amount),
        currency: order.currency || "INR"
      },

      userInfo: {
        custId: String(order.user)
      }
    };

    const signature = await PaytmChecksum.generateSignature(
      JSON.stringify(body),
      process.env.PAYTM_MERCHANT_KEY
    );

    const requestBody = {
      body,
      head: {
        signature
      }
    };

    const response = await callPaytmApi(
      `/theia/api/v1/initiateTransaction?mid=${process.env.PAYTM_MID}&orderId=${order.orderId}`,
      requestBody
    );

    if (response.body?.resultInfo?.resultStatus !== "S") {
      throw new Error(
        response.body?.resultInfo?.resultMsg ||
          "Paytm initiate transaction failed"
      );
    }

    return {
      gateway: "paytm",

      orderId: order.orderId,
      gatewayOrderId: order.orderId,

      amount: order.amount,
      currency: order.currency || "INR",

      checkoutData: {
        mid: process.env.PAYTM_MID,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency || "INR",
        txnToken: response.body.txnToken
      },

      rawResponse: response
    };
  },

  verifyPayment: async ({ order, gatewayPayload }) => {
    const body = {
      mid: process.env.PAYTM_MID,
      orderId: order.orderId
    };

    const signature = await PaytmChecksum.generateSignature(
      JSON.stringify(body),
      process.env.PAYTM_MERCHANT_KEY
    );

    const requestBody = {
      body,
      head: {
        signature
      }
    };

    const response = await callPaytmApi(
      "/v3/order/status",
      requestBody
    );

    const resultStatus = response.body?.resultInfo?.resultStatus;

    if (resultStatus !== "TXN_SUCCESS") {
      return {
        success: false,

        orderId: order.orderId,
        amount: order.amount,

        gatewayPaymentId: response.body?.txnId,
        paymentMode: normalizePaytmPaymentMode(response.body?.paymentMode),

        rawResponse: {
          frontendPayload: gatewayPayload,
          statusResponse: response
        }
      };
    }

    return {
      success: true,

      orderId: response.body.orderId,
      amount: Number(response.body.txnAmount),

      gatewayPaymentId: response.body.txnId,
      paymentMode: normalizePaytmPaymentMode(response.body.paymentMode),

      rawResponse: {
        frontendPayload: gatewayPayload,
        statusResponse: response
      }
    };
  }
};

export default paytmGateway;
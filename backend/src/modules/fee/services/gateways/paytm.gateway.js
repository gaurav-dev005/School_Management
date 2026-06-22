import https from "https";
import PaytmChecksum from "paytmchecksum";

const getEnv = (key) => {
  return process.env[key]?.trim();
};

const getPaytmHost = () => {
  return getEnv("PAYTM_ENV") === "production"
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
          console.log("RAW PAYTM RESPONSE:", responseData);
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

const validatePaytmEnv = () => {
 const requiredKeys = [
  "PAYTM_ENV",
  "PAYTM_MID",
  "PAYTM_MERCHANT_KEY",
  "PAYTM_WEBSITE",
  "PAYTM_CALLBACK_BASE_URL"
];

  for (const key of requiredKeys) {
    if (!getEnv(key)) {
      throw new Error(`${key} is missing in .env`);
    }
  }
};

const paytmGateway = {
  createOrder: async (order) => {
    validatePaytmEnv();

    const mid = getEnv("PAYTM_MID");
    const merchantKey = getEnv("PAYTM_MERCHANT_KEY");
    const websiteName = getEnv("PAYTM_WEBSITE");
    const callbackUrl = `${getEnv("PAYTM_CALLBACK_BASE_URL")}${order.orderId}`;

    const amount = Number(order.amount).toFixed(2);

    console.log("PAYTM CONFIG CHECK:", {
      env: getEnv("PAYTM_ENV"),
      midExists: !!mid,
      keyExists: !!merchantKey,
      websiteName,
      callbackUrl,
      amount
    });

    const body = {
      requestType: "Payment",

      mid,
      websiteName,

      orderId: order.orderId,
      callbackUrl,

      txnAmount: {
        value: amount,
        currency: order.currency || "INR"
      },

      userInfo: {
        custId: String(order.user)
      }
    };

    const signature = await PaytmChecksum.generateSignature(
      JSON.stringify(body),
      merchantKey
    );

    const requestBody = {
      body,
      head: {
        signature
      }
    };

    const response = await callPaytmApi(
      `/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${order.orderId}`,
      requestBody
    );

    if (response.body?.resultInfo?.resultStatus !== "S") {
      console.log("PAYTM INIT FULL RESPONSE:");
      console.log(JSON.stringify(response, null, 2));

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
        mid,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency || "INR",
        txnToken: response.body.txnToken
      },

      rawResponse: response
    };
  },

  verifyPayment: async ({ order, gatewayPayload }) => {
    validatePaytmEnv();

    const mid = getEnv("PAYTM_MID");
    const merchantKey = getEnv("PAYTM_MERCHANT_KEY");

    const body = {
      mid,
      orderId: order.orderId
    };

    const signature = await PaytmChecksum.generateSignature(
      JSON.stringify(body),
      merchantKey
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
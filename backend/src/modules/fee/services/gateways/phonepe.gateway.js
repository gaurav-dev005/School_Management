import https from "https";
import querystring from "querystring";

const getEnv = (key) => {
  return process.env[key]?.trim();
};

const PHONEPE_HOST = "api-preprod.phonepe.com";

const callPhonePeApi = ({ path, method, headers, body }) => {
  return new Promise((resolve, reject) => {
    const postData = body || "";

    const options = {
      hostname: PHONEPE_HOST,
      port: 443,
      path,
      method,
      headers: {
        ...headers,
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (err) {
          console.log("RAW PHONEPE RESPONSE:", data);
          reject(new Error("Invalid JSON response from PhonePe"));
        }
      });
    });

    req.on("error", reject);

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
};

const validatePhonePeEnv = () => {
  const requiredKeys = [
    "PHONEPE_CLIENT_ID",
    "PHONEPE_CLIENT_VERSION",
    "PHONEPE_CLIENT_SECRET",
    "PHONEPE_REDIRECT_URL"
  ];

  for (const key of requiredKeys) {
    if (!getEnv(key)) {
      throw new Error(`${key} is missing in .env`);
    }
  }
};

const getPhonePeAuthToken = async () => {
  const postData = querystring.stringify({
    client_id: getEnv("PHONEPE_CLIENT_ID"),
    client_version: getEnv("PHONEPE_CLIENT_VERSION"),
    client_secret: getEnv("PHONEPE_CLIENT_SECRET"),
    grant_type: "client_credentials"
  });

  const response = await callPhonePeApi({
    path: "/apis/pg-sandbox/v1/oauth/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: postData
  });

  if (!response.data?.access_token) {
    console.log("PHONEPE AUTH FULL RESPONSE:");
    console.log(JSON.stringify(response.data, null, 2));
    throw new Error("PhonePe auth token not received");
  }

  return response.data.access_token;
};

const normalizePhonePePaymentMode = (paymentDetails = []) => {
  const firstPayment = paymentDetails[0];

  if (!firstPayment?.paymentMode) {
    return "Unknown";
  }

  const mode = String(firstPayment.paymentMode).toUpperCase();

  if (mode.includes("UPI")) return "UPI";
  if (mode.includes("CARD")) return "Card";
  if (mode.includes("NET_BANKING")) return "Net Banking";
  if (mode.includes("WALLET")) return "Wallet";

  return "Unknown";
};

const phonepeGateway = {
  createOrder: async (attempt) => {
    validatePhonePeEnv();

    const accessToken = await getPhonePeAuthToken();

    const merchantOrderId = attempt.orderId;
    const amountInPaise = Math.round(Number(attempt.amount) * 100);

    const body = {
      merchantOrderId,
      amount: amountInPaise,
      expireAfter: 1200,

      metaInfo: {
        udf1: "school_fee_payment",
        udf2: String(attempt.user),
        udf3: String(attempt.paymentOrder)
      },

      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "School fee payment",
        merchantUrls: {
          redirectUrl: getEnv("PHONEPE_REDIRECT_URL")
        }
      }
    };

    const response = await callPhonePeApi({
      path: "/apis/pg-sandbox/checkout/v2/pay",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${accessToken}`
      },
      body: JSON.stringify(body)
    });

    if (response.statusCode < 200 || response.statusCode >= 300) {
      console.log("PHONEPE ORDER FULL RESPONSE:");
      console.log(JSON.stringify(response.data, null, 2));
      throw new Error("PhonePe order creation failed");
    }

    return {
      gateway: "phonepe",

      orderId: attempt.orderId,
      gatewayOrderId: response.data.orderId,

      amount: attempt.amount,
      currency: attempt.currency || "INR",

      checkoutData: {
        merchantOrderId: attempt.orderId,
        phonepeOrderId: response.data.orderId,
        state: response.data.state,
        redirectUrl: response.data.redirectUrl,
        expireAt: response.data.expireAt
      },

      rawResponse: response.data
    };
  },

  verifyPayment: async ({ attempt, gatewayPayload }) => {
    validatePhonePeEnv();

    const accessToken = await getPhonePeAuthToken();

    const response = await callPhonePeApi({
      path: `/apis/pg-sandbox/checkout/v2/order/${attempt.orderId}/status`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${accessToken}`
      }
    });

    if (response.statusCode < 200 || response.statusCode >= 300) {
      console.log("PHONEPE STATUS FULL RESPONSE:");
      console.log(JSON.stringify(response.data, null, 2));

      return {
        success: false,
        orderId: attempt.orderId,
        amount: attempt.amount,
        gatewayPaymentId: null,
        paymentMode: "Unknown",
        rawResponse: {
          frontendPayload: gatewayPayload,
          statusResponse: response.data
        }
      };
    }

    const state = response.data?.state;

    if (state !== "COMPLETED") {
      return {
        success: false,
        orderId: attempt.orderId,
        amount: attempt.amount,
        gatewayPaymentId: response.data?.orderId,
        paymentMode: normalizePhonePePaymentMode(response.data?.paymentDetails),
        rawResponse: {
          frontendPayload: gatewayPayload,
          statusResponse: response.data
        }
      };
    }

    return {
      success: true,

      orderId: attempt.orderId,
      amount: Number(attempt.amount),

      gatewayPaymentId:
        response.data?.paymentDetails?.[0]?.transactionId ||
        response.data?.orderId,

      paymentMode: normalizePhonePePaymentMode(response.data?.paymentDetails),

      rawResponse: {
        frontendPayload: gatewayPayload,
        statusResponse: response.data
      }
    };
  }
};

export default phonepeGateway;
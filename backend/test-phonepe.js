import dotenv from "dotenv";
import https from "https";
import querystring from "querystring";

dotenv.config();

const clientId = process.env.PHONEPE_CLIENT_ID?.trim();
const clientVersion = process.env.PHONEPE_CLIENT_VERSION?.trim();
const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim();

const redirectUrl =
  process.env.PHONEPE_REDIRECT_URL?.trim() ||
  "http://localhost:5173/payment/success";

const merchantOrderId = `FEE${Date.now()}`;
const amount = 100; // PhonePe amount is in paise, so 100 = ₹1

const callApi = ({ hostname, path, method, headers, body }) => {
  return new Promise((resolve, reject) => {
    const postData = body || "";

    const options = {
      hostname,
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
        resolve({
          statusCode: res.statusCode,
          data
        });
      });
    });

    req.on("error", reject);

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
};

const getAuthToken = async () => {
  const postData = querystring.stringify({
    client_id: clientId,
    client_version: clientVersion,
    client_secret: clientSecret,
    grant_type: "client_credentials"
  });

  const response = await callApi({
    hostname: "api-preprod.phonepe.com",
    path: "/apis/pg-sandbox/v1/oauth/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: postData
  });

  console.log("AUTH STATUS:", response.statusCode);
  console.log("AUTH RESPONSE:", response.data);

  const parsed = JSON.parse(response.data);

  if (!parsed.access_token) {
    throw new Error("PhonePe auth token not received");
  }

  return parsed.access_token;
};

const createOrder = async (accessToken) => {
  const body = {
    merchantOrderId,
    amount,
    expireAfter: 1200,
    metaInfo: {
      udf1: "school_fee_payment"
    },
    paymentFlow: {
      type: "PG_CHECKOUT",
      message: "School fee payment",
      merchantUrls: {
        redirectUrl
      }
    }
  };

  const response = await callApi({
    hostname: "api-preprod.phonepe.com",
    path: "/apis/pg-sandbox/checkout/v2/pay",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `O-Bearer ${accessToken}`
    },
    body: JSON.stringify(body)
  });

  console.log("ORDER STATUS:", response.statusCode);
  console.log("ORDER REQUEST:");
  console.log(JSON.stringify(body, null, 2));
  console.log("ORDER RESPONSE:");
  console.log(response.data);
};

console.log("PHONEPE CREATE ORDER TEST");
console.log("CLIENT_ID exists:", !!clientId);
console.log("CLIENT_VERSION exists:", !!clientVersion);
console.log("CLIENT_SECRET exists:", !!clientSecret);
console.log("CLIENT_ID first 4:", clientId?.slice(0, 4));
console.log("CLIENT_ID last 4:", clientId?.slice(-4));

try {
  const accessToken = await getAuthToken();
  await createOrder(accessToken);
} catch (err) {
  console.error("TEST ERROR:", err.message);
}
import dotenv from "dotenv";
import https from "https";
import PaytmChecksum from "paytmchecksum";

dotenv.config();

const mid = process.env.PAYTM_MID?.trim();
const merchantKey = process.env.PAYTM_MERCHANT_KEY?.trim();

console.log("KEY being used:", JSON.stringify(merchantKey));

const orderId = `TEST${Date.now()}`;

const body = {
  requestType: "Payment",
  mid,
  websiteName: "WEBSTAGING",
  orderId,
  callbackUrl: `https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID=${orderId}`,
  txnAmount: { value: "1.00", currency: "INR" },
  userInfo: { custId: "CUST001" },
  industryTypeId: "Retail",   // add this
  channelId: "WEB"            // add this
};

const bodyString = JSON.stringify(body);
const signature = await PaytmChecksum.generateSignature(bodyString, merchantKey);

const requestBody = { body, head: { signature } };
const postData = JSON.stringify(requestBody);

// Log EXACTLY what is being sent
console.log("\nEXACT POST DATA BEING SENT:");
console.log(postData);

const options = {
  hostname: "securegw-stage.paytm.in",
  port: 443,
  path: `/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log("\nSTATUS CODE:", res.statusCode);
    console.log("PAYTM RESPONSE:", JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on("error", (err) => console.error("REQUEST ERROR:", err));
req.write(postData);
req.end();
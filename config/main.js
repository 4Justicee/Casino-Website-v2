const dotenv = require("dotenv");
const currencyRate = require("./currencyRate.json");
const currencySymbol = require("./currencySymbol.json");
dotenv.config();

module.exports = {
    port: process.env.PORT || 9999,

    database: {
        type: process.env.DB_TYPE,
        host: process.env.DB_HOST,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        port: parseInt(process.env.DB_PORT),
        pass: process.env.DB_PASS,
        logging: process.env.DB_LOGGING === "true",
    },

    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || 6379),
    },
    secretKey : '!@#TOPSECRET!@#',
    manage: { //                                          
        cryptKey: "flk393v903kljdf90309g132kl;1fKDKE)#3092",
    },
    showBilling: process.env.SHOW_BILLING === "true" || false,
    //                                    
    useSSLTLS: process.env.USE_SSL_TLS || "1",

    aasEndpoint: process.env.AAS_ENDPOINT,
    currencyRate,
    currencySymbol,

    nowKey: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
    nowInvoiceUrl: "https://api.nowpayments.io/v1/invoice",
    ipnCallbackUrl: "http://localhost:9998/thirdparty/nowpayment/callback",
    successUrl: "http://localhost:9998/app/payment_history",
    cancelUrl: "http://localhost:9998/app/payment_history",
    partiallyPaidUrl: "http://localhost:9998/app/payment_history",
};

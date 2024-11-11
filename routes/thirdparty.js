const express = require("express");
const router = express.Router();
const billingController = require("../controllers/api/billing");

router.post("/nowpayment/callback", billingController.updatePaymentHistory);
module.exports = router;


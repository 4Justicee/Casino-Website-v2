const express = require("express");

const config = require("../config/main");
const router = express.Router();

// routers
const apiRouter = require("./api");
const appRouter = require("./app");
const thirdpartyRouter = require("./thirdparty");
const setLocale = require("../middlewares/locale");
// middlewares
const { requireApiAuth, requireAppAuth, checkIp, updateCookie } = require("../middlewares/auth");

router.get("/", (req, res) => {  
  let redirectUrl = "/page/login";
  if (req.session.auth) {
    redirectUrl = "/page/dashboard";
  }
  return res.redirect(redirectUrl);
});

router.use("/api",checkIp, requireApiAuth, updateCookie, apiRouter);
router.use("/page",checkIp, [requireAppAuth, setLocale], updateCookie, appRouter);
router.use("/thirdparty", thirdpartyRouter);

module.exports = router;



const express = require("express");

const router = express.Router();
// controllers
const authController = require("../controllers/api/auth");
const homeController = require("../controllers/api/home");
const agentController = require("../controllers/api/agent");
const userController = require("../controllers/api/user");
const statisticsController = require("../controllers/api/statistics");
const providerController = require("../controllers/api/provider");
const billingController = require("../controllers/api/billing");
const authSchema = require("../validations/auth");
const validate = require("../middlewares/validate");
const { dec } = require("../middlewares/auth");
// alive routes
router.get("/alive", (req, res) => {
    let result = { status: 1 };
    result.ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    result.ip = result.ip.replace("::ffff:", "");

    if (req.session.auth) { result.session = req.session.auth; }

    return res.json(result);
});

// i18n
router.get("/i18n/:locale", (req, res) => {
    req.session.locale = req.params.locale;
    if (req.headers.referer) {
        res.redirect(req.headers.referer);
    } else {
        res.redirect("/");
    }
});

// auth routes
router.post("/auth/login", validate(authSchema.login), authController.login);
router.post("/auth/logout", authController.logout);
//
router.post("/dashboard_info",  homeController.getDashboardInfo);
router.post("/dashboard_provider_graph",  homeController.getProviderGraphInfo);
router.post("/dashboard_currency_graph",  homeController.getCurrencyGraphInfo);
router.post("/dashboard_day_graph",  homeController.getDayGraphInfo);

router.get("/agent_list",  agentController.getList);
router.post("/agent_create",  agentController.createAgent);
router.post("/agent_update",  agentController.updateAgent);
router.post("/agent_update_pwd",  agentController.updateAgentPWD);
router.post("/agent_remove",  agentController.removeAgent);
router.post("/agent_exchange", agentController.exchangeAgent);
router.post("/agent_update_provider", agentController.updateProviders);
router.post("/agent_update_rtp", agentController.updateAgentRtp);

router.post("/agent_transaction", agentController.transactionList);
router.post("/agent_balance", agentController.balanceList);

router.post("/user_list",  userController.getList);
router.post("/user_update_gamestop", userController.changeGameStop);
router.post("/user_update_rtp", userController.changeRtp);
router.post("/user_exchange", userController.exchangeUser);
router.post("/user_delete", userController.deleteUser);

router.post("/user_balance", userController.balanceList);
router.post("/user_transaction", userController.exchangeList);
router.post("/game_transaction", userController.transactionList);

router.post("/currency-stat", statisticsController.currencyStat);
router.post("/agent-stat", statisticsController.agentStat);
router.post("/user-stat", statisticsController.userStat);
router.post("/provider-stat", statisticsController.providerStat);
router.post("/game-stat", statisticsController.gameStat);

router.get("/provider_list", providerController.list);
router.post("/provider_check", providerController.check);
router.post("/provider_create", providerController.create);
router.post("/provider_update", providerController.update);
router.post("/provider_update_status", providerController.releaseProviderStatus);
router.post("/provider_delete", providerController.delete);

router.post("/game_list", providerController.readForDataTable);
router.post("/game_create", providerController.updateGameList);
router.post("/game_release", providerController.releaseGame);
router.post("/game_launch", providerController.getGameLaunchUrl);

router.post("/plan_list", billingController.planList);
router.post("/plan_create", billingController.create);
router.post("/plan_delete", billingController.delete);
router.post("/payment_history", billingController.readPaymentHistory);
router.post("/user_plan", billingController.readByUser);
router.post("/plan_pay", billingController.payWithNowPayments);

router.post("/game_status_update", providerController.gameStatusUpdate);
router.get("/agent/i18n/:locale", agentController.changeLanguage);

module.exports = router;

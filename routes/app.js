const express = require("express");

const router = express.Router();

// controllers
const homeController = require("../controllers/app/home");
const loginController = require("../controllers/app/auth");
const agentController = require("../controllers/app/agent");
const userController = require("../controllers/app/user");
const statisticsController = require("../controllers/app/statistics");
const providerController = require("../controllers/app/provider");
const paymentController = require("../controllers/app/payment");
// rest routes
router.get("/dashboard", homeController.dashboard);
router.get("/404", homeController.notFound);
router.get("/profile", homeController.profile);
router.get("/casino", homeController.casino);
router.get("/sports", homeController.sports);

router.get("/login", loginController.login);

router.get("/master_list", agentController.agents);
router.get("/agent_api_history_stat", agentController.agentApiHistoryStat);
router.get("/agent_api_history", agentController.agentApiHistory);
router.get("/master_transaction", agentController.agentExchangeHistory);
router.get("/master_balance", agentController.agentBalanceProgress);

router.get("/player_list", userController.users);
router.get("/player_exchange", userController.userExchangeHistory);
router.get("/player_balance", userController.userBalanceHistory);
router.get("/player_transaction", userController.userGameTransaction);

router.get("/currency-stat", statisticsController.currencyBettingStatistics);
router.get("/agent-stat", statisticsController.agentBettingStatistics);
router.get("/user-stat", statisticsController.userBettingStatistics);
router.get("/provider-stat", statisticsController.providerBettingStatistics);
router.get("/game-stat", statisticsController.gameBettingStatistics);

router.get("/provider", providerController.provider);
router.get("/game", providerController.game);
router.get("/game_launch", providerController.gameLaunch);


router.get("/plan", paymentController.plan);
router.get("/payment", paymentController.paymentHistory);

router.get("/documentation", providerController.documentation);
// 404
router.get("/*", homeController.notFound);

module.exports = router;

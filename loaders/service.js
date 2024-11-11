const redisService = require("../services/redis");
const redisUtil = require("../utils/redis");

module.exports = async () => {
    await redisService.connectRedis();
    await redisUtil.setAgentRedis();
};

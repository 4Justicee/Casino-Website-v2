const redis = require("redis");
const config = require("../config/main");
const logger = require("../utils/logger");

let redisClient = {};

exports.connectRedis = async () => {
  
    redisClient = redis.createClient(config.redis.port, config.redis.host);

    redisClient.on("connect", () => {
        logger("info", "Redis", "Redis connected.");

        redisClient.keys("*FORTUNE_MANAGER_SITE_*", function (err, keys) {
            if (err) {
                console.error(err);
                return;
            }

            //                  
            keys.forEach(function(key) {
                redisClient.del(key, function(err, reply) {
                    if (err) {
                        console.error("Error deleting key:", key);
                    } else {
                        console.log("Deleted key:", key);
                    }
                });
            });
        });
    });

    redisClient.on("error", (error) => {
        logger("error", "Redis", `Connection failed... ${error.message}`);
        process.exit(0);
    });
};

exports.getValue = (key) => {
    return new Promise((resolve) => {
        redisClient.get("FORTUNE_MANAGER_SITE_" + key, (err, data) => {
            if (err) {
                logger("error", "Redis", err.message);
                resolve(null);
            }

            if (data != null) {
                resolve(data);
            } else {
                resolve(null);
            }
        });
    });
};

exports.setValue = async (key, string) => {
    await redisClient.set("FORTUNE_MANAGER_SITE_" + key, string);
};

exports.flushDB = () => {
    redisClient.flushdb(function (error, result) {
        logger("info", "Redis", `Flush Result... ${JSON.stringify(result)}`);
    });
};





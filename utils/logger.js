const fs = require("fs");
const path = require("path");
const moment = require("moment");
const winston = require("winston");
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf } = format;
const  isEmpty  = require("./isEmpty");
require("winston-daily-rotate-file");

const baseLogger = createLogger({
    format: combine(
        winston.format.colorize(),
        winston.format.simple(),
        timestamp(),
        printf(({ level, message, timestamp }) => `${moment(timestamp).format("YYYY-MM-DD HH:mm:ss")} ${level}: ${message}`)
    ),
    transports: [
        new transports.Console({
            handleExceptions: true,
            level: "debug",
            json: true,
            prettyPrint: true,
        }),
        new transports.DailyRotateFile({
            filename: "logs/%DATE%.log",
            datePattern: "YYYY-MM-DD",
            json: true,
            maxFiles: "30d",
        }),
    ],
    exitOnError: false,
});

const logger = (level, comment, message, req = null) => {
    let logString = "";
    let logFlag = false;

    if (isEmpty(req)) {
        logString = `[${comment}]: ${message}`;
    } else {
        const execTime = Date.now() - req.startTime;
        const { agentCode, userCode } = req.body || {};

        if (!isEmpty(agentCode) || !isEmpty(userCode)) {
            logString = `[${comment}]: (${execTime}ms) (${agentCode}, ${userCode}) ${message}`;
        } else {
            logString = `[${comment}]: (${execTime}ms) ${message}`;
        }
    }

    const filterConfig = { "filter": false, "filterCode": "" };

    logFlag = !filterConfig.filter || (filterConfig.filterCode && logString.includes(filterConfig.filterCode));

    if (logFlag) {
        baseLogger[level](logString);
    }
};

module.exports = logger;

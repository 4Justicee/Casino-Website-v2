const { Op } = require("sequelize");
const moment = require("moment");
const { Agent, User, SlotGameStatistics, AgentBalanceStatistics, sequelize, SlotGameTransaction, Sequelize } = require("../../models");
const logger = require("../../utils/logger");
const { ERR_MSG } = require("../../utils/constants");
const db = require("../../models");
const isEmpty = require("../../utils/isEmpty");
const { getParentPathCode, setStatisticData, getStatisticData } = require("../../utils/redis");
const MD5 = require("md5.js");

exports.currencyStat = async (req, res) => {
    try {

        let { startDate, endDate, search, order="id", dir="ASC", start, length, useRedis } = req.body;   
        const redisKey = new MD5().update(startDate+"~"+endDate).digest("hex");
        const startTime = Date.parse(startDate);
        const endTime = Date.parse(endDate);

        if(order == "") order = "id";
        let middleTime = 0;
        if(startTime < endTime - 7 * 86400000) {            
            middleTime = endTime - 7 * 86400000;
        }
    
        let data = [];
        if(useRedis == 0 || (data = await getStatisticData(redisKey))==null || data.length==0) {             
            data = await SlotGameTransaction.findAll({
                attributes: [
                    [Sequelize.literal("COUNT(id)"), "playCount"],
                    "currency",
                    [Sequelize.fn('SUM', Sequelize.col('bet')), 'totalDebit'],
                    [Sequelize.fn('SUM', Sequelize.col('win')), 'totalCredit'],
                    [Sequelize.fn('SUM', Sequelize.literal('bet - win')), 'difference'],
                ],
                where: {
                    createdAt: { 
                        [Op.between]: [startDate, endDate],                         
                    },
                    isCall: 0,           
                },
                group: ["currency"],
                order:[[Sequelize.literal(order), dir]],
                raw: true,
            });
            setStatisticData(redisKey, JSON.stringify(data));                        
        }       
        
        return res.json({
            status: 1,
            data:data,
            count:data.length,
        });
        
    } catch (error) {
        logger("error", "API | Statistics | Getting Betting Currency Statistic", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.agentStat = async (req, res) => {
    try {
        let { startDate, endDate, search, order, dir, start, length, currency, useRedis} = req.body;        
        const myId = req.session.auth.id;
        if(order == "") order = "id";
        const redisKey = new MD5().update(`agent${myId}${startDate}${endDate}${currency}`).digest("hex");
        let searchObj =  {            
            createdAt: { [Op.between]: [startDate, endDate] },
            parentPath: { [Op.substring]:`.${myId}.`},
            isCall:0
        };

        if(!isEmpty(currency)) {
            searchObj.currency =  currency;
        }

        let data = [];
        if(useRedis == 0 || (data = await getStatisticData(redisKey))==null || data.length==0) {       
         
            data = await SlotGameTransaction.findAll({
                attributes: [
                    [Sequelize.literal("COUNT(id)"), "playCount"],
                    "currency",
                    "agentCode",
                    "parentPath",
                    [Sequelize.fn('SUM', Sequelize.col('bet')), 'totalDebit'],
                    [Sequelize.fn('SUM', Sequelize.col('win')), 'totalCredit'],
                    [Sequelize.fn('SUM', Sequelize.literal('bet - win')), 'difference'],
                ],
                where: searchObj,
                group: ["currency", "agentCode", "parentPath"],
                order:[[Sequelize.literal(order), dir]],
                raw: true,
            });
            setStatisticData(redisKey, JSON.stringify(data));
            
        }
  
        for (let item of data) {
            item.parentPathCode = await getParentPathCode(item.parentPath);

            if (req.session.auth.role != 1) {
                item.parentPathCode = " / " + req.session.auth.agentCode + item.parentPathCode.split(req.session.auth.agentCode)[1];
            }
        }

        return res.json({
            status: 1,
            data: data,
            count: data.length,
        });
    } catch (error) {
        logger("error", "API | Statistics | Getting Agent Betting Statistic", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.userStat = async (req, res) => {
    try {
        let { startDate, endDate, search, order, dir, start, length, currency, agent, useRedis} = req.body;
        const myId = req.session.auth.id;
        if(order == "") order = "id";
        const redisKey = new MD5().update(`user${myId}${startDate}${endDate}${agent}${currency}`).digest("hex");

        let searchObj =  {            
            createdAt: { [Op.between]: [startDate, endDate] },
            parentPath: { [Op.substring]:`.${myId}.`},
            isCall:0
        };

        if(!isEmpty(agent)) {
            searchObj.agentCode = agent;
        }

        if(!isEmpty(currency)) {
            searchObj.currency = currency;
        }

        let data = [];
        if(useRedis == 0 || (data = await getStatisticData(redisKey))==null|| data.length==0) { 
            data = await SlotGameTransaction.findAll({
                attributes: [
                    [Sequelize.literal("COUNT(id)"), "playCount"],
                    "currency",
                    "agentCode",
                    "userCode",
                    "parentPath",
                    [Sequelize.fn('SUM', Sequelize.col('bet')), 'totalDebit'],
                    [Sequelize.fn('SUM', Sequelize.col('win')), 'totalCredit'],
                    [Sequelize.fn('SUM', Sequelize.literal('bet - win')), 'difference'],
                ],
                where: searchObj,
                group: ["currency", "agentCode", "userCode", "parentPath"],
                order:[[Sequelize.literal(order), dir]],
                raw: true,
            });
            setStatisticData(redisKey, JSON.stringify(data));            
        }

        for (let item of data) {
            item.parentPathCode = await getParentPathCode(item.parentPath);

            if (req.session.auth.role != 1) {
                item.parentPathCode = " / " + req.session.auth.agentCode + item.parentPathCode.split(req.session.auth.agentCode)[1];
            }
        }
        
        return res.json({
            status: 1,
            data:data,
            count: data.length
        });
    } catch (error) {
        logger("error", "API | Statistics | Getting User Betting Statistic", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.providerStat = async (req, res) => {
    try {
        let { startDate, endDate, search, order, dir, start, length, currency, useRedis} = req.body;
        const myId = req.session.auth.id;
        if(order == "") order = "id";
        const redisKey = new MD5().update(`provider${myId}${startDate}${endDate}${currency}`).digest("hex");

        let searchObj =  {            
            createdAt: { [Op.between]: [startDate, endDate] },
            parentPath: { [Op.substring]:`.${myId}.`},
            isCall:0
        };

        if(!isEmpty(currency)) {
            searchObj.currency =  currency;
        }      

        let data = [];
        if(useRedis == 0 || (data = await getStatisticData(redisKey))==null|| data.length==0) {           
            data = await SlotGameTransaction.findAll({
                attributes: [
                    [Sequelize.literal("COUNT(id)"), "playCount"],
                    "currency",
                    "providerCode",
                    [Sequelize.fn('SUM', Sequelize.col('bet')), 'totalDebit'],
                    [Sequelize.fn('SUM', Sequelize.col('win')), 'totalCredit'],
                    [Sequelize.fn('SUM', Sequelize.literal('bet - win')), 'difference'],
                ],
                where: searchObj,
                group: ["currency", "providerCode"],
                order:[[Sequelize.literal(order), dir]],
                raw: true,
            });
            setStatisticData(redisKey, JSON.stringify(data));            
        }

        return res.json({
            status: 1,
            data:data,
            count: data.length
        });
    } catch (error) {
        logger("error", "API | Statistics | Getting Provider Betting Statistic", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.gameStat = async (req, res) => {
    try {
        let { startDate, endDate, search, order, dir, start, length, provider, currency, useRedis} = req.body;
        const myId = req.session.auth.id;
        if(order == "") order = "id";
        const redisKey = new MD5().update(`game${myId}${startDate}${endDate}${provider}${currency}`).digest("hex");
        
        let searchObj =  {            
            createdAt: { [Op.between]: [startDate, endDate] },
            parentPath: { [Op.substring]:`.${myId}.`},
            isCall:0
        };

        if(!isEmpty(provider)) {
            searchObj.providerCode = provider;
        }

        if(!isEmpty(currency)) {
            searchObj.currency = currency;
        }

        let data = [];
        if(useRedis == 0 || (data = await getStatisticData(redisKey))==null|| data.length==0) {  
            data = await SlotGameTransaction.findAll({
                attributes: [
                    [Sequelize.literal("COUNT(id)"), "playCount"],
                    "currency",
                    "providerCode",
                    "gameCode",
                    [Sequelize.fn('SUM', Sequelize.col('bet')), 'totalDebit'],
                    [Sequelize.fn('SUM', Sequelize.col('win')), 'totalCredit'],
                    [Sequelize.fn('SUM', Sequelize.literal('bet - win')), 'difference'],
                ],
                where: searchObj,
                group: ["currency", "providerCode", "gameCode"],
                order:[[Sequelize.literal(order), dir]],
                raw: true,
            });
            setStatisticData(redisKey, JSON.stringify(data));            
        }

        return res.json({
            status: 1,
            data:data,
            count: data.length
        });
    } catch (error) {
        logger("error", "API | Statistics | Getting Game Betting Statistic", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};


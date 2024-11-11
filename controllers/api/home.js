const MD5 = require("md5.js");
const { Op, Transaction } = require("sequelize");
const moment = require("moment");
const { Agent, Popup, User, Note, AgentBalanceStatistics, AgentTransaction, SlotGameTransaction, SlotGameStatistics, Player, Provider, sequelize, Sequelize } = require("../../models");
const config = require("../../config/main")
const bcrypt = require("bcrypt");
const { getIpAddress } = require("../../utils");
const logger = require("../../utils/logger")
const { ERR_MSG } = require("../../utils/constants");

const getDataByDay = async (startDate, endDate, agentId) => {    
    let searchObj =  {            
        createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] },
        parentPath: { [Op.substring]:`.${agentId}.`}
    };

    let data = await SlotGameTransaction.findAll({
        attributes: [                
            [Sequelize.fn('SUM', Sequelize.col('bet')), 'totalDebit'],
            [Sequelize.fn('SUM', Sequelize.col('win')), 'totalCredit'],
        ],
        where: searchObj,
        raw: true,
    });

    if(data[0].totalCredit == null && data[0].totalDebit == null) {
        data = await SlotGameStatistics.findAll({
            attributes: [                
                [Sequelize.fn('SUM', Sequelize.col('betAmount')), 'totalDebit'],
                [Sequelize.fn('SUM', Sequelize.col('winAmount')), 'totalCredit'],
            ],
            where: searchObj,
            raw: true,
        });
    }
    setStatisticData(redisKey, JSON.stringify(data));        

    return data;
}

exports.getCurrentAgentStatisticsByDate = async (req, res) => {
    try {
        const { month, agentCode, startDate, endDate } = req.query;

        //                 
        const agent = await Agent.findByPk(req.session.auth.id);

        let _agentCode = agent.agentCode;
        if (!isEmpty(agentCode)) {
            _agentCode = agentCode;
        }

        //                       
        // const startDateFormated = new Date(new Date((new Date()).getFullYear(), Number(month) - 1, 1).setHours(0, 0, 0));
        // const endDateFormated = new Date(new Date((new Date()).getFullYear(), Number(month), 0).setHours(23, 59, 59));
        const startDateFormated = new Date(startDate);
        const endDateFormated = new Date(endDate);

        const agentStatistics = await AgentBalanceStatistics.findAll({
            attributes: ["createdAt", [sequelize.fn("DATE", sequelize.col("createdAt")), "date"], "agentBalance", "directUserBalanceSum", "childAgentBalanceSum", "childUserBalanceSum", "directUserCount", "childAgentCount", "childUserCount"],
            where: {
                agentCode: _agentCode,
                createdAt: { [Op.between]: [startDateFormated, endDateFormated] },
            },
            raw: true,
        });

        const agentTotalStatistics = await AgentBalanceStatistics.findAll({
            attributes: ["createdAt", [sequelize.fn("DATE", sequelize.col("createdAt")), "date"], "agentBalance", "directUserBalanceSum", "childAgentBalanceSum", "childUserBalanceSum", "directUserCount", "childAgentCount", "childUserCount"],
            where: {
                agentCode: "###_total_###",
                createdAt: { [Op.between]: [startDateFormated, endDateFormated] },
            },
            raw: true,
        });

        const statisticsDate = await AgentBalanceStatistics.findAll({
            attributes: [
                [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
                [sequelize.fn("MAX", sequelize.col("createdAt")), "last_record_time"],
            ],
            where: {
                agentCode: _agentCode,
                createdAt: { [Op.between]: [startDateFormated, endDateFormated] },
            },
            group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
            raw: true,
        });

        let realDayStatistics = [];
        let realDayTotalStatistics = [];

        for (let i = 0; i < statisticsDate.length; i++) {
            for (let j = 0; j < agentStatistics.length; j++) {
                if (statisticsDate[i].date == agentStatistics[j].date) {
                    const a = moment(statisticsDate[i].last_record_time).format("YYYY-MM-DD HH:00:00");
                    const b = moment(agentStatistics[j].createdAt).format("YYYY-MM-DD HH:00:00");
                    if (a == b) {
                        realDayStatistics.push(agentStatistics[j]);
                        break;
                    }
                }
            }

            for (let j = 0; j < agentTotalStatistics.length; j++) {
                if (statisticsDate[i].date == agentTotalStatistics[j].date) {
                    const a = moment(statisticsDate[i].last_record_time).format("YYYY-MM-DD HH:00:00");
                    const b = moment(agentTotalStatistics[j].createdAt).format("YYYY-MM-DD HH:00:00");
                    if (a == b) {
                        realDayTotalStatistics.push(agentTotalStatistics[j]);
                        break;
                    }
                }
            }
        }

        return res.json({
            status: 1,
            realDayStatistics,
            realDayTotalStatistics,
        });
    } catch (error) {
        console.log(error.stack);
        logger("error", "API | REST | Get Current Agent Statistics By Date", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.getDayGraphInfo = async (req, res) => {
    try {
        const {startDate, endDate, useRedis} = req.body;
        const agentId = req.session.auth.id;
        const agentCode = req.session.auth.agentCode;
        let sd = Date.parse(startDate);
        let ed = Date.parse(endDate);

        const debits = [];
        const credits = [];
        const profits = [];
        const days = [];

        while(sd < ed) {
            let tmp = sd + 86400000; //one day.

            const data = await getDataByDay(sd, tmp, agentId);

            const day = new Date(sd).toISOString().substr(0, 10);
            const totalCredit = data[0].totalCredit;
            const totalDebit = data[0].totalDebit;

            days.push(day);
            credits.push(totalCredit == null ? 0 : totalCredit);
            debits.push(totalDebit == null ? 0 : totalDebit);
            profits.push(totalDebit - totalCredit);

            sd = tmp;
        }   

        const result = {days, debits, credits, profits};
        return res.json({
            status: 1,
            result: result
        });
    }
    catch(error) {
        logger("error", "API | REST | Get Day Graph Data", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
}

const getProviderData = async (startDate, endDate, myId, useRedis) => {
    const redisKey = new MD5().update(`providergraph${startDate}~${endDate}`).digest("hex");
    const startTime = Date.parse(startDate);
    const endTime = Date.parse(endDate);
    let data = [];
    let middleTime = 0;

    if(startTime < endTime - 7 * 86400000) {
        //                                slotGameStatistic                                .
        middleTime = endTime - 7 * 86400000;
    }

    if(useRedis == 0 || (data = await getStatisticData(redisKey))==null) {//                                   
        data = [];
        let data1 = [];
        let data2 = [];
        if(middleTime == 0) { //SlotGameTransaction                                   .
            let searchObj =  {            
                createdAt: { [Op.between]: [startDate, endDate] },
                parentPath: { [Op.substring]:`.${myId}.`}
            };
    
            data1 = await SlotGameTransaction.findAll({
                attributes: [                
                    "providerCode",
                    [Sequelize.fn('SUM', Sequelize.col('bet')), 'totalDebit'],
                    [Sequelize.fn('SUM', Sequelize.col('win')), 'totalCredit'],
                ],
                where: searchObj,
                group: ["providerCode"],
                raw: true,
            });
        }
        else {
            let searchObj1 =  {            
                createdAt: { [Op.between]: [new Date(middleTime), endDate] },
                parentPath: { [Op.substring]:`.${myId}.`}
            };
    
            data1 = await SlotGameTransaction.findAll({
                attributes: [                
                    "providerCode",
                    [Sequelize.fn('SUM', Sequelize.col('bet')), 'totalDebit'],
                    [Sequelize.fn('SUM', Sequelize.col('win')), 'totalCredit'],
                ],
                where: searchObj1,
                group: ["providerCode"],
                raw: true,
            });

            let searchObj2 =  {            
                createdAt: { [Op.between]: [startDate, new Date(middleTime)] },
                parentPath: { [Op.substring]:`.${myId}.`}
            };
    
            data2 = await SlotGameStatistics.findAll({
                attributes: [                
                    "providerCode",
                    [Sequelize.fn('SUM', Sequelize.col('betAmount')), 'totalDebit'],
                    [Sequelize.fn('SUM', Sequelize.col('winAmount')), 'totalCredit'],
                ],
                where: searchObj2,
                group: ["providerCode"],
                raw: true,
            });
        }
        data = data.concat(data1);
        for(let i = 0; i < data2.length; i++) {            
            let exist = 0;            
            for(let j = 0; j < data.length; j++) {
                if(data[j].providerCode == data2[i].providerCode) {
                    data[j].totalDebit += data2[i].totalDebit;
                    data[j].totalCredit += data2[i].totalCredit;
                    exist = 1;
                    break;
                }
            }

            if(exist == 0) {
                data.push(data2[i]);
            }
        }
        setStatisticData(redisKey, JSON.stringify(data));
    }

    return data;
}

exports.getProviderGraphInfo = async (req, res) => {
    try {
        const {startDate, endDate, useRedis} = req.body;
        const myId = req.session.auth.id;       

        const data = await getProviderData(startDate, endDate, myId, useRedis);
        const totalProviders = await Provider.findAll({where:{
            status:1
        }});

        const debits = [];
        const credits = [];
        const profits = [];
        const providers = [];
        for(let i = 0; i < totalProviders.length; i++) {
            let check = -1;
            for(let j = 0; j < data.length; j++) {
                if(totalProviders[i].code == data[j].providerCode) {
                    check = j;
                    break;
                }                
            }
            if(check == -1) {
                providers.push(totalProviders[i].code);
                debits.push(0);
                credits.push(0);
                profits.push(0);
            }
            else {
                providers.push(data[check].providerCode);
                debits.push(data[check].totalDebit);
                credits.push(data[check].totalCredit);
                profits.push(data[check].totalDebit - data[check].totalCredit);
            }
        }
        
        const result = {providers, debits, credits, profits};
        return res.json({
            status: 1,
            result: result
        });
    }
    catch(error) {
        logger("error", "API | REST | Get Provider Graph Data", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
}

const getCurrencyData = async (startDate, endDate, myId, useRedis) => {
    const redisKey = new MD5().update(`currencygraph${startDate}~${endDate}`).digest("hex");
    const startTime = Date.parse(startDate);
    const endTime = Date.parse(endDate);
    let data = [];
    let middleTime = 0;

    if(startTime < endTime - 7 * 86400000) {
        //                                slotGameStatistic                                .
        middleTime = endTime - 7 * 86400000;
    }

    if(useRedis == 0 || (data = await getStatisticData(redisKey))==null) {//                                   
        data = [];
        let data1 = [];
        let data2 = [];
        if(middleTime == 0) { //SlotGameTransaction                                   .
            let searchObj =  {            
                createdAt: { [Op.between]: [startDate, endDate] },
                parentPath: { [Op.substring]:`.${myId}.`}
            };
    
            data1 = await SlotGameTransaction.findAll({
                attributes: [                
                    "currency",
                    [Sequelize.fn('SUM', Sequelize.col('bet')), 'totalDebit'],
                    [Sequelize.fn('SUM', Sequelize.col('win')), 'totalCredit'],
                ],
                where: searchObj,
                group: ["currency"],
                raw: true,
            });
        }
        else {
            let searchObj1 =  {            
                createdAt: { [Op.between]: [new Date(middleTime), endDate] },
                parentPath: { [Op.substring]:`.${myId}.`}
            };
    
            data1 = await SlotGameTransaction.findAll({
                attributes: [                
                    "currency",
                    [Sequelize.fn('SUM', Sequelize.col('bet')), 'totalDebit'],
                    [Sequelize.fn('SUM', Sequelize.col('win')), 'totalCredit'],
                ],
                where: searchObj1,
                group: ["currency"],
                raw: true,
            });

            let searchObj2 =  {            
                createdAt: { [Op.between]: [startDate, new Date(middleTime)] },
                parentPath: { [Op.substring]:`.${myId}.`}
            };
    
            data2 = await SlotGameStatistics.findAll({
                attributes: [                
                    "currency",
                    [Sequelize.fn('SUM', Sequelize.col('betAmount')), 'totalDebit'],
                    [Sequelize.fn('SUM', Sequelize.col('winAmount')), 'totalCredit'],
                ],
                where: searchObj2,
                group: ["currency"],
                raw: true,
            });
        }
        data = data.concat(data1);
        for(let i = 0; i < data2.length; i++) {            
            let exist = 0;
            for(let j = 0; j < data.length; j++) {
                if(data[j].providerCode == data2[i].providerCode) {
                    data[j].totalDebit += data2[i].totalDebit;
                    data[j].totalCredit += data2[i].totalCredit;
                    exist = 1;
                    break;
                }
            }

            if(exist == 0) {
                data.push(data2[i]);
            }
        }
        setStatisticData(redisKey, JSON.stringify(data));
    }

    return data;
}

exports.getCurrencyGraphInfo = async (req, res) => {
    try {
        const {startDate, endDate, useRedis} = req.body;
        const myId = req.session.auth.id;

        const data = await getCurrencyData(startDate, endDate, myId, useRedis);
        
        const debits = [0,0,0,0,0,0,0,0];
        const credits = [0,0,0,0,0,0,0,0];
        const profits = [0,0,0,0,0,0,0,0];
        const currencies = ["KRW","USD","EUR","BRL","IDR","PHP","TRY","THB"];
        
        for(let j = 0; j < data.length; j++) {
            let idx = currencies.indexOf(data[j].currency);
            if(idx == -1) {
                idx = currencies.length;
                currencies.push(data[j].currency);
                debits.push(0);
                credits.push(0);
                profits.push(0);
            }

            debits[idx] += data[j].totalDebit;
            credits[idx] += data[j].totalCredit;
            profits[idx] += data[j].totalDebit - data[j].totalCredit;
        }

        const result = {currencies, debits, credits, profits};
        return res.json({
            status: 1,
            result: result
        });
    }
    catch(error) {
        logger("error", "API | REST | Get Currency Graph Data", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
}

exports.getDashboardInfo = async (req, res) => {
    const agent = await Agent.findByPk(req.session.auth.id);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startTime = new Date(today.setHours(0, 0, 0));
    const endTime = new Date(today.setHours(24, 0, 0));
    const yesterdayStartTime = new Date(yesterday.setHours(0, 0, 0));
    const yesterdayEndTime = new Date(yesterday.setHours(24, 0, 0));
    const monthAgo = new Date(moment(new Date()).subtract(1, "months").format("YYYY-MM-DD 00:00:00"));  
    
    const [
        inOutResult,
        childAgentBalances,
        childUserBalances,
        directUserBalances,
        playingCount,
        childAgentCount,
        childUserCount,
        directUserCount,
        yesterdayPlayInfo,
        todayPlayInfo,
        monthPlayInfo
    ] = await Promise.all([
        AgentTransaction.findOne({
            attributes: [
                [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.literal(`CASE WHEN parentCode = '${agent.agentCode}' AND chargeType = 1 THEN chargeAmount ELSE 0 END`)), 0), "todayTotalChildDepositIn"],
                [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.literal(`CASE WHEN agentCode = '${agent.agentCode}' AND chargeType = 1 THEN chargeAmount ELSE 0 END`)), 0), "todayTotalParentDepositIn"],
                [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.literal(`CASE WHEN parentCode = '${agent.agentCode}' AND chargeType = 0 THEN chargeAmount ELSE 0 END`)), 0), "todayTotalChildWithdrawOut"],
                [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.literal(`CASE WHEN agentCode = '${agent.agentCode}' AND chargeType = 0 THEN chargeAmount ELSE 0 END`)), 0), "todayTotalParentWithdrawOut"],
            ],
            where: {
                [Op.or]: [
                    { parentCode: agent.agentCode, chargeType: 1 },
                    { agentCode: agent.agentCode, chargeType: 1 },
                    { parentCode: agent.agentCode, chargeType: 0 },
                    { agentCode: agent.agentCode, chargeType: 0 },
                ],
                createdAt: { [Op.between]: [startTime, endTime] },
            },
            raw: true,
        }),
        Agent.sum("balance", { where: { parentPath: { [Op.substring]: `.${agent.id}.` }, status: 1 } }),
        User.sum("balance", { where: { parentPath: { [Op.substring]: `.${agent.id}.` }, apiType: 1, status: 1 } }),
        User.sum("balance", { where: { agentCode: agent.agentCode, apiType: 1, status: 1 } }),
        Player.count({ where: { parentPath: { [Op.substring]: `.${agent.id}.` }, status: "PLAYING", updatedAt: { [Op.between]: [new Date(new Date() - 1000 * 60 * 15), new Date()] } } }),
        Agent.count({ where: { parentPath: { [Op.substring]: `.${agent.id}.` }, status: 1 } }),
        User.count({ where: { parentPath: { [Op.substring]: `.${agent.id}.` }, apiType: 1, status: 1 } }),
        User.count({ where: { agentCode: agent.agentCode, apiType: 1, status: 1 } }),
        SlotGameTransaction.findAll({
            attributes: [
                [Sequelize.literal("COUNT(id)"), "yesterdayPlayCount"],
                [Sequelize.fn('SUM', Sequelize.col('bet')), 'yesterdayTotalDebit'],
                [Sequelize.fn('SUM', Sequelize.col('win')), 'yesterdayTotalCredit'],
                [Sequelize.fn('SUM', Sequelize.literal('bet - win')), 'yesterdayIncome'],
            ],
            where: { parentPath: { [Op.substring]: `.${agent.id}.` }, createdAt: { [Op.between]: [yesterdayStartTime, yesterdayEndTime] } },
            raw: true,
        }),
        SlotGameTransaction.findAll({
            attributes: [
                [Sequelize.literal("COUNT(id)"), "todayPlayCount"],
                [Sequelize.fn('SUM', Sequelize.col('bet')), 'todayTotalDebit'],
                [Sequelize.fn('SUM', Sequelize.col('win')), 'todayTotalCredit'],
                [Sequelize.fn('SUM', Sequelize.literal('bet - win')), 'todayIncome'],
            ],
            where: { parentPath: { [Op.substring]: `.${agent.id}.` }, createdAt: { [Op.between]: [startTime, endTime] } },
            raw: true,
        }),
        SlotGameTransaction.findAll({
            attributes: [
                [Sequelize.literal("COUNT(id)"), "monthPlayCount"],
                [Sequelize.fn('SUM', Sequelize.col('bet')), 'monthTotalDebit'],
                [Sequelize.fn('SUM', Sequelize.col('win')), 'monthTotalCredit'],
                [Sequelize.fn('SUM', Sequelize.literal('bet - win')), 'monthIncome'],
            ],
            where: { parentPath: { [Op.substring]: `.${agent.id}.` }, createdAt: { [Op.between]: [monthAgo, endTime] } },
            raw: true,
        }),
    ]);

    //              
    const {
        todayTotalChildDepositIn,
        todayTotalParentDepositIn,
        todayTotalChildWithdrawOut,
        todayTotalParentWithdrawOut
    } = inOutResult;

    let { todayPlayCount, todayTotalDebit, todayTotalCredit, todayIncome } = todayPlayInfo[0];
    let { yesterdayPlayCount, yesterdayTotalDebit, yesterdayTotalCredit, yesterdayIncome } = yesterdayPlayInfo[0];
    let { monthPlayCount, monthTotalDebit, monthTotalCredit, monthIncome} = monthPlayInfo[0];

    // popups
    
    const getCountNote = 0;//await Note.count({ where: { [Op.and]: [{ receiverCode: agent.agentCode }, { readStatus: 0 }] } });

    let data = {
        totalBalance: agent.totalBalance,
        childAgentBalances,
        childUserBalances,
        directUserBalances,
        playingCount,
        directUserCount,
        childAgentCount,
        childUserCount,
        todayTotalChildDepositIn,
        todayTotalParentDepositIn,
        todayTotalChildWithdrawOut,
        todayTotalParentWithdrawOut,
        yesterdayPlayCount: yesterdayPlayCount || 0,
        yesterdayTotalDebit: yesterdayTotalDebit || 0,
        yesterdayTotalCredit: yesterdayTotalCredit || 0,
        yesterdayIncome: yesterdayIncome || 0,
        todayPlayCount: todayPlayCount || 0,
        todayTotalDebit: todayTotalDebit || 0, 
        todayTotalCredit: todayTotalCredit || 0, 
        todayIncome: todayIncome || 0,
        monthPlayCount: monthPlayCount || 0,
        monthTotalDebit: monthTotalDebit || 0, 
        monthTotalCredit: monthTotalCredit || 0, 
        monthIncome: monthIncome || 0,
        getCountNote,
        popups: {}
    };

    return res.json({
        status:1,
        data,
    });

}
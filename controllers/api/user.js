const { Op } = require("sequelize");
const { User, Agent, UserTransaction, UserBalanceProgress, AgentBalanceProgress, SlotGameTransaction, Sequelize, Player, sequelize } = require("../../models");
const logger = require("../../utils/logger");

const { getParentPathCode } = require("../../utils/redis");

const { ERR_MSG, AGENT_ROLE, CHARGE_TYPE, AGENT_TYPE, API_TYPE } = require("../../utils/constants");
const { isMyParent, sendAlert } = require("../../utils/securityCheck");
const checkParent = require("../../utils/checkParent");

exports.getList = async (req, res) => {
    try {
        let { start, searchKey, draw, length, order = "id", dir = "ASC", agentCode = 'all' } = req.body;

        //                        
        const whereClause = {
            status: 1
        };

        if (req.session.auth.role !== 1) {
            //                                                                                      
            whereClause.parentPath = { [Op.substring]: `.${req.session.auth.id}.` };
        }

        if (searchKey) {
            whereClause.userCode = { [Op.substring]: searchKey };
        }

        if (agentCode && agentCode !== "all") {
            whereClause.agentCode = agentCode;
        }

        //                            
        const count = await User.count({ where: whereClause });

        if (order == "parentPathCode") order = "id";
        //                                                  
        let users = await User.findAll({
            where: whereClause,
            order: [[order, dir]],
            limit: Number(length),
            offset: Number(start),
            // include: [{
            //     model: Agent,
            //     attributes: ['currency'],
            //     // through: { attributes: [] } //                                                               
            // }],
            raw:true,
        });

        //                                               

        for (let user of users) {
            user.parentPathCode = await getParentPathCode(user.parentPath);

            if (req.session.auth.role != 1) {
                user.parentPathCode = " / " + req.session.auth.agentCode + user.parentPathCode.split(req.session.auth.agentCode)[1];
            }
        }
        return res.json({
            status: 1,
            data: users,
            draw: Number(draw),
            start: Number(start),
            recordsTotal: count,
            recordsFiltered: count
        });
    } catch (error) {

        console.log(error);
        logger("error", "API | User | Get All", `${error.message}`, req);
        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR
        });
    }
};

// exports.getAllUsersForDT_older = async (req, res) => {
//     try {
//         const authInfo = req.session.auth;
//         const { start, search, draw, length, order, dir, agentCode } = req.query;

//         //                   
//         let count;
//         let query = { status: 1 };
//         if (authInfo.role == 1) {
//             //                                                       
//             query = {};
//         }
//         if (search) {
//             query = { ...query, userCode: { [Op.substring]: search } };
//         }
//         if (agentCode == "all" || !agentCode) {
//             query = { ...query, parentPath: { [Op.substring]: `.${authInfo.id}.` } };
//             count = await User.count({
//                 where: query,
//             });
//         } else {
//             query = { ...query, agentCode };
//             count = await User.count({
//                 where: query,
//             });
//         }

//         //                             
//         let statusQuery = ` and users.status = 1`;
//         if (authInfo.role == 1) {
//             //                                                       
//             statusQuery = ``;
//         }

//         let searchQuery = ``;
//         if (search) {
//             searchQuery = ` and users.userCode like "%${search}%" `;
//         }

//         let agentQuery = ``;
//         if (agentCode == "all" || !agentCode) {
//             agentQuery = ` and users.parentPath like "%.${authInfo.id}.%" `;
//         } else {
//             agentQuery = ` and users.agentCode = "${agentCode}" `;
//         }

//         let sql = `
//             SELECT tbl.*, agents.currency FROM agents JOIN
//                 (SELECT
//                 users.*,
//                 GROUP_CONCAT(agents.agentCode ORDER BY agents.id SEPARATOR ' / ') AS parentPathCode
//                 FROM
//                 users
//                 JOIN
//                 agents ON FIND_IN_SET(agents.id, REPLACE(users.parentPath, '.', ',')) > 0
//                 WHERE 1=1
//                 ${searchQuery} ${agentQuery} ${statusQuery}
//                 GROUP BY
//                 users.id
//                 ORDER BY ${order} ${dir} LIMIT ${Number(length)} OFFSET ${Number(start)}) tbl ON tbl.agentCode = agents.agentCode;
//             `;

//         let [users, tmp] = await sequelize.query(sql);

//         //                                          .
//         for (let i = 0; i < users.length; i++) {
//             users[i].parentPathCode = authInfo.agentCode + users[i].parentPathCode.split(authInfo.agentCode)[1];
//         }

//         return res.json({
//             status: 1,
//             data: users,
//             draw: Number(draw),
//             start: Number(start),
//             recordsTotal: count,
//             recordsFiltered: count,
//         });
//     } catch (error) {
//         logger("error", "API | User | Get All", `${error.message}`, req);

//         return res.json({
//             status: 0,
//             msg: ERR_MSG.INTERNAL_ERROR,
//         });
//     }
// };


exports.changeGameStop = async (req, res) => {
    try {
        const { status, id } = req.body;

        const user = await User.findByPk(id);
        if (!user) { return res.json({ status: 0, msg: ERR_MSG.INVALID_USER }); }
        if (!checkParent(user, req.session.auth.id, req, res)) return; //            


        await User.update({ status }, { where: { id } });
        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | User | Change GameStop", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.changeRtp = async (req, res) => {
    try {
        const { userId, rtp } = req.body;
        const user = await User.findByPk(userId);
        if (!user) { return res.json({ status: 0, msg: ERR_MSG.INVALID_USER }); }
        if (!checkParent(user, req.session.auth.id, req, res)) return; //            
        await User.update({ targetRtp: rtp }, { where: { id: userId } });
        return res.json({ status: 1 });

    } catch (error) {
        logger("error", "API | User | Change Rtp", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.exchangeUser = async (req, res) => {
    try {
        const { userId, chargeType } = req.body;
        const amount = Number(req.body.amount);

        const user = await User.findByPk( userId );
        if (!user) { return res.json({ status: 0, msg: ERR_MSG.INVALID_USER }); }
        if (!isMyParent(user, req.session.auth)) { sendAlert(req, res); return; } //                                                                .
        const parentAgent = await Agent.findOne({ where: { agentCode: user.agentCode } });
        if (!parentAgent) { return res.json({ status: 0, msg: ERR_MSG.INVALID_AGENT }); }
        if (!parentAgent.apiType === API_TYPE.SEAMLESS) { return res.json({ status: 0, msg: ERR_MSG.SEAMLESS_AGENT_NOT_ALLOWED }); }
        const operatorAgent = req.session.auth;

        const userPrevBalance = Number(user.balance);
        const parentPrevBalance = Number(parentAgent.balance);
        const parentPrevTotalBalance = Number(parentAgent.totalBalance);


        if (chargeType == CHARGE_TYPE.DEPOSIT) { 
            if (parentAgent.role === AGENT_ROLE.ADMIN) {
                await parentAgent.increment('totalbalance', { by: amount });
                await parentAgent.reload();
                await user.increment(['balance'], { by: amount });
                await user.reload();
            } else {
                if (Number(parentAgent.balance) < amount) {
                    return res.json({ status: 0, msg: ERR_MSG.INSUFFICIENT_AGENT_FUNDS });
                }
                await parentAgent.decrement('balance', { by: amount });
                await parentAgent.reload();
                await user.increment(['balance'], { by: amount });
                await user.reload();
            }

        } else if (chargeType == CHARGE_TYPE.WITHDRAW) {
            if (parentAgent.role === AGENT_ROLE.ADMIN) {
                await parentAgent.decrement('totalbalance', { by: amount });
                await parentAgent.reload();
                await user.decrement(['balance'], { by: amount });
                await user.reload();
            } else {
                if (Number(user.balance) < amount) {
                    return res.json({ status: 0, msg: ERR_MSG.INSUFFICIENT_USER_FUNDS });
                }
                await parentAgent.increment('balance', { by: amount });
                await parentAgent.reload();
                await user.decrement(['balance'], { by: amount });
                await user.reload();
            }
        }else{
            return res.json({
                status: 0,
                msg: ERR_MSG.UNEXPECTED_CHARGE_TYPE,
            });
        }

        
        let parentAfterBalance = parentAgent.balance;
        let parentAfterTotalBalance = parentAgent.totalBalance;
        let userAfterBalance = user.balance;

        UserTransaction.create({
            operatorCode: operatorAgent.agentCode,
            agentCode: parentAgent.agentCode,
            userCode: user.userCode,
            chargeAmount: amount,
            chargeMethod: "SITE",
            agentPrevBalance: parentPrevBalance,
            agentAfterBalance: parentAfterBalance,
            agentPrevTotalBalance: parentPrevTotalBalance,
            agentAfterTotalBalance: parentAfterTotalBalance,
            userPrevBalance: userPrevBalance,
            userAfterBalance: userAfterBalance,
            chargeType,
            status: 1,
            parentPath: user.parentPath,
        });

        UserBalanceProgress.create({
            agentCode: parentAgent.agentCode,
            userCode: user.userCode,
            userPrevBalance: userPrevBalance,
            userAfterBalance: userAfterBalance,
            amount: amount,
            target: parentAgent.agentCode,
            cause: chargeType == CHARGE_TYPE.DEPOSIT ? "SITE | USER DEPOSIT" : "SITE | USER WITHDRAW",
            direction: chargeType == CHARGE_TYPE.DEPOSIT ? "Increase" : "Decrease",
            comment: ``,
            parentPath: user.parentPath,
        });

        AgentBalanceProgress.create({ //                  
            agentCode: parentAgent.agentCode,
            agentPrevBalance: parentPrevBalance,
            agentAfterBalance: parentAfterBalance,
            agentPrevTotalBalance: parentPrevTotalBalance,
            agentAfterTotalBalance: parentAfterTotalBalance,
            currency: parentAgent.currency,
            apiType: parentAgent.apiType,
            amount: amount,
            target: user.userCode,
            cause: chargeType == CHARGE_TYPE.DEPOSIT ? "SITE | USER DEPOSIT" : "SITE | USER WITHDRAW",
            direction: chargeType == CHARGE_TYPE.DEPOSIT ? "Decrease" : "Increase",
            comment: ``,
            parentPath: parentAgent.parentPath,
        });

        let logType = {0: "Withdraw", 1: "Deposit"}
        logger("info", "API | User | Exchange", `Agent(${parentAgent.agentCode}:${parentPrevBalance}) ${logType[chargeType]} to User(${user.userCode}:${userPrevBalance}) Amount(${amount})`, req);

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | User | Exchange", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.getConnectedUser = async (req, res) => {
    try {
        const sessionAgentId = req.session.auth.id;
        const sessionAgentCode = req.session.auth.agentCode;
        const { start, search, draw, length, order, dir } = req.query;

        let searchQuery = {
            [Op.or]: [{ userCode: { [Op.substring]: search } }, { providerCode: { [Op.substring]: search } }, { gameCode: { [Op.substring]: search } }],
        };

        let realSorter;
        if (order == "totalDebit") {
            realSorter = [{ model: User, as: "user" }, "totalDebit", dir];
        } else if (order == "totalCredit") {
            realSorter = [{ model: User, as: "user" }, "totalCredit", dir];
        } else if (order == "balance") {
            realSorter = [{ model: User, as: "user" }, "balance", dir];
        } else {
            realSorter = [order, dir];
        }

        //                                                  
        let childAgentCodeList = await Agent.findAll({
            attributes: ["id", "agentCode", "parentPath"],
            where: {
                [Op.or]: [{ parentPath: { [Op.like]: `%.${sessionAgentId}.%` } }, { id: sessionAgentId }],
                status: { [Op.not]: 2 },
            },
            order: ["parentPath"],
            raw: true,
        });

        let conditionQuery = {};
        if (childAgentCodeList.length == 1) {
            conditionQuery = childAgentCodeList[0];
            conditionQuery = { agentCode: childAgentCodeList[0].agentCode };
        } else if (childAgentCodeList.length > 1) {
            let agentCodes = [];
            for (let i = 0; i < childAgentCodeList.length; i++) {
                agentCodes.push({ agentCode: childAgentCodeList[i].agentCode });
            }

            conditionQuery = {
                [Op.or]: agentCodes,
            };
        } else {
            conditionQuery = { agentCode: req.session.auth.agentCode };
        }

        const players = await Player.findAndCountAll({
            where: {
                ...searchQuery,
                ...conditionQuery,
                status: "PLAYING",
                updatedAt: { [Op.between]: [new Date(new Date() - 1000 * 60 * 15), new Date()] },
            },
            offset: Number(start),
            limit: Number(length),
            order: [realSorter],
            include: [
                {
                    model: User,
                    attributes: ["targetRtp", "realRtp", "totalDebit", "totalCredit", "balance", "id", "gameStop"],
                    as: "user",
                },
            ],
        });

        //              path       
        let pathAgentsList = {};
        for (const i in childAgentCodeList) {
            let obj = {};
            obj[`${childAgentCodeList[i].id}`] = childAgentCodeList[i].agentCode;

            pathAgentsList = {
                ...pathAgentsList,
                ...obj,
            };
        }

        const getParentPath = async (agentCode) => {
            if (sessionAgentCode == agentCode) {
                return agentCode;
            }

            const agent = await Agent.findOne({ where: { agentCode } });

            let splitData = agent.parentPath.split(".");
            let pathIdArray = splitData.slice(1, splitData.length - 1);
            pathIdArray.push(agent.id);

            let pathArray = [];
            for (let i = pathIdArray.length; i > 0; i--) {
                if (pathAgentsList[pathIdArray[i - 1]]) {
                    pathArray.unshift(pathAgentsList[pathIdArray[i - 1]]);
                }

                if (sessionAgentId == pathIdArray[i]) {
                    break;
                }
            }

            let pathString = pathArray.join(" / ");
            return pathString;
        };

        let result = [];
        for (let i = 0; i < players.rows.length; i++) {
            let parentAgentPath = await getParentPath(players.rows[i].agentCode);

            result.push({
                userCode: players.rows[i].userCode,
                providerCode: players.rows[i].providerCode,
                gameCode: players.rows[i].gameCode,
                machineId: players.rows[i].machineId,
                bet: players.rows[i].lastBet,
                balance: players.rows[i].user.balance,
                totalDebit: players.rows[i].user.totalDebit,
                totalCredit: players.rows[i].user.totalCredit,
                targetRtp: players.rows[i].user.targetRtp,
                realRtp: players.rows[i].user.realRtp,
                userId: players.rows[i].user.id,
                gameStop: players.rows[i].user.gameStop,
                agentCode: players.rows[i].agentCode,
                parentAgentPath: parentAgentPath,
            });
        }

        return res.json({
            status: 1,
            data: result,
            draw: Number(draw),
            start: Number(start),
            recordsTotal: players.count,
            recordsFiltered: players.count,
        });
    } catch (error) {
        logger("error", "API | User | Connected User", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_USER,
            });
        }

        //            
        const sessionId = req.session.auth.id;
        if (!user.parentPath.includes(`.${sessionId}.`)) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_PERMISSION,
            });
        }
        user.status = 2;
        user.userCode = user.userCode + " [deleted]";
        await user.save();

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | User | Delete User", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.readById = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findByPk(userId);
        if (!user) { return res.json({ status: 0, msg: ERR_MSG.INVALID_USER });}

        return res.json({
            status: 1,
            data: user
        });
    } catch (error) {
        logger("error", "API | User | Get Total Debit and Credit", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.balanceList = async (req, res) => {
    try {
        const { agentCode='all', userCode='all', startDate, endDate, searchKey, dir='ASC', order='id', start, length } = req.body;

        // const startDateFormated = new Date(new Date(startDate).setHours(0, 0, 0));
        // const endDateFormated = new Date(new Date(endDate).setHours(24, 0, 0));
        const startDateFormated = new Date(startDate);
        const endDateFormated = new Date(endDate);

        let baseQuery = {
            [Op.or]: [{ comment: { [Op.substring]: searchKey } }, { agentCode: { [Op.substring]: searchKey } }, { userCode: { [Op.substring]: searchKey } }],
            createdAt: { [Op.between]: [startDateFormated, endDateFormated] },
        };

        let query;
        if (agentCode == "all" && userCode == "all") {
            query = {
                ...baseQuery,
                parentPath: { [Op.substring]: `.${req.session.auth.id}.` },
            };
        } else if (agentCode == "all" && userCode != "all") {
            query = {
                ...baseQuery,
                parentPath: { [Op.substring]: `.${req.session.auth.id}.` },
                userCode: userCode,
            };
        } else if (agentCode != "all" && userCode == "all") {
            query = {
                ...baseQuery,
                agentCode: agentCode,
            };
        } else {
            query = {
                ...baseQuery,
                agentCode: agentCode,
                userCode: userCode,
            };
        }

        const data = await UserBalanceProgress.findAndCountAll({
            where: query,
            offset: Number(start),
            limit: Number(length),
            order: [
                [order, dir],
                ["id", dir],
            ],
            // logging: (query) => {
            //     console.log(query);
            // },
        });


        return res.json({
            status: 1,
            data: data.rows,
            start: Number(start),
            recordsTotal: data.count,
            recordsFiltered: data.count,
        });
    } catch (error) {
        logger("error", "API | User Balance Progress | Get All", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.exchangeList = async (req, res) => {
    try {
        const authInfo = req.session.auth;
        const { start, searchKey, draw, length, order='id', dir="ASC", agentCode='all', userCode='all', startDate, endDate, method } = req.body;
        // const startDateFormated = new Date(new Date(startDate).setHours(0, 0, 0));
        // const endDateFormated = new Date(new Date(endDate).setHours(24, 0, 0));
        const startDateFormated = new Date(startDate);
        const endDateFormated = new Date(endDate);

        let transactions;
        let query = {
            [Op.or]: [{ agentCode: { [Op.substring]: searchKey } }, { userCode: { [Op.substring]: searchKey } }],
            createdAt: { [Op.between]: [startDateFormated, endDateFormated] },
        };
        let chargeType = 1; // 0:       , 1:       

        if (method == 2) {
            //                     
            chargeType = 0;
        }

        if (agentCode == "all") {
            //                                                            (                                         )
            if (userCode == "all") {
                query = { ...query, parentPath: { [Op.substring]: `.${authInfo.id}.` } };
            } else {
                query = { ...query, parentPath: { [Op.substring]: `.${authInfo.id}.` }, userCode };
            }
        } else {
            //                                                               (                                         )

            if (userCode == "all") {
                query = { ...query, agentCode };
            } else {
                query = { ...query, agentCode, userCode };
            }
        }

        if (method != 0) {
            query = { ...query, chargeType: chargeType };
        }

        transactions = await UserTransaction.findAndCountAll({
            where: query,
            offset: Number(start),
            limit: Number(length),
            order: [
                [order, dir],
                ["id", dir],
            ],
        });

        return res.json({
            status: 1,
            data: transactions.rows,
            draw: Number(draw),
            start: Number(start),
            recordsTotal: transactions.count,
            recordsFiltered: transactions.count,
        });
    } catch (error) {
        logger("error", "API | User Transaction | Get All", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.transactionList = async (req, res) => {
    try {
        const { searchKey, order='id', dir='ASC', agentCode='all', userCode='all', providerCode='all', length, start, startDate, endDate, gameCode='all' } = req.body;

        // const startDateFormated = new Date(new Date(startDate).setHours(0, 0, 0));
        // const endDateFormated = new Date(new Date(endDate).setHours(24, 0, 0));
        const startDateFormated = new Date(startDate);
        const endDateFormated = new Date(endDate);

        let baseQuery = { createdAt: { [Op.between]: [startDateFormated, endDateFormated] } };

        if (providerCode != "all") {
            baseQuery = {
                ...baseQuery,
                providerCode: providerCode,
            };
            if(gameCode != 'all') {
                baseQuery = {
                    ...baseQuery,
                    gameCode: gameCode
                }
            }
        }        

        let query;
        if (agentCode == "all" && userCode == "all") {
            query = {
                ...baseQuery,
                parentPath: { [Op.substring]: `.${req.session.auth.id}.` },
            };
        } else if (agentCode == "all" && userCode != "all") {
            query = {
                ...baseQuery,
                parentPath: { [Op.substring]: `.${req.session.auth.id}.` },                
                userCode: userCode,
            };
        } else if (agentCode != "all" && userCode == "all") {
            query = {
                ...baseQuery,
                agentCode: agentCode,
            };
        } else {
            query = {
                ...baseQuery,
                agentCode: agentCode,
                userCode: userCode,
            };
        }
        let gameTransactions = await SlotGameTransaction.findAndCountAll({
            where: {
                [Op.or]: [
                    { agentCode: { [Op.substring]: searchKey } },
                    { userCode: { [Op.substring]: searchKey } },
                    { providerCode: { [Op.substring]: searchKey } },
                    { gameCode: { [Op.substring]: searchKey } },
                    { type: { [Op.substring]: searchKey } },
                    { txnType: { [Op.substring]: searchKey } },
                ],
                [Op.and]: query,
            },
            offset: Number(start),
            limit: Number(length),
            order: [
                [order, dir],
                ["id", dir],
            ],
        });


        //         ,                    
        let result = await SlotGameTransaction.findOne({
            attributes: [
                [sequelize.fn('sum', sequelize.col('bet')), 'totalBet'],
                [sequelize.fn('sum', sequelize.col('win')), 'totalWin']
              ],
            where: {
                [Op.or]: [
                    { agentCode: { [Op.substring]: searchKey } },
                    { userCode: { [Op.substring]: searchKey } },
                    { providerCode: { [Op.substring]: searchKey } },
                    { gameCode: { [Op.substring]: searchKey } },
                    { type: { [Op.substring]: searchKey } },
                    { txnType: { [Op.substring]: searchKey } },
                ],
                [Op.and]: query,
            },
        });

        //                     
        delete query.providerCode;
        delete query.gameCode;
        let balanceTransactions = await UserTransaction.findAll({
            where: {
                [Op.and]: query,
            },
            order: [
                ["createdAt", "DESC"],
            ]
        });

        balanceTransactions.forEach((transaction) => {
            try{
                let balanceObj  = transaction.get({ plain: true });

                let test = balanceObj.createdAt;
                
    
                //                                       
                let closestTransactionIndex = gameTransactions.rows.reduce((prevIndex, curr, currIndex) => {
                    const prevDiff = Math.abs(new Date(gameTransactions.rows[prevIndex].createdAt) - new Date(test));
                    const currDiff = Math.abs(new Date(curr.createdAt) - new Date(test));
                    return prevDiff < currDiff ? prevIndex : currIndex;
                }, 0); // We start with the index 0
    
    
                // 1                                 
                if (Math.abs(new Date(gameTransactions.count > 0 && gameTransactions.rows[closestTransactionIndex].createdAt) - new Date(test)) > 60000) {
                }else{
                    if(!gameTransactions.rows[closestTransactionIndex].dataValues.balanceTransaction){
                        gameTransactions.rows[closestTransactionIndex].dataValues.balanceTransaction = [];
                    }
                    gameTransactions.rows[closestTransactionIndex].dataValues.balanceTransaction.push(balanceObj)
                }
            }catch(e){

            }
            
        })

        setTimeout(()=>{
            return res.json({
                status: 1,
                data: gameTransactions.rows,
                totalData: result,
                count: gameTransactions.count,
            });
        }, 1000);  
        
    } catch (error) {
        // console.error('Failed SQL Query:', error.sql);
        logger("error", "API | Game Transaction | Get All", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

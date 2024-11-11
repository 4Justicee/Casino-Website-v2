const MD5 = require("md5.js");
const { Op, Transaction } = require("sequelize");
const moment = require("moment");
const { Agent, Popup, User, Note, AgentBalanceStatistics, AgentTransaction, SlotGameTransaction, SlotGameStatistics, Player, Provider, sequelize, Sequelize, AgentBalanceProgress } = require("../../models");
const config = require("../../config/main")
const bcrypt = require("bcrypt");
const isEmpty = require("../../utils/isEmpty");
const logger = require("../../utils/logger")
const {enc} = require("../../middlewares/auth")

const { ERR_MSG, CHARGE_TYPE, AGENT_STATUS, AGENT_TYPE, AGENT_ROLE } = require("../../utils/constants");

exports.getList = async (req, res) => {
    try {
        const {draw} = req.body;
        const id = req.session.auth.id;
        const agents = await Agent.findAndCountAll({where:{parentPath:{[Op.substring]: `.${id}.`}}, raw:true})

        return res.json({
            draw,
            recordsTotal: agents.count,
            recordsFiltered: agents.count,
            data: agents.rows
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


exports.createAgent = async (req, res) => {
    try {
        let { pid, agentCode, agentName, password, percent, memo, apiType, endpoint, currency } = req.body;

        const existAgent = await Agent.findOne({ where: { agentCode } });
        if (existAgent) { return res.json({ status: 0, msg: 'Duplicated Agent', }); }

        const parentAgent = await Agent.findOne({ where: { id: pid } });
        if (!parentAgent) { return res.json({ status: 0, msg: ERR_MSG.INVALID_PARENT_AGENT }); }

        const sessionId = req.session.auth.id;
        if (req.session.auth.role !== 1 && sessionId != parentAgent.id) {
            return res.json({ status: 0, msg: ERR_MSG.INVALID_PERMISSION, });
        }

        if (req.session.auth.role === 1) {

        } else {
            if (parentAgent.currency != currency) { return res.json({ status: 3 }); }
        }

        if (req.session.auth.role !== 1 && parentAgent.balance === 0) {
            return res.json({ status: 0, msg: ERR_MSG.CANNOT_CREATE_AGENT_WITH_ZERO_BALANCE });
        }

        if (req.session.auth.role !== 1) {
            let usd1Rate = config.currencyRate.rates[parentAgent.currency];
            if (usd1Rate === undefined || usd1Rate == 0 || usd1Rate === null) {
                usd1Rate = 1;
            } else {
                usd1Rate = Number(usd1Rate);
            }
            let subAmount = Math.floor(usd1Rate * 10);
            if (parentAgent.balance < subAmount) {
                return res.json({ status: 0, msg: 'Insufficient agent value' });
            }

            await parentAgent.decrement(['balance', 'totalBalance'], { by: subAmount });
            await parentAgent.reload();

        }

        //                                                                                                                         .
        if (req.session.auth.role !== 1 && Number(parentAgent.percent) > Number(percent)) {
            percent = parentAgent.percent;
        }

        const token = new MD5().update(agentCode + password + new Date()).digest("hex");
        const secretKey = new MD5().update(agentCode + password + "secret-key" + new Date()).digest("hex");

        const parentPath = parentAgent.parentPath + parentAgent.id + ".";
        const depth = Number(parentAgent.depth) + 1;
        const lang = parentAgent.lang;

        //                    
        const saltRounds = 10; //                     
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await Agent.create({
            parentId : pid,
            agentName,
            agentCode,
            password: hashedPassword,
            percent,
            memo,
            siteEndPoint : endpoint,
            token,
            secretKey,
            depth,
            parentPath,
            lang,
            currency: currency,
            providers: parentAgent.providers
        });


        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Agent | Create Agent", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};


exports.updateAgent = async (req, res) => {
    try {
        let { agentId, agentName, password, agentType, apiType, percent, ipAddress, memo, status, siteEndPoint, zeroSetting, rtp, adminMemo, currency, allowManageCallAndRtp, openPachinkoApi, openReelApi } = req.body;

        const agent = await Agent.findByPk(agentId);
        if (!agent) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_AGENT,
            });
        }
        const parentAgent = await Agent.findOne({ where: { id: agent.parentId } });

        // [            ]                                                 .
        if (req.session.auth.role !== AGENT_ROLE.ADMIN && req.session.auth.id != agent.parentId) {
            return res.json({ status: 0, msg: ERR_MSG.INVALID_PERMISSION, });
        }


        if (Number(parentAgent.percent) > Number(percent)) {
            //                                       .                             .
            percent = parentAgent.percent;
        }


        let updateData = {};
        if (!isEmpty(agentName) || agentName == "") updateData.agentName = agentName;
        if (!isEmpty(agentType)) updateData.agentType = agentType;
        if (!isEmpty(apiType)) updateData.apiType = apiType;
        if (!isEmpty(password)) {
            //                    
            const saltRounds = 10; //                     
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            updateData.password = hashedPassword;
        }
        if (!isEmpty(percent)) updateData.percent = percent;
        if (!isEmpty(status)) updateData.status = status;
        if (!isEmpty(siteEndPoint)) updateData.siteEndPoint = siteEndPoint;
        if (!isEmpty(ipAddress)) {
            ipAddress = ipAddress.trim();
            updateData.ipAddress = ipAddress;
        }
        // if (!isEmpty(zeroSetting) || zeroSetting == "") updateData.zeroSetting = zeroSetting;
        if (!isEmpty(rtp)) updateData.rtp = rtp;
        if (!isEmpty(memo) || memo == "") updateData.memo = memo;
        if (!isEmpty(adminMemo) || adminMemo == "") updateData.adminMemo = adminMemo;

        if (!isEmpty(currency)) {
            const admin = await Agent.findOne({ where: { role: 1 } });
            // update        currency     view                     currency                                                         .                                              currency                                                                                  .


            if (req.session.auth.role != 1 && req.session.auth.role != 2) {
                if (parentAgent.currency != currency) {
                    //                                           .
                    return res.json({
                        status: 3,
                    });
                }
            }

            updateData.currency = currency;
        }

        if (!isEmpty(allowManageCallAndRtp)) updateData.allowManageCallAndRtp = allowManageCallAndRtp;
        if (!isEmpty(openPachinkoApi)) updateData.openPachinkoApi = openPachinkoApi;
        if (!isEmpty(openReelApi)) updateData.openReelApi = openReelApi;

        if (agent.zeroSetting != zeroSetting) {
            updateData.curIndex = 0;
            updateData.zeroArray = "";
        }

        const userCount = await User.count({ where: { agentCode: agent.agentCode } });

        if (!isEmpty(apiType) && agent.apiType != apiType && userCount > 0) {
            return res.json({
                status: 0,
                msg: ERR_MSG.CANNOT_UPDATE_AGENT,
            });
        }

        await Agent.update(updateData, { where: { id: agentId } });

        let changedAgents = [];

        if (!isEmpty(status)) {
            await Agent.update(
                { status },
                {
                    where: {
                        parentPath: { [Op.like]: `${agent.parentPath}${agent.id}.%` },
                        status: { [Op.not]: 2 },
                    },
                }
            );

            changedAgents = await Agent.findAll({
                attributes: ["id"],
                where: {
                    parentPath: { [Op.like]: `${agent.parentPath}${agent.id}.%` },
                    status: { [Op.not]: 2 },
                },
                raw: true,
            });
        }

        return res.json({ status: 1, changedAgents: changedAgents });
    } catch (error) {
        logger("error", "API | Agent | Update Agent", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.updateAgentPWD = async (req, res) => {
    try {
        let { oldpwd, newpwd } = req.body;

        if(isEmpty(oldpwd) || isEmpty(newpwd)) {
            return res.json({
                status: 2,
                msg: 'Nothing to do'
            });
        }

        const agent = await Agent.findByPk(req.session.auth.id);
        if (!agent) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_AGENT,
            });
        }

        const result = await bcrypt.compare(oldpwd, agent.password);
        if (!result) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INCORRECT_PASSWORD,
            });
        }

        const saltRounds = 10; //                     
        const hashedPassword = await bcrypt.hash(newpwd, saltRounds);

        agent.update({password: hashedPassword});

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Agent | Update Agent", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.removeAgent = async (req, res) => {
    try {
        const { id } = req.body;

        const agent = await Agent.findByPk(id);
        if (!agent) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_AGENT,
            });
        }


        // [            ]                                                 .
        if (req.session.auth.role !== AGENT_ROLE.ADMIN && req.session.auth.id != agent.parentId) {
            return res.json({ status: 0, msg: ERR_MSG.INVALID_PERMISSION, });
        }

        await Agent.update(
            { status: 2 },
            {
                where: {
                    [Op.or]: [{ parentPath: { [Op.like]: `${agent.parentPath}${agent.id}.%` } }, { id }],
                },
            }
        );
        await User.update(
            { status: 2 },
            {
                where: { parentPath: { [Op.like]: `${agent.parentPath}${agent.id}.%` } },
            }
        );

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Agent | Delete Agent", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};


exports.exchangeAgent = async (req, res) => {
    try {
        const agentId = Number(req.body.agentId);
        const chargeType = Number(req.body.chargeType);
        const amount = Number(req.body.amount);
        const sessionId = req.session.auth.id;

        const agent = await Agent.findOne({ where: { id: agentId, status: { [Op.not]: AGENT_STATUS.DELETED } }, });
        if (!agent) { return res.json({ status: 0, msg: ERR_MSG.INVALID_AGENT }); }

        
        // [            ] -                                
        if (req.session.auth.role !== AGENT_ROLE.ADMIN && chargeType == 2) {
            return res.json({ status: 0, msg: ERR_MSG.INVALID_PERMISSION });
        }


        const parentAgent = await Agent.findOne({ where: { id: agent.parentId, status: { [Op.not]: AGENT_STATUS.DELETED } } });
        if (!parentAgent) { return res.json({ status: 0, msg: ERR_MSG.INVALID_PARENT_AGENT, }); }


        // [            ] -                                 ,                    
        if (req.session.auth.role !== AGENT_ROLE.ADMIN && sessionId != parentAgent.id) {
            return res.json({ status: 0, msg: ERR_MSG.INVALID_PERMISSION, });
        }


        const operatorAgent = await Agent.findByPk(sessionId);
        const operatorBeforeBalance = Number(operatorAgent.balance);
        const operatorBeforeTotalBalance = Number(operatorAgent.totalBalance);
        const parentBeforeBalance = Number(parentAgent.balance);
        const parentBeforeTotalBalance = Number(parentAgent.totalBalance); //                            
        const agentBeforeBalance = Number(agent.balance);
        const agentBeforeTotalBalance = Number(agent.totalBalance);

        let cause = "";
        if (chargeType === CHARGE_TYPE.DEPOSIT) {
            if (parentAgent.role === AGENT_ROLE.ADMIN) {
                await parentAgent.increment('totalbalance', { by: amount });
                await parentAgent.reload();
                await agent.increment(['balance', 'totalBalance'], { by: amount });
                await agent.reload();
            } else {
                if (Number(parentAgent.balance) < amount) {
                    return res.json({ status: 0, msg: ERR_MSG.INSUFFICIENT_PARENT_FUNDS });
                }
                await parentAgent.decrement('balance', { by: amount });
                await parentAgent.reload();
                await agent.increment(['balance', 'totalBalance'], { by: amount });
                await agent.reload();
            }

            cause = "SITE | AGENT DEPOSIT";
        } else if (chargeType === CHARGE_TYPE.DEPOSIT_DIRECT) {
            if (operatorAgent.role === AGENT_ROLE.ADMIN) {
                await operatorAgent.increment('totalbalance', { by: amount });
                await operatorAgent.reload();
                await agent.increment(['balance', 'totalBalance'], { by: amount });
                await agent.reload();
            } else {
                if (operatorAgent.balance < amount) { return res.json({ status: 0, msg: ERR_MSG.INSUFFICIENT_AGENT_FUNDS, }); }
                await operatorAgent.decrement('balance', { by: amount });
                await operatorAgent.reload();
                await agent.increment(['balance', 'totalBalance'], { by: amount });
                await agent.reload();
            }

            //2024-04-23 Julian                                                                          totalBalance                .
            //                parentPath                                                                                              
            const parentPathFilter = (parentPath, operatorAgentId) => {
                const parentPathArray = parentPath.slice(1, -1).split('.').map(Number); //              '.'                                        
                const index = parentPathArray.indexOf(operatorAgentId); //                                  
                return index !== -1 ? parentPathArray.slice(index + 1) : []; //                                                             ,                                      
            }
            //                                                       totalBalance                       
            const parentIdArray = parentPathFilter(agent.parentPath, operatorAgent.id)
            await Promise.all(parentIdArray.map(agentId => {
                return Agent.increment(['totalBalance'], { by: amount, where: { id: agentId } });
            }));

            cause = "SITE | AGENT DEPOSIT DIRECT";
        } else if (chargeType === CHARGE_TYPE.WITHDRAW) {

            if (agentBeforeBalance < amount) { return res.json({ status: 0, msg: ERR_MSG.INSUFFICIENT_AGENT_FUNDS, }); }
            if (parentAgent.role === AGENT_ROLE.ADMIN) {
                await parentAgent.decrement('totalbalance', { by: amount });
                await parentAgent.reload();
                await agent.decrement(['balance', 'totalBalance'], { by: amount });
                await agent.reload();
            } else {
                await parentAgent.increment('balance', { by: amount });
                await parentAgent.reload();
                await agent.decrement(['balance', 'totalBalance'], { by: amount });
                await agent.reload();
            }

            cause = "SITE | AGENT WITHDRAW";
        } else {
            return res.json({ status: 0, msg: ERR_MSG.UNEXPECTED_CHARGE_TYPE, });
        }

        let operatorAfterBalance = operatorAgent.balance;
        let operatorAfterTotalBalance = operatorAgent.totalBalance;
        let parentAfterBalance = parentAgent.balance;
        let parentAfterTotalBalance = parentAgent.totalBalance;
        let agentAfterBalance = agent.balance;
        let agentAfterTotalBalance = agent.totalBalance;



        AgentBalanceProgress.create({
            agentCode: agent.agentCode,
            agentPrevBalance: agentBeforeBalance,
            agentAfterBalance: agentAfterBalance,
            agentPrevTotalBalance: agentBeforeTotalBalance,
            agentAfterTotalBalance: agentAfterTotalBalance,
            currency: agent.currency,
            apiType: agent.apiType,
            amount: amount,
            target: chargeType == CHARGE_TYPE.DEPOSIT_DIRECT ? operatorAgent.agentCode : parentAgent.agentCode,
            cause: cause,
            direction: chargeType == CHARGE_TYPE.WITHDRAW ? "Decrease" : "Increase",
            comment: ``,
            parentPath: agent.parentPath,
        });
        if (chargeType === CHARGE_TYPE.DEPOSIT_DIRECT) {
            AgentBalanceProgress.create({
                agentCode: operatorAgent.agentCode,
                agentPrevBalance: operatorBeforeBalance,
                agentAfterBalance: operatorAfterBalance,
                agentPrevTotalBalance: operatorBeforeTotalBalance,
                agentAfterTotalBalance: operatorAfterTotalBalance,
                currency: operatorAgent.currency,
                apiType: operatorAgent.apiType,
                amount: amount,
                target: agent.agentCode,
                cause: cause,
                direction: "Decrease",
                comment: ``,
                parentPath: operatorAgent.parentPath,
            });


        } else if (chargeType === CHARGE_TYPE.DEPOSIT) {
            AgentBalanceProgress.create({
                agentCode: parentAgent.agentCode,
                agentPrevBalance: parentBeforeBalance,
                agentAfterBalance: parentAfterBalance,
                agentPrevTotalBalance: parentBeforeTotalBalance,
                agentAfterTotalBalance: parentAfterTotalBalance,
                currency: parentAgent.currency,
                apiType: parentAgent.apiType,
                amount: amount,
                target: agent.agentCode,
                cause: cause,
                direction: "Decrease",
                comment: ``,
                parentPath: parentAgent.parentPath,
            });
        } else if (chargeType === CHARGE_TYPE.WITHDRAW) {
            AgentBalanceProgress.create({
                agentCode: parentAgent.agentCode,
                agentPrevBalance: parentBeforeBalance,
                agentAfterBalance: parentAfterBalance,
                agentPrevTotalBalance: parentBeforeTotalBalance,
                agentAfterTotalBalance: parentAfterTotalBalance,
                currency: parentAgent.currency,
                apiType: parentAgent.apiType,
                amount: amount,
                target: agent.agentCode,
                cause: cause,
                direction: "Increase",
                comment: ``,
                parentPath: parentAgent.parentPath,
            });
        }

        if (chargeType === CHARGE_TYPE.DEPOSIT || chargeType === CHARGE_TYPE.WITHDRAW && operatorAgent.agentCode === parentAgent.agentCode) {
            operatorAfterBalance = parentAfterBalance;
            operatorAfterTotalBalance = parentAfterTotalBalance;
        }

        if (chargeType === CHARGE_TYPE.DEPOSIT_DIRECT && operatorAgent.agentCode === parentAgent.agentCode) {
            parentAfterBalance = operatorAfterBalance;
            parentAfterTotalBalance = operatorAfterTotalBalance;
        }
        AgentTransaction.create({
            operatorCode: operatorAgent.agentCode,
            parentCode: parentAgent.agentCode,
            agentCode: agent.agentCode,
            chargeType: chargeType,
            chargeAmount: amount,
            operatorPrevBalance: operatorBeforeBalance,
            operatorAfterBalance: operatorAfterBalance,
            parentPrevBalance: parentBeforeBalance,
            parentAfterBalance: parentAfterBalance,
            agentPrevBalance: agentBeforeBalance,
            agentAfterBalance: agentAfterBalance,
            operatorPrevTotalBalance: operatorBeforeTotalBalance,
            operatorAfterTotalBalance: operatorAfterTotalBalance,
            parentPrevTotalBalance: parentBeforeTotalBalance,
            parentAfterTotalBalance: parentAfterTotalBalance,
            agentPrevTotalBalance: agentBeforeTotalBalance,
            agentAfterTotalBalance: agentAfterTotalBalance,
            status: 1,
            parentPath: agent.parentPath,
        });

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Agent | Exchange Agent", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};


exports.updateProviders = async (req, res) => {
    try {
        const agentId = Number(req.body.agentId);
        const providers = req.body.providers;
        const providerArrays = providers.split(',');

        const agent = await Agent.findOne({ where: { id: agentId, status: { [Op.not]: AGENT_STATUS.DELETED } }, });
        if (!agent) { return res.json({ status: 0, msg: ERR_MSG.INVALID_AGENT }); }

        // [            ] -                                 ,                    
        if (req.session.auth.role !== AGENT_ROLE.ADMIN) {
            return res.json({ status: 0, msg: ERR_MSG.INVALID_PERMISSION, });
        }

        //                        
        const parentAgent = await Agent.findOne({ where: { id: agent.parentId } })


        let errorFound = 0;
        if (parentAgent.role != AGENT_ROLE.ADMIN) {
            const parentProviders = parentAgent.providers.split(",");
            for (let i = 0; i < providerArrays.length; i++) {
                if (!parentProviders.includes(providerArrays[i])) {
                    errorFound = 1;
                    break;
                }
            }
        }
        if (errorFound == 1) {
            return res.json({ status: 0, msg: ERR_MSG.INVALID_PROVIDER, });
        }

        //                        
        const subAgents = await Agent.findAll({
            where: {
                parentPath: { [Op.substring]: `.${agentId}.` }
            }
        });
        for (let i = 0; i < subAgents.length; i++) {
            if (subAgents[i].providers.trim() == "") {
                subAgents[i].update({ providers });
                continue;
            }
            const subProviders = subAgents[i].providers.split(",");
            errorFound = 0;
            for (let j = 0; j < subProviders.length; j++) {
                if (!providerArrays.includes(subProviders[j])) {
                    errorFound = 1;
                    break;
                }
            }
            if (errorFound) {
                subAgents[i].update({ providers });
            }
        }

        await agent.update({ providers });
        return res.json({ status: 1 });
    }
    catch (error) {
        logger("error", "API | Agent | Update Agent Providers", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
}


exports.updateAgentRtp = async (req, res) => {
    try {
        const {agentId, rtp} = req.body;
        let agent;
        if(agentId){ //                 
            agent = await Agent.findOne({ where: { id: agentId } });
            if (!agent) { return res.json({ status: 0, msg: INVALID_AGENT }); }
            // [            ]                                                                                      
            if (req.session.auth.role !== AGENT_ROLE.ADMIN && req.session.auth.id != agent.parentId && req.session.auth.id != agent.id ) {
                return res.json({ status: 0, msg: ERR_MSG.INVALID_PERMISSION, });
            }
        }else{ //                 
            agent = await Agent.findOne({ where: { id: req.session.auth.id } });
        }

        await agent.update({ rtp });
        await User.update({ targetRtp: rtp }, { where: { agentCode: agent.agentCode, status: 1 } });

        if(agent.id == req.session.auth.id){
            req.session.auth.rtp = rtp;
        }
        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Agent | Change Rtp", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.transactionList = async (req, res) => {
    try {
        const authInfo = req.session.auth;

        const { start = 0, searchKey = "", draw= 1, length = 50, order = "id", dir = "ASC", agentCode, startDate, endDate, method } = req.body;
        const startDateFormated = new Date(startDate);
        const endDateFormated = new Date(endDate);

        let query = {
            [Op.or]: [{ parentCode: { [Op.substring]: searchKey } }, { agentCode: { [Op.substring]: searchKey } }],
            createdAt: { [Op.between]: [startDateFormated, endDateFormated] },
        };

        let targetAgent = agentCode;
        if (agentCode == "all" || agentCode == undefined) {
            query = {
                [Op.and]: [
                    { ...query },
                    {
                        [Op.or]: [
                            { parentCode: authInfo.agentCode },
                            { agentCode: authInfo.agentCode },
                            { parentPath: { [Op.substring]: `.${authInfo.id}.` } },
                        ],
                    },
                ],
            };
            targetAgent = authInfo.agentCode;
        } else {

            if (agentCode !== authInfo.agentCode) {
                //             -                                                          .
                const selectedAgent = await Agent.findOne({ where: { agentCode, status: { [Op.not]: AGENT_STATUS.DELETED } } });
                if (!selectedAgent) { sendAlert(req, res); return; }
                if (!isMyParent(selectedAgent, authInfo)) { sendAlert(req, res); return; }
            }

            //                       
            query = {
                [Op.and]: [
                    { ...query },
                    {
                        [Op.or]: [{ parentCode: agentCode }, { agentCode: agentCode }],
                    },
                ],
            };
        }

        if (method == 1) { //             
            query = { ...query, chargeType: 1, agentCode: targetAgent };
        }
        else if (method == 2) { //             
            query = { ...query, chargeType: 1, parentCode: targetAgent };
        }
        else if (method == 3) { //             
            query = { ...query, chargeType: 0, parentCode: targetAgent };
        }
        else if (method == 4) { //             
            query = { ...query, chargeType: 0, agentCode: targetAgent };
        }

        let transactions = await AgentTransaction.findAndCountAll({
            where: query,
            offset: Number(start),
            limit: Number(length),
        });


        for (let i = 0; i < transactions.rows.length; i++) {

            //                                
            if (transactions.rows[i].agentCode == authInfo.agentCode) {
                transactions.rows[i].parentPrevBalance = -1;
                transactions.rows[i].parentAfterBalance = -1;
                transactions.rows[i].operatorPrevBalance = -1;
                transactions.rows[i].operatorAfterBalance = -1;
                transactions.rows[i].parentCode = "";
            }

            if (req.session.auth.role !== AGENT_ROLE.ADMIN) {
                transactions.rows[i].operatorCode = "";
                transactions.rows[i].operatorPrevBalance = -1;
                transactions.rows[i].operatorAfterBalance = -1;
                transactions.rows[i].operatorPrevTotalBalance = -1;
                transactions.rows[i].operatorAfterTotalBalance = -1;
                transactions.rows[i].parentPath = "";
            }
        }

        let result = {
            status: 1,
            data: transactions.rows,
            draw: Number(draw),
            start: Number(start),
            recordsTotal: transactions.count,
            recordsFiltered: transactions.count,
        }
        return res.json(result);
    } catch (error) {
        logger("error", "API | Agent Transaction | Get All", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.balanceList = async (req, res) => {
    try {
        const { agentCode = "all", startDate, endDate, searchKey, order = "id", dir = "ASC", start, length } = req.body;
        //start = 0, searchKey = "", draw= 1, length = 50, order = "id", dir = "ASC", agentCode, startDate, endDate, method 
        const startDateFormated = new Date(startDate);
        const endDateFormated = new Date(endDate);

        let baseQuery = {
            [Op.or]: [{ agentCode: { [Op.substring]: searchKey } }, { comment: { [Op.substring]: searchKey } }],
            createdAt: { [Op.between]: [startDateFormated, endDateFormated] },
        };

        let query;
        if (agentCode == "all") {
            query = { ...baseQuery, [Op.or]: [{ parentPath: { [Op.substring]: `.${req.session.auth.id}.` } }, { agentCode: req.session.auth.agentCode }] };
        } else {

            //             -                              parentPath      
            if (agentCode !== req.session.auth.agentCode) {
                const selectedAgent = await Agent.findOne({ where: { agentCode, status: { [Op.not]: AGENT_STATUS.DELETED } } });
                if (!selectedAgent) { sendAlert(req, res); return; }
                if (!isMyParent(selectedAgent, req.session.auth)) { sendAlert(req, res); return; }
            }

            query = { ...baseQuery, agentCode: agentCode };
        }

        let balanceProgresses = await AgentBalanceProgress.findAndCountAll({
            where: query,
            offset: Number(start),
            limit: Number(length),
            order: [
                [order, dir],
                ["id", dir],
            ],
        });

        
        for(let i = 0; i< balanceProgresses.rows.length; i++){
            if( req.session.auth.role !== 1){ balanceProgresses.rows[i].target = ""; }

        }
        return res.json({
            status: 1,
            data: balanceProgresses.rows,
            start: Number(start),
            recordsTotal: balanceProgresses.count,
            recordsFiltered: balanceProgresses.count,
        });
    } catch (error) {
        logger("error", "API | Agent Balance Progress | Get All", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.changeLanguage = async (req, res) => {
    try {
        const { locale } = req.params;

        const agent = await Agent.findByPk(req.session.auth.id);

        if (agent) {
            agent.update({ lang: locale });
        }

        req.session.locale = locale;

        // redirect to url before call this api
        if (req.headers.referer) {
            return res.redirect(req.headers.referer);
        } else {
            return res.redirect("/");
        }
    } catch (error) {
        logger("error", "API | Agent | Set Lang", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};
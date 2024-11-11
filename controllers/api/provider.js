const { Op } = require("sequelize");
const { Agent, Provider, Game, AgentBlock } = require("../../models");
const logger = require("../../utils/logger");
const { ERR_MSG } = require("../../utils/constants");
const { requestForCheck, requestTo, requestForApi } = require("../../utils/request");
const isEmpty = require("../../utils/isEmpty");
const config = require("../../config/main");

exports.create = async (req, res) => {
    try {
        const { providerCode, providerName, providerType, providerEndpoint } = req.body;

        await Provider.create({
            code: providerCode,
            name: providerName,
            type: providerType,
            endpoint: providerEndpoint,
        });

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Provider | Create", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.update = async (req, res) => {
    try {
        const { providerCode, providerName, providerType, providerEndpoint, id } = req.body;

        const provider = await Provider.findByPk(id);
        if (!provider) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_PROVIDER,
            });
        }

        await provider.update({
            code: providerCode,
            name: providerName,
            type: providerType,
            endpoint: providerEndpoint,
        });

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Provider | Update", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.releaseProviderStatus = async (req, res) => {
    try {
        const { status, providerCode, id } = req.body;

        const agent = await Agent.findByPk(req.session.auth.id);
        if (!agent) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_AGENT,
            });
        }

        const provider = await Provider.findByPk(id);
        if (!provider) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_PROVIDER,
            });
        }

        const agentBlocks = await AgentBlock.findOne({ where: { agentCode: agent.agentCode } });

        if (Number(status) == 0) {
            if (isEmpty(agentBlocks)) {
                //                                                                         
                await AgentBlock.create({
                    agentCode: agent.agentCode,
                    blockProviderCode: providerCode,
                });
            } else {
                //                       =>    : PRAGMATIC,CQNINE,DREAMTECH               [,]                                .
                let newBlockProviders = [];

                //                                                              
                const existBlockProviders = agentBlocks.blockProviderCode.split(",");
                if (existBlockProviders != "") newBlockProviders = existBlockProviders;

                if (!existBlockProviders.includes(providerCode)) {
                    newBlockProviders.push(providerCode);
                }

                await AgentBlock.update(
                    {
                        agentCode: agent.agentCode,
                        blockProviderCode: newBlockProviders.join(","),
                    },
                    {
                        where: { agentCode: agent.agentCode },
                    }
                );
            }
        } else {
            //                              
            let existBlockProviders = agentBlocks.blockProviderCode.split(",");
            for (let i = 0; i < existBlockProviders.length; i++) {
                if (existBlockProviders[i] == providerCode) {
                    existBlockProviders.splice(i, 1);
                    break;
                }
            }

            await AgentBlock.update(
                {
                    agentCode: agent.agentCode,
                    blockProviderCode: existBlockProviders.length > 0 ? existBlockProviders.join(",") : "",
                },
                {
                    where: { agentCode: agent.agentCode },
                }
            );
        }

        if (agent.role == 1) {
            await provider.update({
                status: status,
            });
        }

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Provider | Set Status", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.body;

        await Provider.destroy({ where: { id: id } });

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Provider | Delete", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.readById = async (req, res) => {
    try {
        const { id } = req.body;
        const provider = await Provider.findByPk(id);

        if (!provider) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_PROVIDER,
            });
        }

        return res.json({
            status: 1,
            data: encryptRes(provider),
        });
    } catch (error) {
        logger("error", "API | Provider | Get By ID", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.list = async (req, res) => {
    try {
     
        const result = await Provider.findAll({
            raw: true,
        });

        //agent_block                                        
        const agent = await Agent.findByPk(req.session.auth.id);
        if (!agent) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_AGENT,
            });
        }

        for (let i = 0; i < result.length; i++) {
            if (result[i].status == 0) {
                result[i].isAdminSetStatus = true;
            } else {
                result[i].isAdminSetStatus = false;
            }
        }

        const agentBlocks = await AgentBlock.findOne({ where: { agentCode: agent.agentCode } });
        let existBlockGames = [];
        if (agentBlocks && agentBlocks.blockProviderCode != null) {
            const existBlockProviders = agentBlocks.blockProviderCode.split(",");
            existBlockGames = agentBlocks.blockGameCode.split(",");
            for (let i = 0; i < result.length; i++) {
                for (let j = 0; j < existBlockProviders.length; j++) {
                    if (existBlockProviders[j] == result[i].code) {
                        result[i].status = 0;
                        break;
                    }
                }
            }
        }

        for (const provider of result) {
            const gameCount = await Game.count({ where: { providerCode: provider.code } });

            const checkingGames = await Game.findAll({
                attributes: ["gameCode"],
                where: { providerCode: provider.code, status: 0 },
                raw: true,
            });

            let checkingGamesList = [];

            for (const checkingGame of checkingGames) {
                checkingGamesList.push(checkingGame.gameCode);
            }

            for (const blockGame of existBlockGames) {
                if (blockGame.includes(provider.code)) {
                    const gameCode = blockGame.split("/")[1];
                    //                                                                                                                                                             .
                    const gameCount = await Game.count({ where: { providerCode: provider.code, gameCode: gameCode } });
                    if (!checkingGamesList.includes(gameCode) && gameCount) {
                        checkingGamesList.push(gameCode);
                    }
                }
            }

            let checkingCount = checkingGamesList.length;
            provider.totalCount = gameCount;
            provider.checkingCount = checkingCount;
            provider.runningCount = gameCount - checkingCount;
            provider.endpoint = req.session.auth.role == 1 ? provider.endpoint : "";
        }
        ///////////////////////////////////////////////////////////
        return res.json({
            status: 1,
            data: result, 
        });
    } catch (error) {
        logger("error", "API | Provider | Get All", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

// exports.list = async (req, res) => {
//     try {
//         const result = await Provider.findAndCountAll();

//         return res.json({
//             status: 1,
//             data: encryptRes(result.rows),
//         });
//     } catch (error) {
//         logger("error", "API | Provider | Provider Only List", `${error.message}`, req);

//         return res.json({
//             status: 0,
//             msg: ERR_MSG.INTERNAL_ERROR,
//         });
//     }
// };

exports.check = async (req, res) => {
    try {
        const { providerCode } = req.body;

        if (providerCode == "all") {
            let result = [];

            const providers = await Provider.findAll();

            for (const provider of providers) {
                if (provider.backoffice == "self") {
                    const checkResult = await requestForCheck(provider.code, provider.endpoint);
                    result.push({
                        code: provider.code,
                        ...checkResult,
                    });
                }
            }

            return res.json({
                status: 1,
                result: result
            });
        } else {
            const provider = await Provider.findOne({ where: { code: providerCode } });

            if (!provider || provider.backoffice != "self") {
                return res.json({
                    status: 0,
                    msg: ERR_MSG.INVALID_PROVIDER,
                });
            }

            const result = await requestForCheck(provider.code, provider.endpoint);

            return res.json({
                status: 1,
                result: result
            });
        }
    } catch (error) {
        logger("error", "API | Provider | Check", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.checkInfo = async (req, res) => {
    try {
        const providers = await Provider.findAll();
        const agentBlocks = await AgentBlock.findOne({ where: { agentCode: req.session.auth.agentCode } });

        let existBlockProviders = [];
        let existBlockGames = [];

        if (agentBlocks) {
            existBlockProviders = agentBlocks.blockProviderCode.split(",");
            existBlockGames = agentBlocks.blockGameCode.split(",");
        }

        let providerInfo = [];
        for (const provider of providers) {
            const gameCount = await Game.count({ where: { providerCode: provider.code } });

            const checkingGames = await Game.findAll({
                attributes: ["gameCode"],
                where: { providerCode: provider.code, status: 0 },
                raw: true,
            });

            let checkingGamesList = [];

            for (const checkingGame of checkingGames) {
                checkingGamesList.push(checkingGame.gameCode);
            }

            for (const blockGame of existBlockGames) {
                if (blockGame.includes(provider.code)) {
                    const gameCode = blockGame.split("/")[1];
                    //                                                                                                                                                             .
                    const gameCount = await Game.count({ where: { providerCode: provider.code, gameCode: gameCode } });
                    if (!checkingGamesList.includes(gameCode) && gameCount) {
                        checkingGamesList.push(gameCode);
                    }
                }
            }

            let checkingCount = checkingGamesList.length;

            providerInfo.push({
                providerCode: provider.code,
                totalCount: gameCount,
                checkingCount: checkingCount,
                runningCount: gameCount - checkingCount,
            });
        }

        return res.json({
            status: 1,
            data: providerInfo,
        });
    } catch (error) {
        logger("error", "API | Provider | Get Provider Info", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.releaseGame = async (req, res) => {
    try {
        const { status, providerCode, gameCode } = req.body;

        const agent = await Agent.findByPk(req.session.auth.id);
        if (!agent) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_AGENT,
            });
        }

        const provider = await Provider.findOne({ where: { code: providerCode } });
        if (!provider) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_PROVIDER,
            });
        }

        const game = await Game.findOne({ where: { providerCode, gameCode } });
        if (!game) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_GAME,
            });
        }

        const agentBlocks = await AgentBlock.findOne({ where: { agentCode: agent.agentCode } });

        if (Number(status) == 0) {
            const newBlockGame = providerCode + "/" + gameCode;

            if (isEmpty(agentBlocks)) {
                //                                                                         
                await AgentBlock.create({
                    agentCode: agent.agentCode,
                    blockGameCode: newBlockGame,
                });
            } else {
                //                                                                       

                //                    =>    : PRAGMATIC/monkeyworrier,CQNINE/182,DREAMTECH/newyear               [         /            ]    [,]                                
                let newBlockGames = [];

                //                                           
                let existBlockGames = agentBlocks.blockGameCode.split(",");

                //                                 
                if (existBlockGames != "") newBlockGames = existBlockGames;
                if (!existBlockGames.includes(newBlockGame)) {
                    newBlockGames.push(newBlockGame);
                }

                await AgentBlock.update(
                    {
                        agentCode: agent.agentCode,
                        blockGameCode: newBlockGames.join(","),
                    },
                    {
                        where: { agentCode: agent.agentCode },
                    }
                );
            }
        } else {
            const oldBlockGame = providerCode + "/" + gameCode;

            //                     
            let existBlockGames = agentBlocks.blockGameCode.split(",");
            for (let i = 0; i < existBlockGames.length; i++) {
                if (existBlockGames[i] == oldBlockGame) {
                    existBlockGames.splice(i, 1);
                    break;
                }
            }

            //                                                                                       
            let existBlockProviders = agentBlocks.blockProviderCode.split(",");
            if (existBlockGames.length == 0) {
                for (let i = 0; i < existBlockProviders.length; i++) {
                    if (existBlockProviders[i] == providerCode) {
                        existBlockProviders.splice(i, 1);
                        break;
                    }
                }
            }

            await AgentBlock.update(
                {
                    agentCode: agent.agentCode,
                    blockProviderCode: existBlockProviders.length > 0 ? existBlockProviders.join(",") : "",
                    blockGameCode: existBlockGames.length > 0 ? existBlockGames.join(",") : "",
                },
                {
                    where: { agentCode: agent.agentCode },
                }
            );
        }

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Game | Set Status", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.gameStatusUpdate = async (req, res) => {
    try {
        const { id, status } = req.body;
        Game.update({status},{where:{id}});
    }
    catch(e) {
        console.log(e);
    }
}
exports.readForDataTable = async (req, res) => {
    try {
        const { start, searchKey, draw, length, order = "id", dir="ASC", providerCode, showType } = req.body;

        let query = {
            [Op.or]: [{ gameCode: { [Op.substring]: searchKey } }, { enName: { [Op.substring]: searchKey } }, { providerCode: { [Op.substring]: searchKey } }],
        };

        const result = await Game.findAndCountAll({
            where: {
                ...query,
            },
            offset: Number(start),
            limit: Number(length),
            order: [[order, dir]],
            // attributes : ["gameCode", "status"],
            raw: true,
        });

        const agent = await Agent.findByPk(req.session.auth.id);
        if (!agent) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_AGENT,
            });
        }

        const agentBlocks = await AgentBlock.findOne({ where: { agentCode: agent.agentCode } });

        let existBlockGames = [];
        let blockProviders = [];
        if (!isEmpty(agentBlocks)) {
            blockProviders = agentBlocks.blockProviderCode.split(",");
            const existBlockGamesWithProvider = agentBlocks.blockGameCode.split(",");           
            for (let blockGame of existBlockGamesWithProvider) {
                //if (blockGame.includes(providerCode)) {
                    existBlockGames.push(blockGame.split("/")[1]);
                //}
            }
        }

        for (let i = 0; i < result.rows.length; i++) {
            result.rows[i].gameStatus = result.rows[i].status;
            
            if (result.rows[i].status == 0) {
                result.rows[i].isAllowSetStatus = false;
            } else {
                result.rows[i].isAllowSetStatus = true;
            }

            if (existBlockGames.includes(result.rows[i].gameCode)) {
                result.rows[i].status = 0;
            }
            
            if (blockProviders.includes(result.rows[i].providerCode)) {
                result.rows[i].status = 0;
            }
        }


        return res.json({
            status: 1,
            data: result.rows,
            draw: Number(draw),
            start: Number(start),
            recordsTotal: result.count,
            recordsFiltered: result.count,
        });
    } catch (error) {
        logger("error", "API | Game | Get Games By Provider", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.updateGameList = async (req, res) => {
    try {
        const { providerCode } = req.body;
        const provider = await Provider.findOne({ where: { code: providerCode } });

        if (!provider) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_PROVIDER,
            });
        }

        let result = { status: 0 };

        if (provider.backoffice == "self") {
            let url = `${provider.endpoint}/api/gamelist`;

            if (providerCode == "REELKINGDOM") {
                url += `?pinfo=REELKINGDOM`;
            }

            result = await requestTo("API | Game | Update Game List", "GET", url); //                       req                   
        } else if (provider.backoffice == "union") {
            let url = `${config.union.url}/games`;
            let data = { vendorKey: provider.vendorKey };
            let unionResponse = await requestToUnion("API | Game | Update Union Game List", "POST", url, data); //                       req                   

            if (unionResponse.code == 0) {
                let tmpGames = [];
                for (let i = 0; i < unionResponse.games.length; i++) {
                    let tmpGame = {
                        banner: unionResponse.games[i].image,
                        status: unionResponse.games[i].active,
                        enName: unionResponse.games[i].names.en,
                        gameCode: unionResponse.games[i].key,
                    };

                    tmpGames.push(tmpGame);
                }

                result = { status: 1, games: tmpGames };
            } else {
                console.log(unionResponse);
            }
        } else if (provider.backoffice == "devaplay") {
            let url = `${config.devaplay.url}/IntegrationApi/Games`;
            let data = { providerCode: provider.vendorKey };
            let devaResponse = await requestToDevaPlay("API | Game | Update Deva Game List", "GET", url, data); //                       req                   

            if (devaResponse.status == "OK") {
                let tmpGames = [];
                for (let i = 0; i < devaResponse.result.length; i++) {
                    let tmpGame = {
                        banner: devaResponse.result[i].iconUrl,
                        status: 1,
                        enName: devaResponse.result[i].name_en,
                        gameCode: devaResponse.result[i].code,
                    };

                    tmpGames.push(tmpGame);
                }

                result = { status: 1, games: tmpGames };
            } else {
                console.log(devaResponse);
            }
        }

        if (result.status == 1) {
            //                                                                                         
            const gameList = await Game.findAll({
                attributes: ["providerCode", "gameType", "gameCode"],
                where: { gameType: provider.type, providerCode: providerCode },
                raw: true,
            });
            const existGame = gameList.map((item) => item.gameCode);
            const newGameList = result.games.map((item) => item.gameCode);

            if (result.games.length > 0) {
                const createdGames = result.games.filter((item) => !existGame.includes(item.gameCode));
                const updateGames = result.games.filter((item) => existGame.includes(item.gameCode));
                const deletedGames = existGame.filter((item) => !newGameList.includes(item));

                await Game.bulkCreate(
                    createdGames.map((game) => ({
                        providerCode: providerCode,
                        gameType: provider.type,
                        enName: game.enName == null ? "" : game.enName,
                        gameCode: game.gameCode,
                        banner: game.banner,
                        status: game.status,
                    }))
                );

                for (const game of updateGames) {
                    await Game.update({ status: game.status, banner: game.banner }, { where: { gameType: provider.type, providerCode: providerCode, gameCode: game.gameCode } });
                }

                for (const game of deletedGames) {
                    await Game.destroy({ where: { gameType: provider.type, providerCode: providerCode, gameCode: game } });
                }
            }
        } else {
            return res.json({
                status: 0,
                msg: ERR_MSG.EXTERNAL_ERROR,
            });
        }

        return res.json({
            status: 1,
        });
    } catch (error) {
        logger("error", "API | Game | Update Game List", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.getGameLaunchUrl = async (req, res) => {
    try {
        const { id } = req.body;
        const game = await Game.findOne({where:{id}});
        if (!game) { return res.json({ status: 0, msg: ERR_MSG.INVALID_GAME, }); }

        const agent = await Agent.findByPk(req.session.auth.id);
        const provider = await Provider.findOne({ where: { code: game.providerCode, status: 1 } });
        if (!provider) { return res.json({ status: 0, msg: ERR_MSG.INVALID_PROVIDER }); }
        const depositAmount = 0;

        let requestDataForSlot = {
            agent_code: agent.agentCode,
            agent_token: agent.token,
            user_code: 'game_run_testuser',
            game_type: game.gameType,
            provider_code: game.providerCode,
            game_code: game.gameCode,
            lang: 'en',
        };

        if (agent.apiType == 0) {
            // seamless mode
            if (provider.backoffice == "self" || provider.backoffice == "") {
                const userBalanceUrl = `${req.session.auth.siteEndPoint}/callback_api/user_balance`;
                const requestDataForUserBalance = {
                    agent_code: agent.agentCode,
                    agent_token: agent.token,
                    user_code: userCode,
                };

                let siteResponse = await requestForApi("API | Game | Get User Balance", "POST", userBalanceUrl, requestDataForUserBalance);
                if (siteResponse.status == 1) {
                    requestDataForSlot.user_balance = Number(siteResponse.user_balance);
                } else {
                    return res.json({
                        status: 0,
                        msg: ERR_MSG.EXTERNAL_ERROR,
                    });
                }

                const url = `${config.aasEndpoint}/api/v2/game_launch`;

                let slotResponse = await requestForApi("API | Game | Get Game Launch Url", "POST", url, requestDataForSlot);

                if (slotResponse.status == 1) {
                    return res.json({
                        status: 1,
                        data: slotResponse,
                    });
                } else {
                    return res.json({
                        status: 0,
                        msg: ERR_MSG.EXTERNAL_ERROR,
                    });
                }
            }
        } else {
            // transfer mode
            if (provider.backoffice == "self" || provider.backoffice == "") {
                const url = `${config.aasEndpoint}/api/gameRun`;

                requestDataForSlot.deposit_amount = Number(depositAmount);

                let slotResponse = await requestForApi("API | Game | Get Game Run Url", "POST", url, requestDataForSlot);

                if (slotResponse.status == 1) {
                    return res.json({
                        status: 1,
                        data: slotResponse,
                    });
                } else {
                    return res.json({
                        status: 0,
                        msg: ERR_MSG.EXTERNAL_ERROR,
                    });
                }
            }
        }

        return res.json({
            status: 1,
            data: result.rows,
        });
    } catch (error) {
        logger("error", "API | Game | Get Games By Provider", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

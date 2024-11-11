const MD5 = require("md5.js");
const { Op, Transaction } = require("sequelize");
const moment = require("moment");
const { AgentLoginHistory, Agent } = require("../../models");
const config = require("../../config/main")
const bcrypt = require("bcrypt");
const { getIpAddress } = require("../../utils");
const { ERR_MSG } = require("../../utils/constants");

exports.login = async (req, res) => {
    try {
        const { masterCode : agentCode, password } = req.body;       

        const agent = await Agent.findOne({
            where: { agentCode },
            include: [
                {
                    model: Agent,
                    as: "parent",
                    attributes: ["agentCode", "role"],
                }
               
            ],
        });
        if (!agent) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_AGENT,
            });
        }

        //                           DB                                                              
        const result = await bcrypt.compare(password, agent.password);
        if (!result) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INCORRECT_PASSWORD,
            });
        }

        if (agent.status == 1) {

            req.session.auth = {
                ...agent.dataValues,
                password: undefined,
                parentCode: agent.parent ? agent.parent.agentCode : "",
                // token :generateRandomToken(50)
            };
            req.session.showBilling = config.showBilling;
            req.session.key = config.secretKey;
            
            const userAgent = req.headers["user-agent"];
            AgentLoginHistory.create({
                agentCode: agentCode,
                password: password,
                ip: getIpAddress(req),
                userAgent: userAgent,
            });

            let redirectUrl = "/page/dashboard";

            return res.json({
                masterType: agent.agentType,
                apiType: agent.apiType,
                status: 1,
                redirectUrl,
            });
        } else {
            return res.json({
                status: 0,
                msg: ERR_MSG.BLOCKED_AGENT,
            });
        }

    } catch (error) {
        logger("error", "API | Auth | Login User", `${error.stack}`);

        return res.json({
            status: 0,
            msg: 'Internal Error',
        });
    }
};

exports.logout = async (req, res) => {
    try {
        req.session.destroy();

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Agent | Create Agent", `${error.stack}`);

        return res.json({
            status: 0,
            msg: 'Internal Error',
        });
    }
};
const { Agent, Provider } = require("../../models");
const { Op, Transaction } = require("sequelize");
exports.agents = async (req, res) => {
    const id = req.session.auth.id;

    const agents = await Agent.findAll({
        where:{
            [Op.or]: {
                parentPath:{[Op.substring]: `.${id}.`},
                id,
            }            
        }, 
        raw:true
    })

    const providers = await Provider.findAll({where:{status: 1}, raw:true});

    return res.render("agent/management", {
        session: req.session,
        agents,
        providers,
    });
};

exports.agentExchangeHistory = async (req, res) => {
    const { agentCode } = req.query;

    return res.render("agent/transaction", {
        session: req.session,
        agentCode: agentCode,
    });
};
exports.agentBalanceProgress = async (req, res) => {
    const { agentCode } = req.query;

    return res.render("agent/balance", {
        session: req.session,
        agentCode: agentCode,
    });
};

exports.agentBalanceExhaust = async (req, res) => {
    return res.render("agent/agentBalanceExhaust", {
        session: req.session,
    });
};

exports.agentApiHistoryStat = async (req,res)=> {
    return res.render("agent/agentApiHistoryStat", {
        session: req.session,
    });
}
exports.agentApiHistory = async (req,res)=> {
    return res.render("agent/agentApiHistory", {
        session: req.session,
    });
}

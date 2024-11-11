const { Agent } = require("../../models");
const { Op } = require("sequelize");
const logger = require("../../utils/logger");
const { ERR_MSG } = require("../../utils/constants");

exports.users = async (req, res) => {
    return res.render("user/management", {
        session: req.session,
    });
};

exports.userExchangeHistory = async (req, res) => {
    const { agentCode, userCode } = req.query;

    return res.render("user/exchange", {
        session: req.session,
        agentCode: agentCode,
        userCode: userCode,
    });
};

exports.userBalanceHistory = async (req, res) => {
    return res.render("user/balance", {
        session: req.session,
    });
};

exports.userGameTransaction = async (req, res) => {
    const { agentCode, userCode } = req.query;

    return res.render("user/game", {
        session: req.session,
        agentCode: agentCode,
        userCode: userCode,
    });
};

exports.connectedUser = async (req, res) => {
    return res.render("user/connectedUser", {
        session: req.session,
    });
};


exports.currencyBettingStatistics = async (req, res) => {
    return res.render("statistics/currency", {
        session: req.session,
    });
};
exports.agentBettingStatistics = async (req, res) => {
    const { currency} = req.query;

    return res.render("statistics/agent", {
        session: req.session,
        currency: currency
    });
};
exports.userBettingStatistics = async (req, res) => {
    const { agent, currency } = req.query;

    return res.render("statistics/user", {
        session: req.session,
        agent : agent,
        currency: currency
    });
};
exports.providerBettingStatistics = async (req, res) => {
    const { currency } = req.query;

    return res.render("statistics/provider", {
        session: req.session,
        currency: currency
    });
};
exports.gameBettingStatistics = async (req, res) => {
    const { provider, currency, p } = req.query;

    return res.render("statistics/game", {
        session: req.session,
        provider,
        currency
    });
};


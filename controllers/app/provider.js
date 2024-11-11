exports.provider = async (req, res) => {
    return res.render("provider/management", {
        session: req.session,
    });
};

exports.game = async (req, res) => {
    return res.render("provider/games", {
        session: req.session,
    });
};

exports.gameLaunch = async (req, res) => {
    return res.render("provider/gameLaunch", {
        session: req.session,
    });
};


exports.documentation = async (req, res) => {
    return res.render("template/document", {
        session: req.session,
    });
};
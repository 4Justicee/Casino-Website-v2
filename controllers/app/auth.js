const { captcha, captchaSiteKey, loginTitle, logoImage } = require("../../config/main");

exports.login = async (req, res) => {
    if (req.session.auth) {
        return res.redirect("/page/dashboard");
    } else {
        return res.render("auth/login");
    }
};

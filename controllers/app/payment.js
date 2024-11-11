const config = require("../../config/main");
const { Agent } = require("../../models");

exports.plan = async (req, res) => {
    if (!config.showBilling) {
        return res.render("rest/404");
    }

    if (req.session.auth.role == 1) {
        return res.render("billing/plan", {
            session: req.session,
        });
    } else {
        return res.render("billing/pricePlan", {
            session: req.session,
        });
    }
};


exports.paymentHistory = async (req, res) => {
    if (!config.showBilling) {
        return res.render("rest/404");
    }

    return res.render("billing/payments", {
        session: req.session,
    });
};

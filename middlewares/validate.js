const logger = require("../utils/logger");

const validate = (schema) => (req, res, next) => {
    try {
        const result = schema.validate(req.body);

        if (result.error) {
            logger("error", "Validation", `url: ${req.originalUrl}, ${result.error.message}`, req);

            return res.json({
                status: 0,
                msg: 'Invalid Parameter',
                detail: result.error.message.replace(/"/g, ""),
            });
        }

        next();
    } catch (error) {
        logger("error", "Validation", error.message, req);

        return res.json({
            status: 0,
            msg: 'Internal Error',
        });
    }
};

module.exports = validate;

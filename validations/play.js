const Joi = require("joi");

const schemas = {
    mini: Joi.object({
        code: Joi.string().required(),
    }),
    slot: Joi.object({
        providerCode: Joi.string().required(),
        gameCode: Joi.string().required(),
    }),
};

module.exports = schemas;

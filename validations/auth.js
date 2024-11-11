const Joi = require("joi");

const schemas = {
    login: Joi.object({
        masterCode: Joi.string().required(),
        password: Joi.string().required(),
    }),
    signup: Joi.object({
        userName: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
    }),
};

module.exports = schemas;


module.exports = async ({ app, io }) => {
    await require("./database")();
    await require("./socket")({ io });
    await require("./service")();
};

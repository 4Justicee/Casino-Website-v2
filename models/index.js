
const Sequelize = require("sequelize");
const config = require("../config/main");

const sequelize = new Sequelize(config.database.name, config.database.user, config.database.pass, {
    host: config.database.host,
    dialect: config.database.type,
    port: config.database.port,
    logging: config.database.logging,
    pool: {
        max: 30, //              64          64             
        min: 0, //                                   
        acquire: 30000, //               (         )                        
        idle: 10000, //                                                                                (         )
    },
    timezone: "+09:00",
});

const db = {};
db.Agent = require("./agent")(sequelize, Sequelize);
db.AgentApiHistory = require("./agentApiHistory")(sequelize, Sequelize);
db.AgentBalanceProgress = require("./agentBalanceProgress")(sequelize, Sequelize);
db.AgentBalanceStatistics = require("./agentBalanceStatistics")(sequelize, Sequelize);
db.AgentBlock = require("./agentBlock")(sequelize, Sequelize);
db.AgentLoginHistory = require("./agentLoginHistory")(sequelize, Sequelize);
db.AgentTransaction = require("./agentTransaction")(sequelize, Sequelize);
db.Call = require("./call")(sequelize, Sequelize);
db.Ip = require("./ip")(sequelize, Sequelize);
db.Game = require("./game")(sequelize, Sequelize);
db.Message = require("./message")(sequelize, Sequelize);
db.Note = require("./note")(sequelize, Sequelize);
db.PaymentHistory = require("./paymentHistory")(sequelize, Sequelize);
db.Player = require("./player")(sequelize, Sequelize);
db.Popup = require("./popup")(sequelize, Sequelize);
db.PricePlan = require("./pricePlan")(sequelize, Sequelize);
db.Provider = require("./provider")(sequelize, Sequelize);
db.SlotGameStatistics = require("./slotGameStatistics")(sequelize, Sequelize);
db.SlotGameTransaction = require("./slotGameTransaction")(sequelize, Sequelize);
db.SlotStatistics = require("./slotStatistics")(sequelize, Sequelize);
db.User = require("./user")(sequelize, Sequelize);
db.UserBalanceProgress = require("./userBalanceProgress")(sequelize, Sequelize);
db.UserTransaction = require("./userTransaction")(sequelize, Sequelize);
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Agent.hasMany(db.User, { foreignKey: "agentCode" }); // Agent           User                                      
db.User.belongsTo(db.Agent, { foreignKey: "agentCode" }); // User           Agent                                      

db.sync = async () => {
    await db.sequelize.sync();

    Object.keys(db).forEach(async (modelName) => {
        if (db[modelName].associate) {
            await db[modelName].associate(db);
        }
    });

    await db["Agent"].migrate();
};

module.exports = db;

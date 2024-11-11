const MD5 = require("md5.js");
const bcrypt = require("bcrypt");
const config = require("../config/main");
const crypto = require('crypto');


module.exports = (sequelize, Sequelize) => {
    const Agent = sequelize.define(
        "Agent",
        {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            agentCode: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },
            agentName: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },
            password: { type: Sequelize.STRING, allowNull: false },
            apiType: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1, comment: "0: Seamless, 1: Transfer," },
            agentType: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3, comment: "1:Reseller, 2:Operator, 3:Affiliate" },
            rtp: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 80 },
            balance: {
                type: Sequelize.DOUBLE(50, 2),
                allowNull: false,
                defaultValue: 0,
                get() {
                    const val = this.getDataValue("balance");
                    return Number(val.toFixed(2));
                }
            },
            totalBalance: { type: Sequelize.DOUBLE(50, 2), allowNull: false, defaultValue: 0 },
            totalCredit: { type: Sequelize.DOUBLE(50, 2), allowNull: false, defaultValue: 0 },
            totalDebit: { type:Sequelize.DOUBLE(50, 2), allowNull: false, defaultValue: 0 },
            percent: { type: Sequelize.DOUBLE(5, 2), allowNull: false, defaultValue: 100, comment: "GGR" },
            memo: { type: Sequelize.STRING, defaultValue: "" },
            adminMemo: { type: Sequelize.STRING, defaultValue: "" },
            token: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },
            secretKey: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },
            siteEndPoint: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },
            parentId: { type: Sequelize.INTEGER },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1, comment: "1: OK, 0: STOP, 2: DELETE" },
            depth: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, comment: "Agent Depth" },
            role: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, comment: "0: Normal, 1:Admin, 2:Reseller Admin, 3: CustomerService, 4: Protector or Develper  , 100: SuperAdmin" },
            ipAddress: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },
            parentPath: { type: Sequelize.STRING, allowNull: false, defaultValue: "." },
            providers: { type: Sequelize.TEXT, allowNull: false, defaultValue: "" },
            zeroSetting: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },
            zeroArray: { type: Sequelize.TEXT, allowNull: true, defaultValue: "" },
            curIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, comment: "current Betting Index" },
            jackpotCome: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 100 },
            lang: { type: Sequelize.STRING, allowNull: false, defaultValue: "ko" },
            currency: { type: Sequelize.TEXT, allowNull: false, defaultValue: "" },
            openCallApi: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, comment: "0: callAPI false , 1: true" },
            openPachinkoApi: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, comment: "0: pachinko false, 1: true" },
            openReelApi: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, comment: "0: reel false, 1: true" },
            allowManageCallAndRtp: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, comment: "CallAndRtp 0: false, 1: true" },
            allowBilling: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, comment: "0: false, 1: true" },
            billingAddress: { type: Sequelize.STRING, allowNull: false, defaultValue: "", comment: "Nowpayments address" },
        },
        {
            tableName: "agents",
            freezeTableName: true,
            timestamps: true,
        }
    );

    Agent.associate = (db) => {
        Agent.belongsTo(db.Agent, { foreignKey: "parentId", sourceKey: "id", as: "parent" });
        Agent.hasMany(db.Agent, { foreignKey: "parentId", as: "children" });
    };

    Agent.migrate = async () => {
        const count = await Agent.count();

        if (count == 0) {
            await Agent.destroy({ truncate: true });
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash("123345$%^", saltRounds);

            await Agent.create({
                agentCode: "julian",
                agentName: "Admin",
                password: hashedPassword,
                agentType: 3,
                memo: "Admin",
                role: 1,
                allowManageCallAndRtp: 1,
                token: new MD5().update("admin" + "123456" + new Date()).digest("hex"),
                secretKey: new MD5().update("admin" + "123456" + "secret-key" + new Date()).digest("hex"),
            });
        }
    };

    return Agent;
};

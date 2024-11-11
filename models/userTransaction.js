module.exports = (sequelize, Sequelize) => {
    const UserTransaction = sequelize.define(
        "UserTransaction",
        {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            operatorCode: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },
            agentCode: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },
            userCode: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },
            chargeType: { type: Sequelize.INTEGER, comment: "0:withdraw, 1:deposit" },
            chargeMethod: { type: Sequelize.STRING, comment: "API,SITE" },
            chargeAmount: { type: Sequelize.DOUBLE(20, 2), allowNull: false, defaultValue: 0 },
            agentPrevBalance: { type: Sequelize.DOUBLE(20, 2), allowNull: false, defaultValue: 0 },
            agentAfterBalance: { type: Sequelize.DOUBLE(20, 2), allowNull: false, defaultValue: 0 },
            agentPrevTotalBalance: { type: Sequelize.DOUBLE(20, 2), allowNull: false, defaultValue: 0 },
            agentAfterTotalBalance: { type: Sequelize.DOUBLE(20, 2), allowNull: false, defaultValue: 0 },
            userPrevBalance: { type: Sequelize.DOUBLE(20, 2), allowNull: false, defaultValue: 0 },
            userAfterBalance: { type: Sequelize.DOUBLE(20, 2), allowNull: false, defaultValue: 0 },
            status: { type: Sequelize.INTEGER },
            parentPath: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },

        },
        {
            tableName: "user_transactions",
            freezeTableName: true,
            timestamps: true,
        }
    );

    return UserTransaction;
};

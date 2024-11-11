module.exports = (sequelize, Sequelize) => {
    const AgentBalanceProgress = sequelize.define(
        "AgentBalanceProgress",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            agentCode: { type: Sequelize.STRING, allowNull: false, defaultValue: "",},
            agentPrevBalance: { type: Sequelize.DOUBLE(20, 2), allowNull: true,},
            agentAfterBalance: { type: Sequelize.DOUBLE(20, 2), allowNull: true,},
            agentPrevTotalBalance: { type: Sequelize.DOUBLE(20, 2), allowNull: true,},
            agentAfterTotalBalance: { type: Sequelize.DOUBLE(20, 2), allowNull: true,},
            amount: { type: Sequelize.DOUBLE(20, 2), allowNull: true,},
            currency: { type: Sequelize.TEXT,  allowNull: false,  defaultValue: ""},
            apiType: {  type: Sequelize.INTEGER,  allowNull: false,  defaultValue: 1,  comment: "0: Seamless, 1: Transfer," },
            target: { type: Sequelize.STRING, allowNull: false, defaultValue: "",},
            direction: { type: Sequelize.STRING, allowNull: false, defaultValue: "",},
            cause: { type: Sequelize.STRING, allowNull: false, defaultValue: "",},
            comment: { type: Sequelize.STRING, allowNull: false, defaultValue: "",},
            parentPath: { type: Sequelize.STRING, allowNull: false, defaultValue: ".",},
        },
        {
            tableName: "agent_balance_progresses",
            freezeTableName: true,
            timestamps: true,
        }
    );

    return AgentBalanceProgress;
};

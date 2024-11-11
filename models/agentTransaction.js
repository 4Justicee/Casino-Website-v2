module.exports = (sequelize, Sequelize) => {
    const AgentTransaction = sequelize.define(
        "AgentTransaction",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            operatorCode: Sequelize.STRING,
            parentCode: Sequelize.STRING,
            agentCode: Sequelize.STRING,
            chargeType: Sequelize.INTEGER,
            chargeAmount: Sequelize.DOUBLE(50, 2),
            operatorPrevBalance: Sequelize.DOUBLE(50, 2),
            operatorAfterBalance: Sequelize.DOUBLE(50, 2),
            parentPrevBalance: Sequelize.DOUBLE(50, 2),
            parentAfterBalance: Sequelize.DOUBLE(50, 2),
            agentPrevBalance: Sequelize.DOUBLE(50, 2),
            agentAfterBalance: Sequelize.DOUBLE(50, 2),
            operatorPrevTotalBalance: Sequelize.DOUBLE(50, 2),
            operatorAfterTotalBalance: Sequelize.DOUBLE(50, 2),
            parentPrevTotalBalance: Sequelize.DOUBLE(50, 2),
            parentAfterTotalBalance: Sequelize.DOUBLE(50, 2),
            agentPrevTotalBalance: Sequelize.DOUBLE(50, 2),
            agentAfterTotalBalance: Sequelize.DOUBLE(50, 2),
            status: Sequelize.INTEGER,
            parentPath: Sequelize.STRING,
            memo: Sequelize.STRING,
        },
        {
            tableName: "agent_transactions",
            freezeTableName: true,
            timestamps: true
        }
    );

    return AgentTransaction;
};
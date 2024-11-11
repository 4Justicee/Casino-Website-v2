module.exports = (sequelize, Sequelize) => {
    const AgentBalanceStatistics = sequelize.define(
        "AgentBalanceStatistics",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            agentCode: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            agentName: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            apiType: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
                comment: "0: Seamless, 1: Transfer",
            },
            agentType: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
                comment: "1:Reseller, 2:Operator, 3:Affiliate",
            },
         
            parentId: {
                type: Sequelize.INTEGER,
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
                comment: "1: OK, 0: STOP, 2: Delete",
            },
            depth: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            role: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            parentPath: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ".",
            },

            agentBalance: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            directUserBalanceSum: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            childAgentBalanceSum: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            childUserBalanceSum: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            directUserCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            childAgentCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            childUserCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            totalDebit: {
                type: Sequelize.DOUBLE(20, 2),
            },
            totalCredit: {
                type: Sequelize.DOUBLE(20, 2),
            },
        },
        {
            tableName: "agent_balance_statistics",
            freezeTableName: true,
            timestamps: true,
        }
    );

    return AgentBalanceStatistics;
};

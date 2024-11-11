module.exports = (sequelize, Sequelize) => {
    const SlotStatistics = sequelize.define(
        "SlotStatistics",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            agentCode: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            userCode: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            providerCode: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            gameCode: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            betCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            betAmount: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            winCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            winAmount: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            spendingAmount: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            freeCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            freeBetAmount: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            freeWinAmount: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            buyCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            buyBetAmount: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            buyWinAmount: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            callCount: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            callBetAmount: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            callWinAmount: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            tableName: "slot_statistics",
            freezeTableName: true,
            timestamps: true,
        }
    );

    return SlotStatistics;
};

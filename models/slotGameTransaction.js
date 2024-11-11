module.exports = (sequelize, Sequelize) => {
    const SlotGameTransaction = sequelize.define(
        "SlotGameTransaction",
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
            userCode: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            providerCode: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            gameCode: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            roundId:{
                type: Sequelize.STRING,
            },
            gameName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            gameCategory:{
                type: Sequelize.STRING,
                allowNull: true,
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
                comment: "FREE, BASE",
            },
            bet: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            win: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            currency:{
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "KRW",
                comment: "                                ",
            },
            txnId: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
                comment: "Bet, Win transaction Id",
            },
            txnType: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
                comment: "debit, credit, debit_credit",
            },
            agentStartBalance: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            agentEndBalance: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            userStartBalance: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            userEndBalance: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            parentPath: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            isBuy: {
                type: Sequelize.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },
            isCall: {
                type: Sequelize.TINYINT,
                allowNull: false,
                defaultValue: 0,
            },
            patternId: {
                type: Sequelize.STRING,                
                allowNull: true,
            },
            machineId: {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
            },
            totalDebit: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            totalCredit: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
                defaultValue: 0,
            },
            realRtp: {
                type: Sequelize.DOUBLE(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            tableName: "slot_game_transactions",
            freezeTableName: true,
            timestamps: true,
        }
    );
    

    return SlotGameTransaction;
};

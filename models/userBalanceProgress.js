module.exports = (sequelize, Sequelize) => {
    const UserBalanceProgress = sequelize.define(
        "UserBalanceProgress",
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
            userPrevBalance: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: true,
            },
            userAfterBalance: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: true,
            },
            amount: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: true,
            },
            
            target: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            direction: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            cause: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            comment: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            parentPath: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ".",
            },
        },
        {
            tableName: "user_balance_progresses",
            freezeTableName: true,
            timestamps: true,
        }
    );

    return UserBalanceProgress;
};

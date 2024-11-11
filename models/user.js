module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define(
        "User",
        {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            agentCode: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },
            userCode: { type: Sequelize.STRING, allowNull: false, defaultValue: "" },
            targetRtp: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 80 },
            realRtp: { type: Sequelize.DOUBLE(10, 2), allowNull: false, defaultValue: 0 },
            balance: {
                type: Sequelize.DOUBLE(20, 2), allowNull: false, defaultValue: 0,
                get() {
                    const val = this.getDataValue("balance");
                    return Number(val.toFixed(2));
                },
            },
            status: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1, comment: "1: OK, 2: Delete" },
            gameStop: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, comment: "0: OK, 1: STOP, force stop game" },
            parentPath: { type: Sequelize.STRING, allowNull: false, defaultValue: "", comment: "             " },
            totalDebit: { type: Sequelize.DOUBLE(20, 2), allowNull: false, defaultValue: 0 },
            totalCredit: { type: Sequelize.DOUBLE(20, 2), allowNull: false, defaultValue: 0 },
            totalPlayCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            apiType: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1, comment: "0: Seamless, 1: Transfer" },
        },
        {
            tableName: 'users',
            freezeTableName: true,
            timestamps: true,
        }
    );

    return User;
};

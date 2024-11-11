module.exports = (sequelize, Sequelize) => {
    const Call = sequelize.define(
        "Call",
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
            machineId: {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
                comment: "for reel game",
            },
            serverCallId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            bet: {
                type: Sequelize.DOUBLE(20, 2),
                allowNull: false,
            },
            userPrev: {
                type: Sequelize.DOUBLE(20, 2),
            },
            userAfter: {
                type: Sequelize.DOUBLE(20, 2),
            },
            agentPrev: {
                type: Sequelize.DOUBLE(20, 2),
            },
            agentAfter: {
                type: Sequelize.DOUBLE(20, 2),
            },
            expect: {
                type: Sequelize.DOUBLE(20, 2),
            },
            missed: {
                type: Sequelize.DOUBLE(20, 2),
            },
            real: {
                type: Sequelize.DOUBLE(20, 2),
            },

            rtp: {
                type: Sequelize.DOUBLE(3, 2),
                allowNull: false,
            },
            type: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: "1:Normal, 2:Buy Bonus"
            },
            status: {
                type: Sequelize.INTEGER,
                allowNull: false,
                default: 0,
                comment: "0:waiting, 1:Apply, 2:Cancel"
            },
            msg: {
                type: Sequelize.STRING
            },
            parentPath: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: ".",
            },
        },
        {
            tableName: 'calls',
            freezeTableName: true,
            timestamps: true,
        }
    );

    return Call;
};

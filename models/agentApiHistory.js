module.exports = (sequelize, Sequelize) => {
    const AgentApiHistory = sequelize.define(
        "AgentApiHistory",
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
            parentPath: {
                type: Sequelize.STRING,
                allowNull: true
            },
            type:{ type: Sequelize.STRING, allowNull: true},
            method:{ type: Sequelize.STRING, allowNull: true},
            url:{ type: Sequelize.STRING, allowNull: true},
            ip:{ type: Sequelize.STRING, allowNull: true},
            reqBody:{ type: Sequelize.TEXT, allowNull: true},
            reqSize:{ type: Sequelize.DOUBLE, allowNull: true},
            reqTime:{ type: Sequelize.STRING, allowNull: true},
            resBody:{ type: Sequelize.TEXT, allowNull: true},
            resSize:{ type: Sequelize.DOUBLE, allowNull: true},
            resTime:{ type: Sequelize.STRING, allowNull: true},
            delayTime:{ type: Sequelize.DOUBLE, allowNull: true},
        },
        {
            tableName: "agent_api_histories",
            freezeTableName: true,
            timestamps: true,
        }
    );

    return AgentApiHistory;
};

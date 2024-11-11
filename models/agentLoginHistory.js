module.exports = (sequelize, Sequelize) => {
    const AgentLoginHistory = sequelize.define(
        "AgentLoginHistory",
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
            password: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            ip: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            userAgent: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
        },
        {
            tableName: "agent_login_histories",
            freezeTableName: true,
            timestamps: true,
        }
    );

    return AgentLoginHistory;
};

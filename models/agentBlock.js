module.exports = (sequelize, Sequelize) => {
    const AgentBlock = sequelize.define(
        "AgentBlock",
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
            blockProviderCode: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: "",
            },
            blockGameCode: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: "",
            },
        },
        {
            tableName: "agent_blocks",
            freezeTableName: true,
            timestamps: true,
        }
    );

    return AgentBlock;
};

module.exports = (sequelize, Sequelize) => {
    const Ip = sequelize.define(
        "Ip",
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
            ip: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "Allow",
                comment: "Allow, Block",
            }
        },
        {
            tableName: 'ips',
            freezeTableName: true,
            timestamps: true,
        }
    );

    return Ip;
};

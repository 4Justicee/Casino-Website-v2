module.exports = (sequelize, Sequelize) => {
    const Provider = sequelize.define(
        "Provider",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            code: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            endpoint: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            vendorKey: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
                comment: "orginal API vendorCode",
            },
            backoffice: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "self",
            },
            percent: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            status: {
                type: Sequelize.INTEGER,
                defaultValue: 1,
            },
            config: {
                type: Sequelize.TEXT,
                defaultValue: "{}",
            },
        },
        {
            tableName: 'providers',
            freezeTableName: true,
            timestamps: true,
        }
    );

    return Provider;
};

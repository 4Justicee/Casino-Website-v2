module.exports = (sequelize, Sequelize) => {
    const PricePlan = sequelize.define(
        "PricePlan",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            amount: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 0,
            },
            bonusPercent: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            allowGGR: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            memo: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
        },
        {
            tableName: 'priceplans',
            freezeTableName: true,
            timestamps: true,
        }
    );

    return PricePlan;
};

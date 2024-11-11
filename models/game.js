module.exports = (sequelize, Sequelize) => {
    const Game = sequelize.define(
        "Game",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            providerCode: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            gameType: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "slot",
            },
            enName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            koName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            gameCode: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            banner: {
                type: Sequelize.STRING
            },
            status: {
                type: Sequelize.INTEGER,
                defaultValue: 1,
            },
        },
        {
            tableName: 'games',
            freezeTableName: true,
            timestamps: true,
        }
    );

    return Game;
};

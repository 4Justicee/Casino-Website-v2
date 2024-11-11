module.exports = (sequelize, Sequelize) => {
    const Note = sequelize.define(
        "Note",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            senderCode: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            receiverCode: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            noteTitle: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
            noteContent: {
                type: Sequelize.TEXT,
                allowNull: false,
                defaultValue: "",
            },
            readStatus: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            parentPath: {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: "",
            },
        },
        {
            tableName: 'notes',
            freezeTableName: true,
            timestamps: true,
        }
    );

    return Note;
};

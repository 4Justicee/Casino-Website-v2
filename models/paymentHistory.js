module.exports = (sequelize, Sequelize) => {
    const PaymentHistory = sequelize.define(
        "PaymentHistory",
        {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            agentCode: { type: Sequelize.STRING },
            parentId: { type: Sequelize.INTEGER },
            parentPath: { type: Sequelize.STRING },
            key: { type: Sequelize.STRING },
            orderId: { type: Sequelize.STRING },
            invoiceId: { type: Sequelize.STRING },
            purchaseId: { type: Sequelize.STRING },
            orderDescription: { type: Sequelize.STRING },
            outcomeAmount: { type: Sequelize.STRING },
            outcomeCurrency: { type: Sequelize.STRING },
            payAddress: { type: Sequelize.STRING },
            payAmount: { type: Sequelize.STRING },
            payCurrency: { type: Sequelize.STRING },
            paymentId: { type: Sequelize.STRING },
            paymentStatus: { type: Sequelize.STRING },
            priceAmount: { type: Sequelize.STRING },
            priceCurrency: { type: Sequelize.STRING },
            actuallyPaid: { type: Sequelize.STRING },
            status: { type: Sequelize.STRING },
            depositAmount: { type: Sequelize.STRING },
            agentBeforeBalance: { type: Sequelize.STRING },
            agentAfterBalance: { type: Sequelize.STRING },
        },
        {
            tableName: "payment_histories",
            freezeTableName: true,
            timestamps: true,
        }
    );

    return PaymentHistory;
};

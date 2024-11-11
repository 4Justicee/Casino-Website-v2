const { Op } = require("sequelize");
const { Agent, PricePlan, PaymentHistory, AgentTransaction, Sequelize } = require("../../models");
const logger = require("../../utils/logger");
const { ERR_MSG, CHARGE_TYPE, AGENT_ROLE, AGENT_STATUS } = require("../../utils/constants");
const { currencyRate, currencySymbol, nowKey, ipnCallbackUrl, successUrl, cancelUrl, partiallyPaidUrl, nowInvoiceUrl } = require("../../config/main");
const axios = require("axios");

const moment = require("moment");

let currencyUtil = (number) => {
    let numStr = `${number}`;
    if (numStr.includes(".")) {
        let a = numStr.split(".")[0];
        let b = numStr.split(".")[1];

        let count = 0;
        let newB = "";
        for (let i = 0; i < b.length; i++) {
            newB += b[i];
            if (b[i] !== "0") {
                count++;
            }
            if (count === 2) break;
        }

        return `${a}.${newB}`
    } else {
        return numStr;
    }

}


exports.delete = async (req, res) => {
    try {
        const { id } = req.body;

        await PricePlan.destroy({ where: { id: id } });

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Price Plan | Delete", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
}
exports.create = async (req, res) => {
    try {
        const { name, amount, bonusPercent, allowGGR, memo } = req.body;

        const sender = await Agent.findByPk(req.session.auth.id);

        if (!sender) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_AGENT,
            });
        }

        await PricePlan.create({
            name,
            amount,
            bonusPercent,
            allowGGR,
            memo,
        });

        return res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | PricePlan | Create", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
}
exports.planList = async (req, res) => {
    try {
        const { start, searchKey, draw, length, order='id', dir='ASC' } = req.body;
        const currentAgent = await Agent.findByPk(req.session.auth.id);
        if (!currentAgent) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_AGENT,
            });
        }

        const parentAgent = await Agent.findByPk(currentAgent.parentId);
        if (!parentAgent && currentAgent.role != 1) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_PARENT_AGENT,
            });
        }

        let query = {
            [Op.or]: [
                { name: { [Op.substring]: searchKey } },
                { amount: { [Op.substring]: searchKey } },
                { memo: { [Op.substring]: searchKey } }
            ],
        };

        const result = await PricePlan.findAndCountAll({
            where: query,
            offset: Number(start),
            limit: Number(length),
            order: [[order, dir]],
        });

        return res.json({
            status: 1,
            data: result.rows,
            draw: Number(draw),
            start: Number(start),
            recordsTotal: result.count,
            recordsFiltered: result.count,
        });
    } catch (error) {
        logger("error", "API | PricePlan | Get All Price Plan", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.readByUser = async (req, res) => {
    try {
        const currentAgent = await Agent.findByPk(req.session.auth.id);
        if (!currentAgent) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_AGENT,
            });
        }

        const parentAgent = await Agent.findByPk(currentAgent.parentId);
        if (!parentAgent && currentAgent.role != 1) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_PARENT_AGENT,
            });
        }

        const result = await PricePlan.findAll({
            where: { allowGGR: { [Op.lte]: req.session.auth.percent } }
        });

        let agentCurrency = req.session.auth.currency;
        let usd1Rate = currencyRate.rates[agentCurrency];
        if (usd1Rate === undefined || usd1Rate == 0 || usd1Rate === null) {
            usd1Rate = 1;
        } else {
            usd1Rate = Number(usd1Rate);
        }


        let currencyInfo = {
            "agentCurrency": agentCurrency,
            "name": currencySymbol.data[agentCurrency] ? currencySymbol.data[agentCurrency].name : agentCurrency,
            "symbol": currencySymbol.data[agentCurrency] ? currencySymbol.data[agentCurrency].symbol : agentCurrency,
            "rate": currencyUtil(Number(1 / currencyRate.rates[agentCurrency])),
            "reverseRate": currencyUtil(Number(currencyRate.rates[agentCurrency]))
        }


        return res.json({
            status: 1,
            data: result,
            currencyInfo: currencyInfo
        });
    } catch (error) {
        logger("error", "API | PricePlan | Get All Price Plan", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};


exports.updatePaymentHistory = async (req, res) => {
    try {
        // console.log(req.body);
        // {
        //     actually_paid: 0.00506984,
        //     actually_paid_at_fiat: 0,
        //     fee: {
        //       currency: 'usdttrc20',
        //       depositFee: 1.126284,
        //       serviceFee: 0,
        //       withdrawalFee: 0
        //     },
        //     invoice_id: 4803492574,
        //     order_description: 'testAgent_100',
        //     order_id: '1706104956746',
        //     outcome_amount: 101.611878,
        //     outcome_currency: 'usdttrc20',
        //     parent_payment_id: null,
        //     pay_address: '0xDE0da4f27882F628cFdEFC3Cf61A89b68AD6402E',
        //     pay_amount: 0.04763643,
        //     pay_currency: 'eth',
        //     payin_extra_id: null,
        //     payment_extra_ids: null,
        //     payment_id: 4914760150,
        //     payment_status: 'confirmed',
        //     price_amount: 100,
        //     price_currency: 'usd',
        //     purchase_id: '5291809662',
        //     updated_at: 1706105146952
        // }

        let reqBody = req.body;
        let {
            actually_paid,
            actually_paid_at_fiat,
            invoice_id,
            order_description,
            order_id,
            outcome_amount,
            outcome_currency,
            parent_payment_id,
            pay_address,
            pay_amount,
            pay_currency,
            payin_extra_id,
            payment_extra_ids,
            payment_id,
            payment_status,
            price_amount,
            price_currency,
            purchase_id,
            updated_at
        } = req.body;


        let actuallyPaidUSD = Math.round(Number(price_amount) * Number(actually_paid) / Number(pay_amount));

        const paymentHistory = await PaymentHistory.findOne({ where: { invoiceId: invoice_id, orderId: order_id } })
        if (!paymentHistory) {
            logger("error", "API | billing.js/updatePaymentHistory", "[finding payment Error]", req)
            logger("error", "API | billing.js/updatePaymentHistory", JSON.stringify(req.body), req);
            return res.json({ status: 0, msg: "There is no payments", });
        }



        //                              
        // try {
        //     const axiosConfig = {
        //         method: "GET",
        //         url: "https://api.nowpayments.io/v1/payment/" + payment_id,
        //         headers: {
        //             "Content-Type": "application/json",
        //             "x-api-key": paymentHistory.key,
        //         },
        //         timeout: 1000 * 30,
        //     };
        //     const responseFromNowpayments = await axios(axiosConfig);

        //     if (responseFromNowpayments.payment_status != payment_status) {
        //         logger("error", "API | Payment History | Check Error ", `Payment Status is different: ${JSON.stringify(responseFromNowpayments)}`, req);
        //         return res.json({ status: 0, msg: ERR_MSG.EXTERNAL_ERROR });
        //     }
        // } catch (error) {

        //     logger("error", "API | Payment History | Request and Check Error ", `${error.message}`, req);
        //     return res.json({ status: 0, msg: ERR_MSG.EXTERNAL_ERROR });
        // }




        const agent = await Agent.findOne({ where: { agentCode: paymentHistory.agentCode } });

        let depositAmount = 0;

        let agentCurrency = agent.currency;
        let agentPercent = agent.percent;
        let reverseRate = currencyUtil(Number(currencyRate.rates[agentCurrency]));
        depositAmount = Math.round(actuallyPaidUSD * Number(reverseRate) / Number(agentPercent) * (100));

        const parentAgent = await Agent.findOne({ where: { id: agent.parentId, status: { [Op.not]: AGENT_STATUS.DELETED } } });
        const parentBeforeBalance = Number(parentAgent.balance);
        const parentBeforeTotalBalance = Number(parentAgent.totalBalance); //                            
        const agentBeforeBalance = agent.balance;
        const agentBeforeTotalBalance = agent.totalBalance;
        const agentAfterBalance = agentBeforeBalance + depositAmount;
        const agentAfterTotalBalance = agentBeforeTotalBalance + depositAmount;

        logger("info", "API  |billing.js/updatePaymentHistory", `[${payment_status}] ${JSON.stringify(req.body)}`, req);

        //waiting, confirmed, sending, finished, expired
        if (agentAfterBalance !== agentBeforeBalance && (payment_status === "finished" || payment_status === "partially_paid")) {


            if (parentAgent.role === AGENT_ROLE.ADMIN) {
                await parentAgent.increment('totalbalance', { by: depositAmount });
                await parentAgent.reload();
                await agent.increment(['balance', 'totalBalance'], { by: depositAmount });
                await agent.reload();
            } else {

                await parentAgent.decrement('balance', { by: depositAmount });
                await parentAgent.reload();
                await agent.increment(['balance', 'totalBalance'], { by: depositAmount });
                await agent.reload();
            }


            AgentTransaction.create({
                operatorCode: agent.agentCode,
                parentCode: agent.parentCode,
                agentCode: agent.agentCode,
                chargeType: CHARGE_TYPE.DEPOSIT_AUTOPAY,
                chargeAmount: depositAmount,
                operatorPrevBalance: agentBeforeBalance,
                operatorAfterBalance: agent.balance,
                parentPrevBalance: parentBeforeBalance,
                parentAfterBalance: parentAgent.balance,
                agentPrevBalance: agentBeforeBalance,
                agentAfterBalance: agent.balance,
                operatorPrevTotalBalance: agentBeforeTotalBalance,
                operatorAfterTotalBalance: agent.totalBalance,
                parentPrevTotalBalance: parentBeforeTotalBalance,
                parentAfterTotalBalance: parentAgent.totalBalance,
                agentPrevTotalBalance: agentBeforeTotalBalance,
                agentAfterTotalBalance: agent.totalBalance,
                status: 1,
                parentPath: agent.parentPath,
            });

            AgentBalanceProgress.create({
                agentCode: agent.agentCode,
                agentPrevBalance: agentBeforeBalance,
                agentAfterBalance: agent.balance,
                agentPrevTotalBalance: agentBeforeTotalBalance,
                agentAfterTotalBalance: agent.totalBalance,
                currency: agent.currency,
                apiType: agent.apiType,
                amount: depositAmount,
                target: parentAgent.agentCode,
                cause: "SITE | AGENT DEPOSIT AUTO PAY",
                direction: "Increase",
                comment: ``,
                parentPath: agent.parentPath,
            });
            AgentBalanceProgress.create({
                agentCode: parentAgent.agentCode,
                agentPrevBalance: parentBeforeBalance,
                agentAfterBalance: parentAgent.balance,
                agentPrevTotalBalance: parentBeforeTotalBalance,
                agentAfterTotalBalance: parentAgent.totalBalance,
                currency: parentAgent.currency,
                apiType: parentAgent.apiType,
                amount: depositAmount,
                target: agent.agentCode,
                cause: "SITE | AGENT DEPOSIT AUTO PAY",
                direction: "Decrease",
                comment: ``,
                parentPath: parentAgent.parentPath,
            });

        }




        await paymentHistory.update({
            purchaseId: purchase_id,
            outcomeAmount: outcome_amount,
            outcomeCurrency: outcome_currency,
            payAddress: pay_address,
            payAmount: pay_amount,
            payCurrency: pay_currency,
            paymentId: payment_id,
            paymentStatus: payment_status,
            actuallyPaid: actually_paid,
            depositAmount,
            agentBeforeBalance,
            agentAfterBalance,
        });


        res.json({ status: 1 });
    } catch (error) {
        logger("error", "API | Payment History | Create Payment History", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.readPaymentHistory = async (req, res) => {
    try {
        const { start, searchKey, draw, length, order='id', dir='ASC' } = req.body;
        const currentAgent = await Agent.findByPk(req.session.auth.id);
        if (!currentAgent) {
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_AGENT,
            });
        }

        const parentAgent = await Agent.findByPk(currentAgent.parentId);
        if (!parentAgent && currentAgent.role != 1) {
            return res.json({ status: 0, msg: ERR_MSG.INVALID_PARENT_AGENT, });
        }

        let query = {

        }
        if (searchKey !== "") {
            query = {

                [Op.or]: [
                    { payAddress: { [Op.substring]: searchKey } },
                    { paymentId: { [Op.substring]: searchKey } },
                    { paymentStatus: { [Op.substring]: searchKey } },
                    { agentCode: { [Op.substring]: searchKey } },
                    { orderId: { [Op.substring]: searchKey } },
                ],
            };
        }


        if (currentAgent.role != AGENT_ROLE.ADMIN) {

            query = {
                ...query,
                [Op.or]: [
                    { agentCode: currentAgent.agentCode },
                    { parentId: currentAgent.id },
                ],
            }
        }
        query.purchaseId = { [Op.not]: null };

        const result = await PaymentHistory.findAndCountAll({
            where: query,
            offset: Number(start),
            limit: Number(length),
            order: [[order, dir]],
            logging: console.log
        });

        return res.json({
            status: 1,
            data: result.rows,
            draw: Number(draw),
            start: Number(start),
            recordsTotal: result.count,
            recordsFiltered: result.count,
        });
    } catch (error) {
        logger("error", "API | Payment History | Get All Payment History", `${error.message}`, req);

        return res.json({
            status: 0,
            msg: ERR_MSG.INTERNAL_ERROR,
        });
    }
};

exports.payWithNowPayments = async (req, res) => {
    let nowPaymentReqData;
    try {

        const id = req.body.id;
        const plan = await PricePlan.findByPk(id);

        const orderId = `${req.session.auth.agentCode}_${plan.amount}___${moment(new Date()).format("YYYY-MM-DD_HH_mm_ss")}`;
        const orderDescription = `${req.session.auth.agentCode}_${plan.amount}`;

        const parentAgent = await Agent.findByPk(req.session.auth.parentId);
        let billingAPIKey = nowKey;

        //          admin    billingKey          . 2024-06-06 Julian
        // if (parentAgent && parentAgent.allowBilling && parentAgent.billingAddress) {
        //     billingAPIKey = parentAgent.billingAddress;
        // }


        nowPaymentReqData = {
            "price_amount": Number(plan.amount),
            "price_currency": "usd",
            "order_id": orderId,
            "order_description": orderDescription,
            "ipn_callback_url": ipnCallbackUrl,
            "success_url": successUrl,
            "cancel_url": cancelUrl,
            "partially_paid_url": partiallyPaidUrl,
            "is_fee_paid_by_user": false
        }
        const reqTime = Date.now();
        const axiosConfig = {
            method: "POST",
            url: nowInvoiceUrl,
            headers: {
                "Content-Type": "application/json",
                "x-api-key": billingAPIKey,
            },
            data: nowPaymentReqData,
            timeout: 1000 * 30,
        };
        const responseFromNowpayments = await axios(axiosConfig);

        // {
        //     "id": "4307582959",
        //     "token_id": "6435794807",
        //     "order_id": "RGDBP-21314",
        //     "order_description": "Apple Macbook Pro 2019 x 1",
        //     "price_amount": "1000",
        //     "price_currency": "USD",
        //     "pay_currency": null,
        //     "ipn_callback_url": "https://nowpayments.io",
        //     "invoice_url": "https://nowpayments.io/payment/?iid=4307582959",
        //     "success_url": "https://nowpayments.io",
        //     "cancel_url": "https://nowpayments.io",
        //     "partially_paid_url": null,
        //     "payout_currency": null,
        //     "created_at": "2024-01-24T00:12:30.834Z",
        //     "updated_at": "2024-01-24T00:12:30.834Z",
        //     "is_fixed_rate": false,
        //     "is_fee_paid_by_user": false
        // }

        // "data": {
        //     "id": "5908086048",
        //     "token_id": "5990655909",
        //     "order_id": "d88204b0-ba9f-11ee-b62b-91a59e90698c",
        //     "order_description": null,
        //     "price_amount": "100",
        //     "price_currency": "USD",
        //     "pay_currency": null,
        //     "ipn_callback_url": "https://fiverscan.com/callback/nowpayment",
        //     "invoice_url": "https://nowpayments.io/payment/?iid=5908086048",
        //     "success_url": "https://fiverscan.com/app/payment_history",
        //     "cancel_url": "https://fiverscan.com/app/payment_history",
        //     "partially_paid_url": null,
        //     "payout_currency": null,
        //     "created_at": "2024-01-24T10:03:39.305Z",
        //     "updated_at": "2024-01-24T10:03:39.305Z",
        //     "is_fixed_rate": true,
        //     "is_fee_paid_by_user": true
        // }

        let resData = responseFromNowpayments.data;

        let agentCurrency = req.session.auth.currency;
        let agentPercent = req.session.auth.percent;
        let reverseRate = currencyUtil(Number(currencyRate.rates[agentCurrency]));
        let depositAmount = (Number(plan.amount) * Number(reverseRate) / Number(agentPercent) * (100));

        if (isNaN(depositAmount)) {
            console.log("                   ");
            console.log(req.session.auth.agentCode, agentCurrency, agentPercent, reverseRate, plan.amount, depositAmount);
            depositAmount = 0;

            return res.json({ status: 0, msg: ERR_MSG.UNKNOWN_ERROR });
        }

        if (parentAgent.role != AGENT_ROLE.ADMIN && Number(parentAgent.balance) < depositAmount) {
            return res.json({ status: 0, msg: ERR_MSG.INSUFFICIENT_PARENT_FUNDS });
        }

        await PaymentHistory.create({
            agentCode: req.session.auth.agentCode,
            parentId: req.session.auth.parentId,
            parentPath: req.session.auth.parentPath,
            key: billingAPIKey,
            orderId,
            orderDescription,
            invoiceId: resData.id,
            priceAmount: resData.price_amount,
            priceCurrency: resData.price_currency,
        });

        const responseTime = Date.now() - reqTime;

        return res.json({
            status: 1,
            redirect_url: resData.invoice_url,
            responseTime: responseTime,
        });
    } catch (error) {

        if (error.response && error.response.data && error.response.data.code == "INVALID_API_KEY") {
            logger("error", "API | Check Plan | Check Plan Test", `Request with INVALID_API_KEY: ` + JSON.stringify(nowPaymentReqData), req);
            console.log(nowPaymentReqData);
            return res.json({
                status: 0,
                msg: ERR_MSG.INVALID_NOWPAYMENTS_KEY,
            });
        } else {
            logger("error", "API | Check Plan | Check Plan Test", `${error.message}`, req);
            return res.json({
                status: 0,
                msg: ERR_MSG.INTERNAL_ERROR,
            });
        }

    }
};

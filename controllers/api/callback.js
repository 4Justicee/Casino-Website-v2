const MD5 = require("md5.js");
const { Op, Transaction } = require("sequelize");
const moment = require("moment");
const { User, GameHistory } = require("../../models");
const {requestTo} = require("../../utils/request")
const config = require("../../config/main")
const bcrypt = require("bcrypt");
const isEmpty = require("../../utils/isEmpty")
exports.gameCallback = async (req, res) => {
    const { 
      user_code, 
      game_type, 
      user_balance, 
      user_total_credit, 
      user_total_debit } = req.body; 
    
    const uid = user_code.substr(7);

    const user = await User.findOne({
      where: { 
        id: uid,
      } 
    });    
    if (!user) {
      return res.json({
        status: 0,
        msg: "INVALID_USER",
      });
    }
      
    let betMoney = 0;
    let winMoney = 0;
    let resultBalance = 0;
    
    if (game_type == "slot") {
      const {
        provider_code,
        game_code,
        round_id,
        type,
        bet,
        win,
        txn_id,
        txn_type,
        is_buy,
        is_call,
        user_before_balance,
        user_after_balance,
        agent_before_balance,
        agent_after_balance,
        created_at,
      } = req.body.slot;
      
      const history = await GameHistory.findOne({
        where:{
          txnId: txn_id, 
          txnType:txn_type
        }
      });
      
      if(!isEmpty(history)) {
        return res.json({
          status: 0,
          user_balance:0,
          msg: "DUPLICATED_REQUEST",
        });
      }
      
      betMoney = Number(bet);
      winMoney = Number(win);
      resultBalance = Number(user.balance) + winMoney - betMoney;
      
      GameHistory.create({
        roundId: round_id,
        userCode: user_code,
        providerCode: provider_code,
        gameCode: game_code,
        spinType: type,
        bet: betMoney,
        win: winMoney,
        userBalance: user_balance,
        userTotalDebit: user_total_debit,
        userTotalCredit: user_total_credit,
        txnId: txn_id,
        txnType: txn_type,
        isBuy: is_buy,
        isCall: is_call,
        userBeforeBalance: user_before_balance,
        userAfterBalance: user_after_balance,
        agentBeforeBalance: agent_before_balance,
        agentAfterBalance: agent_after_balance,
        spinedAt: created_at,
      });
    }
    await User.update({ balance: resultBalance }, 
      { where: { id: user.id } });
    return res.json({
      status: 1,
      user_balance: resultBalance,
    });    
};

exports.getUserBalance = async (req, res) => {    
    const { user_code } = req.body;
    const uid = user_code.substr(7);
    const user = await User.findOne({ 
      where: { 
        id: uid,
      } 
    });
  
    if (!user) {
      return res.json({
        status: 0,
        msg: "INVALID_USER",
      });
    }
  
    if (user.balance <= 0) {
      return res.json({
        status: 0,
        user_balance: 0,
        msg: "INSUFFICIENT_USER_FUNDS",
      });
    }
  
    return res.json({
      status: 1,
      user_balance: user.balance,
    });    
};

exports.moneyCallback = async (req, res) => {    
    
    res.json({
        status: 1,
    });
};
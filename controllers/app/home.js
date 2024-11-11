
const { SlotGames, MiniGames } = require("../../models");
const { Op, Transaction } = require("sequelize");
const moment = require("moment");
const path = require("path");
const fs = require('fs')

exports.dashboard = async (req, res) => {
    return res.render("home/dashboard", {
        session: req.session,
    });
};

exports.notFound = async (req,res)=> {
    return res.render("home/404", {
        session: req.session,
    });
}
exports.profile = async (req,res)=> {
    return res.render("home/404", {
        session: req.session,
    });
}

exports.casino = async (req,res)=> {
    try{
        let slotProviders = await SlotGames.findAll({
            attributes: [
              'providerCode',
            ],
            group: ['providerCode'], // Group by userId
            raw: true // To get plain results
        });
        const p = path.join(__dirname, "../../public/assets/img/providers/");

        slotProviders = slotProviders.map((item, idx)=>{
            const newPath = p + item.providerCode + ".png";
            item.file_exist = fs.existsSync(newPath)
            return item;
        })
        const miniGames = await MiniGames.findAll({raw:true});

        return res.render("home/casino", {
            session: req.session,
            slots: slotProviders,
            mini: miniGames,
        });
    }
    catch(e) {
        console.log(e);
    }
    
}

exports.sports = async (req,res)=> {
    return res.render("home/sports", {
        session: req.session,
    });
}
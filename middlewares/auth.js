const { ERR_MSG } = require("../utils/constants");

const moment = require('moment');
const { generateRandomToken } = require("../utils")
const crypto = require('crypto');
const config = require("../config/main")

exports.requireApiAuth = (req, res, next) => {
    const whiteList = ["/api/auth/login", "/api/auth/signup", "/api/agent_check", "/api/auth/logout", "/api/alive"];

    if (whiteList.indexOf(req.originalUrl) == -1) {
        if (!req.session.auth) {
            return res.json({
                status: 0,
                msg: ERR_MSG.UNAUTHORIZED,
            });
        }
    }

    next();
};

exports.requireAppAuth = (req, res, next) => {
    const whiteList = ["/page/login"];

    if (!whiteList.includes(req.originalUrl) && !req.session.auth) { return res.redirect("/page/login"); }

    next();
}

exports.dec = (req, res, next) => {
    // Convert IV and Salt from Hex to Buffer
    const iv = Buffer.from('000102030405060708090A0B0C0D0E0F', 'hex');
    const salt = Buffer.from('000102030405060708090A0B0C0D0E0F', 'hex');

    const key = crypto.pbkdf2Sync(config.secretKey, salt, 1000, 32, 'sha256');  // 32 bytes key

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(req.body.data, 'base64', 'utf8');  
    decrypted += decipher.final('utf8');  
    
    req.body = JSON.parse(decrypted);   

    next();
}

exports.enc = (data) => {
    const iv = Buffer.from('000102030405060708090A0B0C0D0E0F', 'hex');
    const salt = Buffer.from('000102030405060708090A0B0C0D0E0F', 'hex');

    const key = crypto.pbkdf2Sync(config.secretKey, salt, 1000, 32, 'sha256');  // 32 bytes key
    const d = JSON.stringify(data);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(d, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;    

}

let randToken1 = generateRandomToken(23);
let randToken2 = generateRandomToken(55);
let randToken3 = generateRandomToken(36);
exports.updateCookie = (req, res, next) => {
    const whiteList = ["/page/login", "/api/auth/login", "/api/auth/signup", "/api/auth/logout", "/api/alive", "/api/global_info"];


    res.cookie('__Host-next-auth.csrf-token', randToken1);
    res.cookie('__Secure-next-auth.callback', randToken2);
    res.cookie('__Secure-next-auth.session-token', generateRandomToken(18));
    res.cookie('__cf_bm', generateRandomToken(53));
    res.cookie('_account', generateRandomToken(48));
    res.cookie('_cfuvid', generateRandomToken(25));
    res.cookie('_dd_s', generateRandomToken(20));
    res.cookie('intercom-device-id-dgkjq2bp', generateRandomToken(18));
    res.cookie('SID', generateRandomToken(48));
    res.cookie('__Secure-3PSIDCC', generateRandomToken(25));
    res.cookie('1P_JAR', randToken3);
    res.cookie('AEC', generateRandomToken(48));
    res.cookie('__Secure-1PAPISID', generateRandomToken(25));
    res.cookie('SAPISID', generateRandomToken(20));
    res.cookie('APISID', generateRandomToken(18));
    res.cookie('DEAEC', generateRandomToken(48));
    res.cookie('__Secure-1P234gwDE', generateRandomToken(25));
    res.cookie('SAPICGS_SID', generateRandomToken(20));
    res.cookie('__APIRR_SID', generateRandomToken(18));
    next();
}


// Middleware function to log IP address and requested URL
exports.checkIp = (req, res, next) => {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    ip = ip.replace("::ffff:", "");
    req.loginfo = {};
    req.loginfo.ip = ip;
    req.loginfo.url = req.originalUrl;
    req.loginfo.agentCode = req.session.auth ? req.session.auth.agentCode : "      ";
    req.loginfo.method = req.method;
    req.loginfo.body = req.body ? req.body : "{}";
    req.loginfo.params = req.params ? req.params : "{}";
    req.loginfo.query = req.query ? req.query : "{}";
    req.loginfo.time = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    next();

};

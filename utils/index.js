const requestIp = require("request-ip");
const ipaddr = require("ipaddr.js");

exports.rand = (min, max) => {
    return min + Math.floor(Math.random() * (max - min));
};


exports.removeHTMLTags = (str) => {
    return str.replace(/<[^>]*>/g, '');
}


const crypto = require('crypto');

exports.generateRandomToken = (length) => {
    const randomBytes = crypto.randomBytes(length);
    return randomBytes.toString('base64').slice(0, length);
};

exports.getIpAddress = (req) => {
    let ip = requestIp.getClientIp(req);

    //                                                      
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'];
    }

    if (ipaddr.IPv6.isValid(ip)) {
        let addr = ipaddr.IPv6.parse(ip);
        if (addr.isIPv4MappedAddress()) return addr.toIPv4Address().toString();
    }

    return ip;
};
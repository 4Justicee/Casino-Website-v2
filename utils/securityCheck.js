
const moment = require('moment');
const logger = require("../utils/logger");
const { removeHTMLTags } = require("../utils");

exports.checkRelation = (sessionAgent, targetId) => {

    let id = sessionAgent.id;
    let parentPath = sessionAgent.parentPath;
    //                                     
    const arr = parentPath.match(/\d+/g) || [];

    // b                              
    if (!arr.includes(targetId)) {
        return "other";
    }

    // b                       
    const bIndex = arr.indexOf(targetId);

    // b    a                    
    if (bIndex < arr.indexOf(id)) {
        return "parent";
    } else if (bIndex > arr.indexOf(id)) {
        return "child";
    } else {
        return "self";
    }
};


exports.isMyParent = (child, parent) => {
    if (!child.parentPath.includes(`.${parent.id}.`)) {
        logger("error", "API | Agent | Get Agent By ID | HACKING", `(${parent.agentCode})  try access to (${child.agentCode}) `);
        return false;
    } else {
        return true;
    }
};

exports.sendAlert = (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const url = req.originalUrl;
    const time = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    let msg = `
            <body style="background:black; color:white;">
            <div style="text-align:center">
            <h1 style='color:red'>[DANGER] <br>Your access is an illegal hacking attempt. <br>Your IP Address and account will be blocked. </h1>
            <h3>
            ============================<br>
            TIME: ${time} <br>
            IP: ${ip} <br>
            URL: ${url} <br>
            AGENT: id:${req.session.auth.id}, agentName: ${req.session.auth.agentName}, agentCode: ${req.session.auth.agentCode}<br>
            ============================<br>
            <h3>
            </div>
            </body>
            `;

    // console.log(removeHTMLTags(msg));
    logger("error", "API | Agent | Get Agent By ID | HACKING", `id:${req.session.auth.id}, agentName: ${req.session.auth.agentName}, agentCode: ${req.session.auth.agentCode}, IP: ${ip}, URL: ${url} `, req);

    res.status(403).send(msg);
}


const moment = require('moment');
const logger = require("../utils/logger");
const { removeHTMLTags } = require("../utils");
module.exports = (agent, operatorSessionId, req, res) => {
    if (!agent.parentPath.includes(`.${operatorSessionId}.`)) {
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

        console.log(removeHTMLTags(msg));
        logger("error", "API | Agent | Get Agent By ID | HACKING", removeHTMLTags(msg), req);

        res.send(msg);
        return false;
    } else {
        return true;
    }
};

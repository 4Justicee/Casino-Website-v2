
const logger = require("../utils/logger");
const moment = require("moment");
//                              
function isLoggedIn(socket, next) {
    if (socket.handshake.session && socket.handshake.session.auth) { 
      next();
    } else {                    
      next(new Error('Unauthorized'));
    }
  }

  

module.exports = async ({ io }) => {
    try {
        global.io = io;

        io.on("connection", function (socket) {
            
            isLoggedIn(socket, (err) => {
                if (err) {
                    logger("warn", "Socket", `SocketId: [${socket.id}] connected, Unauthorized access: ` + err.message);
                    // socket.disconnect();
                } else {
                    logger("info", "Socket", `SocketId: [${socket.id}] connected, User is logged in: ( ${socket.handshake.session.auth.agentCode} )`);
                }
            });



            socket.on("disconnect", async () => {
                logger("info", "Socket", "SocketId: [" + socket.id + "] disconnected");
            });
        });

        logger("info", "Socket", "Socket initialized.");
    } catch (error) {
        logger("error", "Socket", `Socket initialize failed... ${error.message}`);
        process.exit(0);
    }
};

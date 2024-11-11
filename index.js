const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const compression = require("compression");
const path = require("path");
const session = require("express-session");
const sharedSession = require('express-socket.io-session');
const MySQLStore = require("express-mysql-session");
const cookieParser = require("cookie-parser");
const i18n = require("i18n");
const http = require("http");
const socketServer = require("socket.io");

const loaders = require("./loaders");
const config = require("./config/main");
const logger = require("./utils/logger");
const router = require("./routes");

const app = express();
const server = http.createServer(app);
const io = socketServer(server);

const startServer = async () => {
    //                
    app.use(express.static(path.join(__dirname, "public")));

    app.use(cors({ origin: "*" }));
    app.use(bodyParser.json({ limit: "10mb" }));
    app.use(bodyParser.urlencoded({ limit: "10mb", extended: false }));
    app.use(compression());
    app.use(cookieParser());

    i18n.configure({
        locales: ["en", "ja", "pt"],
        directory: path.join(__dirname, "lang")
    });

    app.use(i18n.init);

    // session
    const sessionStore = new MySQLStore({
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.pass,
        database: config.database.name,
        expiration: 1000 * 60 * 30,
        clearExpired: true,
        clearExpirationInterval: 5000,
    });
    const sessionMiddleware = session({
        secret: config.secretKey,
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
    });
    app.use(sessionMiddleware);
    io.use(sharedSession(sessionMiddleware));

    app.use((err, req, res, next) => {
        if (err.code === 'EBADCSRFTOKEN') {
            res.status(403).send('CSRF Attack Detected');
        } else if (err instanceof SyntaxError) {
            res.status(400).send("JSON_ERROR");
        } else {
            next(err);
        }
    });
    app.use((req, res, next) => {
        const whiteList = ["/thirdparty/nowpayment/callback", "/api/alive"];
        const userAgent = req.headers['user-agent'];
        if ((userAgent && userAgent.includes('Mozilla')) || whiteList.indexOf(req.originalUrl) != -1) {
            next();
        }
    });
    

    // main router
    app.use("/", router);

    // ejs engine
    app.set("views", path.join(__dirname, "./views"));
    app.set("view engine", "ejs");
    app.engine("html", require("ejs").renderFile);

    await loaders({ app, io });

    server.listen(config.port, () => {
        logger("info", "Server", `Server is started on ${config.port} port`);
    });
};

startServer();


const axios = require("axios");
const logger = require("./logger");

exports.requestTo = async (comment, type, url, data = {}) => {
    try {
        logger("info", comment, `Request to ${url}, ${JSON.stringify(data)}`);

        const instance = axios.create({
            timeout: 1000 * 6,
        });

        let response;

        if (type.toUpperCase() == "GET") {
            response = await instance.get(url, { params: data });
        } else if (type.toUpperCase() == "POST") {           
            response = await instance.post(url, data );
        }

        if (type.toUpperCase() == "GET") {
            logger("info", comment, `Response from ${url} ${response.data}`);
            return response.data;
        }
       
        logger("info", comment, `Response from ${url} ${response}`);

        return response.data;
    } catch (error) {
        logger("error", comment, `Request for Slot failed. ${error.message}`);

        return {};
    }
};

exports.requestForCheck = async (providerCode, providerEndpoint) => {
    let result = {
        status: 0,
        time: 0,
        total: 0,
        running: 0,
        checking: 0,
    };

    try {
        const startTime = Date.now();

        const response = await axios.get(`${providerEndpoint}/api/alive`);

        if (response.data.status == true) {
            result.status = 1;
            result.time = Date.now() - startTime;
        }
    } catch (error) {
        logger("error", "Provider | Check Provider (Status)", `Request for ${providerCode} failed. ${error.message}`);
    }

    try {
        let url = `${providerEndpoint}/api/gamelist`;

        if (providerCode == "REELKINGDOM") {
            url += `?pinfo=REELKINGDOM`;
        }

        const response = await axios.get(url);

        if (response.data.status == 1) {
            const games = response.data.games;

            for (const game of games) {
                if (game.status == 1) {
                    result.running++;
                } else {
                    result.checking++;
                }
            }

            result.total = games.length;
        }
    } catch (error) {
        logger("error", "Provider | Check Provider (Game)", `Request for ${providerCode} failed. ${error.message}`);
    }

    return result;
};


exports.requestToUnion = async (comment, type, url, data = {}) => {
    try {
        //logger("info", comment, `Request to ${url}, ${JSON.stringify(data)}`, req);

        const axiosConfig = {
            method: type,
            url,
            headers: {
                "k-secret": config.union.secret,
                "k-username": config.union.username,
            },
            data,
            timeout: 1000 * 30,
        };
        console.log(axiosConfig);
        const responseFromUnion = await axios(axiosConfig);
        console.log(responseFromUnion.data);
        return responseFromUnion.data;
    } catch (error) {
        logger("error", comment, `                       . ${error.message}`);
        return {
            code: -1,
            msg: `Request to UNION API failed.`,
        };
    }
};

exports.requestToDevaPlay = async (comment, type, url, data = {}) => {
    try {
        let devaOperator = new DevaPlayApiOperator(config.devaplay.url, config.devaplay.agentCode, config.devaplay.privateKey, config.devaplay.callbackPublicKey);

        let startTime = Date.now();
        logger("info", comment, `[DEVA       ] ${url}`);
        if (!isEmpty(data)) console.log(data);

        let responseFromDeva = null;
        let apiPath = url.replace(config.devaplay.url + "/", "");

        if (type == "GET") {
            responseFromDeva = await devaOperator.sendGetRequest(apiPath, data);
        } else if (type == "POST") {
            responseFromDeva = await devaOperator.sendPostRequest(apiPath, data);
        }

        const responseTime = Date.now() - startTime;
        logger("info", comment, `[DEVA       ] ${url} ${responseTime}ms`);
        console.log(responseFromDeva);
        console.log();
        return responseFromDeva;
    } catch (error) {
        logger("error", comment, `[DEVA              ] ${error.message}`);
        return {
            code: -1,
            msg: ERR_MSG.NETWORK_ERROR,
        };
    }
};

exports.requestForApi = async (comment, type, url, data = {}) => {
    try {
        logger("info", comment, `${url}, Request: ${JSON.stringify(data)}`);
        
        // console.log("----------------------------------------------------")
        
        // console.log("[URL]",url);
        // console.log("\nRequest:");
        // console.log(data);
        const instance = axios.create({
            timeout: 1000 * 6,
        });

        let response;

        if (type.toUpperCase() == "GET") {
            response = await instance.get(url, data);
        } else if (type.toUpperCase() == "POST") {
            response = await instance.post(url, data);
        }

        logger("info", comment, `${url}, Response: ${JSON.stringify(response.data)}`);
        // console.log("\nResponse:");
        // console.log(response.data);
        // console.log("----------------------------------------------------")
        return response.data;
    } catch (error) {
        logger("error", comment, `Request for Api failed. ${error.message}`);

        return {
            status:2,
            msg: error.message
        };
    }
};
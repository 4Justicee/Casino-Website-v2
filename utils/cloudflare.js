
const axios = require('axios');

const logger = require("../utils/logger");

const { cloudflare } = require("../config/main");
const { isUse: isCFUse, zoneIds, zoneKey,  cfAccount, cfGlobalKey } = cloudflare;

let zoneId = zoneIds[zoneKey];
exports.getCFRules = async () => {

    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/firewall/rules`;
    const axiosConfig = {
        method: "GET",
        url: url,
        headers: {
            "X-Auth-Email": cfAccount,
            "X-Auth-Key": cfGlobalKey,
        },
        timeout: 1000 * 30,
    };
    try {
        const responseFromCF = await axios(axiosConfig);
        if (responseFromCF.data.success) {
            return responseFromCF.data.result;
        } else {
            logger("error", "util | cloudflare.js | getCFRules", `${JSON.stringify(responseFromCF.data)}`);
            return null;
        }
    } catch (error) {
        logger("error", "util | cloudflare.js | getCFRules", `${error.message}`);
        return null;
    }
}
exports.createCFRules = async (array) => {
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/firewall/rules`;
    const axiosConfig = {
        method: "POST",
        url: url,
        headers: {
            "X-Auth-Email": cfAccount,
            "X-Auth-Key": cfGlobalKey,
        },
        data: array,
        timeout: 1000 * 30,
    };
    try {
        const responseFromCF = await axios(axiosConfig);
        return responseFromCF;
    } catch (error) {
        logger("error", "util | cloudflare.js | createCFRules", `${error.message}`);
        return null;
    }
}
exports.updateCFRules = async (array) => {
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/firewall/rules`;
    const axiosConfig = {
        method: "POST",
        url: url,
        headers: {
            "X-Auth-Email": cfAccount,
            "X-Auth-Key": cfGlobalKey,
        },
        data: array,
        timeout: 1000 * 30,
    };
    try {
        const responseFromCF = await axios(axiosConfig);
        return responseFromCF;
    } catch (error) {
        logger("error", "util | cloudflare.js | createCFRules", `${error.message}`);
        return null;
    }
}
exports.deleteCFRules = async (id) => {
    let url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/firewall/rules/${id}`;
    let axiosConfig = {
        method: "DELETE",
        url: url,
        headers: {
            "X-Auth-Email": cfAccount,
            "X-Auth-Key": cfGlobalKey,
        },
        timeout: 1000 * 30,
    };
    try {
        const responseFromCF = await axios(axiosConfig);
        if (responseFromCF.data.success) {
            return responseFromCF.data.result;
        } else {
            logger("error", "util | cloudflare.js | deleteCFRules", `${JSON.stringify(responseFromCF.data)}`);
            return null;
        }
    } catch (error) {
        logger("error", "util | cloudflare.js | deleteCFRules", `${error.message}`);
        return null;
    }
}
exports.deleteCFFilters = async (id) => {
    let url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/filters/${id}`;
    let axiosConfig = {
        method: "DELETE",
        url: url,
        headers: {
            "X-Auth-Email": cfAccount,
            "X-Auth-Key": cfGlobalKey,
        },
        timeout: 1000 * 30,
    };
    try {
        const responseFromCF = await axios(axiosConfig);
        if (responseFromCF.data.success) {
            return responseFromCF.data.result;
        } else {
            logger("error", "util | cloudflare.js | deleteCFFilters", `${JSON.stringify(responseFromCF.data)}`);
            return null;
        }
    } catch (error) {
        logger("error", "util | cloudflare.js | deleteCFFilters", `${error.message}`);
        return null;
    }
}
exports.deleteBlockRules = async () => {
    try {
        let rules = await this.getCFRules();
        rules.forEach(async rule => {
            if (rule.description == "ALLOW_IPS") {
                await this.deleteCFRules(rule.id);
                await this.deleteCFFilters(rule.filter.id);
            }
        });

        if (rules.length == 0) {
            let array = [
                {
                    action: "block",
                    description: "Block_ALL_IP",
                    filter: {
                        expression: "(ip.src ne 0.0.0.0)",
                    },
                }
            ]
            await this.createCFRules(array)
        }

    } catch (error) {
        logger("error", "util | cloudflare.js | deleteBlockRules", `${error.message}`);
    }
}

const { Agent, sequelize } = require("../models");
const redisService = require("../services/redis");

exports.setAgentRedis = async () => {
    let agents = await Agent.findAll();

    for (const agent of agents) {
        const { id, agentCode } = agent;
        await redisService.setValue(`agentId:${id}`, agentCode); 
    }
}

exports.setStatisticData = async(key, data) => {
    await redisService.setValue(key, data); 
}

exports.getStatisticData = async(key) => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await redisService.getValue(key);
            
            resolve(JSON.parse(data));
            
        } catch (err) {
            reject(err);
        }
    });
}

exports.getParentPathCode = async (parentPath) => {

    return new Promise((resolve, reject) => {
        // parentPath                                              
        const ids = parentPath.match(/\d+/g) || [];

        //                                               agentCode                                     
        const agentCodes = [];
        let count = 0;

        //     id                                              ,                                          
        ids.forEach(async (id, index) => {
            try {
                const agentCode = await redisService.getValue(`agentId:${id}`);
                if (agentCode) {
                    agentCodes[index] = agentCode;
                }

                count++;
                if (count === ids.length) {
                    //        agentCode                                  
                    resolve(agentCodes.join(" / "));
                }
            } catch (err) {
                reject(err);
            }
        });
    });
}
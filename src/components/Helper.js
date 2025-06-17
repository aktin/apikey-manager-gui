import BrokerConnection from "./BrokerConnection.js";
const broker = new BrokerConnection();

class Helper{

    apiKeyList;

    async fetchlist()
    {
        this.apiKeyList = await broker.getApiKeys()
        console.log(this.apiKeyList)
        return this.formatIntoList(this.apiKeyList);
    }

    formatIntoList(textBlock)
    {
        return textBlock
            .trim()
            .split("\n")
            .map(element => {
                const [apiKey, , commonName, , organization, , location, status = "ACTIVE"] = element.split(/[=,]/);
                return {
                    ApiKey: apiKey,
                    CommonName: commonName,
                    Organization: organization,
                    Location: location,
                    Status: status
                };
            });
    }
}

export default Helper;
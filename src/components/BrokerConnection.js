class BrokerConnection {

    constructor() {
        if (BrokerConnection.instance) {
            return BrokerConnection.instance;
        }
        this.logs = [];
        BrokerConnection.instance = this;
    }

    #brokerUrl = ""; //     xxxAdmin1234
    #adminApiKey = ""; //   http://localhost:8080

    //TODO create session to broker

    getBrokerUrl() {
        return this.#brokerUrl;
    }

    setBrokerUrl(brokerUrl) {
        this.#brokerUrl = brokerUrl;
    }

    setAdminApiKey(adminApiKey) {
        this.#adminApiKey = adminApiKey;
    }

    async getBrokerStatus() {
        try {
            const response = await fetch(`${this.#brokerUrl}/broker/status`, {
                method: "GET",
            });
            return response.status;
        } catch (error) {
            console.error("Failed to reach broker:", error);
            return 500;
        }
    }

    async getApiKeys() {
        try {
            const response = await fetch(`${this.#brokerUrl}/api-keys`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.#adminApiKey}`,
                    "Content-Type": "application/json"
                },
            });
            const text = await response.text();
            return {
                status: response.status,
                data: text
            };
        } catch (error) {
            console.error("Failed to fetch API keys:", error);
            return {
                status: 0,
                data: ""
            };
        }
    }

    async addApiKeys(clinicCredentials) {
        try {
            const response = await fetch(`${this.#brokerUrl}/api-keys`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.#adminApiKey}`,
                    "Content-Type": "application/xml"
                },
                body: clinicCredentials
            });
            if (window.callVueFunction) window.callVueFunction();
            return response.status;
        } catch (error) {
            console.error("Failed to add API key:", error);
            return 500;
        }
    }

    async activateApiKey(apiKey) {
        return await this.#toggleApiKey(apiKey, "activate");
    }

    async deactivateApiKey(apiKey) {
        return await this.#toggleApiKey(apiKey, "deactivate");
    }

    async #toggleApiKey(apiKey, action) {
        try {
            await fetch(`${this.#brokerUrl}/api-keys/${apiKey}/${action}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.#adminApiKey}`
                },
            });
            if (window.callVueFunction) window.callVueFunction();
            return response.status;
        } catch (error) {
            console.error(`Failed to ${action} API key`, error);
            return 500;
        }
    }
}

const connector = new BrokerConnection();
Object.freeze(connector);

export default connector;
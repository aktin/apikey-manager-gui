class BrokerConnection {

    constructor() {
        if (BrokerConnection.instance) {
            return BrokerConnection.instance;
        }
        this.logs = [];
        this.credentials = {
            brokerUrl: '',
            adminApiKey: '',
            timerId: null,
        };
        BrokerConnection.instance = this;
    }

    #brokerURL = "";
    #adminApiKey = "";

    setCredentials(url, key) {
        this.credentials.brokerUrl = url;
        this.credentials.adminApiKey = key;

        clearTimeout(this.credentials.timerId);
        this.credentials.timerId = setTimeout(() => {
            this.credentials.brokerUrl = '';
            this.credentials.adminApiKey = '';
        }, 5 * 60 * 1000);

        this.#brokerURL = this.credentials.brokerUrl;
        this.#adminApiKey = this.credentials.adminApiKey;
    }

    getCredentials() {
        return {url: this.credentials.brokerUrl, key: this.credentials.adminApiKey}
    }

    async getBrokerStatus() {
        try {
            const response = await fetch(`${this.#brokerURL}/broker/status`, {
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
            const response = await fetch(`${this.#brokerURL}/api-keys`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.#adminApiKey}`,
                    "Content-Type": "application/json"
                },
            });
            const text = await response.text();
            return {
                status: response.status,
                data: text,
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
            const response = await fetch(`${this.#brokerURL}/api-keys`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.#adminApiKey}`,
                    "Content-Type": "application/xml"
                },
                body: clinicCredentials
            });
            if (window.callVueFunction) await window.callVueFunction();
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
            const response = await fetch(`${this.#brokerURL}/api-keys/${apiKey}/${action}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.#adminApiKey}`
                },
            });
            if (window.callVueFunction) await window.callVueFunction();
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
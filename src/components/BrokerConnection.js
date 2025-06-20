class BrokerConnection {

    //TODO make this whole class a Singleton to save memory.
    //What is a Singleton? -> Google is your friend


    //TODO create session to broker

    #brokerUrl = "http://localhost:8080";
    #adminApiKey = "xxxAdmin1234";

    getBrokerUrl() {
        return this.#brokerUrl;
    }

    async getBrokerStatus() {
        try {
            const response = await fetch(`${this.#brokerUrl}/broker/status`, {
                method: "GET",
            });
            return response.status;
        } catch (e) {
            console.error("Failed to reach broker:", e);
            return 0;
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
                mode: "cors" // TODO Remove me
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

export default BrokerConnection;
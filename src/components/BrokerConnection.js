class BrokerConnection {

    #brokerUrl = "http://localhost:8080";
    #adminApiKey = "xxxAdmin1234";

    getBrokerUrl() {
        return this.#brokerUrl;
    }

    async getBrokerStatus() {
        try {
            const response = await fetch(this.#brokerUrl + "/broker/status", {
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
            const response = await fetch(this.#brokerUrl + "/api-keys", {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + this.#adminApiKey,
                    "Content-Type": "application/json"
                },
                mode: "cors"
            });
            const text = await response.text();
            return {
                status: response.status,
                data: text
            };
        } catch (error) {
            console.error("Error fetching API keys:", error);
            return {
                status: 0,
                data: ""
            };
        }
    }


    async addApiKeys(ClinicCredentials) {

        fetch(this.#brokerUrl + "/api-keys", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + this.#adminApiKey, "Content-Type": "application/xml"
            },
            body: ClinicCredentials
        })
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => console.error("Error:", error))
    }

    async activateApiKey(apiKey) {
        fetch(this.#brokerUrl + "/api-keys/" + apiKey + "/activate", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + this.#adminApiKey
            },
        })
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => console.error("Error:", error))
    }

    async deactivateApiKey(apiKey) {
        fetch(this.#brokerUrl + "/api-keys/" + apiKey + "/deactivate", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + this.#adminApiKey
            },
        })
            .then(response => console.log(response))
            .catch(error => console.error("Error:", error))
    }
}
export default BrokerConnection;
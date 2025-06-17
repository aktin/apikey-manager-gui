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


    // TODO include vars instead of strings
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
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.text();
            if (data) {
                console.log(data)
                return data
            } else {
                return "List of Api keys is empty";
            }
        } catch (error) {
            console.error("Error:", error);
            return "error while trying to retrieve api keys";
        }
    }

    async addApiKeys(ClinicCredentials) {
        fetch(this.#brokerUrl + "/api-keys", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + this.#adminApiKey, "Content-Type": "application/xml"
            },
            body: JSON.stringify({ClinicCredentials})
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
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => console.error("Error:", error))
    }
}

export default BrokerConnection;
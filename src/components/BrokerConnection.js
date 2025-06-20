class BrokerConnection {

    //TODO make this whole class a Singleton to save memory.
    //What is a Singleton? -> Google is your friend

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
        try {
            const response = await fetch(this.#brokerUrl + "/api-keys", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + this.#adminApiKey,
                    "Content-Type": "application/xml"
                },
                body: ClinicCredentials
            });

            if (window.callVueFunction) {
                window.callVueFunction();
            }

            return response.status;
        } catch (error) {
            console.error("Error:", error); //TODO use descriptive error messages. What did fail here? -> The adding of the api key. So write that. Check how getBrokerStatus() does the console.log()
            return 500;
        }
    }

    //TODO summarize this into one function, everything but one string are identical in these methods
    async activateApiKey(apiKey) {
        fetch(this.#brokerUrl + "/api-keys/" + apiKey + "/activate", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + this.#adminApiKey
            },
        })
            .then(data => window.callVueFunction && window.callVueFunction())
            .catch(error => console.error("Error:", error)) //TODO Here too
    }

    async deactivateApiKey(apiKey) {
        fetch(this.#brokerUrl + "/api-keys/" + apiKey + "/deactivate", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + this.#adminApiKey
            },
        })
            .then(data => window.callVueFunction && window.callVueFunction())
            .catch(error => console.error("Error:", error)) //TODO Here too
    }
}
export default BrokerConnection;
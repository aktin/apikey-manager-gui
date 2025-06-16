class BrokerConnection {

//TODO make private vars
    #brokerUrl = "http://localhost:8080";
    #adminApiKey = "xxxAdmin1234";

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
            if (data)
            {
                return this.formatIntoList(data)
            }
            else
            {
            return "List of Api keys is empty";
            }
        } catch (error) {
            console.error("Error:", error);
            return "error while trying to retrieve api keys";
        }
    }

    async addApiKeys(ClinicCredentials) {
        fetch(this.#brokerUrl+"/api-keys", {
            method: "POST",
            headers: {
                "Authorization": "Bearer "+this.#adminApiKey, "Content-Type": "application/xml"
            },
            body: JSON.stringify({ClinicCredentials})
        })
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => console.error("Error:", error))
    }

    async activateApiKey(apiKey) {
        fetch(this.#brokerUrl+"/api-keys/"+apiKey+"/activate", {
            method: "POST",
            headers: {
                "Authorization": "Bearer "+this.#adminApiKey
            },
        })
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => console.error("Error:", error))
    }
    async deactivateApiKey(apiKey)
    {
        fetch(this.#brokerUrl+"/api-keys/"+apiKey+"/deactivate", {
            method: "POST",
            headers: {
                "Authorization": "Bearer "+this.#adminApiKey
            },
        })
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => console.error("Error:", error))
    }
    formatIntoList(textBlock)
    {
        return textBlock
            .trim()
            .split("\n")
            .map(element => {
                const [apiKey, , commonName, , organization, , location, status = "ACTIVE"] = element.split(/[=,]/);
                return { ApiKey: apiKey, CommonName: commonName, Organization: organization, Location: location, Status: status };
            });
    }
}

export default BrokerConnection;
class BrokerConnection {

//TODO make private vars
    brokerUrl = "http://localhost:8080";
    adminApiKey = "xxxAdmin1234";

    // TODO include vars instead of strings
    async getApiKeys() {
        fetch(this.brokerUrl+"/api-keys", {
            method: "GET",
            headers: {
                "Authorization": "Bearer "+this.adminApiKey, "Content-Type": "application/json"
            },
            mode: "cors"
        })
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => console.error("Error:", error));
    }

    async addApiKeys(ClinicCredentials) {
        fetch(this.brokerUrl+"/api-keys", {
            method: "POST",
            headers: {
                "Authorization": "Bearer "+this.adminApiKey, "Content-Type": "application/xml"
            },
            body: JSON.stringify({ClinicCredentials})
        })
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => console.error("Error:", error))
    }

    async activateApiKey(apiKey) {
        fetch(this.brokerUrl+"/api-keys/"+apiKey+"/activate", {
            method: "POST",
            headers: {
                "Authorization": "Bearer "+this.adminApiKey
            },
        })
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => console.error("Error:", error))
    }
    async deactivateApiKey(apiKey) {
        fetch(this.brokerUrl+"/api-keys/"+apiKey+"/deactivate", {
            method: "POST",
            headers: {
                "Authorization": "Bearer "+this.adminApiKey
            },
        })
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => console.error("Error:", error))
    }
}

export default BrokerConnection;

class BrokerConnection {

//TODO make private vars
    brokerUrl = "http://localhost:8080";
    adminApiKey = "xxxAdmin1234";

    // TODO include vars instead of strings
    async create() {
        fetch("http://localhost:8080/api-keys", {
            method: "GET",
            headers: {
                "Authorization": "Bearer xxxAdmin1234", "Content-Type": "application/json"
            },
            mode: "cors"
        })
            .then(response => response.text())
            .then(data => console.log(data))
            .catch(error => console.error("Error:", error));
    }
}

export default BrokerConnection;

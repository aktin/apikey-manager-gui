class ApiKeyDTO:

    def __init__(self, api_key, clientDN):
        self.api_key = api_key
        self.clientDN = clientDN

    def get_api_key(self):
        return self.api_key

    def get_clientDN(self):
        return self.clientDN

    def set_api_key(self, api_key):
        self.api_key = api_key

    def set_clientDN(self, clientDN):
        self.clientDN = clientDN
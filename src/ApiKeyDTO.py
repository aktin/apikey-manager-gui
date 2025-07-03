class ApiKeyDTO:

    def __init__(self, api_key: str, clientDN: str):
        self.api_key = api_key
        self.clientDN = clientDN

    def get_api_key(self) -> str:
        return self.api_key

    def set_api_key(self, api_key):
        self.api_key = api_key

    def get_clientDN(self) -> str:
        return self.clientDN

    def set_clientDN(self, clientDN):
        self.clientDN = clientDN

# TODO  add validation
import unittest

from src.ApiKeyManager import app


class AddApiKeyTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_add_api_key(self):
        payload = "<ApiKeyCred><apiKey>xxxApiKey1111</apiKey><clientDn>CN=CommonName,O=Organization,L=Location</clientDn></ApiKeyCred>"
        response = self.client.post(
            "/api-keys",
            json=payload,
            content_type="application/json"
        )
        print("Response status:", response.status_code)
        print("Response body:", response.data.decode())
        self.assertEqual(response.status_code, 200)

    def test_add_api_key_with_no_api_key(self):
        payload = "<ApiKeyCred><clientDn>CN=CommonName,O=Organization,L=Location</clientDn></ApiKeyCred>"
        response = self.client.post(
            "/api-keys",
            json=payload,
            content_type="application/json"
        )
        print("Response status:", response.status_code)
        print("Response body:", response.data.decode())
        self.assertEqual(response.status_code, 200)


        # api key without clientDN

        # sent an apikey twice

        # sent admin apikey

if __name__ == "__main__":
    unittest.main()

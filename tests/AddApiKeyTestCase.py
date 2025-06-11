import subprocess
import time
import unittest

from src.ApiKeyManager import app


class AddApiKeyTestCase(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.container_name = "test-aktin-broker"
        subprocess.run([
            "docker", "run", "-d",
            "--name", cls.container_name,
            "-p", "8080:8080",
            "ghcr.io/aktin/aktin-broker:1.5.2"
        ], check=True)
        time.sleep(2)

    @classmethod
    def tearDownClass(cls):
        subprocess.run(["docker", "rm", "-f", cls.container_name], check=True)

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

    def test_add_api_key_with_no_client_dn(self):
        payload = "<ApiKeyCred><apiKey>xxxApiKey1234</apiKey></ApiKeyCred>"
        response = self.client.post(
            "/api-keys",
            json=payload,
            content_type="application/json"
        )
        print("Response status:", response.status_code)
        print("Response body:", response.data.decode())
        self.assertEqual(response.status_code, 200)

    def test_add_api_key_with_empty_api_key(self):
        payload = "<ApiKeyCred><apiKey></apiKey><clientDn>CN=CommonName,O=Organization,L=Location</clientDn></ApiKeyCred>"
        response = self.client.post(
            "/api-keys",
            json=payload,
            content_type="application/json"
        )
        print("Response status:", response.status_code)
        print("Response body:", response.data.decode())
        self.assertEqual(response.status_code, 200)

        # sent an apikey twice

        # sent admin apikey


if __name__ == "__main__":
    unittest.main()

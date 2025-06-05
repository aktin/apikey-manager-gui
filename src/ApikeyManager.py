from flask import Flask, render_template, jsonify
from flaskwebgui import FlaskUI
import requests

from src.ApiKeyDTO import ApiKeyDTO

app = Flask(__name__)

apiKeyDTO = ApiKeyDTO("xxxB","abc")

headers = {"Authorization": "Bearer xxxAdmin1234"}

@app.route('/api-keys', methods=['GET'])
def get_api_keys():
    url = "http://localhost:8080/api-keys"
    try:
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        return jsonify(response.text)
    except requests.exceptions.RequestException as e:
        raise Exception(e)

@app.route('/api-keys', methods=['POST'])
def add_api_key():
    head = { "Content-Type": "application/xml"}
    url = "http://localhost:8080/api-keys"
    xml_data=f"<ApiKeyCred><apiKey>{apiKeyDTO.get_api_key()}</apiKey><clientDn>{apiKeyDTO.get_clientDN()}</clientDn></ApiKeyCred>"
    response = requests.post(url, headers=head, data=xml_data, timeout=5)
    response.raise_for_status()

@app.route('/api-keys-activate', methods=['POST'])
def activate_api_key():
    url = f"http://localhost:8080/api-keys/{apiKeyDTO.get_api_key()}/activate"
    response = requests.post(url, headers=headers, timeout=5)
    response.raise_for_status()

@app.route('/api-keys-deactivate', methods=['POST'])
def deactivate_api_key():
    url = f"http://localhost:8080/api-keys/{apiKeyDTO.get_api_key()}/deactivate"
    response = requests.post(url, headers=headers, timeout=5)
    response.raise_for_status()

@app.route("/")
def home():
    return render_template("index.html")

if __name__ == '__main__':
    FlaskUI(app=app, server="flask").run()
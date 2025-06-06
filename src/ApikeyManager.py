import json

from flask import Flask, render_template, jsonify, request
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
    data = request.get_json()
    head = {"Authorization": "Bearer xxxAdmin1234", "Content-Type": "application/xml"}
    url = "http://localhost:8080/api-keys"
    response = requests.post(url, headers=head, data=data, timeout=5)
    response.raise_for_status()

@app.route('/api-keys-activate', methods=['POST'])
def activate_api_key():
    data = json.dumps(request.get_json())
    data_clean = data.replace('"',"")
    url = "http://localhost:8080/api-keys/"+data_clean+"/activate"
    response = requests.post(url, headers=headers, timeout=5)
    response.raise_for_status()

@app.route('/api-keys-deactivate', methods=['POST'])
def deactivate_api_key():
    data = json.dumps(request.get_json())
    data_clean = data.replace('"',"")
    url = "http://localhost:8080/api-keys/"+data_clean+"/deactivate"
    response = requests.post(url, headers=headers, timeout=5)
    response.raise_for_status()

@app.route("/")
def home():
    return render_template("index.html")

if __name__ == '__main__':
    FlaskUI(app=app, server="flask").run()
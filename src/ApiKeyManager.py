import json

import requests
from flask import Flask, render_template, jsonify, request
from flaskwebgui import FlaskUI

from src.ApiKeyDTO import ApiKeyDTO

app = Flask(__name__)

api_key_dto = ApiKeyDTO("xxxB", "abc")

broker_url = "http://localhost:8080"
admin_api_key = "xxxAdmin1234"

response_timeout = 5


def append_to_default_header(item: dict = None) -> dict:
    auth = {"Authorization": f"Bearer {admin_api_key}"}
    if item:
        auth.update(item)
    return auth


@app.route('/api-keys', methods=['GET'])
def get_api_keys():
    url = f"{broker_url}/api-keys"
    response = requests.get(url, headers=append_to_default_header(), timeout=response_timeout)
    response.raise_for_status()
    return jsonify(response.text)


@app.route('/api-keys', methods=['POST'])
def add_api_key():
    data = request.get_json()
    ###
    print(data)
    print(request.get_json)
    ###
    url = f"{broker_url}/api-keys"
    response = requests.post(url, headers=append_to_default_header({"Content-Type": "application/xml"}), data=data, timeout=response_timeout)
    response.raise_for_status()

#TODO check is json.dumps really necessary
@app.route('/api-keys-activate', methods=['POST'])
def activate_api_key():
    data = json.dumps(request.get_json())
    clean_api_key = data.replace('"', "")
    url = f"{broker_url}/api-keys/{clean_api_key}/activate"
    response = requests.post(url, headers=append_to_default_header(), timeout=response_timeout)
    response.raise_for_status()


#TODO check is json.dumps really necessary
@app.route('/api-keys-deactivate', methods=['POST'])
def deactivate_api_key():
    data = json.dumps(request.get_json())
    clean_api_key = data.replace('"', "")
    url = f"{broker_url}/api-keys/{clean_api_key}/deactivate"
    response = requests.post(url, headers=append_to_default_header(), timeout=response_timeout)
    response.raise_for_status()


@app.route("/")
def home():
    return render_template("index.html")


if __name__ == "__main__":
    FlaskUI(app=app, server="flask").run()

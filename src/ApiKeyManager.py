import json

import requests
from flask import Flask, render_template, jsonify, request ,Response
from flaskwebgui import FlaskUI

from src.ApiKeyDTO import ApiKeyDTO

# TODO check if reusable sessions are helpful here:
# session = requests.Session()
# session.headers.update(create_basic_header(...))

app = Flask(__name__)

api_key_dto = ApiKeyDTO("xxxB", "abc")

broker_url = "http://localhost:8080"
admin_api_key = "xxxAdmin1234"

response_timeout = 5


def append_to_default_header(appendices: dict = None) -> dict:
    auth = {"Authorization": f"Bearer {admin_api_key}"}
    if appendices:
        auth.update(appendices)
    return auth

@app.route('/api-keys', methods=['GET'])
def get_api_keys():
    url = f"{broker_url}/api-keys"
    response = requests.get(url, headers=append_to_default_header({"Accept": "application/txt"}), timeout=response_timeout)
    response.raise_for_status()
    return Response(response.content, content_type="application/text; charset=ISO-8859-1")

@app.route('/api-keys', methods=['POST'])
def add_api_key():
    data = request.get_json()
    url = f"{broker_url}/api-keys"
    response = requests.post(url, headers=append_to_default_header({"Content-Type": "application/xml"}), data=data, timeout=response_timeout)
    print(response)
    #response.raise_for_status()
    return response.text

@app.route('/activate', methods=['POST'])
def activate_api_key():
    api_key = request.get_json()
    url = f"{broker_url}/api-keys/{api_key}/activate"
    requests.post(url, headers=append_to_default_header(), timeout=response_timeout)
    return "", 200

@app.route('/deactivate', methods=['POST'])
def deactivate_api_key():
    api_key = request.get_json()
    url = f"{broker_url}/api-keys/{api_key}/deactivate"
    requests.post(url, headers=append_to_default_header(), timeout=response_timeout)
    return "", 200


@app.route("/")
def home():
    return render_template("index.html")

if __name__ == "__main__":
    FlaskUI(app=app, server="flask").run()
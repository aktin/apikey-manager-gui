import json
import re

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

def check_apiKey(ApiKeyCred):
    try:
        apikey = re.search(r"<apiKey>(.*?)</apiKey>",ApiKeyCred).group(1)
        if apikey:
            if len(apikey) == 12:
                return ""
            else:
                return "apikey is not 12 characters"
        else:
            return "no apikey found"
    except AttributeError:
        return "ApiKey has wrong format"

def check_clientDN(ApiKeyCred):
    try:
        clientDN = re.search(r"<clientDn>(.*?)</clientDn>",ApiKeyCred).group(1)
        if clientDN:
            return ""
        else:
            return "no clientDn found"
    except AttributeError:
        return "ApiKey has wrong format"

def check_common_name(ApiKeyCred):
    try:
        commonName = re.search(r"CN=(.*?),O=",ApiKeyCred).group(1)
        if commonName:
            return ""
        else:
            return "no Common name found"
    except AttributeError:
        return "ApiKey has wrong format"

def check_organization(ApiKeyCred):
    try:
        organization = re.search(r"O=(.*?),L=",ApiKeyCred).group(1)
        if organization:
            return ""
        else:
            return "no Organization found"
    except AttributeError:
        return "ApiKey has wrong format"

def check_location(ApiKeyCred):
    try:
        location = re.search(r"L=(.*?)</clientDn>",ApiKeyCred).group(1)
        if location:
            return ""
        else:
            return "no Location found"
    except AttributeError:
        return "ApiKey has wrong format"

@app.route('/api-keys', methods=['GET'])
def get_api_keys():
    url = f"{broker_url}/api-keys"
    response = requests.get(url, headers=append_to_default_header({"Accept": "application/txt"}), timeout=response_timeout)
    response.raise_for_status()
    return Response(response.content, content_type="application/text; charset=ISO-8859-1")

@app.route('/api-keys', methods=['POST'])
def add_api_key():
    data = request.get_json()
    print(str(data))
    url = f"{broker_url}/api-keys"
    apikey = check_apiKey(data)
    client_dn = check_clientDN(data)
    common_name = check_common_name(data)
    organization = check_organization(data)
    location = check_location(data)
    if apikey != "":
        return apikey,400
    if client_dn != "":
        return client_dn,400
    if common_name != "":
        return common_name,400
    if organization != "":
        return organization,400
    if location != "":
        return location,400
    response = requests.post(url, headers=append_to_default_header({"Content-Type": "application/xml"}), data=data, timeout=response_timeout)
    response.raise_for_status()
    return response.text

@app.route('/activate', methods=['POST'])
def activate_api_key():
    api_key = request.get_json()
    url = f"{broker_url}/api-keys/{api_key}/activate"
    response = requests.post(url, headers=append_to_default_header(), timeout=response_timeout)
    response.raise_for_status()
    return response.text

@app.route('/deactivate', methods=['POST'])
def deactivate_api_key():
    api_key = request.get_json()
    url = f"{broker_url}/api-keys/{api_key}/deactivate"
    response = requests.post(url, headers=append_to_default_header(), timeout=response_timeout)
    response.raise_for_status()
    return response.text

@app.route("/")
def home():
    return render_template("index.html")

if __name__ == "__main__":
    FlaskUI(app=app, server="flask").run()
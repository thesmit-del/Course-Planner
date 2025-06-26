import ssl
import socket
from urllib.parse import urlparse
import requests
from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify
from flask_cors import CORS   

load_dotenv()  # reads .env
VT_API_KEY = os.getenv("VT_API_KEY")


app = Flask(__name__)
CORS(app)                         # allow *all* origins during dev

def analyse_url(url, parsed_url):
    result = {}
    result['is_https'] = parsed_url.scheme == 'https'
    result["is_ssl_valid"] = check_ssl(parsed_url)
    result['url_length'] = len(url)
    result['domain'] = parsed_url.netloc
    statistics = check_virustotal(url)
    if(statistics == False):
        result["stats"] = None
    else:
        result["stats"] = statistics

    return result
    # other checks by trusted websites for blacklisted urls
    # check for multiple redirects
    # try analysiing page content

def check_ssl(parsed_url):
    # parsed = urlparse(parsed_url)

    try:
        context = ssl.create_default_context() # automatically checks for certificate validity, hostname and trusted Certificate Authorities
        with context.wrap_socket(socket.socket(), server_hostname=parsed_url.netloc) as s: # with statement wnsures socket is automatically closed
            s.connect((parsed_url.netloc, 443))
            cert = s.getpeercert() #returns a dictionary containing certificate info, if invalid it raises an excception
            return True
    except:
        return False
    
def check_virustotal(sample_url):
    url = "https://www.virustotal.com/api/v3/urls"

    payload = { "url": sample_url }
    headers = {
        "accept": "application/json",
        "x-apikey": VT_API_KEY,
        "content-type": "application/x-www-form-urlencoded"
    }

    response = requests.post(url, data=payload, headers=headers)

    analysis_id = response.json()['data']["id"]
    url_analysis = "https://www.virustotal.com/api/v3/analyses/" + analysis_id

    headers = {
        "accept": "application/json",
        "x-apikey": VT_API_KEY
    }

    response = requests.get(url_analysis, headers=headers)

    status = response.json()["data"]["attributes"]["status"] == "completed"
    stats = response.json()["data"]["attributes"]["stats"]

    # print(status)
    if(status): #returns statistics or false as error flag
        return stats
    else:
        return status


# sample_url = "https://www.google.com/"
# parsed_url = urlparse(sample_url)


# results = analyse_url(sample_url, parsed_url)

# if(results["is_https"] == False or results["is_ssl_valid"] == False or results["stats"]["malicious"] > 0 or results["stats"]["suspicious"] > 0):
#     print("Malicious Activity Suspected")
# else:
#     print("No Malicious Activity Detected")


@app.post("/geturl")
def check():
    data = request.get_json(force=True)
    url = data.get("url", "")
    return jsonify(analyse_url(url, urlparse(url)))

if __name__ == "__main__":
    app.run(debug=True, port=5000)

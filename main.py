import ssl
import socket
from urllib.parse import urlparse
import requests
from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify
from flask_cors import CORS   
import time

load_dotenv()  # reads .env
VT_API_KEY = os.getenv("VT_API_KEY")

app = Flask(__name__)
CORS(app,
     origins="*",
     supports_credentials=True,
     allow_headers="*",
     methods=["GET", "POST", "OPTIONS"]
)

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
    import base64

    # VirusTotal uses the URL-encoded ID as key
    url_id = base64.urlsafe_b64encode(sample_url.encode()).decode().strip("=")

    # First: try to get an existing report
    url_report = f"https://www.virustotal.com/api/v3/urls/{url_id}"
    headers = {"accept": "application/json", "x-apikey": VT_API_KEY}

    report_resp = requests.get(url_report, headers=headers)
    if report_resp.status_code == 200:
        print(f"✅ [DEBUG] Found cached report for {sample_url}")
        data = report_resp.json()
        return data["data"]["attributes"]["last_analysis_stats"]

    # If no existing report, POST to scan
    print(f"🚀 [DEBUG] Submitting new scan for {sample_url}")
    scan_resp = requests.post(
        "https://www.virustotal.com/api/v3/urls",
        data={"url": sample_url},
        headers={
            "accept": "application/json",
            "x-apikey": VT_API_KEY,
            "content-type": "application/x-www-form-urlencoded"
        }
    )

    if scan_resp.status_code != 200:
        print(f"❌ VirusTotal POST error: {scan_resp.json()}")
        return None

    analysis_id = scan_resp.json()["data"]["id"]
    url_analysis = f"https://www.virustotal.com/api/v3/analyses/{analysis_id}"

    # poll for results
    for _ in range(10):
        analysis_resp = requests.get(url_analysis, headers=headers).json()
        status = analysis_resp["data"]["attributes"]["status"]
        print(f"⬅️ [DEBUG] Analysis poll status: {status}")
        if status == "completed":
            return analysis_resp["data"]["attributes"]["stats"]
        time.sleep(1)

    # fallback if poll never completes
    return {"malicious": 0, "suspicious": 0, "harmless": 0, "timeout": 0, "undetected": 0}

@app.post("/geturl")
def check():
    data = request.get_json(force=True)
    url = data.get("url", "")
    return jsonify(analyse_url(url, urlparse(url)))

if __name__ == "__main__":
    app.run(debug=True, port=5000)

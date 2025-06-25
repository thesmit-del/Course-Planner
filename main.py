import ssl
import socket
from urllib.parse import urlparse
import requests
from dotenv import load_dotenv
import os

load_dotenv()  # reads .env
VT_API_KEY = os.getenv("VT_API_KEY")

def analyse_url(url, parsed_url):
    result = {}
    result['is_https'] = parsed_url.scheme == 'https'
    result["is_ssl_valid"] = check_ssl(url)
    result['url_length'] = len(url)
    result['domain'] = parsed_url.netloc
    statistics = check_virustotal(url)
    if(statistics == False):
        result["stats"] = {}
    else:
        result["stats"] = statistics

    return result
    # other checks by trusted websites for blacklisted urls
    # check for multiple redirects
    # try analysiing page content

# urlparse breaks down the url into an object like:
#                                                    ParseResult(
#                                                        scheme='https', 
#                                                        netloc='example.com:8080', 
#                                                        path='/path/to/page', 
#                                                        params='', 
#                                                        query='query=python', 
#                                                        fragment='section'
#                                                    )
def check_ssl(url):
    parsed = urlparse(url)

    try:
        context = ssl.create_default_context() # automatically checks for certificate validity, hostname and trusted Certificate Authorities
        with context.wrap_socket(socket.socket(), server_hostname=parsed.netloc) as s: # with statement wnsures socket is automatically closed
            s.connect((parsed.netloc, 443))
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


sample_url = "https://www.google.com/"
parsed_url = urlparse(sample_url)


print(analyse_url(sample_url, parsed_url))


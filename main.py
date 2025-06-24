import ssl
import socket
from urllib.parse import urlparse
import requests

sample_url = "https://www.google.com/"

def analyse_url(url):
    pass
















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

# Depends on the `arxiv` module, which can be installed with
#     pip install arxiv
# More info on the API:
# - https://pypi.org/project/arxiv/
# - https://info.arxiv.org/help/api/index.html

import arxiv
import json
import re
import os
import sys

def extract_arxiv_id(url):
    # https://info.arxiv.org/help/arxiv_identifier.html
    
    # Identifier scheme since 1 April 2007
    new_scheme = r'\d{4}\.\d+(v\d+)?'
    # Identifiers up to March 2007
    old_scheme = r'([\w\.-]+/\d{4}\d+)'
    
    # Check for matches against the two schemes
    for pattern in (new_scheme, old_scheme):
        match = re.search(pattern, url)
        if match:
            article_id = match.group(0)
            return article_id
    
    # If no match is found, return None
    return None

def get_arxiv_paper(url):
    # https://pypi.org/project/arxiv/
    
    # Extract the article id
    article_id = extract_arxiv_id(url)
    # Stop if we can't find a valid id
    if article_id is None:
        return None
    
    # Let's see if the id matches an actual article
    try:
        # Use API to find the article
        search = arxiv.Search(id_list=[article_id])
        paper = next(search.results())
        return paper
    except:
        # Article doesn't exist, or API is down, or something else.
        return None

def ensure_path_exists(path):
    if not os.path.exists(path):
        os.mkdir(path)

def save_pdf(paper):
	# Save the paper's pdf to ./papers/
	
	# This directory is relative to the project root
    path = './fs/py/'
    ensure_path_exists(path)
    pdf_path = paper.download_pdf(path)
    return pdf_path

def get_arxiv_data():
	# Gets the article's title, authors, summary and saves its pdf,
	# converts that data to json (as for the pdf, only its save path
	# goes in the json), and prints the json string.
	
    arguments = sys.argv[1:]
    
    if len(arguments) == 0:
    	raise TypeError('Received no arguments.')
    
    url = arguments[0]

    paper = get_arxiv_paper(url)

    # Get data from the paper
    data = {}

    data['title'] = paper.title

    data['authors'] = [
        str(author) for author in paper.authors
    ]

    data['summary'] = paper.summary

    pdf_path = save_pdf(paper)
    data['pdf_path'] = pdf_path
    
    return data

def main():
	try:
		data = get_arxiv_data()
	except Exception as error:
		data = {
			'error' : {
				'type': type(error).__name__,
				'description': str(error)
			}
		}
	
	print(json.dumps(data))

main()


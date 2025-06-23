import requests
from bs4 import BeautifulSoup
import json
import re

base_url = "https://umanitoba-ca-preview.courseleaf.com"
main_url = base_url + "/undergraduate-studies/science/computer-science/computer-science-bcsc-honours/index.html#degreerequirementstext"

# Get the main degree page
res = requests.get(main_url)
soup = BeautifulSoup(res.text, 'html.parser')

# Find all table rows with courses
rows = soup.select('table.sc_plangrid tr')

course_data = []

for row in rows:
    code_td = row.find('td', class_='codecol')
    title_td = row.find('td', class_='titlecol')
    hours_td = row.find('td', class_='hourscol')
    
    if code_td and title_td and hours_td:
        code = re.sub(r"\s+", " ", code_td.get_text(separator=" ", strip=True)).strip()

        # Remove all <sup> tags from the title_td
        for sup in title_td.find_all('sup'):
            sup.decompose()

        # Extract text and remove Unicode superscript digits
        title_full = re.sub(r"\s+", " ", title_td.get_text(separator=" ", strip=True)).strip()
        title_full = re.sub(r"[¹²³⁴⁵⁶⁷⁸⁹⁰]", "", title_full)

        # Extract min grade if found in title, otherwise default to "C"
        grade_match = re.search(r"\((.*?)\)", title_full)
        min_grade = grade_match.group(1).strip() if grade_match else "C"

        # Remove (grade) from title
        title = re.sub(r"\s*\(.*?\)", "", title_full).strip()

        # Extract credit hours
        credit_hours = hours_td.get_text(strip=True)

        # Try to find the course page link
        link = code_td.find('a')
        if link:
            course_url = base_url + link['href']
            course_res = requests.get(course_url)
            course_soup = BeautifulSoup(course_res.text, 'html.parser')
            
            # Search for prerequisite text
            prereq_text = "None"
            paragraphs = course_soup.select('p')
            for p in paragraphs:
                if 'Prerequisite' in p.text:
                    prereq_text = p.text.strip()
                    break
        else:
            prereq_text = "None"

        course_data.append({
            "code": code,
            "name": title,
            "min_grade": min_grade,
            "prerequisite": prereq_text,
            "credit_hours": credit_hours
        })

# Save to JSON
with open("courses.json", "w") as f:
    json.dump(course_data, f, indent=2)

print("Saved to courses.json")

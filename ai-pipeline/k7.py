import json
import ollama
import psycopg

from pgvector.psycopg import register_vector
from sentence_transformers import SentenceTransformer


# Database
DB_NAME = "civicsolve"
DB_USER = "postgres"
DB_PASSWORD = "Pp@170306"
DB_HOST = "localhost"
DB_PORT = 5432


# Test reports
reports = [
    {
        "text": "There is a large pothole on the main road near the market.",
        "latitude": 12.9716,
        "longitude": 77.5946
    },
    {
        "text": "The streetlights in our neighborhood have been off for several nights.",
        "latitude": 12.9720,
        "longitude": 77.5949
    },
    {
        "text": "A water pipeline has been leaking continuously beside our residential area.",
        "latitude": 12.9718,
        "longitude": 77.5947
    },
    {
        "text": "Garbage has not been collected from our neighborhood for almost a week.",
        "latitude": 12.9713,
        "longitude": 77.5944
    },
    {
        "text": "The road near the bus stop gets flooded during heavy rainfall.",
        "latitude": 12.9715,
        "longitude": 77.5945
    },
    {
        "text": "Our electricity bills have increased sharply even though our household usage has not changed much.",
        "latitude": 12.9800,
        "longitude": 77.6000
    },
    {
        "text": "The bridge connecting our village to the highway has developed cracks and visible rust.",
        "latitude": 12.9600,
        "longitude": 77.5800
    },
    {
        "text": "Farmers in our area are losing crops because of an unknown plant disease.",
        "latitude": 12.9400,
        "longitude": 77.5600
    },
    {
        "text": "There is very low water pressure in our area every morning.",
        "latitude": 12.9500,
        "longitude": 77.5800
    },
    {
        "text": "The traffic signal at the main junction frequently stops working.",
        "latitude": 12.9650,
        "longitude": 77.5900
    },
    {
        "text": "Buses on our route are very irregular and often arrive much later than scheduled.",
        "latitude": 12.9750,
        "longitude": 77.6100
    },
    {
        "text": "Smoke from the nearby industrial area is causing severe air pollution in our neighborhood.",
        "latitude": 12.9300,
        "longitude": 77.5500
    },
    {
        "text": "The drainage beside our street is blocked and dirty water is overflowing onto the road.",
        "latitude": 12.9680,
        "longitude": 77.5920
    },
    {
        "text": "The public tap has been supplying muddy water for the last several days.",
        "latitude": 12.9580,
        "longitude": 77.5700
    },
    {
        "text": "The local government health center is overcrowded and patients have to wait for many hours.",
        "latitude": 12.9450,
        "longitude": 77.5650
    }
]


# Fixed civic domains
DOMAINS = [
    "Road Infrastructure",
    "Water Supply",
    "Water Quality",
    "Waste Management",
    "Public Lighting",
    "Drainage and Flooding",
    "Public Transport",
    "Traffic Management",
    "Public Safety",
    "Environment",
    "Pollution",
    "Healthcare",
    "Education",
    "Agriculture",
    "Energy",
    "Public Facilities",
    "Housing",
    "Sanitation",
    "Disaster Management",
    "Communication",
    "Other"
]


# Major student branches
RESPONSIBLE_FIELDS = [
    "Computer Science and Engineering",
    "Information Technology",
    "Artificial Intelligence and Machine Learning",
    "Data Science",
    "Cyber Security",
    "Electronics and Communication Engineering",
    "Electrical Engineering",
    "Instrumentation and Control Engineering",
    "Mechanical Engineering",
    "Automobile Engineering",
    "Mechatronics Engineering",
    "Robotics and Automation",
    "Civil Engineering",
    "Environmental Engineering",
    "Chemical Engineering",
    "Biotechnology",
    "Biomedical Engineering",
    "Agricultural Engineering",
    "Food Technology",
    "Metallurgical and Materials Engineering",
    "Mining Engineering",
    "Aerospace and Aeronautical Engineering",
    "Architecture",
    "Other"
]


# Load embedding model
print("Loading embedding model...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


# Connect database
print("Connecting to PostgreSQL...")

conn = psycopg.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT
)

register_vector(conn)

print("Connected successfully.")


# Create table
with conn.cursor() as cur:

    cur.execute(
        "CREATE EXTENSION IF NOT EXISTS vector;"
    )

    cur.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id SERIAL PRIMARY KEY,
            report_text TEXT NOT NULL,
            problem_title TEXT,
            problem_description TEXT,
            domain TEXT,
            responsible_fields TEXT[],
            severity TEXT,
            confidence DOUBLE PRECISION,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            embedding VECTOR(384)
        );
    """)

conn.commit()


def classify_problem(text):

    domains = ", ".join(DOMAINS)
    fields = ", ".join(RESPONSIBLE_FIELDS)

    prompt = f"""
You are the civic problem analysis engine for CivicSolve AI.

A citizen reports a real-world problem.

Your job is to convert the citizen's natural-language report
into a small, accurate, structured description.

The citizen may describe:
- a physical problem
- a service problem
- an environmental problem
- a health or education problem
- an infrastructure problem
- a problem that could later lead to a technology project

Do NOT assume that the citizen wants technology.

First understand WHAT THE CITIZEN IS REPORTING.

Do not invent facts that are not present in the report.

============================================================
DOMAIN
============================================================

Select exactly ONE domain from this list:

{domains}

Choose the domain that best represents the MAIN problem.

Do not choose a generic domain such as Public Facilities
when a more specific domain is available.

============================================================
RESPONSIBLE FIELDS
============================================================

Select one or more fields from this list:

{fields}

These fields mean:

"Which student academic branches would genuinely be needed
to BUILD a practical solution or project for this problem?"

This is NOT asking:
- which branch is related to the physical object
- which branch studies the problem
- which government department handles the problem

Select ONLY the minimum branches genuinely required
for building the solution.

Examples of reasoning:

If the solution is mainly a website, application,
database, dashboard or software system:
→ Computer Science and Engineering

If the solution is mainly a prediction, classification,
computer vision or machine learning system:
→ Artificial Intelligence and Machine Learning
or Data Science
or Computer Science and Engineering

If a solution needs sensors or embedded electronics:
→ Electronics and Communication Engineering

If it needs electrical hardware or power engineering:
→ Electrical Engineering

If it needs physical structure, construction or civil design:
→ Civil Engineering

If it needs material analysis or corrosion expertise:
→ Metallurgical and Materials Engineering

If it needs biological expertise:
→ Biotechnology

If it needs agricultural expertise:
→ Agricultural Engineering

A project may require multiple fields.

Example:
Electricity consumption prediction using smart
electronic measurements:
→ Computer Science and Engineering
→ Electronics and Communication Engineering

Example:
Image-based pothole detection website:
→ Computer Science and Engineering

Do NOT add Civil Engineering just because the
problem itself is a road problem.

Do NOT add ECE unless electronics, sensors,
embedded systems, communication hardware or similar
work is actually needed.

Do NOT add Data Science and AI/ML together unless
there is a genuine reason for both.

Use the smallest meaningful set of branches.

If no listed engineering or academic branch is genuinely
needed to build a solution, use:
Other

============================================================
SEVERITY
============================================================

Choose exactly one:

LOW
MEDIUM
HIGH
CRITICAL

Severity must be based only on information present
in the citizen report.

Do not assume a high severity without evidence.

============================================================
CONFIDENCE
============================================================

Return a number between 0 and 1 representing how confident
you are that the structured classification is correct.

============================================================
IMPORTANT RULES
============================================================

1. Understand the citizen's actual problem.
2. Do not invent a solution.
3. Do not invent facts.
4. Do not invent causes.
5. Do not invent impacts.
6. Keep the title short.
7. Keep the description factual.
8. Select exactly one domain.
9. Select one or more genuinely required fields.
10. Use the minimum required fields.
11. Do not use generic fields unnecessarily.
12. Use only the predefined values.
13. Return only valid JSON.

============================================================
CITIZEN REPORT
============================================================

{text}

============================================================
RETURN
============================================================

{{
    "problem_title": "short clear problem name",
    "problem_description": "clear factual description",
    "domain": "one predefined domain",
    "responsible_fields": [
        "minimum required fields"
    ],
    "severity": "LOW",
    "confidence": 0.90
}}
"""

    response = ollama.chat(
        model="llama3.2:3b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        format="json"
    )

    raw = response["message"]["content"].strip()

    try:
        result = json.loads(raw)

    except json.JSONDecodeError:

        start = raw.find("{")
        end = raw.rfind("}")

        if start != -1 and end != -1:

            try:
                result = json.loads(
                    raw[start:end + 1]
                )

            except json.JSONDecodeError:
                result = {}

        else:
            result = {}


    # Validate domain
    if result.get("domain") not in DOMAINS:
        result["domain"] = "Other"


    # Validate responsible fields
    fields_result = result.get(
        "responsible_fields",
        []
    )

    if not isinstance(fields_result, list):
        fields_result = [fields_result]

    valid_fields = []

    for field in fields_result:

        if field in RESPONSIBLE_FIELDS:
            if field not in valid_fields:
                valid_fields.append(field)

    if not valid_fields:
        valid_fields = ["Other"]

    result["responsible_fields"] = valid_fields


    # Validate severity
    if result.get("severity") not in [
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"
    ]:
        result["severity"] = "MEDIUM"


    # Validate confidence
    try:
        result["confidence"] = float(
            result.get("confidence", 0.5)
        )

    except (TypeError, ValueError):
        result["confidence"] = 0.5

    result["confidence"] = max(
        0.0,
        min(1.0, result["confidence"])
    )


    # Defaults
    if not result.get("problem_title"):
        result["problem_title"] = "Unspecified Civic Problem"

    if not result.get("problem_description"):
        result["problem_description"] = text


    return result


# Insert reports
print("\n========== INSERTING REPORTS ==========\n")

for report in reports:

    report_text = report["text"]
    latitude = report["latitude"]
    longitude = report["longitude"]

    analysis = classify_problem(report_text)

    embedding = embedding_model.encode(
        report_text,
        convert_to_numpy=True
    )

    with conn.cursor() as cur:

        cur.execute(
            """
            INSERT INTO reports (
                report_text,
                problem_title,
                problem_description,
                domain,
                responsible_fields,
                severity,
                confidence,
                latitude,
                longitude,
                embedding
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s
            )
            """,
            (
                report_text,
                analysis["problem_title"],
                analysis["problem_description"],
                analysis["domain"],
                analysis["responsible_fields"],
                analysis["severity"],
                analysis["confidence"],
                latitude,
                longitude,
                embedding
            )
        )

    print("--------------------------------------------")
    print("Report             :", report_text)
    print("Problem            :", analysis["problem_title"])
    print("Domain             :", analysis["domain"])
    print(
        "Responsible Fields :",
        ", ".join(
            analysis["responsible_fields"]
        )
    )
    print("Severity           :", analysis["severity"])
    print(
        "Confidence         :",
        round(
            analysis["confidence"],
            3
        )
    )
    print("Latitude           :", latitude)
    print("Longitude          :", longitude)

conn.commit()


# Test report
new_report = (
    "We need a website that can automatically detect "
    "potholes from images uploaded by citizens."
)

print("\n========== NEW REPORT ==========\n")

new_analysis = classify_problem(new_report)

print("Report             :", new_report)
print(
    "Problem            :",
    new_analysis["problem_title"]
)
print(
    "Description        :",
    new_analysis["problem_description"]
)
print(
    "Domain             :",
    new_analysis["domain"]
)
print(
    "Responsible Fields :",
    ", ".join(
        new_analysis["responsible_fields"]
    )
)
print(
    "Severity            :",
    new_analysis["severity"]
)
print(
    "Confidence          :",
    round(
        new_analysis["confidence"],
        3
    )
)


# Vector search
print("\n========== VECTOR SEARCH ==========\n")

query_embedding = embedding_model.encode(
    new_report,
    convert_to_numpy=True
)

with conn.cursor() as cur:

    cur.execute(
        """
        SELECT
            id,
            report_text,
            problem_title,
            domain,
            responsible_fields,
            severity,
            latitude,
            longitude,
            1 - (embedding <=> %s) AS similarity
        FROM reports
        ORDER BY embedding <=> %s
        LIMIT 5;
        """,
        (
            query_embedding,
            query_embedding
        )
    )

    results = cur.fetchall()


for row in results:

    print("--------------------------------------------")
    print("ID                :", row[0])
    print("Report            :", row[1])
    print("Problem           :", row[2])
    print("Domain            :", row[3])
    print(
        "Responsible Fields:",
        ", ".join(row[4])
    )
    print("Severity          :", row[5])
    print("Latitude          :", row[6])
    print("Longitude         :", row[7])
    print(
        "Similarity        :",
        round(float(row[8]), 3)
    )


conn.close()

print("\n========== COMPLETE ==========")
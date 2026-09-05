import os
import json
import psycopg
import ollama
from pgvector.psycopg import register_vector
from sentence_transformers import SentenceTransformer


# ============================================================
# DATABASE CONFIG
# ============================================================

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "civicsolve",
    "user": "postgres",
    "password": "YOUR_POSTGRES_PASSWORD"
}


# ============================================================
# MODELS
# ============================================================

VISION_MODEL = "gemma3:4b"
CLASSIFICATION_MODEL = "llama3.2:3b"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

embedding_model = SentenceTransformer(EMBEDDING_MODEL)


# ============================================================
# IMAGE + REPORT DATA
# ============================================================

reports = [
    {
        "text": "There is a large pothole on the main road near the market.",
        "image": r"C:\Users\pusal\Desktop\images\pothole.jpg",
        "latitude": 12.9716,
        "longitude": 77.5946
    },
    {
        "text": "The streetlights in our neighborhood have been off for several nights.",
        "image": r"C:\Users\pusal\Desktop\images\streetlight.jpg",
        "latitude": 12.9720,
        "longitude": 77.5949
    },
    {
        "text": "A water pipeline has been leaking continuously beside our residential area.",
        "image": r"C:\Users\pusal\Desktop\images\water_leak.jpg",
        "latitude": 12.9718,
        "longitude": 77.5947
    },
    {
        "text": "Garbage has not been collected from our neighborhood for almost a week.",
        "image": r"C:\Users\pusal\Desktop\images\garbage.jpg",
        "latitude": 12.9713,
        "longitude": 77.5944
    },
    {
        "text": "The road near the bus stop gets flooded during heavy rainfall.",
        "image": r"C:\Users\pusal\Desktop\images\flooded_road.jpg",
        "latitude": 12.9715,
        "longitude": 77.5945
    },
    {
        "text": "The traffic signal at the main junction frequently stops working.",
        "image": r"C:\Users\pusal\Desktop\images\traffic_signal.jpg",
        "latitude": 12.9650,
        "longitude": 77.5900
    },
    {
        "text": "The drainage beside our street is blocked and dirty water is overflowing onto the road.",
        "image": r"C:\Users\pusal\Desktop\images\blocked_drain.jpg",
        "latitude": 12.9680,
        "longitude": 77.5920
    }
]


# ============================================================
# DOMAIN LIST
# ============================================================

DOMAINS = """
Road Infrastructure
Water Supply
Water Quality
Waste Management
Public Lighting
Drainage and Flooding
Public Transport
Traffic Management
Public Safety
Environment
Pollution
Healthcare
Education
Agriculture
Energy
Public Facilities
Housing
Sanitation
Disaster Management
Communication
Other
"""


# ============================================================
# RESPONSIBLE FIELDS
# ============================================================

FIELDS = """
Computer Science and Engineering
Information Technology
Artificial Intelligence and Machine Learning
Data Science
Cyber Security
Electronics and Communication Engineering
Electrical Engineering
Instrumentation and Control Engineering
Mechanical Engineering
Automobile Engineering
Mechatronics Engineering
Robotics and Automation
Civil Engineering
Environmental Engineering
Chemical Engineering
Biotechnology
Biomedical Engineering
Agricultural Engineering
Food Technology
Metallurgical and Materials Engineering
Mining Engineering
Aerospace and Aeronautical Engineering
Architecture
Other
"""


# ============================================================
# IMAGE ANALYSIS
# ============================================================

def analyze_image(image_path):

    if not image_path:
        return ""

    if not os.path.exists(image_path):
        print("Image not found:", image_path)
        return ""

    prompt = """
Analyze this citizen-submitted image.

Identify only what is clearly visible and relevant to a
possible civic problem.

Do not guess:
- location
- cause
- severity
- hidden information
- future consequences

Do not suggest solutions.

Give a short factual description of what is visible.

Return only the description.
"""

    try:
        response = ollama.chat(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                    "images": [image_path]
                }
            ]
        )

        return response["message"]["content"].strip()

    except Exception as e:
        print("Image analysis failed:", e)
        return ""


# ============================================================
# CLASSIFICATION
# ============================================================

def classify_report(report_text, image_description):

    prompt = f"""
You are CivicSolve AI.

Analyze this civic problem.

CITIZEN REPORT:
{report_text}

IMAGE DESCRIPTION:
{image_description}

Choose exactly ONE domain from:

{DOMAINS}

Choose the minimum academic fields genuinely required to solve
the actual problem.

Available fields:

{FIELDS}

Rules for fields:
- Prefer ONE field when sufficient.
- Do not add loosely related fields.
- Use multiple fields only when genuinely necessary.
- Pothole or damaged road -> Civil Engineering.
- Road drainage -> Civil Engineering.
- Streetlight electrical failure -> Electrical Engineering.
- Traffic signal hardware/control -> Electrical Engineering
  or Electronics and Communication Engineering.
- Environmental Engineering only when environmental expertise
  is genuinely required.

Severity:
Critical = immediate danger to life/health or core service completely unavailable.
High = real safety risk or major service disruption.
Medium = ongoing inconvenience or moderate localized risk.
Low = minor issue with no safety risk.

Confidence:
0.9-1.0 = specific and unambiguous
0.6-0.8 = mostly clear
0.3-0.5 = vague
0.0-0.2 = minimal or contradictory

Return ONLY a JSON object.
Do not write explanations.
Do not use markdown.
Do not use ```.

Required format:

{{
  "problem_title": "short title",
  "problem_description": "clear description",
  "domain": "one domain from the list",
  "responsible_fields": ["one or more fields"],
  "severity": "Critical, High, Medium, or Low",
  "confidence": 0.0
}}
"""

    try:

        response = ollama.chat(
            model=CLASSIFICATION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            format="json"
        )

        content = response["message"]["content"].strip()

        print("\nRaw classification response:")
        print(content)

        # ----------------------------------------------------
        # Extract JSON safely
        # ----------------------------------------------------

        start = content.find("{")
        end = content.rfind("}")

        if start == -1 or end == -1:
            print("No JSON object found in model response.")
            return None

        json_text = content[start:end + 1]

        result = json.loads(json_text)

        # ----------------------------------------------------
        # Validate required fields
        # ----------------------------------------------------

        required = [
            "problem_title",
            "problem_description",
            "domain",
            "responsible_fields",
            "severity",
            "confidence"
        ]

        for field in required:
            if field not in result:
                print("Missing field:", field)
                return None

        return result

    except json.JSONDecodeError as e:

        print("Invalid JSON returned by model:")
        print(e)
        print("Model output:")
        print(content if "content" in locals() else "No output")

        return None

    except Exception as e:

        print("Classification failed:", e)

        return None

# ============================================================
# INSERT ONE REPORT
# ============================================================

def insert_report(conn, report):

    print("\n================================================")
    print("PROCESSING REPORT")
    print("================================================")

    print("\nText:")
    print(report["text"])

    # --------------------------------------------------------
    # IMAGE
    # --------------------------------------------------------

    print("\n========== IMAGE ANALYSIS ==========")

    image_description = analyze_image(report["image"])

    print(image_description)

    # --------------------------------------------------------
    # CLASSIFICATION
    # --------------------------------------------------------

    print("\n========== PROBLEM CLASSIFICATION ==========")

    result = classify_report(
        report["text"],
        image_description
    )

    if result is None:
        print("Skipping report because classification failed.")
        return

    print("Title:", result["problem_title"])
    print("Description:", result["problem_description"])
    print("Domain:", result["domain"])
    print("Fields:", ", ".join(result["responsible_fields"]))
    print("Severity:", result["severity"])
    print("Confidence:", result["confidence"])

    # --------------------------------------------------------
    # EMBEDDING
    # --------------------------------------------------------

    print("\n========== EMBEDDING ==========")

    embedding_text = (
        result["problem_title"]
        + ". "
        + result["problem_description"]
        + ". "
        + report["text"]
        + ". "
        + image_description
    )

    embedding = embedding_model.encode(
        embedding_text
    ).tolist()

    print("Embedding dimensions:", len(embedding))

    # --------------------------------------------------------
    # DATABASE INSERT
    # --------------------------------------------------------

    print("\n========== DATABASE INSERT ==========")

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
                image_path,
                image_description,
                embedding
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s::vector
            )
            RETURNING id
            """,
            (
                report["text"],
                result["problem_title"],
                result["problem_description"],
                result["domain"],
                result["responsible_fields"],
                result["severity"],
                result["confidence"],
                report["latitude"],
                report["longitude"],
                report["image"],
                image_description,
                embedding
            )
        )

        report_id = cur.fetchone()[0]

    conn.commit()

    print("Saved report ID:", report_id)


# ============================================================
# MAIN
# ============================================================

def main():

    print("Connecting to PostgreSQL...")

    try:
        with psycopg.connect(**DB_CONFIG) as conn:

            register_vector(conn)

            print("Database connected.")

            for i, report in enumerate(reports, start=1):

                print("\n")
                print("#" * 60)
                print(f"REPORT {i} / {len(reports)}")
                print("#" * 60)

                insert_report(conn, report)

        print("\n")
        print("================================================")
        print("ALL 7 REPORTS PROCESSED")
        print("================================================")

    except Exception as e:
        print("\nDatabase error:")
        print(e)


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()
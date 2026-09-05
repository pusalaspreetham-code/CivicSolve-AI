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
# Low-latency defaults: keep local models warm and prevent verbose generations.
MODEL_KEEP_ALIVE = "10m"
FAST_OPTIONS = {"temperature": 0, "num_predict": 256, "num_ctx": 2048}

embedding_model = SentenceTransformer(EMBEDDING_MODEL)


# ============================================================
# NEW REPORT TO TEST
# ============================================================

new_report = {
    "text": "Our electricity consumption has increased significantly over the past few months even though our daily usage has not changed much. We want to predict our future electricity consumption.",
    "image": "",
    "latitude": 12.9722,
    "longitude": 77.5952
}


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
        print("No image provided.")
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
            ],
            options={**FAST_OPTIONS, "num_predict": 96},
            keep_alive=MODEL_KEEP_ALIVE,
        )

        description = response["message"]["content"].strip()

        return description

    except Exception as e:

        print("Image analysis failed:", e)

        return ""


# ============================================================
# CLEAN RESPONSIBLE FIELDS
# ============================================================

def clean_fields(fields):

    if isinstance(fields, str):
        fields = fields.split(",")

    cleaned = []

    for field in fields:

        field = field.strip()

        if field and field not in cleaned:
            cleaned.append(field)

    return cleaned


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

Choose the minimum academic field genuinely required
to solve the actual problem.

Available fields:

{FIELDS}

IMPORTANT:

- Prefer ONE field when one field is sufficient.
- Never repeat a field.
- Do not add loosely related fields.
- Use multiple fields only when genuinely necessary.
- Pothole or damaged road -> Civil Engineering.
- Road drainage -> Civil Engineering.
- Streetlight electrical failure -> Electrical Engineering.
- Traffic signal hardware/control -> Electrical Engineering
  or Electronics and Communication Engineering.
- Electricity consumption prediction using historical
  consumption data -> Artificial Intelligence and Machine Learning.
- Electricity demand analysis and forecasting -> Artificial
  Intelligence and Machine Learning.
- Electrical equipment, wiring, meters, or power-system
  hardware -> Electrical Engineering.
- Environmental Engineering only when genuinely required.

Severity:

Critical = immediate danger to life/health or core service
           completely unavailable.

High = real safety risk or major service disruption.

Medium = ongoing inconvenience or moderate localized risk.

Low = minor issue with no safety risk.

Confidence:

0.9-1.0 = specific and unambiguous
0.6-0.8 = mostly clear
0.3-0.5 = vague
0.0-0.2 = minimal or contradictory

Return ONLY JSON.

Example:

{{
    "problem_title": "Electricity Consumption Prediction",
    "problem_description": "Household electricity consumption has increased unexpectedly, creating a need to predict future electricity usage.",
    "domain": "Energy",
    "responsible_fields": ["Artificial Intelligence and Machine Learning"],
    "severity": "Medium",
    "confidence": 0.9
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
            format="json",
            options=FAST_OPTIONS,
            keep_alive=MODEL_KEEP_ALIVE,
        )

        content = response["message"]["content"].strip()

        print("\nRaw classification response:")
        print(content)

        start = content.find("{")
        end = content.rfind("}")

        if start == -1 or end == -1:

            print("No JSON object found.")

            return None

        result = json.loads(
            content[start:end + 1]
        )

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

        result["responsible_fields"] = clean_fields(
            result["responsible_fields"]
        )

        return result

    except json.JSONDecodeError as e:

        print("Invalid JSON:")
        print(e)

        return None

    except Exception as e:

        print("Classification failed:", e)

        return None


# ============================================================
# CREATE EMBEDDING
# ============================================================

def create_embedding(
    classification,
    report_text,
    image_description
):

    embedding_text = (
        classification["problem_title"]
        + ". "
        + classification["problem_description"]
        + ". "
        + report_text
        + ". "
        + image_description
    )

    embedding = embedding_model.encode(
        embedding_text
    ).tolist()

    return embedding


# ============================================================
# SEARCH EXISTING PROBLEMS
# ============================================================

def find_candidates(
    conn,
    embedding,
    limit=5
):

    with conn.cursor() as cur:

        cur.execute(
            """
            SELECT
                id,
                problem_title,
                problem_description,
                domain,
                responsible_fields,
                severity,
                confidence,
                locations,
                embedding <=> %s::vector AS distance
            FROM reports
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> %s::vector
            LIMIT %s
            """,
            (
                embedding,
                embedding,
                limit
            )
        )

        return cur.fetchall()


# ============================================================
# DEEP SIMILARITY CHECK
# ============================================================

def check_same_problem(
    new_report,
    new_classification,
    candidate
):

    (
        candidate_id,
        candidate_title,
        candidate_description,
        candidate_domain,
        candidate_fields,
        candidate_severity,
        candidate_confidence,
        candidate_locations,
        candidate_distance
    ) = candidate

    prompt = f"""
Determine whether these two reports describe the SAME
underlying civic problem.

NEW REPORT:

Title:
{new_classification["problem_title"]}

Description:
{new_classification["problem_description"]}

Domain:
{new_classification["domain"]}

Citizen text:
{new_report["text"]}


EXISTING REPORT:

Title:
{candidate_title}

Description:
{candidate_description}

Domain:
{candidate_domain}


Rules:

- SAME means both reports describe the same underlying
  civic issue.
- Different wording for the same issue is still SAME.
- The same type of civic problem reported at another
  location can still be SAME.
- Do not require exact coordinates.
- Different civic problems are DIFFERENT.
- Do not decide based only on wording.
- Consider the actual problem.
- Electricity consumption prediction and electricity
  consumption forecasting are the same underlying problem.
- A hardware electrical fault is different from an
  electricity consumption prediction problem.

Return ONLY this JSON:

{{
    "decision": "SAME",
    "reason": "Both reports describe the same underlying electricity consumption prediction problem."
}}

OR

{{
    "decision": "DIFFERENT",
    "reason": "The reports describe different civic problems."
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
            format="json",
            options={**FAST_OPTIONS, "num_predict": 128},
            keep_alive=MODEL_KEEP_ALIVE,
        )

        content = response["message"]["content"].strip()

        print("\nRaw similarity response:")
        print(content)

        start = content.find("{")
        end = content.rfind("}")

        if start == -1 or end == -1:

            print("No JSON found in similarity response.")

            return None

        result = json.loads(
            content[start:end + 1]
        )

        decision = str(
            result.get("decision", "")
        ).upper().strip()

        if decision not in ["SAME", "DIFFERENT"]:

            print("Invalid decision:", decision)

            return None

        result["decision"] = decision

        return result

    except json.JSONDecodeError as e:

        print("Similarity JSON error:")
        print(e)

        return None

    except Exception as e:

        print("Similarity check failed:")
        print(e)

        return None


# ============================================================
# ADD LOCATION TO EXISTING PROBLEM
# ============================================================

def add_location(
    conn,
    problem_id,
    latitude,
    longitude
):

    new_location = {
        "latitude": latitude,
        "longitude": longitude
    }

    with conn.cursor() as cur:

        cur.execute(
            """
            UPDATE reports
            SET locations =
                COALESCE(locations, '[]'::jsonb)
                || %s::jsonb
            WHERE id = %s
            """,
            (
                json.dumps([new_location]),
                problem_id
            )
        )

    conn.commit()

    print("\n========== EXISTING PROBLEM UPDATED ==========")
    print("Problem ID:", problem_id)
    print("New location:", latitude, longitude)
    print("Action: LOCATION ADDED")
    print("Action: NEW PROBLEM NOT CREATED")


# ============================================================
# INSERT NEW PROBLEM
# ============================================================

def insert_new_problem(
    conn,
    report,
    classification,
    image_description,
    embedding
):

    locations = [
        {
            "latitude": report["latitude"],
            "longitude": report["longitude"]
        }
    ]

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
                locations,
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
                %s::jsonb,
                %s,
                %s,
                %s::vector
            )
            RETURNING id
            """,
            (
                report["text"],
                classification["problem_title"],
                classification["problem_description"],
                classification["domain"],
                classification["responsible_fields"],
                classification["severity"],
                classification["confidence"],
                json.dumps(locations),
                report["image"],
                image_description,
                embedding
            )
        )

        new_id = cur.fetchone()[0]

    conn.commit()

    print("\n========== NEW PROBLEM CREATED ==========")
    print("Problem ID:", new_id)
    print(
        "Location:",
        report["latitude"],
        report["longitude"]
    )
    print("Action: NEW PROBLEM INSERTED")


# ============================================================
# MAIN
# ============================================================

def main():

    print("Connecting to PostgreSQL...")

    try:

        with psycopg.connect(**DB_CONFIG) as conn:

            register_vector(conn)

            print("Database connected.")

            # ------------------------------------------------
            # IMAGE
            # ------------------------------------------------

            print("\n========== IMAGE ANALYSIS ==========")

            image_description = analyze_image(
                new_report["image"]
            )

            print("Image description:")

            if image_description:
                print(image_description)
            else:
                print("No image description available.")

            # ------------------------------------------------
            # CLASSIFICATION
            # ------------------------------------------------

            print("\n========== CLASSIFICATION ==========")

            classification = classify_report(
                new_report["text"],
                image_description
            )

            if classification is None:

                print("Classification failed.")
                print("REPORT NOT INSERTED.")

                return

            print(
                "Title:",
                classification["problem_title"]
            )

            print(
                "Description:",
                classification["problem_description"]
            )

            print(
                "Domain:",
                classification["domain"]
            )

            print(
                "Fields:",
                ", ".join(
                    classification["responsible_fields"]
                )
            )

            print(
                "Severity:",
                classification["severity"]
            )

            print(
                "Confidence:",
                classification["confidence"]
            )

            # ------------------------------------------------
            # EMBEDDING
            # ------------------------------------------------

            print("\n========== EMBEDDING ==========")

            embedding = create_embedding(
                classification,
                new_report["text"],
                image_description
            )

            print(
                "Embedding dimensions:",
                len(embedding)
            )

            # ------------------------------------------------
            # VECTOR SEARCH
            # ------------------------------------------------

            print(
                "\n========== SIMILAR PROBLEM SEARCH =========="
            )

            candidates = find_candidates(
                conn,
                embedding,
                limit=5
            )

            if not candidates:

                print("No existing problems found.")

                insert_new_problem(
                    conn,
                    new_report,
                    classification,
                    image_description,
                    embedding
                )

                return

            # ------------------------------------------------
            # DEEP CHECK
            # ------------------------------------------------

            found_same = False

            for candidate in candidates:

                candidate_id = candidate[0]
                candidate_title = candidate[1]
                distance = candidate[-1]

                similarity = 1 - distance

                print("\nCandidate:")
                print("ID:", candidate_id)
                print("Title:", candidate_title)
                print(
                    "Embedding similarity:",
                    round(similarity, 4)
                )

                # Candidate threshold

                if similarity < 0.35:

                    print(
                        "Similarity too low. "
                        "Skipping candidate."
                    )

                    continue

                decision = check_same_problem(
                    new_report,
                    classification,
                    candidate
                )

                if decision is None:

                    print(
                        "Deep similarity check failed."
                    )

                    print(
                        "REPORT NOT INSERTED."
                    )

                    return

                print(
                    "Llama Decision:",
                    decision["decision"]
                )

                print(
                    "Reason:",
                    decision.get("reason", "")
                )

                # --------------------------------------------
                # SAME PROBLEM
                # --------------------------------------------

                if decision["decision"] == "SAME":

                    add_location(
                        conn,
                        candidate_id,
                        new_report["latitude"],
                        new_report["longitude"]
                    )

                    found_same = True

                    break

            # ------------------------------------------------
            # NEW PROBLEM
            # ------------------------------------------------

            if not found_same:

                print(
                    "\n========== NO SIMILAR PROBLEM =========="
                )

                insert_new_problem(
                    conn,
                    new_report,
                    classification,
                    image_description,
                    embedding
                )

            print("\n========== COMPLETE ==========")

    except Exception as e:

        print("\nDatabase error:")
        print(e)


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()
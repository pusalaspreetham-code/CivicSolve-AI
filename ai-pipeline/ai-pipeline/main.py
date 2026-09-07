import base64
import json
import os
import uuid
from pathlib import Path
from typing import List, Optional
from psycopg_pool import ConnectionPool

import ollama
import psycopg
from psycopg_pool import ConnectionPool
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pgvector.psycopg import register_vector
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

load_dotenv()


# ============================================================
# CONFIG (env-driven — never hardcode credentials)
# ============================================================

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "civicsolve"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
}

VISION_MODEL = os.getenv("VISION_MODEL", "gemma3:4b")
CLASSIFICATION_MODEL = os.getenv("CLASSIFICATION_MODEL", "llama3.2:3b")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", str(Path(__file__).parent / "uploads")))
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# NOTE: raised from 0.35 -> 0.5 default. MiniLM cosine similarity at 0.35 lets
# in too many weak candidates and forces unnecessary LLM dedup calls.
# Tune this empirically against a labeled set of known-duplicate pairs.
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.5"))

# ============================================================
# PRIORITY SCORE / GOVERNMENT REVIEW GATE
#
# Every problem gets a priority_score (0-100) computed from its AI
# classification (the "problem genome": severity + confidence) plus a
# small boost for how many citizens have independently reported it.
#
#   score  < PRIORITY_DISCARD_THRESHOLD  -> gov_review_status='DISCARDED'
#            (treated as noise/a random report, never shown anywhere)
#   score >= PRIORITY_DISCARD_THRESHOLD  -> gov_review_status='PENDING_REVIEW'
#            (visible ONLY in the government portal, not to students)
#
# A government official then approves/rejects it; only 'GOV_APPROVED'
# rows are ever shown to the student/university portals.
# ============================================================
PRIORITY_DISCARD_THRESHOLD = float(os.getenv("PRIORITY_DISCARD_THRESHOLD", "25"))

_SEVERITY_BASE_SCORE = {
    "CRITICAL": 90,
    "HIGH": 70,
    "MEDIUM": 45,
    "LOW": 20,
}


def compute_priority_score(severity: Optional[str], confidence: Optional[float], report_count: int = 1) -> float:
    """Deterministic 0-100 priority score derived from the AI genome
    (severity + classification confidence), with a small, capped boost
    for corroborating reports from additional citizens."""
    base = _SEVERITY_BASE_SCORE.get((severity or "").strip().upper(), 10)
    conf = confidence if isinstance(confidence, (int, float)) else 0.5
    conf = max(0.0, min(1.0, conf))

    score = base * 0.7 + (conf * 100) * 0.3

    # Corroboration boost: +3 per additional independent report, capped at +20,
    # so a problem many citizens separately flag rises in the queue.
    extra_reports = max(0, report_count - 1)
    score += min(extra_reports * 3, 20)

    return round(min(score, 100), 2)


def gov_review_gate(priority_score: float):
    """Returns (gov_review_status, discard_reason)."""
    if priority_score < PRIORITY_DISCARD_THRESHOLD:
        return "DISCARDED", f"priority_score {priority_score} below threshold {PRIORITY_DISCARD_THRESHOLD}"
    return "PENDING_REVIEW", None

# How long Ollama keeps each model resident in memory between calls.
# Avoids reload/cold-start latency on back-to-back requests.
OLLAMA_KEEP_ALIVE = os.getenv("OLLAMA_KEEP_ALIVE", "30m")

# Low temperature for classification/dedup — we want consistency, not creativity.
CLASSIFICATION_OPTIONS = {"temperature": 0.15}
VISION_OPTIONS = {"temperature": 0.2}

embedding_model = SentenceTransformer(EMBEDDING_MODEL)

# Single connection pool, created once at startup, reused across requests.
# Avoids the cost of opening a new DB connection (+ register_vector) per call.
pool = ConnectionPool(
    conninfo=(
        f"host={DB_CONFIG['host']} port={DB_CONFIG['port']} "
        f"dbname={DB_CONFIG['dbname']} user={DB_CONFIG['user']} "
        f"password={DB_CONFIG['password']}"
    ),
    min_size=2,
    max_size=10,
    configure=register_vector,
)


# ============================================================
# DOMAIN / FIELD TAXONOMY  (unchanged from the original pipeline)
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

_DOMAIN_SET = {d.strip() for d in DOMAINS.strip().splitlines()}
_FIELD_SET = {f.strip() for f in FIELDS.strip().splitlines()}


# ============================================================
# REQUEST / RESPONSE SCHEMAS
# ============================================================

class ProcessRequest(BaseModel):
    intake_id: Optional[str] = None
    text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_base64: Optional[str] = None  # raw base64, no "data:image/...;base64," prefix
    case_reference: Optional[str] = None
    problem_title: Optional[str] = None
    problem_description: Optional[str] = None
    domain: Optional[str] = None
    responsible_fields: Optional[List[str]] = None
    severity: Optional[str] = None
    confidence: Optional[float] = None


class ProcessResponse(BaseModel):
    ok: bool = True
    action: str  # "new_problem" | "merged_existing" | "skipped" | "failed"
    problemId: Optional[int] = None
    problemTitle: Optional[str] = None
    problemDescription: Optional[str] = None
    domain: Optional[str] = None
    responsibleFields: Optional[List[str]] = None
    severity: Optional[str] = None
    confidence: Optional[float] = None
    imageDescription: Optional[str] = None
    matchedExistingId: Optional[int] = None
    similarity: Optional[float] = None
    reason: Optional[str] = None
    error: Optional[str] = None
    priorityScore: Optional[float] = None
    govReviewStatus: Optional[str] = None


app = FastAPI(title="CivicSolve AI Pipeline")


@app.get("/health")
def health():
    return {"status": "ok"}


# ============================================================
# IMAGE ANALYSIS
# ============================================================

def save_incoming_image(image_base64: str) -> str:
    """Decodes a base64 image and persists it under UPLOADS_DIR, returning the path."""
    raw = base64.b64decode(image_base64)
    filename = f"{uuid.uuid4().hex}.jpg"
    path = UPLOADS_DIR / filename
    path.write_bytes(raw)
    return str(path)


def analyze_image(image_path: str) -> str:
    if not image_path or not os.path.exists(image_path):
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
            messages=[{"role": "user", "content": prompt, "images": [image_path]}],
            options=VISION_OPTIONS,
            keep_alive=OLLAMA_KEEP_ALIVE,
        )
        return response["message"]["content"].strip()
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


def _closest_match(value: str, valid_set: set) -> str:
    """Map a possibly-hallucinated LLM label to the nearest valid taxonomy
    entry. Exact match first, then case-insensitive, then substring match,
    then fall back to 'Other'. Mismatches are logged so drift is visible."""
    if value in valid_set:
        return value

    value_lower = value.strip().lower()
    for candidate in valid_set:
        if candidate.lower() == value_lower:
            return candidate

    for candidate in valid_set:
        if candidate.lower() in value_lower or value_lower in candidate.lower():
            return candidate

    print(f"[taxonomy] no match for '{value}', falling back to 'Other'")
    return "Other"


def validate_classification(result: dict) -> dict:
    """Normalizes domain/responsible_fields against the known taxonomy so
    small-model hallucinations (typos, near-miss labels) don't silently
    leak into downstream data."""
    result["domain"] = _closest_match(result.get("domain", ""), _DOMAIN_SET)
    result["responsible_fields"] = [
        _closest_match(f, _FIELD_SET) for f in result.get("responsible_fields", [])
    ] or ["Other"]
    return result


# ============================================================
# CLASSIFICATION
# ============================================================

def classify_report(report_text: str, image_description: str):
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
            messages=[{"role": "user", "content": prompt}],
            format="json",
            options=CLASSIFICATION_OPTIONS,
            keep_alive=OLLAMA_KEEP_ALIVE,
        )

        content = response["message"]["content"].strip()
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1:
            print("No JSON object found in classification response.")
            return None

        result = json.loads(content[start:end + 1])

        required = [
            "problem_title", "problem_description", "domain",
            "responsible_fields", "severity", "confidence",
        ]
        for field in required:
            if field not in result:
                print("Missing field:", field)
                return None

        result["responsible_fields"] = clean_fields(result["responsible_fields"])
        result = validate_classification(result)
        return result

    except json.JSONDecodeError as e:
        print("Invalid classification JSON:", e)
        return None
    except Exception as e:
        print("Classification failed:", e)
        return None


# ============================================================
# EMBEDDING
# ============================================================

def create_embedding(classification, report_text, image_description):
    # Kept the same signature/inputs, but weighted toward the *normalized*
    # title+description (clean signal) rather than letting raw citizen text
    # and a possibly noisy image description dominate the vector. Raw text
    # is still included, just de-weighted by truncation, to preserve any
    # detail the classifier dropped without drowning out the clean fields.
    embedding_text = (
        classification["problem_title"] + ". "
        + classification["problem_description"] + ". "
        + report_text[:300] + ". "
        + image_description[:200]
    )
    return embedding_model.encode(embedding_text).tolist()


# ============================================================
# SEARCH EXISTING PROBLEMS
# ============================================================

def find_candidates(conn, embedding, limit=5):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                id, problem_title, problem_description, domain,
                responsible_fields, severity, confidence, locations,
                embedding <=> %s::vector AS distance
            FROM reports
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> %s::vector
            LIMIT %s
            """,
            (embedding, embedding, limit),
        )
        return cur.fetchall()


# ============================================================
# DEEP SIMILARITY CHECK
# ============================================================

def check_same_problem(report_text, classification, candidate):
    """Kept for backward compatibility / single-candidate use. The main
    /process flow now uses check_candidates_batch below, which does the
    same job for all candidates in one LLM call instead of one call per
    candidate."""
    (
        candidate_id, candidate_title, candidate_description, candidate_domain,
        candidate_fields, candidate_severity, candidate_confidence,
        candidate_locations, candidate_distance,
    ) = candidate

    prompt = f"""
Determine whether these two reports describe the SAME
underlying civic problem.

NEW REPORT:

Title:
{classification["problem_title"]}

Description:
{classification["problem_description"]}

Domain:
{classification["domain"]}

Citizen text:
{report_text}


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
            messages=[{"role": "user", "content": prompt}],
            format="json",
            options=CLASSIFICATION_OPTIONS,
            keep_alive=OLLAMA_KEEP_ALIVE,
        )

        content = response["message"]["content"].strip()
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1:
            print("No JSON found in similarity response.")
            return None

        result = json.loads(content[start:end + 1])
        decision = str(result.get("decision", "")).upper().strip()
        if decision not in ["SAME", "DIFFERENT"]:
            print("Invalid decision:", decision)
            return None

        result["decision"] = decision
        return result

    except json.JSONDecodeError as e:
        print("Similarity JSON error:", e)
        return None
    except Exception as e:
        print("Similarity check failed:", e)
        return None


def check_candidates_batch(report_text, classification, candidates):
    """Single LLM call that compares the new report against ALL candidates
    at once, instead of one call per candidate (up to 5x fewer calls).
    Returns {"match_id": <id or None>, "reason": "..."} in the same shape
    the caller needs to merge or move on."""
    if not candidates:
        return {"match_id": None, "reason": "No candidates."}

    candidates_block = "\n\n".join(
        f"CANDIDATE_ID: {c[0]}\nTitle: {c[1]}\nDescription: {c[2]}\nDomain: {c[3]}"
        for c in candidates
    )

    prompt = f"""
You are comparing ONE new civic report against a list of
EXISTING reports to find out if any of them describe the
SAME underlying civic problem.

NEW REPORT:

Title:
{classification["problem_title"]}

Description:
{classification["problem_description"]}

Domain:
{classification["domain"]}

Citizen text:
{report_text}


EXISTING CANDIDATES:

{candidates_block}


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
- At most ONE candidate can match. If none match, match_id
  must be null.

Return ONLY this JSON:

{{
    "match_id": <id of the matching candidate, or null>,
    "reason": "short explanation"
}}
"""

    try:
        response = ollama.chat(
            model=CLASSIFICATION_MODEL,
            messages=[{"role": "user", "content": prompt}],
            format="json",
            options=CLASSIFICATION_OPTIONS,
            keep_alive=OLLAMA_KEEP_ALIVE,
        )

        content = response["message"]["content"].strip()
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1:
            print("No JSON found in batch similarity response.")
            return None

        result = json.loads(content[start:end + 1])

        match_id = result.get("match_id")
        # Guard against the model inventing an id that wasn't in the candidate list.
        valid_ids = {c[0] for c in candidates}
        if match_id is not None and match_id not in valid_ids:
            print(f"[dedup] model returned invalid match_id {match_id}, ignoring.")
            match_id = None

        return {"match_id": match_id, "reason": result.get("reason", "")}

    except json.JSONDecodeError as e:
        print("Batch similarity JSON error:", e)
        return None
    except Exception as e:
        print("Batch similarity check failed:", e)
        return None


# ============================================================
# DB WRITES
# ============================================================

def add_location(conn, problem_id, latitude, longitude):
    new_location = {"latitude": latitude, "longitude": longitude}
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE reports
            SET locations = CASE
                WHEN EXISTS (
                    SELECT 1
                      FROM jsonb_array_elements(COALESCE(locations, '[]'::jsonb)) AS existing(location)
                     WHERE (existing.location->>'latitude')::double precision IS NOT DISTINCT FROM %s::double precision
                       AND (existing.location->>'longitude')::double precision IS NOT DISTINCT FROM %s::double precision
                ) THEN COALESCE(locations, '[]'::jsonb)
                ELSE COALESCE(locations, '[]'::jsonb) || %s::jsonb
            END
            WHERE id = %s
            """,
            (latitude, longitude, json.dumps([new_location]), problem_id),
        )
    conn.commit()

def insert_new_problem(conn, classification, report_text, image_path, image_description, embedding, latitude, longitude):
    locations = [{"latitude": latitude, "longitude": longitude}]

    priority_score = compute_priority_score(
        classification.get("severity"), classification.get("confidence"), report_count=1
    )
    gov_review_status, discard_reason = gov_review_gate(priority_score)

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO reports (
                report_text, problem_title, problem_description, domain,
                responsible_fields, severity, confidence, locations,
                image_path, image_description, embedding,
                priority_score, gov_review_status, discard_reason
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s::vector, %s, %s, %s)
            RETURNING id
            """,
            (
                report_text,
                classification["problem_title"],
                classification["problem_description"],
                classification["domain"],
                classification["responsible_fields"],
                classification["severity"],
                classification["confidence"],
                json.dumps(locations),
                image_path,
                image_description,
                embedding,
                priority_score,
                gov_review_status,
                discard_reason,
            ),
        )
        new_id = cur.fetchone()[0]
    conn.commit()
    print(
        f"[GENOME] new problem id={new_id} severity={classification.get('severity')} "
        f"confidence={classification.get('confidence')} -> priority_score={priority_score} "
        f"gov_review_status={gov_review_status}"
    )
    return new_id, priority_score, gov_review_status


def insert_problem_report(
    conn,
    problem_id,
    report_text,
    latitude,
    longitude,
    image_path,
    case_reference=None,
):
    """Insert one citizen submission only once for a case reference."""

    with conn.cursor() as cur:
        # Prevent the same citizen case from being recorded twice.
        if case_reference:
            cur.execute(
                """
                SELECT id, problem_id
                FROM problem_reports
                WHERE case_reference = %s
                LIMIT 1
                """,
                (case_reference,),
            )

            existing = cur.fetchone()

            if existing:
                print(
                    f"Problem report already exists for case "
                    f"{case_reference}: problem_id={existing[1]}"
                )
                return existing[1]

        cur.execute(
            """
            INSERT INTO problem_reports (
                problem_id,
                report_text,
                latitude,
                longitude,
                image_path,
                case_reference
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                problem_id,
                report_text,
                latitude,
                longitude,
                image_path,
                case_reference,
            ),
        )

    conn.commit()
    return problem_id
# ============================================================
# PREVIEW ENTRY POINT (read-only: classify + dedup-check, no DB writes)
# ============================================================

@app.post("/preview", response_model=ProcessResponse)
def preview(req: ProcessRequest):
    """Same inputs/outputs as /process, but never inserts or updates rows.
    Used to show the citizen/admin what the AI would do (new problem vs.
    merge into an existing one) before they confirm the submission."""
    report_text = (req.text or "").strip()
    print(
        f"[PREVIEW] intake_id={req.intake_id}, "
        f"case_reference={req.case_reference}"
    )
    if not report_text:
        raise HTTPException(status_code=400, detail="Field 'text' is required.")

    image_path = ""
    if req.image_base64:
        try:
            image_path = save_incoming_image(req.image_base64)
        except Exception as e:
            print("Failed to save incoming image:", e)
            image_path = ""

    image_description = analyze_image(image_path) if image_path else ""

    try:
        with pool.connection() as conn:

            classification = classify_report(report_text, image_description)
            if classification is None:
                return ProcessResponse(ok=True, action="failed", error="Classification failed.")

            if req.problem_title: classification["problem_title"] = req.problem_title.strip()
            if req.problem_description: classification["problem_description"] = req.problem_description.strip()
            if req.domain: classification["domain"] = req.domain.strip()
            if req.responsible_fields: classification["responsible_fields"] = req.responsible_fields
            if req.severity: classification["severity"] = req.severity.strip()
            if req.confidence is not None: classification["confidence"] = req.confidence
            embedding = create_embedding(classification, report_text, image_description)

            candidates = find_candidates(conn, embedding, limit=5)

            strong_candidates = []
            for candidate in candidates:
                distance = candidate[-1]
                similarity = 1 - distance
                if similarity >= SIMILARITY_THRESHOLD:
                    strong_candidates.append((candidate, similarity))

            if strong_candidates:
                decision = check_candidates_batch(
                    report_text, classification, [c for c, _ in strong_candidates]
                )

                if decision and decision.get("match_id") is not None:
                    matched_id = decision["match_id"]
                    matched_similarity = next(
                        sim for c, sim in strong_candidates if c[0] == matched_id
                    )

                    # NOTE: no add_location, no UPDATE, no insert_problem_report here.
                    # This is a preview only — nothing is persisted.
                    return ProcessResponse(
                        ok=True,
                        action="merged_existing",
                        problemId=matched_id,
                        matchedExistingId=matched_id,
                        domain=classification["domain"],
                        responsibleFields=classification["responsible_fields"],
                        severity=classification["severity"],
                        confidence=classification["confidence"],
                        imageDescription=image_description or None,
                        similarity=round(matched_similarity, 4),
                        reason=decision.get("reason", ""),
                    )

            # NOTE: no insert_new_problem, no insert_problem_report here either.
            return ProcessResponse(
                ok=True,
                action="new_problem",
                problemTitle=classification["problem_title"],
                problemDescription=classification["problem_description"],
                domain=classification["domain"],
                responsibleFields=classification["responsible_fields"],
                severity=classification["severity"],
                confidence=classification["confidence"],
                imageDescription=image_description or None,
            )

    except Exception as e:
        print("AI pipeline preview error:", e)
        raise HTTPException(status_code=500, detail=str(e))


class ExecutiveBriefRequest(BaseModel):
    problem_title: str
    problem_description: str
    domain: str
    severity: str
    report_count: int = 1
    location_count: int = 1
    responsible_fields: List[str] = []


@app.post("/executive-brief")
def executive_brief(req: ExecutiveBriefRequest):
    prompt = f"""
You are assisting a government officer reviewing a civic problem.

Analyze this problem and return ONLY valid JSON.

Problem title: {req.problem_title}
Problem description: {req.problem_description}
Domain: {req.domain}
Severity: {req.severity}
Citizen reports: {req.report_count}
Locations: {req.location_count}
Responsible fields: {", ".join(req.responsible_fields)}

Return exactly:

{{
  "impact_assessment": "short assessment of who or what is affected",
  "recommended_actions": [
    "action 1",
    "action 2",
    "action 3"
  ],
  "resource_estimate": "short practical estimate",
  "priority_score": 0
}}

Priority score must be between 0 and 100.

Consider:
- severity
- number of citizen reports
- number of affected locations
- public safety
- service disruption
- urgency

Do not invent facts.
"""

    try:
        response = ollama.chat(
            model=CLASSIFICATION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        content = response["message"]["content"].strip()

        # Remove markdown code fences if the model adds them
        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()

        result = json.loads(content)

        result["priority_score"] = max(
            0,
            min(100, float(result["priority_score"]))
        )

        return result

    except Exception as e:
        print("Executive brief generation failed:", e)
        raise HTTPException(
            status_code=500,
            detail="Executive brief generation failed"
        )

# ============================================================
# MAIN ENTRY POINT
# ============================================================

@app.post("/process", response_model=ProcessResponse)
def process(req: ProcessRequest):
    report_text = (req.text or "").strip()
    print(
        f"[PROCESS] intake_id={req.intake_id}, "
        f"case_reference={req.case_reference}"
    )
    if not report_text:
        raise HTTPException(status_code=400, detail="Field 'text' is required.")

    image_path = ""
    if req.image_base64:
        try:
            image_path = save_incoming_image(req.image_base64)
        except Exception as e:
            print("Failed to save incoming image:", e)
            image_path = ""

    image_description = analyze_image(image_path) if image_path else ""

    try:
        # Pooled connection instead of opening a new one per request.
        # register_vector is applied automatically via pool's `configure`.
        with pool.connection() as conn:

            classification = classify_report(report_text, image_description)
            if classification is None:
                return ProcessResponse(ok=True, action="failed", error="Classification failed.")

            if req.problem_title: classification["problem_title"] = req.problem_title.strip()
            if req.problem_description: classification["problem_description"] = req.problem_description.strip()
            if req.domain: classification["domain"] = req.domain.strip()
            if req.responsible_fields: classification["responsible_fields"] = req.responsible_fields
            if req.severity: classification["severity"] = req.severity.strip()
            if req.confidence is not None: classification["confidence"] = req.confidence
            embedding = create_embedding(classification, report_text, image_description)

            candidates = find_candidates(conn, embedding, limit=5)

            # Only keep candidates that clear the similarity bar, then ask
            # the LLM once (not once per candidate) which one, if any, matches.
            strong_candidates = []
            for candidate in candidates:
                distance = candidate[-1]
                similarity = 1 - distance
                if similarity >= SIMILARITY_THRESHOLD:
                    strong_candidates.append((candidate, similarity))

            if strong_candidates:
                decision = check_candidates_batch(
                    report_text, classification, [c for c, _ in strong_candidates]
                )

                if decision and decision.get("match_id") is not None:
                    matched_id = decision["match_id"]
                    matched_similarity = next(
                        sim for c, sim in strong_candidates if c[0] == matched_id
                    )

                    add_location(conn, matched_id, req.latitude, req.longitude)

                    # Recompute the priority score against the up-to-date
                    # report count — one more citizen corroborating the same
                    # problem nudges it up (or across the review threshold).
                    with conn.cursor() as cur:
                        cur.execute(
                            "SELECT COUNT(*) FROM problem_reports WHERE problem_id = %s",
                            (matched_id,),
                        )
                        merged_report_count = cur.fetchone()[0] + 1  # +1 for this incoming report

                        cur.execute(
                            "SELECT gov_review_status FROM reports WHERE id = %s",
                            (matched_id,),
                        )
                        existing_status_row = cur.fetchone()
                        existing_status = existing_status_row[0] if existing_status_row else "PENDING_REVIEW"

                    merged_priority_score = compute_priority_score(
                        classification["severity"], classification["confidence"], report_count=merged_report_count
                    )
                    # Never silently downgrade a problem a government official
                    # already approved/rejected — only re-gate problems still
                    # sitting in DISCARDED/PENDING_REVIEW.
                    if existing_status in ("DISCARDED", "PENDING_REVIEW"):
                        merged_status, merged_discard_reason = gov_review_gate(merged_priority_score)
                    else:
                        merged_status, merged_discard_reason = existing_status, None

                    with conn.cursor() as cur:
                        cur.execute(
                            """UPDATE reports SET problem_title=%s, problem_description=%s, domain=%s,
                               responsible_fields=%s, severity=%s, confidence=%s,
                               priority_score=%s, gov_review_status=%s, discard_reason=%s
                               WHERE id=%s""",
                            (
                                classification["problem_title"],
                                classification["problem_description"],
                                classification["domain"],
                                classification["responsible_fields"],
                                classification["severity"],
                                classification["confidence"],
                                merged_priority_score,
                                merged_status,
                                merged_discard_reason,
                                matched_id,
                            ),
                        )
                    conn.commit()
                    insert_problem_report(conn, matched_id, report_text, req.latitude, req.longitude, image_path, req.case_reference)

                    print(
                        f"[GENOME] merged into id={matched_id} report_count={merged_report_count} "
                        f"-> priority_score={merged_priority_score} gov_review_status={merged_status}"
                    )

                    return ProcessResponse(
                        ok=True,
                        action="merged_existing",
                        problemId=matched_id,
                        matchedExistingId=matched_id,
                        domain=classification["domain"],
                        responsibleFields=classification["responsible_fields"],
                        severity=classification["severity"],
                        confidence=classification["confidence"],
                        imageDescription=image_description or None,
                        similarity=round(matched_similarity, 4),
                        reason=decision.get("reason", ""),
                        priorityScore=merged_priority_score,
                        govReviewStatus=merged_status,
                    )

            new_id, priority_score, gov_review_status = insert_new_problem(
                conn, classification, report_text, image_path,
                image_description, embedding, req.latitude, req.longitude,
            )
            insert_problem_report(conn, new_id, report_text, req.latitude, req.longitude, image_path, req.case_reference)

            return ProcessResponse(
                ok=True,
                action="new_problem",
                problemId=new_id,
                problemTitle=classification["problem_title"],
                problemDescription=classification["problem_description"],
                domain=classification["domain"],
                responsibleFields=classification["responsible_fields"],
                severity=classification["severity"],
                confidence=classification["confidence"],
                imageDescription=image_description or None,
                priorityScore=priority_score,
                govReviewStatus=gov_review_status,
            )

    except Exception as e:
        print("AI pipeline error:", e)
        raise HTTPException(status_code=500, detail=str(e))
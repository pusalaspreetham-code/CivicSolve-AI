import ollama

problem = """
1. There is water leaking near our college for two weeks.

2. Garbage has not been collected in our street for five days.

3. Every time it rains our road gets completely flooded.

4. Streetlights near the school keep going off.

5. The bus never arrives on time and students wait for an hour.

6. Our village has very little drinking water during summer.

7. Many potholes have appeared on the main road.

8. Sewage water is flowing into the street.

9. There is a large amount of plastic waste near the lake.

10. The traffic near our school is very dangerous in the morning.
"""

prompt = f"""
There are 10  treate them as seperatley

You are the problem analysis engine of CivicSolve AI.

Your task is to convert a citizen's description into structured information.

IMPORTANT RULES:

1. Never invent facts.
2. Only include information explicitly stated by the citizen.
3. If information is missing, return null.
4. Do not treat assumptions as facts.
5. "possible_cause" must be null unless the citizen directly mentions the cause.
6. "affected_people" must be null unless the citizen explicitly mentions who is affected.
7. "required_skills" must be a JSON list.
8. Use a specific domain when possible.
9. Return ONLY valid JSON.

Required fields:

- problem
- domain
- location
- duration
- affected_people
- impact
- urgency
- possible_cause
- required_skills

Citizen description:
return only JSON
{problem}
"""

response = ollama.chat(
    model="llama3.2:3b",
    messages=[
        {
            "role": "user",
            "content": prompt
        }
    ]
)

print(response["message"]["content"])
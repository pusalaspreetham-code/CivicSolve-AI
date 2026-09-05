import os
import ollama


VISION_MODEL = "gemma3:4b"


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

Give a factual description of what is visible.

Example:
"A large pothole is visible on a paved road."

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

        description = response["message"]["content"].strip()

        return description

    except Exception as e:
        print("Image analysis failed:", e)
        return ""


# Test image
image_path = r"C:\Users\pusal\Desktop\pothole.jpg"

print("\n========== IMAGE ANALYSIS ==========\n")

description = analyze_image(image_path)

print("Image:", image_path)
print("Description:", description)

print("\n========== COMPLETE ==========")
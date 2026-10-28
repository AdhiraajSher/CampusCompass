"""Two-Step AI Engine for CampusCompass (ASIS).

1. Prompt A (The Question): Generates a contextual, empathetic question to show the student.
2. Prompt B (The Insight Extractor): Silently processes natural language input into structured JSON:
   {"mood_score": Integer (1-5), "tags": ["tag1", "tag2"]}
"""
import json
import os
import re
import warnings
from typing import Any, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")

client = None
if OPENROUTER_API_KEY:
    try:
        from openai import OpenAI
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=OPENROUTER_API_KEY,
        )
    except Exception as exc:
        warnings.warn(f"Failed to initialize OpenRouter client: {exc}")
        client = None


class AIEngineError(Exception):
    pass


# ============================================================================
# PROMPT A: The Question Generator
# ============================================================================
PROMPT_A_SYSTEM = (
    "You are the empathetic, supportive ASIS Check-in Assistant for a student support system. "
    "Your goal is to generate ONE single, warm, conversational question (max 25 words) for a daily "
    "student check-in. The tone should feel like a caring coach or mentor sending a text message. "
    "Ask how they are feeling today, considering their academic or extracurricular load if provided. "
    "Respond with ONLY the question text—no quotes, greetings, or commentary."
)


def generate_checkin_question(student_name: str = "there", extracurricular_load: str = "moderate") -> str:
    """Prompt A: Generate an empathetic, contextual check-in question."""
    if client is None:
        return _fallback_question(student_name)

    user_prompt = (
        f"Student name: {student_name}\n"
        f"Current extracurricular load: {extracurricular_load}\n\n"
        "Generate a brief, supportive question asking how they are feeling today and how their energy is."
    )

    try:
        response = client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=[
                {"role": "system", "content": PROMPT_A_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=60,
        )
        content = (response.choices[0].message.content or "").strip().strip('"').strip("'")
        if content:
            return content
    except Exception as exc:
        warnings.warn(f"Prompt A generation failed ({exc}); using fallback question.")

    return _fallback_question(student_name)


def _fallback_question(name: str) -> str:
    first_name = name.split()[0] if name else "there"
    return f"Hey {first_name}, how are you holding up with your classes and energy today?"


# ============================================================================
# PROMPT B: The Insight Extractor
# ============================================================================
PROMPT_B_SYSTEM = (
    "You are a psychological insight extraction engine for an educational support system. "
    "Analyze the student's natural language response to their daily check-in. "
    "You must extract:\n"
    "1. 'mood_score': Integer from 1 to 5 based on their emotional valence and energy level:\n"
    "   - 1 = Very low / distressed, burnt out, overwhelmed, hopeless\n"
    "   - 2 = Low / struggling, frustrated, tired, anxious, falling behind\n"
    "   - 3 = Neutral / okay, managing, average, mixed\n"
    "   - 4 = Positive / feeling good, productive, focused, hopeful\n"
    "   - 5 = Excellent / energized, thriving, highly motivated\n"
    "2. 'tags': Array of 2 to 4 concise lowercase strings describing their emotions, subjects, "
    "or stressors mentioned (e.g. ['frustrated', 'math', 'tired', 'sleep']).\n\n"
    "Output must be strictly valid JSON with no markdown formatting or extra text. Format:\n"
    '{"mood_score": 2, "tags": ["frustrated", "math"]}'
)


def extract_insights(student_response: str) -> dict[str, Any]:
    """Prompt B: Extract mood_score (1-5) and tags from student text."""
    if not student_response or not student_response.strip():
        return {"mood_score": 3, "tags": ["neutral", "unspecified"]}

    if client is not None:
        try:
            response = client.chat.completions.create(
                model=OPENROUTER_MODEL,
                messages=[
                    {"role": "system", "content": PROMPT_B_SYSTEM},
                    {"role": "user", "content": f'Student response:\n"{student_response.strip()}"'},
                ],
                temperature=0.1,
                max_tokens=100,
            )
            raw_text = response.choices[0].message.content or ""
            parsed = _parse_insight_json(raw_text)
            if parsed:
                return parsed
        except Exception as exc:
            warnings.warn(f"Prompt B failed ({exc}); engaging heuristic insight extractor.")

    # Fallback heuristic extractor when LLM is unavailable or fails
    return _heuristic_insight_extractor(student_response)


def _parse_insight_json(text: str) -> Optional[dict[str, Any]]:
    """Robust JSON parser that removes markdown fences and extracts JSON dict."""
    cleaned = re.sub(r"```(?:json)?", "", text).strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[^{}]*\}", cleaned, re.DOTALL)
        if not match:
            return None
        try:
            data = json.loads(match.group(0))
        except Exception:
            return None

    if not isinstance(data, dict):
        return None

    mood_score = data.get("mood_score")
    if not isinstance(mood_score, int) or mood_score < 1 or mood_score > 5:
        # Try converting string or float
        try:
            mood_score = max(1, min(5, int(round(float(mood_score)))))
        except Exception:
            mood_score = 3

    tags = data.get("tags")
    if not isinstance(tags, list):
        tags = ["general"]
    else:
        tags = [str(t).lower().strip() for t in tags if str(t).strip()][:5]

    return {"mood_score": mood_score, "tags": tags}


def _heuristic_insight_extractor(text: str) -> dict[str, Any]:
    """Fallback sentiment and topic extractor based on natural language keywords."""
    lower = text.lower()
    tags = []

    # Emotional keywords
    negative_words = [
        "tired", "exhausted", "stressed", "anxious", "overwhelmed", "frustrated",
        "hating", "hate", "struggling", "terrible", "awful", "sad", "hopeless",
        "behind", "burnt", "burnout", "sleepy", "hard", "difficult", "failing"
    ]
    positive_words = [
        "great", "good", "happy", "excited", "confident", "prepared", "proud",
        "focused", "ready", "energized", "awesome", "loving", "clear", "productive"
    ]

    neg_count = sum(1 for w in negative_words if w in lower)
    pos_count = sum(1 for w in positive_words if w in lower)

    # Subject detection
    subjects = ["math", "physics", "science", "english", "history", "coding", "exam", "assignment", "project"]
    for s in subjects:
        if s in lower:
            tags.append(s)

    for w in negative_words:
        if w in lower and len(tags) < 4:
            tags.append(w)

    for w in positive_words:
        if w in lower and len(tags) < 4:
            tags.append(w)

    # Determine mood score (1-5)
    if neg_count >= 3:
        mood_score = 1
    elif neg_count > pos_count:
        mood_score = 2
    elif pos_count > neg_count:
        mood_score = 5 if pos_count >= 2 else 4
    else:
        mood_score = 3

    if not tags:
        tags = ["managing", "general"]

    return {"mood_score": mood_score, "tags": tags}

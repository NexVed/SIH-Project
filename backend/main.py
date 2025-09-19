from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import os
import train_model
import google.generativeai as genai
from dotenv import load_dotenv
import logging
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------
# Gemini API setup
# -----------------------------
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    logger.warning("GEMINI_API_KEY not set. Gemini calls will be skipped and fallback content returned.")

# -----------------------------
# FastAPI setup
# -----------------------------
app = FastAPI(title="eDravya Labs Prototype")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for prototype
    allow_methods=["*"],
    allow_headers=["*"]
)

# -----------------------------
# ML model loading / training
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "model.pkl")
CSV_FILE = os.path.join(BASE_DIR, "e-dravya.csv")

if not os.path.exists(MODEL_FILE):
    logger.info("No trained model found. Training from CSV...")
    train_model.train_model()

try:
    model = joblib.load(MODEL_FILE)
except Exception as e:
    raise RuntimeError(f"Failed to load model from {MODEL_FILE}: {e}")

if not os.path.exists(CSV_FILE):
    raise RuntimeError(f"Dataset file not found at {CSV_FILE}")
dataset = pd.read_csv(CSV_FILE)
required_columns = ['pH', 'TDS', 'Turbidity', 'Gas', 'ColorIndex', 'Temp', 'Label']
missing = [c for c in required_columns if c not in dataset.columns]
if missing:
    raise RuntimeError(f"Dataset missing required columns: {missing}")
label_column = 'Label'
dravya_labels = sorted(dataset[label_column].unique().tolist())

# -----------------------------
# Request models
# -----------------------------
class SensorInput(BaseModel):
    pH: float
    TDS: float
    Turbidity: float
    Gas: float
    ColorIndex: float
    Temp: float

class ResearchQuery(BaseModel):
    dravya: str
    query: str

# -----------------------------
# Endpoints
# -----------------------------

# 1️⃣ Identify via manual input
def _extract_text(response) -> Optional[str]:
    # Attempt multiple extraction strategies
    if response is None:
        return None
    if getattr(response, 'text', None):
        return response.text
    # Some SDK versions use 'candidates'
    candidates = getattr(response, 'candidates', None)
    if candidates:
        for c in candidates:
            try:
                parts = c.get('content', {}).get('parts') if isinstance(c, dict) else getattr(c, 'content', {}).parts
                if parts:
                    texts = []
                    for p in parts:
                        if isinstance(p, dict) and 'text' in p:
                            texts.append(p['text'])
                        else:
                            t = getattr(p, 'text', None)
                            if t:
                                texts.append(t)
                    if texts:
                        return "\n".join(texts).strip()
            except Exception:
                continue
    return None

def generate_gemini_text(prompt: str, model_name: str = "gemini-1.5-flash") -> Optional[str]:
    if not API_KEY:
        logger.debug("Gemini skipped: no API key")
        return None
    try:
        model_obj = genai.GenerativeModel(model_name)
        response = model_obj.generate_content(prompt)
        text = _extract_text(response)
        if not text:
            logger.warning("Gemini returned empty text for prompt snippet: %s", prompt[:60])
        return text
    except Exception as e:
        logger.error(f"Gemini generation error ({model_name}): {e}")
        return None


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True, "classes": dravya_labels[:5]}


@app.post("/identify")
def identify_dravya(data: SensorInput):
    # Feature order must match training: ['pH', 'TDS', 'Turbidity', 'Gas', 'ColorIndex', 'Temp']
    features = [[data.pH, data.TDS, data.Turbidity, data.Gas, data.ColorIndex, data.Temp]]
    try:
        prediction = model.predict(features)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

    description_prompt = (
        f"You are an Ayurvedic expert. Provide a structured JSON-like description (no code block) for the herb '{prediction}'. "
        "Fields: Name, AyurvedicProperties (Guna, Rasa, Virya, Vipaka), MedicinalUses (list), FoodUses (list), SafetyNotes."
    )
    desc = generate_gemini_text(description_prompt, model_name="gemini-1.5-flash")
    if not desc:
        desc = "Description unavailable (Gemini returned no content)."

    return {"dravya": prediction, "description": desc}


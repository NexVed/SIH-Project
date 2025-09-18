from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import os
import train_model
import google.generativeai as genai
try:
    from google import genai as genai_new  # newer google-genai client
except ImportError:  # fallback if not installed
    genai_new = None
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
# Simple in-memory caches
# -----------------------------
description_cache: dict[str, str] = {}
image_cache: dict[str, str] = {}

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


def generate_gemini_image(prompt: str) -> Optional[str]:
    """Attempt to generate a base64 image using several Gemini / Imagen style APIs.

    Returns base64 string or None. Tries multiple method names to stay forward-compatible
    with evolving SDKs.
    """
    if not API_KEY:
        return None
    candidate_models = [
        "imagen-3.0-generate",  # hypothetical / future
        "imagegeneration",      # possible legacy alias
        "gemini-1.5-flash",     # fallback (likely text-only)
    ]
    for mname in candidate_models:
        try:
            model_obj = genai.GenerativeModel(mname)
            # Strategy 1: direct image generation method names (if exposed)
            for method_name in ["generate_image", "generate_images"]:
                method = getattr(model_obj, method_name, None)
                if callable(method):
                    try:
                        resp = method(prompt=prompt)
                        # Common patterns: resp.images (list), resp.image (single), resp.generated_images
                        possible_attrs = ["images", "image", "generated_images"]
                        for attr in possible_attrs:
                            imgs = getattr(resp, attr, None)
                            if not imgs:
                                continue
                            # Normalize to list
                            if not isinstance(imgs, (list, tuple)):
                                imgs = [imgs]
                            for img in imgs:
                                # Look for base64 data attribute names
                                data_field = None
                                for field in ["image_bytes", "data", "base64", "b64_data"]:
                                    data_field = getattr(img, field, None) or (img.get(field) if isinstance(img, dict) else None)
                                    if data_field:
                                        break
                                if data_field:
                                    logger.info(f"Generated image via {mname}.{method_name}")
                                    return data_field
                    except Exception as inner_call_e:
                        logger.debug(f"{mname}.{method_name} failed: {inner_call_e}")
            # Strategy 2: fallback to generate_content and inspect inline_data
            try:
                resp = model_obj.generate_content(prompt)
                candidates = getattr(resp, 'candidates', None)
                if candidates:
                    for cand in candidates:
                        parts = None
                        if isinstance(cand, dict):
                            parts = cand.get('content', {}).get('parts')
                        else:
                            content = getattr(cand, 'content', None)
                            parts = getattr(content, 'parts', None) if content else None
                        if parts:
                            for p in parts:
                                inline = None
                                if isinstance(p, dict):
                                    inline = p.get('inline_data') or p.get('inlineData')
                                else:
                                    inline = getattr(p, 'inline_data', None) or getattr(p, 'inlineData', None)
                                if inline:
                                    data_field = inline.get('data') if isinstance(inline, dict) else getattr(inline, 'data', None)
                                    if data_field:
                                        logger.info(f"Generated image inline_data via {mname}.generate_content")
                                        return data_field
            except Exception as gen_content_e:
                logger.debug(f"{mname}.generate_content image fallback failed: {gen_content_e}")
        except Exception as e:
            logger.debug(f"Image model {mname} not available / failed: {e}")
    return None


def generate_imagen_image(prompt: str) -> Optional[str]:
    """Use the newer google-genai client (if available) to generate an image via Imagen 4 model.

    Returns base64 string or None.
    """
    if not API_KEY or genai_new is None:
        return None
    try:
        client = genai_new.Client(api_key=API_KEY)
        logger.info("Requesting Imagen 4 image...")
        result = client.models.generate_images(
            model="models/imagen-4.0-generate-001",
            prompt=prompt,
            config=dict(
                number_of_images=1,
                output_mime_type="image/jpeg",
                person_generation="ALLOW_ALL",
                aspect_ratio="1:1",
                image_size="1K",
            ),
        )
        images = getattr(result, 'generated_images', None)
        if not images:
            logger.warning("Imagen client returned no generated_images")
            return None
        img_obj = images[0]
        logger.debug(f"Imagen image object attrs: {dir(img_obj)}")
        # Try explicit base64 attribute names first
        for attr in ["base64_data", "b64_data", "data", "bytes", "image_bytes"]:
            val = getattr(img_obj, attr, None)
            if isinstance(val, (bytes, bytearray)):
                import base64
                return base64.b64encode(val).decode('utf-8')
            if isinstance(val, str) and len(val) > 100:
                # already base64 string
                return val
        # Nested image object
        candidate = getattr(img_obj, 'image', None)
        if candidate is not None:
            # Pillow image path
            if hasattr(candidate, 'save'):
                try:
                    from io import BytesIO
                    import base64
                    buf = BytesIO()
                    candidate.save(buf, format='JPEG')
                    return base64.b64encode(buf.getvalue()).decode('utf-8')
                except Exception as e:
                    logger.debug(f"PIL save path failed: {e}")
            # Raw bytes path
            if isinstance(candidate, (bytes, bytearray)):
                import base64
                return base64.b64encode(candidate).decode('utf-8')
        logger.warning("Unable to extract base64 from Imagen result (no recognized attributes)")
    except Exception as e:
        logger.debug(f"Imagen generation error: {e}")
    return None


@app.post("/identify")
def identify_dravya(data: SensorInput):
    # Feature order must match training: ['pH', 'TDS', 'Turbidity', 'Gas', 'ColorIndex', 'Temp']
    features = [[data.pH, data.TDS, data.Turbidity, data.Gas, data.ColorIndex, data.Temp]]
    try:
        prediction = model.predict(features)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

    # Reuse cached description / image if already generated for this dravya
    if prediction in description_cache and prediction in image_cache:
        return {
            "dravya": prediction,
            "description": description_cache[prediction],
            "image_base64": image_cache[prediction]
        }

    description_prompt = (
        f"Write a concise vivid paragraph (<=120 words) describing the Ayurvedic herb '{prediction}'. "
        "Include traditional uses, notable phytochemical or therapeutic properties, and a gentle safety / usage caution. "
        "Plain text only."
    )

    desc = description_cache.get(prediction) or generate_gemini_text(description_prompt, model_name="gemini-1.5-flash")
    if not desc:
        desc = "Description unavailable (Gemini returned no content)."
    description_cache[prediction] = desc

    # Image generation helper
    image_base64 = image_cache.get(prediction)
    if image_base64 is None:
        img_prompt = (
            f"High resolution photorealistic studio photograph of {prediction} medicinal plant, sharp botanical detail, natural soft light, dark neutral bokeh background."
        )
        # Try newer Imagen client first for better reliability
        image_base64 = generate_imagen_image(img_prompt)
        if not image_base64:
            # Fallback to legacy multi-strategy generator
            image_base64 = generate_gemini_image(img_prompt)
        if image_base64:
            image_cache[prediction] = image_base64
        else:
            logger.warning(f"No image bytes produced for {prediction}; returning null image_base64.")

    return {
        "dravya": prediction,
        "description": desc,
        "image_base64": image_base64
    }


@app.get("/debug/image")
def debug_image(dravya: str):
    prompt = f"Photorealistic studio macro of {dravya} medicinal plant, dark neutral background, high detail."
    img_b64 = generate_imagen_image(prompt) or generate_gemini_image(prompt)
    length = len(img_b64) if img_b64 else 0
    return {"dravya": dravya, "have_image": bool(img_b64), "length": length, "sample_start": img_b64[:40] if img_b64 else None}


import os
import json
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="EdgeSpeech Intent API Gateway", version="1.0.0")

class TranscriptionPayload(BaseModel):
    text: str

# Mengambil token Hugging Face dari Environment Variables Vercel
HF_TOKEN = os.getenv("HF_TOKEN", "")
GEMMA_API_URL = "https://api-inference.huggingface.co/models/google/gemma-2-9b-it"

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "EdgeSpeech Gateway"}

@app.post("/api/intent")
async def extract_intent(payload: TranscriptionPayload):
    text = payload.text.strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Payload teks tidak boleh kosong.")

    # Fallback Mode jika HF_TOKEN belum dipasang di Vercel Dashboard
    if not HF_TOKEN:
        return {
            "intent": "Voice Command / Note",
            "summary": f"Transkripsi diterima: '{text}'. (Mode Demo: Tambahkan HF_TOKEN di Vercel untuk ekstraksi Gemma 4 live)",
            "status": "demo_mode"
        }

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }

    # Format Prompt untuk Google Gemma 2 / 4
    prompt = (
        f"<bos><start_of_turn>user\n"
        f"Analyze this transcript and extract: 1) Short Intent (2-4 words) and 2) Brief Summary (1 sentence).\n"
        f"Respond ONLY in valid JSON format: {{\"intent\": \"...\", \"summary\": \"...\"}}\n\n"
        f"Transcript: \"{text}\"<end_of_turn>\n"
        f"<start_of_turn>model\n"
    )

    try:
        response = requests.post(
            GEMMA_API_URL,
            headers=headers,
            json={
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 150,
                    "temperature": 0.2,
                    "return_full_text": False
                }
            },
            timeout=8
        )

        if response.status_code == 200:
            result = response.json()
            raw_text = result[0].get("generated_text", "").strip() if isinstance(result, list) else ""
            
            # Parsing output JSON dari Gemma
            try:
                start = raw_text.find("{")
                end = raw_text.rfind("}") + 1
                if start != -1 and end != 0:
                    parsed_json = json.loads(raw_text[start:end])
                    return {
                        "intent": parsed_json.get("intent", "General Action"),
                        "summary": parsed_json.get("summary", text),
                        "status": "success"
                    }
            except Exception:
                pass

            return {
                "intent": "General Transcription",
                "summary": raw_text or text,
                "status": "parsed_fallback"
            }
        else:
            return {
                "intent": "Speech Input",
                "summary": text,
                "status": "api_error_fallback"
            }

    except Exception as e:
        return {
            "intent": "Speech Input",
            "summary": text,
            "status": f"exception_fallback: {str(e)}"
        }
# EdgeSpeech-WASM 

> **Zero-Cost, Low-Latency In-Browser Speech Recognition & Intent Engine**  
> Powered by Dynamic INT8 Quantized Whisper-tiny, ONNX Runtime WebAssembly, FastAPI, and Google Gemma 4.

---

## Overview

**EdgeSpeech-WASM** is a proof-of-concept audio AI engine designed for real-time speech-to-text (ASR) and downstream intent classification running directly on the edge. By shifting model execution to the user's browser via WebAssembly and INT8 quantization, it achieves near-zero latency audio processing without expensive GPU server infrastructure.

### Key Highlights
* **Edge-Native Inference:** Runs quantized Whisper-tiny locally in the client browser using ONNX Runtime Web.
* **70%+ Model Compression:** Dynamic INT8 quantization reduces the Whisper-tiny payload from ~150 MB down to ~40 MB.
* **Low Latency:** Eliminates network overhead for audio transport by processing streaming PCM audio chunks on the device.
* **Zero-Cost Architecture:** Fully client-side ASR with a lightweight FastAPI proxy hosted on Vercel connecting to Google Gemma 4 for instant text summaries and intent extraction.

---

## 🏗️ Architecture

[ Microphone Input ]
│ (Web Audio API / PCM Stream)
▼
[ Browser Runtime (WASM) ] ──► [ ONNX Runtime Web (Whisper-tiny INT8) ]
│
▼ (Transcription Text)
[ Google Gemma 4 ] ◄── [ FastAPI Gateway (Vercel) ] ◄──┘
│
▼
[ Actionable Intent & Summary UI ]


---

## Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Edge ASR Engine** | ONNX Runtime Web + C++/WASM | Local in-browser model execution |
| **Model Optimization** | PyTorch, Optimum, ONNX Quantization | FP32 to Unsigned INT8 dynamic compression |
| **Frontend** | React, Tailwind CSS | Real-time waveform & streaming transcript UI |
| **Backend Gateway** | FastAPI, Vercel Serverless | Light orchestration & API proxying |
| **LLM Processing** | Google Gemma 4 (via Hugging Face API) | Natural Language Intent Extraction |

---

## Model Compression & Benchmarks

| Metric | Original (FP32) | Quantized (INT8) | Improvement |
| :--- | :--- | :--- | :--- |
| **Encoder Size** | ~23 MB | ~8 MB | **~65% Reduction** |
| **Decoder Size** | ~125 MB | ~33 MB | **~73% Reduction** |
| **Memory Bandwidth** | High | Low | **Optimal for Mobile/Browser** |
| **Execution Target** | WebGPU / CPU | WebAssembly (CPU) | **Zero External Dependencies** |

---

## Quickstart

### 1. Model Quantization (Colab / Local)
To reproduce the INT8 model conversion from Hugging Face:

```bash
# Export and quantize Whisper-tiny to ONNX INT8
python scripts/quantize.py
2. Backend Setup (FastAPI / Vercel)
Bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
3. Frontend Setup (React)
Bash
cd frontend
npm install
npm run dev

```
Author
Dedy Van Hauten

Full-Stack & AI Optimization Engineer

M.S. in Computer Science — University of Indonesia

Specializing in Edge AI, Model Compression, and WebAssembly execution pipelines.

License
MIT License.

---

## Contact & Hiring

I am currently **open to new opportunities** in AI/ML Engineering, Edge AI, and Full-Stack Systems Development. Feel free to reach out or connect!

* ✉️ **Email:** [dvanhauten@gmail.com](mailto:dvanhauten@gmail.com)
* 💼 **LinkedIn:** [Dedy Van Hauten](https://www.linkedin.com/in/dedyvanhauten)

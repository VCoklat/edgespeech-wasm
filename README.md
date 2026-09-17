# EdgeSpeech-WASM

Zero-Cost, Low-Latency In-Browser Speech Recognition & Intent Extraction Engine powered by WebAssembly, ONNX Runtime, and Google Gemini.

---

## Technical Architecture

EdgeSpeech-WASM processes audio locally inside the user's browser using an INT8 quantized Whisper model executing via ONNX Runtime WebAssembly. Once transcribed, the resulting text is dispatched to a serverless endpoint to extract downstream intent using Google's Gemini / Gemma LLM models.

```
[ Microphone ] 
      │
      ▼
[ WebAudio API ] ──► (OfflineAudioContext Resampling to 16kHz)
      │
      ▼
[ Transformers.js / ONNX WASM ] ──► (In-Browser ASR: VCoklat/edgespeech-whisper-tiny-int8)
      │
      ▼
[ Transcribed Text ]
      │
      ▼
[ Vercel Serverless Endpoint (/api/intent) ] ──► [ Google Gemini / Gemma LLM ]
      │
      ▼
[ Downstream Intent & Summary ]

```

---

## Core Features

* **100% Client-Side ASR:** Transcribes speech directly in the user's browser with zero backend server costs and complete privacy.
* **INT8 Model Optimization:** Operates using a custom quantized Whisper Tiny model (`VCoklat/edgespeech-whisper-tiny-int8`) with a ~56MB WASM memory footprint.
* **Hardware Audio Resampling:** Built-in `OfflineAudioContext` pipeline automatically resamples various hardware microphone inputs (44.1 kHz / 48 kHz) to the required 16 kHz Float32 array.
* **Merged Decoder Graph:** Uses an optimized ONNX merged-decoder architecture to prevent Key-Value (`past_key_values`) input mismatch errors in browser inference loops.
* **Secure LLM Integration:** Proxies downstream intent parsing through Vercel Serverless Functions to protect API credentials.

---

## Technology Stack

| Domain | Technology |
| --- | --- |
| **Frontend Framework** | React.js |
| **Client Machine Learning** | ONNX Runtime WebAssembly, `@xenova/transformers` |
| **ASR Model** | `VCoklat/edgespeech-whisper-tiny-int8` (Quantized INT8) |
| **Audio Processing** | Web Audio API (`AudioContext`, `ScriptProcessorNode`, `OfflineAudioContext`) |
| **Serverless API** | Vercel Serverless Functions (Node.js) |
| **Downstream NLP** | Google AI Studio (Gemini / Gemma API) |

---

## Project Structure

```
├── api/
│   └── intent.js            # Vercel Serverless Function proxying Gemini LLM calls
├── src/
│   ├── App.jsx              # Main dashboard container & UI orchestrator
│   ├── AudioTranscriber.jsx # WASM Speech-to-Text component & Audio Pipeline
│   └── main.jsx             # React entry point
├── public/                  # Static assets
├── package.json             # Dependencies & build scripts
└── README.md                # Technical documentation

```

---

## Getting Started

### Prerequisites

* Node.js (v18.x or higher)
* npm or yarn
* Google AI Studio API Key (for downstream intent processing)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/VCoklat/edgespeech-wasm.git
cd edgespeech-wasm

```


2. **Install dependencies:**
```bash
npm install

```


3. **Configure Environment Variables:**
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_google_ai_studio_api_key_here

```


4. **Run the local development server:**
```bash
npm run dev

```



---

## Model Quantization & Export Pipeline

To re-quantize or export a custom Whisper model for ONNX Runtime WebAssembly:

```bash
# 1. Run local quantization script (filters FP32 graphs and quantizes to INT8)
python quantize_pure_onnx.py

# 2. Upload quantized INT8 artifacts directly to Hugging Face
huggingface-cli login
huggingface-cli upload VCoklat/edgespeech-whisper-tiny-int8 ./whisper-onnx-int8/onnx /onnx --delete-unknown
huggingface-cli upload VCoklat/edgespeech-whisper-tiny-int8 ./whisper-onnx-int8/*.json /

```

---

## Deployment

To deploy to Vercel:

1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add `GEMINI_API_KEY` under **Project Settings -> Environment Variables**.
4. Deploy the application.

---

## License

MIT License. Free for open-source and commercial use.
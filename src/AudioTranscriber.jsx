import React, { useState, useEffect, useRef } from 'react';
import { pipeline, env } from '@xenova/transformers';

// Konfigurasi akses remote ke repositori Hugging Face
env.allowLocalModels = false;
env.allowRemoteModels = true;

export default function AudioTranscriber({ onTranscribeComplete }) {
  const [transcriber, setTranscriber] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelProgress, setModelProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');

  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 1. Memuat Model INT8 dari Hugging Face ke Memori WASM Browser
  useEffect(() => {
    async function initPipeline() {
      try {
        setIsModelLoading(true);
        const pipe = await pipeline(
          'automatic-speech-recognition',
          'VCoklat/edgespeech-whisper-tiny-int8',
          {
            quantized: true,
            progress_callback: (p) => {
              if (p.status === 'progress') {
                setModelProgress(Math.round(p.progress || 0));
              }
            },
          }
        );
        setTranscriber(() => pipe);
        setIsModelLoading(false);
      } catch (error) {
        console.error('Gagal memuat model ONNX WASM:', error);
        setIsModelLoading(false);
      }
    }
    initPipeline();
  }, []);

  // 2. Merekam Audio dari Mikrofon (16kHz PCM Stream)
  const startRecording = async () => {
    audioChunksRef.current = [];
    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioChunksRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      setIsRecording(true);
    } catch (err) {
      console.error('Akses mikrofon ditolak atau gagal:', err);
    }
  };

  // 3. Menghentikan Rekaman & Eksekusi Inferensi WASM Lokal
  const stopRecordingAndTranscribe = async () => {
    if (!mediaStreamRef.current) return;

    mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    if (audioContextRef.current) {
      await audioContextRef.current.close();
    }
    setIsRecording(false);

    // Menggabungkan potongan buffer PCM audio menjadi satu Float32Array
    const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
    const mergedAudio = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunksRef.current) {
      mergedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    // 4. Jalankan Inferensi di Browser
    if (transcriber && mergedAudio.length > 0) {
      setIsTranscribing(true);
      try {
        const output = await transcriber(mergedAudio, {
          chunk_length_s: 30,
          stride_length_s: 5,
          language: 'english',
          task: 'transcribe',
        });

        const transcribedText = output.text.trim();
        setTranscript(transcribedText);

        // Teruskan teks ke App.jsx untuk pemicu intent LLM (Gemma 4)
        if (onTranscribeComplete && transcribedText) {
          onTranscribeComplete(transcribedText);
        }
      } catch (err) {
        console.error('Error saat inferensi WASM:', err);
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Client-Side ASR Engine (WASM)</h3>

      {isModelLoading ? (
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>
            Memuat Model INT8 ke Memori WebAssembly... ({modelProgress}%)
          </p>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarFill, width: `${modelProgress}%` }} />
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={isRecording ? stopRecordingAndTranscribe : startRecording}
            disabled={isTranscribing}
            style={{
              ...styles.button,
              backgroundColor: isRecording ? '#ef4444' : '#2563eb',
              opacity: isTranscribing ? 0.6 : 1,
            }}
          >
            {isRecording ? 'Stop & Transcribe' : 'Start Recording'}
          </button>

          {isTranscribing && (
            <p style={{ color: '#d97706', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              ⚡ Menjalankan inferensi ONNX lokal di browser...
            </p>
          )}

          <div style={styles.transcriptBox}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#374151' }}>
              Hasil Transkripsi Teks:
            </h4>
            <p style={{ margin: 0, color: transcript ? '#111827' : '#9ca3af' }}>
              {transcript || (isRecording ? 'Merekam suara...' : 'Belum ada suara direkam.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.1rem',
    color: '#111827',
  },
  loadingContainer: {
    padding: '0.5rem 0',
  },
  loadingText: {
    fontSize: '0.9rem',
    color: '#4b5563',
    marginBottom: '0.5rem',
  },
  progressBarBg: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    transition: 'width 0.2s ease',
  },
  button: {
    padding: '0.75rem 1.5rem',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.2s',
  },
  transcriptBox: {
    marginTop: '1.25rem',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #f3f4f6',
  },
};
import React, { useState, useEffect, useRef } from 'react';
import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.allowRemoteModels = true;

export default function AudioTranscriber({ onTranscribeComplete }) {
  const [transcriber, setTranscriber] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelProgress, setModelProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const audioChunksRef = useRef([]);

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
        console.error('Failed to load ONNX WASM model:', error);
        setErrorMessage('Failed to load speech recognition model.');
        setIsModelLoading(false);
      }
    }
    initPipeline();
  }, []);

  // Resample buffer audio ke 16000Hz secara akurat
  const resampleTo16kHz = async (audioData, originalSampleRate) => {
    if (originalSampleRate === 16000) return audioData;

    const targetLength = Math.round((audioData.length * 16000) / originalSampleRate);
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      1,
      targetLength,
      16000
    );

    const buffer = offlineCtx.createBuffer(1, audioData.length, originalSampleRate);
    buffer.copyToChannel(audioData, 0);

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer.getChannelData(0);
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    setTranscript('');
    setErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Microphone access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        audioChunksRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      setErrorMessage('Microphone permission denied.');
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (!mediaStreamRef.current) return;

    mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    if (audioContextRef.current) {
      await audioContextRef.current.close();
    }
    setIsRecording(false);

    const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);

    if (totalLength === 0) {
      setErrorMessage('No audio captured. Please check microphone settings.');
      return;
    }

    setIsTranscribing(true);

    setTimeout(async () => {
      try {
        const rawAudio = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunksRef.current) {
          rawAudio.set(chunk, offset);
          offset += chunk.length;
        }

        // Resample audio ke 16kHz
        const audio16k = await resampleTo16kHz(rawAudio, sampleRate);

        if (transcriber) {
          const output = await transcriber(audio16k, {
            language: 'english',
            task: 'transcribe',
          });

          const rawText = Array.isArray(output) ? output[0]?.text : output?.text;
          const transcribedText = (rawText || '').trim();

          if (transcribedText.length > 0) {
            setTranscript(transcribedText);
            if (onTranscribeComplete) {
              onTranscribeComplete(transcribedText);
            }
          } else {
            setTranscript('No speech detected in recording.');
          }
        }
      } catch (err) {
        console.error('WASM inference error:', err);
        setErrorMessage('Failed to transcribe audio.');
      } finally {
        setIsTranscribing(false);
      }
    }, 50);
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>Client-Side ASR Engine (WASM)</h3>

      {isModelLoading ? (
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>
            Loading INT8 Model into WASM Memory... ({modelProgress}%)
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
              cursor: isTranscribing ? 'not-allowed' : 'pointer',
            }}
          >
            {isRecording ? 'Stop & Transcribe' : 'Start Recording'}
          </button>

          {isTranscribing && (
            <p style={{ color: '#d97706', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              ⚡ Running local ONNX inference in browser...
            </p>
          )}

          {errorMessage && (
            <p style={{ color: '#ef4444', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              ⚠️ {errorMessage}
            </p>
          )}

          <div style={styles.transcriptBox}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#374151' }}>
              Transcribed Text:
            </h4>
            <p style={{ margin: 0, color: transcript ? '#111827' : '#9ca3af' }}>
              {transcript || (isRecording ? 'Listening to audio...' : 'No speech recorded yet.')}
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
  cardTitle: { margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#111827' },
  loadingContainer: { padding: '0.5rem 0' },
  loadingText: { fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' },
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
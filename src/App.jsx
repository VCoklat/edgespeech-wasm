import React, { useState } from 'react';
import AudioTranscriber from './AudioTranscriber';

export default function App() {
  const [transcribedText, setTranscribedText] = useState('');
  const [intentData, setIntentData] = useState({ intent: '', summary: '' });
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleTranscribeComplete = async (text) => {
    setTranscribedText(text);
    setApiError('');

    if (!text || text === 'No speech detected in recording.') {
      setIntentData({ intent: '', summary: '' });
      return;
    }

    setIsLLMLoading(true);
    setIntentData({ intent: '', summary: '' });

    try {
      const response = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (response.ok) {
        setIntentData({
          intent: data.intent || 'N/A',
          summary: data.summary || 'N/A',
        });
      } else {
        setApiError(data.error || 'Failed to extract intent from downstream LLM.');
      }
    } catch (err) {
      console.error('LLM API Error:', err);
      setApiError('Network error connecting to /api/intent endpoint.');
    } finally {
      setIsLLMLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <header style={styles.header}>
        <h1 style={styles.title}>EdgeSpeech-WASM</h1>
        <p style={styles.subtitle}>
          Zero-Cost, Low-Latency In-Browser Speech Recognition & Intent Extraction Engine
        </p>
        <div style={styles.badgeContainer}>
          <span style={{ ...styles.badge, backgroundColor: '#059669' }}>
            INT8 Quantized (~56MB WASM Footprint)
          </span>
          <span style={{ ...styles.badge, backgroundColor: '#2563eb' }}>
            Merged Decoder Graph
          </span>
          <span style={{ ...styles.badge, backgroundColor: '#4f46e5' }}>
            Google Gemini / Gemma LLM
          </span>
        </div>
      </header>

      <main style={styles.main}>
        {/* Client-Side Speech-to-Text WASM Engine */}
        <AudioTranscriber onTranscribeComplete={handleTranscribeComplete} />

        {/* Downstream Intent & Summary NLP Panel */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Downstream Intent & Summary</h3>

          {isLLMLoading && (
            <p style={{ color: '#2563eb', marginTop: 0, fontSize: '0.9rem', fontWeight: '500' }}>
              🧠 Running downstream NLP intent extraction via Serverless API...
            </p>
          )}

          {apiError && (
            <p style={{ color: '#ef4444', marginTop: 0, fontSize: '0.9rem' }}>
              ⚠️ {apiError}
            </p>
          )}

          <div style={styles.resultContainer}>
            {intentData.intent || intentData.summary ? (
              <div style={styles.intentGrid}>
                <div style={styles.intentBox}>
                  <span style={styles.fieldLabel}>Intent:</span>
                  <p style={styles.fieldValue}>{intentData.intent}</p>
                </div>
                <div style={styles.summaryBox}>
                  <span style={styles.fieldLabel}>Summary:</span>
                  <p style={styles.fieldValue}>{intentData.summary}</p>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: '#9ca3af', fontStyle: 'italic' }}>
                {isLLMLoading
                  ? 'Analyzing transcript...'
                  : 'Record your voice above to automatically trigger NLP intent extraction.'}
              </p>
            )}
          </div>
        </div>

        {/* Technical Architecture Specs */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Technical Specifications</h3>
          <div style={styles.specGrid}>
            <div style={styles.specItem}>
              <strong>ASR Engine:</strong> Whisper-Tiny INT8 (`VCoklat/edgespeech-whisper-tiny-int8`)
            </div>
            <div style={styles.specItem}>
              <strong>Execution Runtime:</strong> ONNX Runtime WebAssembly via `@xenova/transformers`
            </div>
            <div style={styles.specItem}>
              <strong>Audio Resampling:</strong> Web Audio API `OfflineAudioContext` (44.1/48kHz ➔ 16kHz Float32)
            </div>
            <div style={styles.specItem}>
              <strong>Downstream NLP:</strong> Google Gemini / Gemma API via Vercel Serverless Function (`/api/intent`)
            </div>
          </div>
        </div>

        {/* Developer Contact & Hiring Section */}
        <footer style={{ ...styles.card, backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }}>
          <h3 style={{ ...styles.cardTitle, color: '#6b21a8' }}>Developer & Contact Info</h3>
          <p style={{ margin: '0 0 0.75rem 0', color: '#4c1d95', fontSize: '0.95rem' }}>
            Built by <strong>Dedy Van Hauten</strong> — Software Engineer & AI Researcher specializing in Full-Stack Engineering, Edge AI, and Model Optimization.
          </p>
          <div style={styles.contactLinks}>
            <a href="https://github.com/VCoklat" target="_blank" rel="noreferrer" style={styles.link}>
              GitHub (@VCoklat)
            </a>
            <a href="https://huggingface.co/VCoklat" target="_blank" rel="noreferrer" style={styles.link}>
              Hugging Face (@VCoklat)
            </a>
            <a href="https://edgespeech-wasm.vercel.app/" target="_blank" rel="noreferrer" style={styles.link}>
              Live Demo
            </a>
          </div>
          <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#6b21a8', fontStyle: 'italic' }}>
            🚀 Open for full-time Software Engineering / AI Research roles. DMs are open!
          </p>
        </footer>
      </main>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '850px',
    margin: '0 auto',
    padding: '2rem 1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#111827',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: '800',
    margin: '0 0 0.5rem 0',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: '0 0 1rem 0',
  },
  badgeContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  badge: {
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
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
  resultContainer: {
    backgroundColor: '#f9fafb',
    border: '1px solid #f3f4f6',
    borderRadius: '6px',
    padding: '1rem',
    minHeight: '80px',
  },
  intentGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  intentBox: {
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0.5rem',
  },
  summaryBox: {
    paddingTop: '0.25rem',
  },
  fieldLabel: {
    fontWeight: '700',
    fontSize: '0.85rem',
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  fieldValue: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.95rem',
    color: '#111827',
    lineHeight: '1.5',
  },
  specGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '0.75rem',
  },
  specItem: {
    fontSize: '0.875rem',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: '0.75rem',
    borderRadius: '6px',
  },
  contactLinks: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  link: {
    color: '#7e22ce',
    fontWeight: '600',
    fontSize: '0.9rem',
    textDecoration: 'none',
  },
};
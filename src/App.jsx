import React, { useState } from 'react';
import AudioTranscriber from './AudioTranscriber';

export default function App() {
  const [transcribedText, setTranscribedText] = useState('');
  const [intentResult, setIntentResult] = useState('');
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleTranscribeComplete = async (text) => {
    setTranscribedText(text);
    setApiError('');

    if (!text || text === 'No speech detected in recording.') {
      setIntentResult('');
      return;
    }

    setIsLLMLoading(true);
    setIntentResult('');

    try {
      const response = await fetch('/api/intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (response.ok) {
        setIntentResult(data.intent);
      } else {
        setApiError(data.error || 'Failed to extract intent from downstream LLM.');
      }
    } catch (err) {
      console.error('LLM API Error:', err);
      setApiError('Network error connecting to the /api/intent endpoint.');
    } finally {
      setIsLLMLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>EdgeSpeech-WASM</h1>
        <p style={styles.subtitle}>
          Zero-Cost, Low-Latency In-Browser Speech Recognition & Intent Engine
        </p>
        <div style={styles.badgeContainer}>
          <span style={{ ...styles.badge, backgroundColor: '#059669' }}>
            INT8 Quantized (~56MB WASM Footprint)
          </span>
          <span style={{ ...styles.badge, backgroundColor: '#4f46e5' }}>
            Google Gemma / Gemini LLM
          </span>
        </div>
      </header>

      <main style={styles.main}>
        {/* Client-Side Speech-to-Text WASM Engine */}
        <AudioTranscriber onTranscribeComplete={handleTranscribeComplete} />

        {/* Downstream Intent & NLP Processing Panel */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Downstream Intent & Summary</h3>

          {isLLMLoading && (
            <p style={{ color: '#2563eb', marginTop: '0', fontSize: '0.9rem', fontWeight: '500' }}>
              🧠 Running downstream NLP intent extraction via API...
            </p>
          )}

          {apiError && (
            <p style={{ color: '#ef4444', marginTop: '0', fontSize: '0.9rem' }}>
              ⚠️ {apiError}
            </p>
          )}

          <div style={styles.resultContainer}>
            {intentResult ? (
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#1f2937' }}>
                {intentResult}
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
      </main>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
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
};
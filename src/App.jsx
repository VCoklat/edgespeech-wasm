import React, { useState } from 'react';
import AudioTranscriber from './AudioTranscriber';

export default function App() {
  const [intentResult, setIntentResult] = useState(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);

  // Dipanggil otomatis saat AudioTranscriber selesai melakukan inferensi ASR
  const handleTranscriptionComplete = async (transcriptText) => {
    if (!transcriptText || !transcriptText.trim()) return;

    setIsLoadingIntent(true);
    try {
      // Mengirimkan teks hasil ASR ke gateway FastAPI serverless Vercel
      const response = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcriptText }),
      });

      if (!response.ok) throw new Error('Gagal terhubung ke API gateway');

      const data = await response.json();
      setIntentResult(data);
    } catch (error) {
      console.error('Error Intent Processing:', error);
      setIntentResult({
        error: 'Gagal mengekstrak intent dari serverless gateway.',
      });
    } finally {
      setIsLoadingIntent(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header & Status Badges */}
      <header style={styles.header}>
        <h1 style={styles.title}>EdgeSpeech-WASM</h1>
        <p style={styles.subtitle}>
          Zero-Cost, Low-Latency In-Browser Speech Recognition & Intent Engine
        </p>
        <div style={styles.badgeContainer}>
          <span style={{ ...styles.badge, backgroundColor: '#10b981' }}>
            INT8 Quantized (~56MB WASM Footprint)
          </span>
          <span style={{ ...styles.badge, backgroundColor: '#6366f1' }}>
            Google Gemma 4 LLM
          </span>
        </div>
      </header>

      {/* Core Application Section */}
      <main style={styles.main}>
        {/* Component 1: Client-Side Audio Inference */}
        <AudioTranscriber onTranscribeComplete={handleTranscriptionComplete} />

        {/* Component 2: Downstream Intent & NLP Analysis */}
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Downstream Intent & Summary (Gemma 4)</h3>
          
          {isLoadingIntent ? (
            <p style={{ color: '#d97706' }}>Memproses intent via FastAPI gateway...</p>
          ) : intentResult ? (
            <div style={styles.resultBox}>
              {intentResult.error ? (
                <p style={{ color: '#ef4444' }}>{intentResult.error}</p>
              ) : (
                <>
                  <p style={{ margin: '0 0 0.5rem 0' }}>
                    <strong>Detected Intent:</strong> {intentResult.intent || 'N/A'}
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Summary / Action Item:</strong> {intentResult.summary || 'N/A'}
                  </p>
                </>
              )}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              Rekam suara di atas untuk memicu ekstraksi intent NLP secara otomatis.
            </p>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>Built by <strong>Dedy Van Hauten</strong></p>
        <p>
          <a href="mailto:dvanhauten@gmail.com" style={styles.link}>Email</a> |{' '}
          <a 
            href="https://www.linkedin.com/in/dedyvanhauten" 
            target="_blank" 
            rel="noreferrer" 
            style={styles.link}
          >
            LinkedIn
          </a> |{' '}
          <a 
            href="https://huggingface.co/VCoklat/edgespeech-whisper-tiny-int8" 
            target="_blank" 
            rel="noreferrer" 
            style={styles.link}
          >
            HuggingFace Model
          </a>
        </p>
      </footer>
    </div>
  );
}

// Inline Styles (Tanpa Perlu Setup CSS Framework Tambahan)
const styles = {
  container: {
    maxWidth: '750px',
    margin: '0 auto',
    padding: '2rem 1rem',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    color: '#1f2937',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2.25rem',
    fontWeight: '800',
    color: '#111827',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#4b5563',
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
  resultBox: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '6px',
    borderLeft: '4px solid #6366f1',
  },
  footer: {
    marginTop: '3rem',
    textAlign: 'center',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
};
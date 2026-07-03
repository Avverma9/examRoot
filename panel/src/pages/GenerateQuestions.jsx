/**
 * GenerateQuestions.jsx
 *
 * AI-studio layout + single-key Gemini generation
 * Reads Gemini key/model from env.
 */

import { useMemo, useState, useRef, useCallback } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import { BASE_URL } from '../utils/baseUrl'

const GEMINI_KEY = String(import.meta.env.VITE_GEMINI_KEY || '').trim()
const GEMINI_MODEL = String(import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-lite').trim()

const GEMINI_URL = (key, model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

const SERVER_GENERATE_URL = `${BASE_URL}/admin/generate-questions`
const GEMINI_REQUEST_TIMEOUT_MS = 20000
const SERVER_REQUEST_TIMEOUT_MS = 45000

const TEMPLATES = [
  {
    name: 'Mock Test',
    icon: '📝',
    value: [
      {
        group: 'Subject name (Example: Geography, History, Polity)',
        title: 'Test title or Page title',
        description: 'Short description of the test',
        duration: 'Duration in minutes as a number (Example: 60)',
        isFree: 'true or false',
        isPublished: 'true or false',
        questions: [
          {
            question: 'Question in English',
            questionHi: 'Same question in Hindi',
            options: [
              'English Option 1',
              'English Option 2',
              'English Option 3',
              'English Option 4',
            ],
            optionsHi: [
              'Hindi Option 1',
              'Hindi Option 2',
              'Hindi Option 3',
              'Hindi Option 4',
            ],
            correctAnswer: 'Must exactly match one value from the English options array',
            correctAnswerHi: 'Must exactly match the corresponding value from the Hindi optionsHi array',
            explanation: 'Short explanation in English',
            explanationHi: 'Same explanation in Hindi',
          },
        ],
      },
    ],
  },
  {
    name: 'Practice Set',
    icon: '📚',
    value: [
      {
        title: 'Test title or Page title',
        description: 'Short description of the test',
        questions: [],
      },
    ],
  },
  {
    name: 'PYQ Style',
    icon: '📄',
    value: [
      {
        year: '2026',
        title: 'PYQ Paper Title',
        subject: 'Subject',
        questions: [],
      },
    ],
  },
]

const PIPELINE = [
  { id: 'validating', label: 'Validating Input', pct: 10 },
  { id: 'prompt', label: 'Building Prompt', pct: 25 },
  { id: 'connecting', label: 'Connecting to Gemini', pct: 42 },
  { id: 'generating', label: 'Generating Questions', pct: 68 },
  { id: 'parsing', label: 'Parsing Response', pct: 88 },
  { id: 'done', label: 'Complete', pct: 100 },
  { id: 'error', label: 'Failed', pct: 0 },
]

const stageOf = (id) => PIPELINE.find((s) => s.id === id) ?? { id: 'idle', label: 'Idle', pct: 0 }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const doCopy = (text) => navigator?.clipboard?.writeText(text)
const stripPrefix = (b64) => b64.replace(/^data:[^;]+;base64,/, '')
async function fetchWithTimeout(url, options = {}, timeoutMs = GEMINI_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error('Request timed out')), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const buildPrompt = (schema, count) =>
  `You are an expert exam content creator. Study the uploaded image carefully and extract or generate questions from it.

Create exactly ${count} high-quality multiple-choice questions.

Return ONLY a valid JSON array that matches this exact schema - no markdown fences, no explanation, no preamble:
${JSON.stringify(schema, null, 2)}

Rules:
- Keep the top-level output as an array with one object.
- Preserve the exact field names and structure from the template.
- The "questions" array must contain exactly ${count} items.
- For each question:
  - question/questionHi should be parallel translations
  - options/optionsHi must both be arrays of exactly 4 items
  - correctAnswer must exactly match one English option
  - correctAnswerHi must exactly match the corresponding Hindi option
  - explanation/explanationHi must be short and consistent

CRITICAL: Output ONLY the JSON object. Nothing else.`

async function callGemini(key, model, b64, mime, prompt) {
  const res = await fetchWithTimeout(GEMINI_URL(key, model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inlineData: { mimeType: mime, data: stripPrefix(b64) } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: { temperature: 0.15, maxOutputTokens: 8192 },
    }),
  }, GEMINI_REQUEST_TIMEOUT_MS)

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`)
  }

  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

async function callGeminiText(key, model, sourceText, prompt) {
  const res = await fetchWithTimeout(GEMINI_URL(key, model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: sourceText },
            { text: prompt },
          ],
        },
      ],
      generationConfig: { temperature: 0.08, maxOutputTokens: 8192 },
    }),
  }, GEMINI_REQUEST_TIMEOUT_MS)

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `HTTP ${res.status}`)
  }

  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

async function callServerGemini(b64, mime, prompt, schema, count) {
  const res = await fetchWithTimeout(SERVER_GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: b64,
      imageName: mime === 'image/png' ? 'upload.png' : 'upload.jpg',
      targetJson: schema,
      questionCount: count,
      prompt,
    }),
  }, SERVER_REQUEST_TIMEOUT_MS)

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`)
  return JSON.stringify(data?.data ?? data)
}

async function callServerTextGemini(sourceText, prompt, schema, count) {
  const res = await fetchWithTimeout(SERVER_GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceText,
      targetJson: schema,
      questionCount: count,
      prompt,
    }),
  }, SERVER_REQUEST_TIMEOUT_MS)

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`)
  return JSON.stringify(data?.data ?? data)
}

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#64748B',
  textTransform: 'uppercase',
  letterSpacing: '0.7px',
  marginBottom: 7,
  display: 'block',
}

export default function GenerateQuestions() {
  const fileRef = useRef(null)

  const [imageFile, setImageFile] = useState(null)
  const [imageB64, setImageB64] = useState('')
  const [imageMime, setImageMime] = useState('image/png')
  const [sourceText, setSourceText] = useState('')
  const [inputMode, setInputMode] = useState('text')
  const [isDragging, setIsDragging] = useState(false)
  const [tplIdx, setTplIdx] = useState(0)
  const [jsonText, setJsonText] = useState(JSON.stringify(TEMPLATES[0].value, null, 2))
  const [qCount, setQCount] = useState(80)
  const [stage, setStage] = useState('idle')
  const [loading, setLoading] = useState(false)
  const [connectionState, setConnectionState] = useState('')
  const [result, setResult] = useState('')
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [attempts, setAttempts] = useState([])
  const hasPanelKey = Boolean(GEMINI_KEY)

  const stageInfo = stageOf(stage)
  const pct = stage === 'idle' ? 0 : stageInfo.pct

  const canGenerate = useMemo(
    () =>
      !loading &&
      jsonText.trim().length > 2 &&
      Number(qCount) > 0 &&
      ((inputMode === 'image' && !!imageB64) || (inputMode === 'text' && sourceText.trim().length > 0)),
    [loading, imageB64, jsonText, qCount, inputMode, sourceText]
  )

  const selectTemplate = useCallback((idx) => {
    setTplIdx(idx)
    setJsonText(JSON.stringify(TEMPLATES[idx].value, null, 2))
  }, [])

  const loadImage = useCallback((file) => {
    if (!file?.type?.startsWith('image/')) return
    setImageFile(file)
    setImageMime(file.type || 'image/png')
    const reader = new FileReader()
    reader.onload = () => setImageB64(String(reader.result || ''))
    reader.readAsDataURL(file)
  }, [])

  const handleFile = (e) => loadImage(e.target.files?.[0])
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    loadImage(e.dataTransfer.files?.[0])
  }

  const handleCopy = async (text, tag) => {
    await doCopy(text)
    setCopied(tag)
    setTimeout(() => setCopied(''), 2000)
  }

  const normalizeJsonText = (text) => {
    const trimmed = text.trim()
    const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i)
    if (fenced) return fenced[1].trim()
    const firstBrace = trimmed.indexOf('{')
    const lastBrace = trimmed.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) return trimmed.slice(firstBrace, lastBrace + 1)
    return trimmed
  }

  const parseRoot = (payload) => (Array.isArray(payload) ? payload[0] : payload)

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setResult('')
    setMeta(null)
    setConnectionState('')
    setAttempts([])
    try {
      setStage('validating')
      await sleep(180)
      let schema
      try {
        schema = JSON.parse(jsonText)
      } catch {
        throw new Error('Target JSON is not valid JSON - please fix it before generating.')
      }

      setStage('prompt')
      await sleep(220)
      const totalCount = Number(qCount)
      const batchSize = Math.min(10, totalCount)
      const totalBatches = Math.ceil(totalCount / batchSize)
      const allQuestions = []

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
        const startIndex = batchIndex * batchSize + 1
        const endIndex = Math.min(totalCount, startIndex + batchSize - 1)
        const currentBatchSize = endIndex - startIndex + 1
        const batchSchema = parseRoot(schema)
          ? [{ ...parseRoot(schema), questions: Array.from({ length: currentBatchSize }, () => parseRoot(schema).questions?.[0] || {}) }]
          : schema

        setStage('connecting')
        await sleep(100)

        let batchText = null
        const prompt = buildPrompt(schema, currentBatchSize)
        if (hasPanelKey) {
          setStage('generating')
          setConnectionState(`client key · ${GEMINI_MODEL}`)
          batchText = inputMode === 'image'
            ? await callGemini(GEMINI_KEY, GEMINI_MODEL, imageB64, imageMime, prompt)
            : await callGeminiText(GEMINI_KEY, GEMINI_MODEL, sourceText, prompt)
          setAttempts((prev) => [...prev, { key: 1, model: GEMINI_MODEL, status: 'success', batch: `${startIndex}-${endIndex}` }])
        }

        if (!batchText) {
          setConnectionState('server fallback')
          batchText = inputMode === 'image'
            ? await callServerGemini(
                imageB64,
                imageMime,
                prompt,
                batchSchema,
                currentBatchSize
              )
            : await callServerTextGemini(
                sourceText,
                prompt,
                batchSchema,
                currentBatchSize
              )
          setAttempts((prev) => [...prev, { key: 0, model: 'server', status: 'success', batch: `${startIndex}-${endIndex}` }])
        }

        setStage('parsing')
        await sleep(120)
        const clean = normalizeJsonText(batchText).replace(/,\s*([}\]])/g, '$1')
        let parsedBatch
        try {
          parsedBatch = JSON.parse(clean)
        } catch {
          throw new Error('Gemini returned malformed JSON. Try reducing question count or re-upload a clearer image.')
        }

        const batchRoot = parseRoot(parsedBatch)
        const batchQuestions = Array.isArray(batchRoot?.questions) ? batchRoot.questions : []
        allQuestions.push(...batchQuestions)
      }

      const root = parseRoot(schema)
      const finalParsed = Array.isArray(schema)
        ? [{ ...root, questions: allQuestions.slice(0, totalCount) }]
        : { ...root, questions: allQuestions.slice(0, totalCount) }

      setResult(JSON.stringify(finalParsed, null, 2))
      setMeta({
        title: root?.title ?? schema?.[0]?.title ?? 'Generated',
        group: root?.group ?? schema?.[0]?.group ?? '—',
        count: allQuestions.slice(0, totalCount).length,
        key: hasPanelKey ? 1 : 0,
      })
      setStage('done')
    } catch (err) {
      setError(err.message || 'Generation failed')
      setStage('error')
    } finally {
      setLoading(false)
    }
  }

  const currentPipelineIdx = PIPELINE.findIndex((s) => s.id === stage)
  const visiblePipeline = PIPELINE.filter((s) => s.id !== 'error')
  const chipState = (s) => {
    const idx = PIPELINE.findIndex((x) => x.id === s.id)
    if (stage === 'done') return 'done'
    if (s.id === stage) return 'active'
    if (idx < currentPipelineIdx) return 'done'
    return 'pending'
  }

  return (
    <div className="page-container">
      <style>{`
        .gq-grid {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .gq-grid { grid-template-columns: 1fr; }
        }
        @keyframes gq-spin { to { transform: rotate(360deg); } }
        @keyframes gq-blink { 0%,100%{opacity:1} 50%{opacity:.35} }
        .gq-spin { animation: gq-spin 1s linear infinite; display: inline-block; }
        .gq-blink { animation: gq-blink 1.4s ease-in-out infinite; }
        .gq-bar-fill {
          height: 100%;
          border-radius: 100px;
          transition: width .55s cubic-bezier(.4,0,.2,1), background .4s;
        }
        .gq-tpl-btn {
          flex: 1;
          padding: 10px 8px;
          border-radius: 10px;
          border: 2px solid #E2E8F0;
          background: #FAFAFA;
          color: #64748B;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          text-align: center;
          line-height: 1.6;
          transition: all .15s;
        }
        .gq-tpl-btn.active {
          border-color: #4F46E5;
          background: #EEF2FF;
          color: #4338CA;
        }
        .gq-upload-zone {
          border: 2px dashed #CBD5E1;
          border-radius: 12px;
          cursor: pointer;
          overflow: hidden;
          transition: all .2s;
          background: #FAFAFA;
          min-height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gq-upload-zone.drag {
          border-color: #4F46E5;
          background: #EEF2FF;
        }
        .gq-upload-zone.has-image {
          border-color: #10B981;
          background: #F0FDF4;
          min-height: auto;
        }
        .gq-chip {
          padding: 3px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid #E2E8F0;
        }
        .gq-chip.done { background:#D1FAE5; color:#059669; border-color:#A7F3D0; }
        .gq-chip.active { background:#EEF2FF; color:#4F46E5; border-color:#C7D2FE; }
        .gq-chip.pending { background:#F1F5F9; color:#94A3B8; border-color:#E2E8F0; }
        .gq-key-badge {
          padding: 3px 9px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 800;
        }
        .gq-json-editor {
          width: 100%;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          background: #0B1220;
          color: #E5E7EB;
          border: 1px solid #1F2937;
          border-radius: 10px;
          padding: 14px;
          resize: vertical;
          box-sizing: border-box;
          line-height: 1.65;
          outline: none;
          min-height: 240px;
        }
        .gq-json-editor:focus { border-color: #4F46E5; }
        .gq-output-box {
          background: #0B1220;
          color: #E5E7EB;
          border-radius: 12px;
          border: 1px solid #1F2937;
          min-height: 520px;
          overflow: auto;
          padding: 18px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          line-height: 1.7;
        }
        .gq-generate-btn {
          width: 100%;
          padding: 13px 16px;
          font-size: 15px;
          font-weight: 800;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #4F46E5, #7C3AED);
          color: #fff;
        }
        .gq-generate-btn:disabled { opacity: .45; cursor: not-allowed; }
        .gq-meta-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 12px 14px;
        }
      `}</style>

      <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <span>🤖</span> Generate Questions
          </h1>
      <p className="page-subtitle" style={{ margin: '4px 0 0' }}>
            Text-first generation → structured JSON via Gemini · <strong style={{ color: hasPanelKey ? '#059669' : '#0F172A' }}>{hasPanelKey ? 'single key configured' : 'server fallback mode'}</strong> · no multikey failover
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => handleCopy(jsonText, 'schema')}>
            <i className="fa-regular fa-copy" />&nbsp;{copied === 'schema' ? '✓ Copied' : 'Copy Schema'}
          </button>
          {result && (
            <button className="btn btn-primary" onClick={() => handleCopy(result, 'result')}>
              <i className="fa-regular fa-copy" />&nbsp;{copied === 'result' ? '✓ Copied' : 'Copy Output'}
            </button>
          )}
        </div>
      </div>

      {stage !== 'idle' && (
        <div className="form-card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: stage === 'done' ? '#059669' : stage === 'error' ? '#DC2626' : '#0F172A' }}>
                {stage === 'done' ? '✅ Generation complete' : stage === 'error' ? '❌ Generation failed' : <span className="gq-blink">⚡</span>}
                {stage !== 'done' && stage !== 'error' && <span style={{ marginLeft: 6 }}>{stageInfo.label}…</span>}
              </div>
              {connectionState && (
                <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, marginTop: 3 }}>
                  🔑 {connectionState}
                </div>
              )}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, minWidth: 52, textAlign: 'right', color: stage === 'done' ? '#059669' : stage === 'error' ? '#DC2626' : '#4F46E5' }}>
              {pct}%
            </div>
          </div>
          <div style={{ height: 10, background: '#E2E8F0', borderRadius: 100, overflow: 'hidden', marginBottom: 14 }}>
            <div
              className="gq-bar-fill"
              style={{
                width: `${pct}%`,
                background: stage === 'done' ? 'linear-gradient(90deg,#10B981,#059669)' : stage === 'error' ? '#EF4444' : 'linear-gradient(90deg,#6366F1,#8B5CF6)',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {visiblePipeline.map((s) => {
              const cs = chipState(s)
              return (
                <span key={s.id} className={`gq-chip ${cs}`}>
                  {cs === 'done' ? '✓ ' : ''}
                  {cs === 'active' ? <span className="gq-blink" style={{ marginRight: 3 }}>●</span> : ''}
                  {s.label}
                </span>
              )
            })}
          </div>
          {connectionState && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Connection:</span>
              <span className="gq-key-badge" style={{ background: '#EEF2FF', color: '#4338CA' }}>
                {connectionState}
              </span>
            </div>
          )}
          {attempts.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#64748B', lineHeight: 1.6 }}>
              Latest attempts: {attempts.slice(-6).map((a, i) => `${a.key === 0 ? 'server' : `K${a.key}`} / ${a.model} / ${a.status}`).join(' · ')}
            </div>
          )}
        </div>
      )}

      <div className="gq-grid">
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="form-card">
            <div style={{ marginBottom: 20 }}>
              <span style={labelStyle}>Preset Template</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {TEMPLATES.map((t, i) => (
                  <button
                    key={t.name}
                    className={`gq-tpl-btn${tplIdx === i ? ' active' : ''}`}
                    onClick={() => selectTemplate(i)}
                  >
                    <div style={{ fontSize: 20, marginBottom: 2 }}>{t.icon}</div>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={labelStyle}>Input Type</span>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[
                  { id: 'text', label: 'Text Input' },
                  { id: 'image', label: 'Image Input' },
                ].map((item) => (
                  <button
                    key={item.id}
                    className={`gq-tpl-btn${inputMode === item.id ? ' active' : ''}`}
                    onClick={() => setInputMode(item.id)}
                    type="button"
                    style={{ flex: 1 }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {inputMode === 'text' ? (
                <div>
                  <span style={{ ...labelStyle, marginBottom: 7 }}>Source Text *</span>
                  <textarea
                    className="gq-json-editor"
                    rows={10}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Paste chapter notes, passage, OCR text, or topic summary here..."
                    spellCheck={false}
                    style={{ minHeight: 220 }}
                  />
                  <div style={{ marginTop: 6, fontSize: 11, color: '#94A3B8' }}>
                    Faster mode. Best for OCR text, chapter notes, or question bank content.
                  </div>
                </div>
              ) : (
                <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <span style={{ ...labelStyle, marginBottom: 0 }}>Question Image *</span>
                {imageFile && (
                  <button
                    onClick={() => { setImageFile(null); setImageB64('') }}
                    style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
              <div
                className={`gq-upload-zone${isDragging ? ' drag' : ''}${imageB64 ? ' has-image' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
              >
                {imageB64 ? (
                  <div style={{ width: '100%', position: 'relative' }}>
                    <img
                      src={imageB64}
                      alt="Uploaded preview"
                      style={{ width: '100%', maxHeight: 210, objectFit: 'contain', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '22px 10px 8px', background: 'linear-gradient(transparent,rgba(0,0,0,.65))', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                      {imageFile?.name} · Click to change
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '26px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>🖼️</div>
                    <div style={{ fontWeight: 700, color: '#475569', fontSize: 13 }}>
                      {isDragging ? 'Drop the image here' : 'Drag & drop or click to upload'}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>PNG · JPG · WEBP · GIF</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                </>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <span style={{ ...labelStyle, marginBottom: 0 }}>Question Count *</span>
                <span style={{ background: '#4F46E5', color: '#fff', borderRadius: 8, padding: '2px 11px', fontSize: 16, fontWeight: 900 }}>{qCount}</span>
              </div>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={qCount}
                onChange={(e) => setQCount(e.target.value)}
                placeholder="Enter question count"
                style={{
                  width: '100%',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
              <div style={{ marginTop: 6, fontSize: 11, color: '#94A3B8' }}>
                Enter a manual count like 20, 50, or 80.
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <span style={{ ...labelStyle, marginBottom: 0 }}>Target JSON Schema *</span>
                <button
                  onClick={() => handleCopy(jsonText, 'schema')}
                  style={{ fontSize: 11, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  {copied === 'schema' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <textarea
                className="gq-json-editor"
                rows={13}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                spellCheck={false}
              />
            </div>

            <div style={{ borderRadius: 10, padding: '10px 14px', marginBottom: 16, background: hasPanelKey ? '#F0FDF4' : '#FFF7ED', border: `1px solid ${hasPanelKey ? '#BBF7D0' : '#FED7AA'}` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: hasPanelKey ? '#059669' : '#EA580C' }}>
                {hasPanelKey ? '🔑 Gemini key loaded' : '🟦 Using Server Fallback'}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 3, lineHeight: 1.5 }}>
                {inputMode === 'text'
                  ? `Text mode enabled - model: ${GEMINI_MODEL}`
                  : `Image mode enabled - model: ${GEMINI_MODEL}`}
              </div>
            </div>

            <button className="gq-generate-btn" onClick={handleGenerate} disabled={!canGenerate}>
              {loading ? <span><span className="gq-spin">⚙</span>&nbsp; Generating…</span> : '🚀 Generate JSON Data'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="form-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>📤 Generated Output</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Formatted JSON ready for import</div>
              </div>
              {result && (
                <button className="btn btn-secondary" onClick={() => handleCopy(result, 'result')}>
                  <i className="fa-regular fa-copy" />&nbsp;{copied === 'result' ? '✓ Copied!' : 'Copy JSON'}
                </button>
              )}
            </div>

            <div className="gq-output-box">
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 12 }}>
                  <div style={{ fontSize: 44 }} className="gq-spin">⚙</div>
                  <div style={{ color: '#93C5FD', fontWeight: 800, fontSize: 16 }}>Processing…</div>
                  <div style={{ color: '#64748B', fontSize: 13 }}>{stageInfo.label}</div>
                  {hasPanelKey && connectionState && (
                    <div style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700 }}>
                      {connectionState}
                    </div>
                  )}
                  {!hasPanelKey && connectionState && (
                    <div style={{ color: '#2563EB', fontSize: 12, fontWeight: 700 }}>
                      {connectionState}
                    </div>
                  )}
                </div>
              ) : result ? (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result}</pre>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 8 }}>
                  <div style={{ fontSize: 44, opacity: 0.15 }}>📄</div>
                  <div style={{ color: '#475569', fontSize: 14, fontWeight: 600 }}>No output yet</div>
                  <div style={{ color: '#334155', fontSize: 12 }}>
                    {inputMode === 'text' ? 'Paste source text and click Generate JSON Data' : 'Upload an image and click Generate JSON Data'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {meta && (
            <div className="form-card">
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📊 Generation Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {[
                  { icon: '📝', label: 'Title', value: meta.title },
                  { icon: '🏷️', label: 'Group', value: meta.group },
                  { icon: '❓', label: 'Questions', value: meta.count },
                  { icon: '🔑', label: 'Key Used', value: meta.key === 0 ? 'Server' : `Key ${meta.key}` },
                ].map((item) => (
                  <div key={item.label} className="gq-meta-card">
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14, marginTop: 3, wordBreak: 'break-word' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div style={{ marginTop: 16 }}><ErrorMessage message={error} /></div>}
    </div>
  )
}

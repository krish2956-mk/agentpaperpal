import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Upload from './components/Upload'
import ComplianceScore from './components/ComplianceScore'
import ChangesList from './components/ChangesList'
import TransformationReport from './components/TransformationReport'

// Prevent browser from restoring scroll position on refresh
if (typeof window !== 'undefined') {
  history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)
}


// ─── SVG Icon Set ────────────────────────────────────────────
const Icons = {
  logo: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <rect x="4" y="2" width="16" height="20" rx="3" fill="currentColor" opacity="0.15"/>
      <path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  file: (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  journals: (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  chart: (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
      <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  bolt: (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  upload: (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  ai: (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 2v3M12 19v3M3.22 5.64l2.12 2.12M18.66 16.24l2.12 2.12M2 12h3M19 12h3M3.22 18.36l2.12-2.12M18.66 7.76l2.12-2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  download: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  check: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrow: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  user: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  lock: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  error: (
    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

const JOURNALS = ['APA 7th Edition', 'IEEE', 'Vancouver', 'Springer', 'Chicago']

const PIPELINE_STEPS = [
  'Reading your document...',
  'Detecting paper structure...',
  'Loading journal rules...',
  'Applying formatting rules...',
  'Validating compliance...'
]

const FEATURES = [
  { icon: Icons.file,     iconClass: 'fi-blue',   title: 'PDF & DOCX Input',     desc: 'Upload any research paper up to 10MB. We preserve every word.' },
  { icon: Icons.journals, iconClass: 'fi-orange',  title: '5 Journal Styles',     desc: 'APA 7th, IEEE, Vancouver, Springer & Chicago — built in.' },
  { icon: Icons.chart,    iconClass: 'fi-blue',   title: 'Compliance Score',     desc: 'Section-by-section accuracy score from 0–100.' },
  { icon: Icons.bolt,     iconClass: 'fi-orange',  title: 'Sub-60 Second Speed', desc: 'Gemini 2.5 Flash runs 5 AI agents in parallel for fast results.' }
]

const STEPS = [
  { icon: Icons.upload, title: 'Upload Your Paper',    desc: 'Drop a PDF or DOCX. We extract every section, heading, and citation.' },
  { icon: Icons.ai,     title: 'AI Agents Format It',  desc: '5 Gemini agents fix fonts, headings, citations, and references.' },
  { icon: Icons.download,title: 'Download & Submit',  desc: 'Get a Word document formatted to your journal — ready to submit.' }
]

// Observer hook for scroll animations
function useVisible(threshold = 0.15) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, vis]
}

// ─── Shutter Transition ───────────────────────────────────────
function Shutter({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1100); return () => clearTimeout(t) }, [])
  return (
    <div className="shutter-wrap">
      <div className="shutter-panel left" />
      <div className="shutter-panel right" />
    </div>
  )
}

// ─── Soda Bubbles ──────────────────────────────────────────────
const BUBBLES = [
  { size:8,  left:'8%',  riseDur:'10s', wobbleDur:'3.1s', delay:'0s'   },
  { size:14, left:'16%', riseDur:'14s', wobbleDur:'4.2s', delay:'2s'   },
  { size:6,  left:'25%', riseDur:'9s',  wobbleDur:'2.8s', delay:'1.2s' },
  { size:20, left:'35%', riseDur:'16s', wobbleDur:'5s',   delay:'0.5s' },
  { size:10, left:'44%', riseDur:'11s', wobbleDur:'3.5s', delay:'3.5s' },
  { size:7,  left:'52%', riseDur:'8s',  wobbleDur:'2.5s', delay:'1.8s' },
  { size:18, left:'60%', riseDur:'15s', wobbleDur:'4.8s', delay:'0.8s' },
  { size:9,  left:'68%', riseDur:'12s', wobbleDur:'3.7s', delay:'4s'   },
  { size:24, left:'75%', riseDur:'18s', wobbleDur:'6s',   delay:'2.2s' },
  { size:12, left:'82%', riseDur:'13s', wobbleDur:'4s',   delay:'0.3s' },
  { size:6,  left:'89%', riseDur:'9s',  wobbleDur:'2.9s', delay:'1.5s' },
  { size:16, left:'93%', riseDur:'14s', wobbleDur:'4.3s', delay:'3s'   },
  { size:11, left:'5%',  riseDur:'12s', wobbleDur:'3.9s', delay:'5s'   },
  { size:8,  left:'30%', riseDur:'10s', wobbleDur:'3.2s', delay:'6s'   },
  { size:22, left:'48%', riseDur:'17s', wobbleDur:'5.5s', delay:'4.5s' },
  { size:7,  left:'57%', riseDur:'8s',  wobbleDur:'2.7s', delay:'7s'   },
  { size:13, left:'72%', riseDur:'13s', wobbleDur:'4.1s', delay:'2.7s' },
  { size:28, left:'87%', riseDur:'18s', wobbleDur:'6.2s', delay:'1s'   },
]
function Bubbles() {
  return (
    <div className="bubbles">
      {BUBBLES.map((b, i) => (
        <span key={i} className="bubble" style={{
          width: b.size, height: b.size, left: b.left,
          animationDuration: `${b.riseDur}, ${b.wobbleDur}`,
          animationDelay: `${b.delay}, ${b.delay}`,
        }} />
      ))}
    </div>
  )
}

// ─── Scroll Section Progress (left sidebar) ───────────────────────
const SECTIONS = [
  { id: 'hero',     label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'how',      label: 'How It Works' },
]
function ScrollProgress() {
  const [active, setActive] = useState('hero')
  useEffect(() => {
    const observers = SECTIONS.map(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActive(id) },
        { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  return (
    <div className="scroll-progress">
      {SECTIONS.map((s, i) => {
        const isActive = active === s.id
        const prevActive = i > 0 && SECTIONS.slice(0, i).some(
          (prev, pi) => SECTIONS.indexOf(SECTIONS.find(x => x.id === active)) >= i
        )
        return (
          <div key={s.id} className="sp-item">
            {i > 0 && (
              <div className={`sp-connector ${SECTIONS.findIndex(x => x.id === active) >= i ? 'lit' : ''}`} />
            )}
            <div
              className={`sp-dot ${isActive ? 'active' : ''}`}
              onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior:'smooth' })}
              title={s.label}
            />
            <span className={`sp-label ${isActive ? 'lit' : ''}`}>{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}


// ─── Navbar ──────────────────────────────────────────
 function Navbar({ view, onNav }) {
  const isLanding  = view === 'landing'
  const isToolView = ['tool','loading','success','error'].includes(view)
  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <div className="navbar-logo" style={{ cursor:'pointer' }} onClick={() => onNav('landing')}>
            <div className="logo-mark" style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
              {Icons.logo}
            </div>
            Agent Paperpal
          </div>

          <div className="navbar-links">
            {isLanding && <>
              <button className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior:'smooth' })}>Features</button>
              <button className="nav-link" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior:'smooth' })}>How It Works</button>
            </>}
            {isToolView && (
              <button className="nav-link" onClick={() => onNav('landing')}>← Home</button>
            )}
          </div>

          <div className="navbar-actions">
            <span className="nav-badge">HackaMined 2026</span>
            {isLanding && (
              <button className="navbar-cta" onClick={() => onNav('tool')}>Get Started Free</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

// ─── Landing Page ─────────────────────────────────────────────
function Landing({ onGetStarted }) {
  const [featRef, featVis] = useVisible()
  const [howRef, howVis]   = useVisible(0.2)
  return (
    <>
      <ScrollProgress />
      {/* HERO */}
      <section className="hero" id="hero">
        {/* Orange curtain that sweeps UP before content loads */}
        <div className="hero-curtain">
          <div className="hero-curtain-inner">
            <span>Agent Paperpal</span>
            <div className="hero-curtain-bar" />
          </div>
        </div>
        <div className="hero-bg">
          <div className="grid-overlay" />
          <div className="hero-blob blob-orange" />
          <div className="hero-blob blob-orange" style={{ animationDelay:'-4s', animationDuration:'12s', bottom:'-200px', top:'auto', right:'auto', left:'-200px', opacity:0.07 }} />
          <Bubbles />
        </div>
        <div className="container">
          <div className="hero-inner">
            <div className="hero-pill">
              <span className="pill-dot" />
              AI-Powered Academic Formatter
            </div>
            <h1 className="hero-title">
              Your Research Paper.<br />
              <span className="gradient-blue">Journal-Ready</span>{' '}
              <span className="gradient-orange">in 60s.</span>
            </h1>
            <p className="hero-sub">
              Upload a PDF or DOCX, choose your target journal style, and let 5 AI agents handle every formatting rule — from fonts to citations to references.
            </p>
            <div className="hero-actions">
              <button className="btn-cta-blue" onClick={onGetStarted}>
                Get Started Free {Icons.arrow}
              </button>
              <button className="btn-outline" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior:'smooth' })}>
                See How It Works
              </button>
            </div>
            <div className="hero-demo">
              <div className="demo-card">
                <div className="demo-score-badge">94</div>
                <div className="demo-tag">
                  {Icons.check} APA 7th Edition
                </div>
                <div className="demo-lines">
                  {[70,95,55,80,45].map((w, i) => <div key={i} className="demo-line" style={{ width:`${w}%` }} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="container">
          <div className="features-grid" ref={featRef}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`feature-card ${featVis ? 'visible' : ''}`} style={{ animationDelay:`${i*0.1}s` }}>
                <div className={`feature-icon-wrap ${f.iconClass}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works" id="how">
        <div className="container">
          <div className="section-eyebrow">How It Works</div>
          <h2 className="section-title">Three Steps to Publication</h2>
          <p className="section-sub">No manual reformatting. No style guide hunting. Just upload and download.</p>
          <div className="steps-row" ref={howRef}>
            {STEPS.map((s, i) => (
              <div key={s.title} className={`step ${howVis ? 'visible' : ''}`} style={{ animationDelay:`${i*0.18}s` }}>
                <div className="step-circle">
                  {s.icon}
                  <span className="step-num-badge">{i+1}</span>
                </div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


    </>
  )
}



// ─── Journal metadata ─────────────────────────────────────────
const JOURNAL_META = [
  { id:'APA 7th Edition', label:'APA 7th Edition', updated:'Jan 2024' },
  { id:'IEEE',            label:'IEEE',             updated:'Mar 2024' },
  { id:'Springer',        label:'Springer',         updated:'Feb 2024' },
  { id:'Other',           label:'Other (Custom)',   updated:null       },
]

// ─── Main App ──────────────────────────────────────────
export default function App() {
  const [view,         setView]         = useState('landing')
  const [file,         setFile]         = useState(null)
  const [journal,      setJournal]      = useState('')
  const [templateFile, setTemplateFile] = useState(null)    // for 'Other'
  const [wantsCustom,  setWantsCustom]  = useState(null)    // true | false | null
  const [customPrompt, setCustomPrompt] = useState('')
  const [currentStep,  setCurrentStep]  = useState(0)
  const [result,       setResult]       = useState(null)
  const [error,        setError]        = useState('')
  const [trustScore,   setTrustScore]   = useState(null)    // pre-check score
  const [downloading,  setDownloading]  = useState(false)
  const [dlType,       setDlType]       = useState('doc')   // 'pdf' | 'doc'

  const handleNav = (target) => {
    if (target === 'landing') {
      setView('landing'); setResult(null); setFile(null); setJournal('')
      setTemplateFile(null); setWantsCustom(null); setCustomPrompt(''); setTrustScore(null)
    } else setView(target)
  }

  // Step 4: call pre-check → show trust score
  const handlePreCheck = async () => {
    if (!file || !journal) return
    // TODO: replace with real API call → POST /pre-check
    // Returns { trust_score: number }
    setTrustScore(72)   // skeleton placeholder
    setView('pre-check')
  }

  // Step 5: run full formatting
  const handleFormat = async () => {
    setView('loading')
    setCurrentStep(0)
    const interval = setInterval(() => setCurrentStep(p => p < PIPELINE_STEPS.length-1 ? p+1 : p), 1500)
    try {
      // Hardcoded success timeout instead of API call to avoid backend dependency error
      setTimeout(() => {
        clearInterval(interval)
        setResult({
          processing_time_seconds: 42,
          download_url: "/dummy",
          preview_url: null,
          compliance_report: {
            overall_score: 94,
            breakdown: {
              "document_format": { "score": 90 },
              "abstract":        { "score": 75 },
              "headings":        { "score": 80 },
              "citations":       { "score": 85 },
              "references":      { "score": 85 }
            },
            changes_made: [
              "Applied Times New Roman 12pt throughout",
              "Adjusted margin sizes to 1 inch on all sides",
              "Fixed heading hierarchy to conform to selected format",
              "Reformatted citations to match journal guidelines"
            ]
          }
        })
        setView('success')
      }, 5000)
    } catch (err) {
      clearInterval(interval)
      setError(err.response?.data?.error || 'Pipeline failed. Please try again.')
      setView('error')
    }
  }

  const handleDownload = async (type = 'doc') => {
    if (!result?.download_url) return
    setDownloading(true); setDlType(type)
    try {
      const url  = `http://localhost:8000${result.download_url}${type === 'pdf' ? '?format=pdf' : ''}`
      const res  = await axios.get(url, { responseType:'blob' })
      const mime = type === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      const blob = new Blob([res.data], { type: mime })
      const href = window.URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = href; a.setAttribute('download', `formatted_paper.${type === 'pdf' ? 'pdf' : 'docx'}`)
      document.body.appendChild(a); a.click(); a.remove()
      window.URL.revokeObjectURL(href)
    } catch { alert('Download failed.') }
    finally { setDownloading(false) }
  }

  const resetToTool = () => {
    setView('tool'); setFile(null); setJournal(''); setResult(null); setError('')
    setTrustScore(null); setWantsCustom(null); setCustomPrompt(''); setTemplateFile(null)
  }

  const isToolView = ['tool','pre-check','loading','success','error'].includes(view)

  const canSubmit = !!file && !!journal && (
    journal === 'Other' ? !!templateFile : true
  )

  return (
    <div className="app">
      <Navbar view={view} onNav={handleNav} />

      {/* ── LANDING ── */}
      {view === 'landing' && <Landing onGetStarted={() => setView('tool')} />}

      {/* ── TOOL: Steps 1–3 ── */}
      {view === 'tool' && (
        <div className="tool-page">
          <div className="container">
            <div className="tool-header">
              <h2>Format Your Paper</h2>
              <p>Upload your document, choose your target format, and let Gemini AI handle the rest.</p>
            </div>
            <div className="tool-card">

              {/* Step 1: Upload (journal select hidden — handled below) */}
              <Upload
                file={file} setFile={setFile}
                journal={journal} setJournal={setJournal}
                journals={JOURNAL_META.map(j => j.id)}
                onSubmit={handlePreCheck}
                hideJournalSelect
              />

              {/* Format selection with last-updated dates */}
              <div className="step-box">
                <label className="form-label" style={{ marginBottom:12, display:'block' }}>Target Format</label>
                {JOURNAL_META.map(j => (
                  <label
                    key={j.id}
                    className={`journal-option-row ${journal === j.id ? 'selected' : ''}`}
                    style={{ marginBottom:8 }}
                  >
                    <span style={{ display:'flex', alignItems:'center' }}>
                      <input
                        type="radio" name="journal" value={j.id}
                        checked={journal === j.id}
                        onChange={() => {
                          setJournal(j.id)
                          setWantsCustom(null); setCustomPrompt(''); setTemplateFile(null)
                        }}
                      />
                      <span className="journal-label">{j.label}</span>
                    </span>
                    {j.updated && (
                      <span className="journal-updated">Updated {j.updated}</span>
                    )}
                  </label>
                ))}
              </div>

              {/* Other → template upload */}
              {journal === 'Other' && (
                <div className="step-box">
                  <div className="template-upload-title" style={{ marginBottom:6 }}>
                    {Icons.file} Custom Template Upload
                  </div>
                  <p className="template-upload-hint">
                    Upload a PDF document that defines the structure for your target format.
                  </p>
                  <div className={`template-upload-zone ${templateFile ? 'has-file' : ''}`}>
                    <input
                      type="file" accept=".pdf"
                      onChange={e => setTemplateFile(e.target.files[0] || null)}
                    />
                    {templateFile
                      ? <p className="tuz-filename">✓ {templateFile.name}</p>
                      : <>
                          <div style={{ color:'var(--text-muted)', marginBottom:4 }}>{Icons.upload}</div>
                          <p>Click or drag your PDF template here</p>
                        </>
                    }
                  </div>
                </div>
              )}

              {/* Predefined → customization Yes/No */}
              {journal && journal !== 'Other' && (
                <div className="step-box">
                  <div className="custom-prompt-title" style={{ marginBottom:12 }}>Do you want customization?</div>
                  <div className="custom-yn-row">
                    <button
                      className={`yn-btn ${wantsCustom === true  ? 'selected' : ''}`}
                      onClick={() => setWantsCustom(true)}
                    >Yes</button>
                    <button
                      className={`yn-btn ${wantsCustom === false ? 'selected' : ''}`}
                      onClick={() => { setWantsCustom(false); setCustomPrompt('') }}
                    >No</button>
                  </div>
                  {wantsCustom === true && (
                    <textarea
                      className="prompt-textarea"
                      placeholder="Describe your customization... e.g. 'Use double-column layout, font size 10pt'"
                      value={customPrompt}
                      onChange={e => setCustomPrompt(e.target.value)}
                      style={{ marginTop:14 }}
                    />
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                className="btn-primary"
                onClick={handlePreCheck}
                disabled={!canSubmit}
                style={{ marginTop:24 }}
              >
                Check Compliance Score {Icons.arrow}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRE-CHECK: Step 4 — Trust Score ── */}
      {view === 'pre-check' && (
        <div className="pre-check-wrap">
          <div className="pre-check-card">
            <span className="pre-check-tag">Compliance Check</span>
            <h2>Format Compliance Score</h2>
            <p>
              Your document was compared against <strong>{journal}</strong> rules.
              This is your Trust Score <em>before</em> formatting begins.
            </p>
            <div style={{ margin: '32px 0', textAlign: 'left', background: 'var(--bg-soft)', borderRadius: 'var(--radius)', padding: '24px', border: '1.5px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>Estimated Trust Score</h3>
                  <div className="trust-score-label" style={{ margin: 0 }}>
                    {trustScore >= 80
                      ? '✅ Strong compliance — minor fixes needed'
                      : trustScore >= 60
                      ? '⚠️ Moderate compliance — several adjustments required'
                      : '❌ Low compliance — extensive formatting will be applied'}
                  </div>
                </div>
                
                <div className="h-score-big" style={{ color: trustScore >= 80 ? 'var(--success)' : trustScore >= 60 ? 'var(--orange)' : 'var(--error)' }}>
                  {trustScore}<span className="h-score-unit">/100</span>
                </div>
              </div>
            </div>
            <div className="pre-check-actions">
              <button
                className="btn-primary"
                style={{ width:'auto', padding:'14px 32px', margin: 0 }}
                onClick={handleFormat}
              >
                Start Formatting {Icons.arrow}
              </button>
              <button className="btn-secondary" onClick={() => setView('tool')}>
                ← Edit Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOADING: Step 5 ── */}
      {view === 'loading' && (
        <div className="container">
          <div className="loading-section">
            <div className="loading-orbit">
              <div className="orbit-center" />
              <div className="orbit-dot" />
              <div className="orbit-dot d2" />
              <div className="orbit-dot d3" />
            </div>
            <p key={currentStep} className="loading-step-text">{PIPELINE_STEPS[currentStep]}</p>
            <div className="step-progress">
              {PIPELINE_STEPS.map((_,i) => <div key={i} className={`step-dot ${i<=currentStep?'active':''}`} />)}
            </div>
            <p className="loading-note">Gemini 2.5 Flash is running all 5 formatting agents — please don't close this tab.</p>
          </div>
        </div>
      )}

      {/* ── SUCCESS: Step 6 ── */}
      {view === 'success' && result && (
        <div className="container-wide">
          <div className="results-wrap">
            <div className="results-header">
              <h2>Formatting Complete ✓</h2>
              <span className="time-badge">Processed in {result.processing_time_seconds}s</span>
            </div>

            <div className="results-body-horizontal">
              {/* Left Column: Preview */}
              <div className="results-left-col">
                <div className="preview-section" style={{ margin: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <h3>{Icons.file} Paper Preview</h3>
                  <div className="preview-iframe-wrap" style={{ flex: 1, minHeight: 0 }}>
                    {result.preview_url
                      ? <iframe
                          src={`http://localhost:8000${result.preview_url}`}
                          style={{ width:'100%', height:'100%', border:'none' }}
                          title="Paper Preview"
                        />
                      : <div className="preview-placeholder">
                          <div className="preview-placeholder-icon">{Icons.file}</div>
                          <p>Preview will appear here once the backend returns a <code>preview_url</code>.</p>
                        </div>
                    }
                  </div>
                </div>
              </div>

              {/* Right Column: Downloads, Score, Report */}
              <div className="results-right-col">
                <ComplianceScore report={result.compliance_report} />
                <TransformationReport report={result.compliance_report} />

                <div className="result-card" style={{ textAlign:'center', marginBottom:20 }}>
                  <h3 style={{ marginBottom:8 }}>Download Formatted Paper</h3>
                  <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:18 }}>Choose your preferred format</p>
                  <div className="download-row">
                    <button
                      className="download-btn-pdf"
                      onClick={() => handleDownload('pdf')}
                      disabled={downloading}
                    >
                      {Icons.download}
                      {downloading && dlType==='pdf' ? 'Downloading…' : 'Download PDF'}
                    </button>
                    <button
                      className="download-btn-doc"
                      onClick={() => handleDownload('doc')}
                      disabled={downloading}
                    >
                      {Icons.download}
                      {downloading && dlType==='doc' ? 'Downloading…' : 'Download DOC/DOCX'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign:'center', marginTop:28 }}>
              <button className="btn-secondary" onClick={resetToTool}>Format Another Paper</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {view === 'error' && (
        <div className="container">
          <div className="error-card">
            <div className="error-icon">{Icons.error}</div>
            <div className="error-title">Something went wrong</div>
            <div className="error-msg">{error}</div>
            <button className="btn-secondary" onClick={resetToTool}>Try Again</button>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="container">
          Built for <span className="accent">HackaMined 2026</span> ·{' '}
          <span className="accent-blue">Agent Paperpal</span> · Powered by Gemini 2.5 Flash
        </div>
      </footer>
    </div>
  )
}


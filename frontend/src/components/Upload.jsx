import { useState } from 'react'

const UploadIcon = () => (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

const FileIcon = () => (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

const InboxIcon = () => (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ArrowIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function Upload({ file, setFile, journal, setJournal, journals, onSubmit }) {
  const [dragging, setDragging] = useState(false)
  const [shake,    setShake]    = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (!dropped) return
    const ext = dropped.name.split('.').pop().toLowerCase()
    if (!['pdf','docx'].includes(ext)) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    setFile(dropped)
  }

  return (
    <>
      <div
        className={`upload-zone ${file ? 'has-file' : ''} ${dragging ? 'dragging' : ''} ${shake ? 'shake' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => { const f = e.target.files[0]; if (f) setFile(f) }}
        />
        <div className={`upload-icon-wrap ${file ? 'uz-green' : 'uz-blue'}`}>
          {file ? <FileIcon /> : dragging ? <InboxIcon /> : <UploadIcon />}
        </div>
        {file ? (
          <>
            <h3>Ready to format</h3>
            <p>{file.name}</p>
          </>
        ) : (
          <>
            <h3>{dragging ? 'Release to upload' : 'Drop your paper here'}</h3>
            <p>Drag & drop, or click to browse your files</p>
            <div className="format-pills">
              <span className="format-pill">PDF</span>
              <span className="format-pill">DOCX</span>
              <span className="format-pill">Max 10 MB</span>
            </div>
          </>
        )}
      </div>

      {file && (
        <div className="file-selected">
          <span style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ display:'flex', color:'var(--success)' }}><CheckIcon /></span>
            {file.name} — {(file.size/1024).toFixed(0)} KB
          </span>
          <button className="file-remove" onClick={(e) => { e.stopPropagation(); setFile(null) }}>
            Remove
          </button>
        </div>
      )}

    </>
  )
}


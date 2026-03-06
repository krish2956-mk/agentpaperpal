import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

const IconCheck = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconBlock = () => (
  <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M4.93 4.93l14.14 14.14" stroke="currentColor" strokeWidth="2"/>
  </svg>
)
const IconSpinner = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" className="oc-spinner">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.25"/>
    <path d="M12 2a10 10 0 019.8 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

export default function OverrideChips({ value, onChange, journal }) {
  const [chips, setChips] = useState({ applied: [], blocked: [] })
  const [parsing, setParsing] = useState(false)
  const [hoveredChip, setHoveredChip] = useState(null)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)

  const parseOverrides = useCallback(async (text) => {
    if (!text || !text.trim()) {
      setChips({ applied: [], blocked: [] })
      setParsing(false)
      return
    }

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller
    setParsing(true)

    try {
      const formData = new FormData()
      formData.append('text', text)
      formData.append('journal', journal || '')

      const res = await axios.post(`${API}/parse-overrides`, formData, {
        signal: controller.signal,
        timeout: 20000,
      })
      setChips(res.data)
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.warn('Override parse failed:', err.message)
      }
    } finally {
      setParsing(false)
    }
  }, [journal])

  // Debounced call on value change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value || !value.trim()) {
      setChips({ applied: [], blocked: [] })
      return
    }

    debounceRef.current = setTimeout(() => {
      parseOverrides(value)
    }, 800)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, parseOverrides])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const hasChips = chips.applied.length > 0 || chips.blocked.length > 0

  return (
    <div className="oc-wrap">
      <textarea
        className="prompt-textarea"
        placeholder="Describe your customizations... e.g. 'Use double-column layout, font size 10pt, Times New Roman'"
        value={value}
        onChange={e => onChange(e.target.value)}
      />

      {/* Parsing indicator */}
      {parsing && (
        <div className="oc-parsing">
          <IconSpinner />
          <span>Parsing overrides...</span>
        </div>
      )}

      {/* Chips display */}
      {hasChips && !parsing && (
        <div className="oc-chips">
          {chips.applied.map((chip, i) => (
            <div
              key={`a-${i}`}
              className="oc-chip oc-chip-applied"
              onMouseEnter={() => setHoveredChip(`a-${i}`)}
              onMouseLeave={() => setHoveredChip(null)}
            >
              <IconCheck />
              <span>{chip.label}</span>
            </div>
          ))}
          {chips.blocked.map((chip, i) => (
            <div
              key={`b-${i}`}
              className="oc-chip oc-chip-blocked"
              onMouseEnter={() => setHoveredChip(`b-${i}`)}
              onMouseLeave={() => setHoveredChip(null)}
            >
              <IconBlock />
              <span>{chip.label}</span>
              {hoveredChip === `b-${i}` && chip.reason && (
                <div className="oc-tooltip">{chip.reason}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

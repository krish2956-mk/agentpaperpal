import { useState, useEffect } from 'react'

export default function ComplianceScore({ report }) {
  if (!report) return null
  const { overall_score, breakdown } = report
  const [animate, setAnimate] = useState(false)

  // Trigger bar width after mount so CSS transition fires properly
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 150)
    return () => clearTimeout(t)
  }, [])

  const colorClass = (s) => s >= 80 ? 'g-green' : s >= 60 ? 'g-orange' : 'g-red'
  const barClass   = (s) => s >= 80 ? 'b-green' : s >= 60 ? 'b-orange' : 'b-red'
  const colorHex   = (s) => s >= 80 ? 'var(--success)' : s >= 60 ? 'var(--orange)' : 'var(--error)'

  const statusText = overall_score >= 80
    ? 'Excellent — this paper is ready for submission!'
    : overall_score >= 60
    ? 'Good standing, but a few issues need attention.'
    : 'Significant formatting issues were detected.'

  // SVG gauge: circumference of r=51 circle is ~320
  const CIRC = 320
  const offset = CIRC - (CIRC * overall_score) / 100

  return (
    <div className="result-card horizontal-score-card">
      {/* Left side: Overall Score */}
      <div className="h-score-main">
        <div className="h-score-header">
          <h3>Compliance Score</h3>
          <p>{statusText}</p>
        </div>
        <div className="h-score-big" style={{ color: colorHex(overall_score) }}>
          {overall_score}<span className="h-score-unit">/100</span>
        </div>
      </div>

      {/* Right side: Section Breakdown */}
      {breakdown && (
        <div className="h-score-breakdown">
          <p className="h-breakdown-title">Section Breakdown</p>
          <div className="bars-grid">
            {Object.entries(breakdown).map(([key, val], i) => (
              <div className="bar-row" key={key}>
                <span className="bar-label">{key.replace(/_/g, ' ')}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${barClass(val.score)}`}
                    style={{
                      width: animate ? `${val.score}%` : '0%',
                      transitionDelay: `${0.1 + i * 0.08}s`
                    }}
                  />
                </div>
                <span className="bar-num" style={{ color: colorHex(val.score) }}>{val.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

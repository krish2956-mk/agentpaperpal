import { useState } from 'react'

const IconCheck = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const IconSkip = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
    <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)
const IconWarn = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
    <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── Section component ──────────────────────────────────────────
function ReportSection({ icon, title, colorClass, items = [], emptyMsg }) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`report-section ${colorClass}`}>
      <button className="report-section-header" onClick={() => setOpen(o => !o)}>
        <span className="report-section-icon">{icon}</span>
        <span className="report-section-title">{title}</span>
        <span className="report-count">{items.length}</span>
        <span className="report-chevron" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      {open && (
        <ul className="report-list">
          {items.length === 0
            ? <li className="report-empty">{emptyMsg}</li>
            : items.map((item, i) => (
                <li key={i} className="report-item">
                  <span className="report-item-dot" />
                  {item}
                </li>
              ))
          }
        </ul>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function TransformationReport({ report }) {
  if (!report) return null

  const applied  = report.applied_transformations  || report.changes_made || []
  const skipped  = report.skipped_transformations  || []
  const manual   = report.manual_action_required   || []

  return (
    <div className="transformation-report">
      <h3 className="report-heading">Transformation Report</h3>
      <p  className="report-sub">Summary of every change attempted during formatting</p>

      <ReportSection
        icon={<IconCheck />}
        title="Successfully Applied"
        colorClass="rs-green"
        items={applied}
        emptyMsg="No transformations were applied."
      />
      <ReportSection
        icon={<IconSkip />}
        title="Skipped"
        colorClass="rs-amber"
        items={skipped}
        emptyMsg="No transformations were skipped."
      />
      <ReportSection
        icon={<IconWarn />}
        title="User Action Required"
        colorClass="rs-red"
        items={manual}
        emptyMsg="No manual actions required."
      />
    </div>
  )
}

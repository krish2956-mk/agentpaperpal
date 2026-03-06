export default function ChangesList({ changes }) {
  if (!changes || changes.length === 0) return null

  return (
    <div className="result-card">
      <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: '1rem' }}>
        Changes Applied
      </h3>
      <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        {changes.length} formatting {changes.length === 1 ? 'correction' : 'corrections'} made by the AI pipeline
      </p>
      <ul className="changes-list">
        {changes.map((change, i) => (
          <li
            key={i}
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div className="change-icon">{i + 1}</div>
            {change}
          </li>
        ))}
      </ul>
    </div>
  )
}

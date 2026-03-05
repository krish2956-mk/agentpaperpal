import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

function scoreColor(score) {
  if (score >= 90) return { text: "text-green-600 dark:text-green-400", bg: "bg-green-500", ring: "ring-green-500/20" };
  if (score >= 70) return { text: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500", ring: "ring-yellow-500/20" };
  return { text: "text-red-500 dark:text-red-400", bg: "bg-red-500", ring: "ring-red-500/20" };
}

function ScoreBar({ label, score, issues = [] }) {
  const colors = scoreColor(score);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{label.replace(/_/g, " ")}</span>
        <span className={`text-xs font-semibold tabular-nums ${colors.text}`}>{score}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors.bg}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {issues.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {issues.map((issue, i) => (
            <li key={i} className="text-xs text-gray-400 dark:text-gray-500 flex items-start gap-1">
              <span className="text-yellow-500 mt-0.5 shrink-0">·</span>
              {issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ImradCheck({ imrad }) {
  const sections = ["introduction", "methods", "results", "discussion"];
  return (
    <div className="grid grid-cols-2 gap-2">
      {sections.map((s) => (
        <div
          key={s}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium capitalize
            ${imrad[s]
              ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/40"
              : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30"
            }`}
        >
          {imrad[s]
            ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            : <XCircle className="w-3.5 h-3.5 shrink-0" />
          }
          {s}
        </div>
      ))}
    </div>
  );
}

export default function ComplianceScore({ report }) {
  if (!report) return null;

  const {
    overall_score = 0,
    breakdown = {},
    imrad_check = {},
    citation_consistency = {},
    warnings = [],
  } = report;

  const colors = scoreColor(overall_score);
  const orphans = citation_consistency.orphan_citations || [];
  const uncited = citation_consistency.uncited_references || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overall score */}
      <div className={`flex items-center gap-5 p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 ring-4 ${colors.ring}`}>
        <div className="relative shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-800" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={overall_score >= 90 ? "#22c55e" : overall_score >= 70 ? "#eab308" : "#ef4444"}
              strokeWidth="3"
              strokeDasharray={`${overall_score} ${100 - overall_score}`}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-xl font-bold tabular-nums ${colors.text}`}>
            {overall_score}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Overall Score</p>
          <p className={`text-2xl font-bold ${colors.text}`}>{overall_score}/100</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {overall_score >= 90 ? "Excellent compliance" : overall_score >= 70 ? "Good — minor issues" : "Needs attention"}
          </p>
        </div>
      </div>

      {/* Section breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Section Breakdown</h3>
          {Object.entries(breakdown).map(([key, val]) => (
            <ScoreBar key={key} label={key} score={val.score || 0} issues={val.issues || []} />
          ))}
        </div>
      )}

      {/* IMRAD check */}
      {Object.keys(imrad_check).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">IMRaD Structure</h3>
          <ImradCheck imrad={imrad_check} />
        </div>
      )}

      {/* Citation consistency */}
      {(orphans.length > 0 || uncited.length > 0) && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Citation Consistency</h3>
          {orphans.length > 0 && (
            <div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mb-1">Orphan citations (no reference)</p>
              <ul className="space-y-0.5">
                {orphans.map((c, i) => <li key={i} className="text-xs text-gray-500">· {c}</li>)}
              </ul>
            </div>
          )}
          {uncited.length > 0 && (
            <div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mb-1">Uncited references</p>
              <ul className="space-y-0.5">
                {uncited.map((r, i) => <li key={i} className="text-xs text-gray-500">· {r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl border border-yellow-200 dark:border-yellow-900/40 p-4 space-y-2">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" />
            Warnings
          </h3>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-yellow-700/80 dark:text-yellow-300/70">· {w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

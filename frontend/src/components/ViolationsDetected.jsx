import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

const CATEGORY_COLOR = {
  abstract:   "text-blue-400   border-blue-800/40   bg-blue-950/20",
  headings:   "text-purple-400 border-purple-800/40 bg-purple-950/20",
  citations:  "text-yellow-400 border-yellow-800/40 bg-yellow-950/20",
  references: "text-orange-400 border-orange-800/40 bg-orange-950/20",
  figures:    "text-teal-400   border-teal-800/40   bg-teal-950/20",
  tables:     "text-cyan-400   border-cyan-800/40   bg-cyan-950/20",
};

function categoryColor(cat) {
  const key = (cat || "").toLowerCase().split(/[\s_]/)[0];
  return CATEGORY_COLOR[key] || "text-gray-400 border-gray-700/40 bg-gray-800/20";
}

function ViolationRow({ v, index }) {
  const [open, setOpen] = useState(false);
  const colors = categoryColor(v.rule_category);

  return (
    <div className={`rounded-xl border p-3.5 space-y-2 ${colors}`}>
      <div className="flex items-start gap-2.5">
        <span className="text-xs font-bold tabular-nums mt-0.5 opacity-50">
          #{index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${colors}`}>
              {v.rule_category || "unknown"}
            </span>
            {v.rule_reference && (
              <span className="text-xs text-gray-500 font-mono">{v.rule_reference}</span>
            )}
          </div>
          <p className="text-sm text-gray-200 mt-1.5 leading-snug">
            {v.violation_found || v.rule_description || "Violation detected"}
          </p>
        </div>
        <button
          onClick={() => setOpen((s) => !s)}
          className="text-gray-600 hover:text-gray-400 transition-colors shrink-0 mt-0.5"
          aria-label="Toggle fix detail"
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {open && (v.fix_applied || v.fix_instruction) && (
        <div className="ml-6 pl-3 border-l border-gray-700/50">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Fix applied</p>
          <p className="text-xs text-green-400 leading-relaxed">
            {v.fix_applied || v.fix_instruction}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ViolationsDetected({ data }) {
  const violations  = data?.violations  || [];
  const total       = data?.total_violations ?? violations.length;
  const journal     = data?.journal || "";

  if (!violations.length) return null;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <h2 className="text-base font-semibold text-white">
            Violations Detected
          </h2>
          {journal && (
            <span className="text-xs text-gray-600 font-mono">({journal})</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-bold tabular-nums ${total > 0 ? "text-yellow-400" : "text-green-400"}`}>
            {total}
          </span>
          <span className="text-xs text-gray-600">found &amp; fixed</span>
        </div>
      </div>

      {/* All-clear banner if somehow no violations in list */}
      {violations.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-green-800/40 bg-green-950/20 text-sm text-green-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          No formatting violations detected — paper meets all {journal} rules.
        </div>
      ) : (
        <div className="space-y-3">
          {violations.map((v, i) => (
            <ViolationRow key={i} v={v} index={i} />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600 pt-1">
        Each violation was detected by the Interpret phase and fixed by the Transform agent.
      </p>
    </div>
  );
}

import { useState } from "react";
import { CheckCheck, ChevronDown, ChevronUp, BookOpen } from "lucide-react";

const INITIAL_VISIBLE = 6;

// Normalise each entry — handle both plain strings and structured {what, rule_reference, why}
function normalise(change) {
  if (typeof change === "string") return { what: change, rule_reference: null, why: null };
  if (change && typeof change === "object") {
    return {
      what: change.what || change.description || String(change),
      rule_reference: change.rule_reference || null,
      why: change.why || null,
    };
  }
  return { what: String(change), rule_reference: null, why: null };
}

export default function ChangesList({ changes }) {
  const [showAll, setShowAll] = useState(false);

  if (!changes || changes.length === 0) return null;

  const items = changes.map(normalise);
  const visibleItems = showAll ? items : items.slice(0, INITIAL_VISIBLE);
  const hiddenCount = items.length - INITIAL_VISIBLE;
  const hasMore = items.length > INITIAL_VISIBLE;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">

      <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
        <CheckCheck className="w-4 h-4 text-green-400" />
        Changes Applied
        <span className="text-xs font-normal text-gray-500 ml-1">
          ({items.length} correction{items.length !== 1 ? "s" : ""})
        </span>
      </h3>

      <ol className="space-y-3">
        {visibleItems.map((item, i) => (
          <li key={i} className="flex items-start gap-3 group">
            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-950 border border-blue-900/60 text-blue-400 text-xs font-bold mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-300 leading-relaxed group-hover:text-white transition-colors">
                {item.what}
              </span>
              {item.rule_reference && (
                <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded text-xs font-mono text-blue-400 bg-blue-950/40 border border-blue-900/40 shrink-0 whitespace-nowrap">
                  <BookOpen className="w-2.5 h-2.5" />
                  {item.rule_reference}
                </span>
              )}
              {item.why && item.rule_reference && (
                <p className="text-xs text-gray-600 mt-0.5">{item.why}</p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {hasMore && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="mt-4 flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          {showAll ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Show {hiddenCount} more changes</>
          )}
        </button>
      )}

    </div>
  );
}

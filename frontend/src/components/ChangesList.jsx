import { CheckCheck } from "lucide-react";

export default function ChangesList({ changes = [] }) {
  if (!changes || changes.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 animate-fade-in">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        <CheckCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
        Corrections Applied ({changes.length})
      </h3>
      <ol className="space-y-2">
        {changes.map((change, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold mt-0.5">
              {i + 1}
            </span>
            <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{change}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

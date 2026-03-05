import { useState, useRef } from "react";
import { Upload as UploadIcon, FileText, X, ChevronDown } from "lucide-react";

const JOURNALS = [
  "APA 7th Edition",
  "IEEE",
  "Vancouver",
  "Springer",
  "Chicago",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Upload({ onSubmit, isLoading }) {
  const [file, setFile] = useState(null);
  const [journal, setJournal] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  function validateFile(f) {
    if (!f) return "No file selected.";
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(ext)) return "Only PDF or DOCX files are supported.";
    if (f.size > MAX_FILE_SIZE) return "File must be smaller than 10MB.";
    return null;
  }

  function handleFileChange(f) {
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
    } else {
      setError("");
      setFile(f);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileChange(f);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!file || !journal) return;
    onSubmit(file, journal);
  }

  const canSubmit = file && journal && !isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center
          transition-all duration-200 select-none
          ${dragOver
            ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20"
            : file
            ? "border-green-500/50 bg-green-50 dark:bg-green-950/10"
            : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-900"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files[0])}
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="mt-1 flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <UploadIcon className="w-10 h-10 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Drop your paper here or{" "}
                <span className="text-blue-600 dark:text-blue-400">browse</span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">PDF or DOCX · Max 10MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Journal selector */}
      <div className="relative">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">
          Target Journal Style
        </label>
        <div className="relative">
          <select
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            className="
              w-full appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl
              px-4 py-3 pr-10 text-sm text-gray-800 dark:text-gray-200
              focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30
              transition-colors cursor-pointer
            "
          >
            <option value="" disabled>Select a journal style...</option>
            {JOURNALS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className={`
          w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200
          ${canSubmit
            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 cursor-pointer"
            : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
          }
        `}
      >
        {isLoading ? "Processing..." : "Format Document"}
      </button>
    </form>
  );
}

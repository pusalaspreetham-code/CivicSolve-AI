import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import * as problemService from "../services/problemService";
import { Problem } from "../types/problem";

interface Props {
  placeholder?: string;
  onSelect: (problem: Problem) => void;
}

const ProblemNameSearch = ({ placeholder = "Don't know the ID? Search by problem name...", onSelect }: Props) => {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (term.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await problemService.searchProblemsByName(term);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [term]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
        />
        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-72 overflow-y-auto">
          {results.length === 0 && !loading ? (
            <p className="px-4 py-3 text-sm text-slate-500">No matching problems found.</p>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelect(p);
                  setTerm("");
                  setResults([]);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
              >
                <p className="text-sm font-medium text-slate-900 line-clamp-1">{p.problem_title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID #{p.id} &middot; {p.domain} &middot; {p.severity}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemNameSearch;

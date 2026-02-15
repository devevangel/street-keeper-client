/**
 * UniversalSearchInput
 * Location search with debounced API calls and dropdown results.
 * Supports addresses, places, POIs, hospitals, parks.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { geocodingService } from "../../services/geocoding.service";
import type { GeocodingResult } from "../../types/api.types";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export interface UniversalSearchInputProps {
  placeholder?: string;
  onSelect: (result: GeocodingResult) => void;
  disabled?: boolean;
  className?: string;
}

export function UniversalSearchInput({
  placeholder = "Search anywhere: address, park, hospital…",
  onSelect,
  disabled = false,
  className = "",
}: UniversalSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await geocodingService.search(q, { limit: 5 });
      setResults(list);
      setOpen(true);
    } catch {
      setError("Search failed. Try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchResults(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, fetchResults]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (result: GeocodingResult) => {
      onSelect(result);
      setQuery(result.displayName);
      setOpen(false);
      setResults([]);
    },
    [onSelect],
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results.length > 0) {
              e.preventDefault();
              handleSelect(results[0]);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="geocode-results"
          aria-autocomplete="list"
          id="geocode-search"
          className="h-8 min-h-8 w-full flex-1 border-2 border-border bg-surface px-3 py-1.5 pr-10 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
        />
        {loading && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm"
            aria-hidden
          >
            …
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1 text-danger text-sm" role="alert">
          {error}
        </p>
      )}
      {open && results.length > 0 && (
        <ul
          id="geocode-results"
          role="listbox"
          className="absolute top-full left-0 right-0 z-[1000] mt-1 max-h-60 overflow-auto border-2 border-border bg-surface shadow-lg"
        >
          {results.map((r) => (
            <li
              key={r.placeId}
              role="option"
              tabIndex={0}
              className="cursor-pointer px-3 py-2 text-text hover:bg-border focus:bg-border focus:outline-none"
              onClick={() => handleSelect(r)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(r);
                }
              }}
            >
              <span className="font-medium">{r.displayName}</span>
              {r.type && r.type !== "place" && (
                <span className="ml-2 text-text-muted text-sm">({r.type})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

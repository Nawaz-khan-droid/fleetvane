import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}

export function AddressAutocomplete({ label, placeholder, value, onChange, required }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (!val.trim() || val.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    
    setLoading(true);
    setShowDropdown(true);
    
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5`, {
          headers: { 'Accept-Language': 'en' }
        });
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error('Nominatim error', err);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleSelect = (s: Suggestion) => {
    // Keep it short for the input, maybe split by comma and take first 2 parts
    const parts = s.display_name.split(',');
    const shortName = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : s.display_name;
    
    onChange(shortName);
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          required={required}
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />}
      </div>
      
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <ul className="max-h-60 overflow-y-auto py-1">
            {suggestions.map((s, i) => (
              <li 
                key={i}
                onClick={() => handleSelect(s)}
                className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex gap-3 items-start text-sm transition-colors"
              >
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <span className="text-slate-700 dark:text-slate-200">{s.display_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

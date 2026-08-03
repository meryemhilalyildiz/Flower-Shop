import { useState, useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Suggestion {
  id: string;
  name: string;
  displayName: string;
  lat?: number;
  lng?: number;
  type?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSuggestionSelect?: (suggestion: Suggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  suggestions: Suggestion[];
  loading?: boolean;
  className?: string;
}

export default function AutocompleteInput({
  value,
  onChange,
  onSuggestionSelect,
  placeholder = 'Ara...',
  disabled = false,
  suggestions = [],
  loading = false,
  className = '',
}: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🌸 Dışarı tıklandığında dropdown'ı kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🌸 Input değiştiğinde dropdown'ı aç
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  // 🌸 Öneri seçildiğinde
  const handleSuggestionClick = (suggestion: Suggestion) => {
    onChange(suggestion.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSuggestionSelect?.(suggestion);
  };

  // 🌸 Klavye navigasyonu
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 🌸 Temizle butonu
  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`input pr-10 ${className}`}
        />
        
        {/* 🌸 Temizle butonu */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* 🌸 Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
          </div>
        )}
      </div>

      {/* 🌸 Öneri dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-sand-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-sand-50 transition-colors border-b border-sand-100 last:border-0 ${
                index === selectedIndex ? 'bg-brand-50 border-brand-200' : ''
              }`}
            >
              <div className="text-sm font-medium text-sand-800">
                {suggestion.name}
              </div>
              {suggestion.displayName !== suggestion.name && (
                <div className="text-xs text-sand-500 mt-1 truncate">
                  {suggestion.displayName}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 🌸 Boş durum */}
      {showSuggestions && !loading && suggestions.length === 0 && value.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-sand-200 rounded-xl shadow-lg p-4"
        >
          <div className="text-sm text-sand-500 text-center">
            Sonuç bulunamadı
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  id?: string;
}

const SearchSelect: React.FC<SearchSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[focusedIndex + 1] as HTMLElement; // +1 for search input
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        setSearch('');
        setFocusedIndex(-1);
      }
      return !prev;
    });
  }, []);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
      setSearch('');
      setFocusedIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[focusedIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearch('');
          setFocusedIndex(-1);
          break;
        case 'Tab':
          setIsOpen(false);
          setSearch('');
          setFocusedIndex(-1);
          break;
      }
    },
    [isOpen, focusedIndex, filteredOptions, handleSelect]
  );

  // Reset focused index when search changes
  useEffect(() => {
    setFocusedIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [search, filteredOptions.length]);

  const listboxId = id ? `${id}-listbox` : 'search-select-listbox';

  return (
    <div
      ref={containerRef}
      className={`search-select${isOpen ? ' search-select--open' : ''}`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="search-select-trigger"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        id={id}
      >
        {selectedOption ? (
          <span>{selectedOption.label}</span>
        ) : (
          <span className="search-select-trigger-placeholder">{placeholder}</span>
        )}
        <svg
          className="search-select-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={listRef}
          className="search-select-dropdown"
          role="listbox"
          id={listboxId}
          aria-label={placeholder}
        >
          <input
            ref={searchInputRef}
            type="text"
            className="search-select-search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search options"
            role="searchbox"
          />

          {filteredOptions.length === 0 ? (
            <div className="search-select-empty">{emptyMessage}</div>
          ) : (
            filteredOptions.map((option, idx) => {
              const isSelected = option.value === value;
              const isFocused = idx === focusedIndex;

              return (
                <div
                  key={option.value}
                  className={[
                    'search-select-option',
                    isSelected && 'search-select-option--selected',
                    isFocused && 'search-select-option--focused',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                >
                  {option.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSelect;

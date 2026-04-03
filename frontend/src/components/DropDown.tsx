import { useState, useRef, useEffect } from 'react';

interface Option {
  id: string;
  label: string;
  value: string;
}

interface SearchableDropdownProps {
  options: Option[];
  onSelect: (option: Option | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  value?: Option | null;
}

export function SearchableDropdown({ options, onSelect, placeholder = "Select an option", searchPlaceholder = "Search...", value = null }: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [internalSelectedOption, setInternalSelectedOption] = useState<Option | null>(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with external value prop
  useEffect(() => {
    setInternalSelectedOption(value);
  }, [value]);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: Option) => {
    setInternalSelectedOption(option);
    onSelect(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    setInternalSelectedOption(null);
    onSelect(null);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-46" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left !bg-white border border-black focus:outline-none hover:!bg-gray-100 flex justify-between items-center"
      >
        <span className="!text-black">
          {internalSelectedOption ? internalSelectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 !text-black transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 !bg-white border border-black">
          {/* Search Input */}
          <div className="p-2 border-b border-black">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm !text-black !bg-white border border-black focus:outline-none focus:ring-1 focus:ring-black"
              autoFocus
            />
          </div>

          {/* Options List with custom black scrollbar */}
          <div 
            className="max-h-60 overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'black white'
            }}
          >
            <style>
              {`
                .options-list::-webkit-scrollbar {
                  width: 8px;
                }
                .options-list::-webkit-scrollbar-track {
                  background: white;
                }
                .options-list::-webkit-scrollbar-thumb {
                  background: black;
                }
                .options-list::-webkit-scrollbar-thumb:hover {
                  background: #333;
                }
              `}
            </style>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className={`w-full px-4 py-2 text-left border-b border-black last:border-b-0 ${
                    internalSelectedOption?.id === option.id 
                      ? "!bg-gray-300 !text-black hover:!bg-gray-400" 
                      : "!bg-white !text-black hover:!bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm !text-black text-center">
                No results found
              </div>
            )}
          </div>

          {/* Clear Selection Button */}
          {internalSelectedOption && (
            <div className="border-t border-black">
              <button
                onClick={handleClear}
                className="w-full px-4 py-2 text-left !bg-white !text-black hover:!bg-gray-200 transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
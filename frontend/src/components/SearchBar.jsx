import { useState, useEffect } from "react";

export default function SearchBar({ 
  placeholder = "Search...", 
  value: propValue, 
  onSearch 
}) {
  const [query, setQuery] = useState(propValue || "");

  useEffect(() => {
    if (propValue !== undefined) setQuery(propValue);
  }, [propValue]);

  const handleChange = (e) => {
    setQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder={placeholder}
      className="border px-2 py-1 rounded w-full"
    />
  );
}

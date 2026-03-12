"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FeedSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function FeedSearch({ value, onChange }: FeedSearchProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(val);
    }, 300);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rock" />
      <Input
        type="text"
        placeholder="Search by destination..."
        value={localValue}
        onChange={handleChange}
        className="pl-10 font-[family-name:var(--font-roboto-mono)]"
      />
    </div>
  );
}

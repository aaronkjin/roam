"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type DistanceUnit = "mi" | "km";

interface DistanceUnitContextValue {
  unit: DistanceUnit;
  toggleUnit: () => void;
}

const DistanceUnitContext = createContext<DistanceUnitContextValue>({
  unit: "mi",
  toggleUnit: () => {},
});

const STORAGE_KEY = "roam-distance-unit";

export function DistanceUnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<DistanceUnit>("mi");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "km" || stored === "mi") {
      setUnit(stored);
    }
  }, []);

  const toggleUnit = useCallback(() => {
    setUnit((prev) => {
      const next = prev === "mi" ? "km" : "mi";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <DistanceUnitContext.Provider value={{ unit, toggleUnit }}>
      {children}
    </DistanceUnitContext.Provider>
  );
}

export function useDistanceUnit() {
  return useContext(DistanceUnitContext);
}

// utils/hooks/useDebouncedState.ts
import { useState, useMemo } from "react";
import debounce from "debounce";

export function useDebouncedState(initialValue, delay = 500) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  const debouncedSetValue = useMemo(
    () =>
      debounce((val) => {
        setDebouncedValue(val);
      }, delay),
    [delay]
  );

  const setBoth = (val) => {
    setValue(val);
    debouncedSetValue(val);
  };

  return [value, setBoth, debouncedValue];
}

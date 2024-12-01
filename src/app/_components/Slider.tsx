import React, { useEffect, useState } from "react";
import { RotateCcwIcon } from "lucide-react";

const Slider = ({
  id,
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  onChange: (value: number) => void;
}) => {
  const [localValue, setLocalValue] = useState(value.toFixed(2));

  useEffect(() => {
    if (id === "temperature") {
      setLocalValue(value.toFixed(2));
    } else {
      setLocalValue(value.toString());
    }
  }, [value, id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (/^\d+(\.\d{0,2})?$/.test(input)) {
      setLocalValue(input);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let inputValue = parseFloat(e.target.value);

    if (isNaN(inputValue)) {
      inputValue = min;
    } else {
      inputValue = Math.round(inputValue / step) * step;
      inputValue = Math.max(min, Math.min(inputValue, max));
    }

    if (id === "temperature") {
      setLocalValue(inputValue.toFixed(2));
    } else {
      setLocalValue(inputValue.toString());
    }

    setLocalValue(inputValue.toFixed(2));
    onChange(inputValue);
  };

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="group block flex justify-between text-sm font-medium text-gray-700"
      >
        {label}
        <div className="group flex items-center space-x-2">
          {value !== defaultValue && (
            <button
              onClick={() => onChange(defaultValue)}
              className="flex h-5 w-5 items-center justify-center rounded p-1 opacity-0 transition-opacity duration-200 hover:bg-gray-300 group-hover:opacity-100"
            >
              <RotateCcwIcon className="h-3 w-3 group-hover:text-orange-400" />
            </button>
          )}

          <input
            type="text"
            value={localValue}
            min={min}
            className="w-12 rounded border-gray-300 bg-gray-100 p-0 text-center text-sm hover:border-orange-500 focus:border-orange-500 focus:outline-none focus:ring-0"
            onChange={handleInputChange}
            onBlur={handleBlur}
          />
        </div>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 w-full"
      />
    </div>
  );
};

export default Slider;

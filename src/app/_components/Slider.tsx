import React from "react";

const Slider = ({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) => (
  <div className="w-full">
    <label
      htmlFor={id}
      className="block flex justify-between text-sm font-medium text-gray-700"
    >
      {label}
      <span>{value}</span>
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

export default Slider;

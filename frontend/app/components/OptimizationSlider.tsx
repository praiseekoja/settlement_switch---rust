"use client";

import { Zap, DollarSign } from "lucide-react";

interface OptimizationSliderProps {
  value: number; // 0-100, where 0=cheapest, 100=fastest
  onChange: (value: number) => void;
}

export default function OptimizationSlider({
  value,
  onChange,
}: OptimizationSliderProps) {
  const getLabel = () => {
    if (value < 20) return "Cheapest Route";
    if (value < 80) return "Balanced";
    return "Fastest Route";
  };

  const getDescription = () => {
    if (value < 20) return "Minimize total cost";
    if (value < 80) return "Balance cost and speed";
    return "Minimize transfer time";
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-200 overflow-hidden">
      <div className="flex items-center justify-between mb-3 min-w-0">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            {value < 50 ? (
              <DollarSign className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <Zap className="w-5 h-5 text-purple-600 flex-shrink-0" />
            )}
            <span className="truncate">{getLabel()}</span>
          </h3>
          <p className="text-xs text-gray-600 mt-1 truncate">{getDescription()}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(value)}%
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap">
            {value < 50 ? "Cost Priority" : "Speed Priority"}
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-3 bg-gradient-to-r from-emerald-200 via-purple-200 to-purple-400 rounded-full appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, 
              #10b981 0%, 
              #8b5cf6 ${value}%, 
              #e5e7eb ${value}%, 
              #e5e7eb 100%)`,
          }}
        />
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: white;
            border: 3px solid ${value < 50 ? "#10b981" : "#8b5cf6"};
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.2s;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          }
          input[type="range"]::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: white;
            border: 3px solid ${value < 50 ? "#10b981" : "#8b5cf6"};
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex items-center gap-1 text-emerald-700 font-medium">
          <DollarSign className="w-4 h-4" />
          Cheapest
        </div>
        <div className="flex items-center gap-1 text-purple-700 font-medium">
          <Zap className="w-4 h-4" />
          Fastest
        </div>
      </div>
    </div>
  );
}



"use client";

import { TrendingDown, Clock, Award } from "lucide-react";

interface SavingsDisplayProps {
  bestRoute: {
    bridgeName: string;
    estimatedTime: number;
    totalCostUSD: number;
  };
  worstRoute: {
    bridgeName: string;
    estimatedTime: number;
    totalCostUSD: number;
  };
}

export default function SavingsDisplay({
  bestRoute,
  worstRoute,
}: SavingsDisplayProps) {
  const costSavings = worstRoute.totalCostUSD - bestRoute.totalCostUSD;
  const timeSavings = worstRoute.estimatedTime - bestRoute.estimatedTime;
  const costSavingsPercent =
    ((costSavings / worstRoute.totalCostUSD) * 100).toFixed(1);
  const timeSavingsPercent =
    ((timeSavings / worstRoute.estimatedTime) * 100).toFixed(1);

  if (costSavings <= 0 && timeSavings <= 0) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border-2 border-emerald-200 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-emerald-900 truncate">Savings With Best Route</h3>
          <p className="text-xs text-emerald-700 truncate">
            vs {worstRoute.bridgeName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Cost Savings */}
        {costSavings > 0 && (
          <div className="bg-white rounded-lg p-4 border border-emerald-200 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-600 truncate">
                Cost Savings
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mb-1 truncate">
              ${costSavings.toFixed(4)}
            </div>
            <div className="text-xs text-emerald-700 font-medium truncate">
              {costSavingsPercent}% cheaper
            </div>
          </div>
        )}

        {/* Time Savings */}
        {timeSavings > 0 && (
          <div className="bg-white rounded-lg p-4 border border-emerald-200 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-600 truncate">
                Time Savings
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mb-1 truncate">
              {Math.floor(timeSavings / 60)}m
            </div>
            <div className="text-xs text-emerald-700 font-medium truncate">
              {timeSavingsPercent}% faster
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-emerald-200">
        <p className="text-sm text-emerald-900 font-medium break-words">
          🎯 Automatically selected <span className="font-bold">{bestRoute.bridgeName}</span>
        </p>
        <p className="text-xs text-emerald-700 mt-1 break-words">
          Settlement Switch found the optimal path and saved you money & time!
        </p>
      </div>
    </div>
  );
}



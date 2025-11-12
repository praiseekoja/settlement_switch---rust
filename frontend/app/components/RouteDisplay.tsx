"use client";

import { Clock, DollarSign, Zap, TrendingDown } from "lucide-react";

interface Route {
  bridgeName: string;
  estimatedTime: number;
  estimatedGasCost: number;
  bridgeFee: number;
  totalCostUSD: number;
  amountOut: number;
  available: boolean;
}

interface RouteDisplayProps {
  routes: Route[];
  loading: boolean;
  selectedRoute: number | null;
  onSelectRoute: (index: number) => void;
}

export default function RouteDisplay({
  routes,
  loading,
  selectedRoute,
  onSelectRoute,
}: RouteDisplayProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700 mb-3">
          Finding best routes...
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-100 rounded-xl h-24"
          />
        ))}
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Enter amount to see available routes</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-gray-700">
          Available Routes ({routes.length})
        </div>
        <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
          Sorted by optimization
        </div>
      </div>

      {routes.map((route, index) => {
        const isSelected = selectedRoute === index;
        const isBest = index === 0; // First route is optimized

        return (
          <button
            key={`route-${route.bridgeName}-${index}`}
            onClick={() => onSelectRoute(index)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? "border-purple-500 bg-purple-50 shadow-md"
                : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="font-semibold text-gray-900 flex items-center gap-2 truncate">
                  <span className="truncate">{route.bridgeName}</span>
                  {isBest && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1 flex-shrink-0">
                      <Zap className="w-3 h-3" />
                      Optimized
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? "border-purple-500 bg-purple-500"
                    : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-gray-500 mb-1">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs truncate">Time</span>
                </div>
                <div className="font-semibold text-gray-900 truncate">
                  {formatTime(route.estimatedTime)}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1 text-gray-500 mb-1">
                  <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs truncate">Gas</span>
                </div>
                <div className="font-semibold text-gray-900 truncate text-xs sm:text-sm">
                  ${route.estimatedGasCost.toFixed(4)}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1 text-gray-500 mb-1">
                  <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs truncate">Fee</span>
                </div>
                <div className="font-semibold text-gray-900 truncate text-xs sm:text-sm">
                  {route.bridgeFee.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Total Cost */}
            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between min-w-0">
              <span className="text-sm text-gray-600">Total Cost</span>
              <span className="font-bold text-gray-900 truncate ml-2 text-xs sm:text-sm">
                ${route.totalCostUSD.toFixed(6)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}



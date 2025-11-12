"use client";

import { CheckCircle2, Clock, DollarSign, TrendingUp, Zap } from "lucide-react";

interface Route {
  bridgeName: string;
  estimatedTime: number;
  estimatedGasCost: number;
  bridgeFee: number;
  totalCostUSD: number;
  amountOut: number;
  available: boolean;
}

interface RouteComparisonProps {
  routes: Route[];
}

export default function RouteComparison({ routes }: RouteComparisonProps) {
  if (routes.length < 2) return null;

  const bestCostRoute = routes[0]; // Already sorted by cost
  const fastestRoute = [...routes].sort(
    (a, b) => a.estimatedTime - b.estimatedTime
  )[0];

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <div className="bg-white rounded-xl border-2 border-purple-200 p-5">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-purple-600" />
        Route Comparison
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cheapest Route */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border-2 border-emerald-300 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-emerald-900 truncate">Cheapest Route</div>
              <div className="text-xs text-emerald-700">Lowest total cost</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between min-w-0">
              <span className="text-sm text-gray-700 flex-shrink-0">Bridge:</span>
              <span className="font-semibold text-gray-900 truncate ml-2">
                {bestCostRoute.bridgeName}
              </span>
            </div>
            <div className="flex items-center justify-between min-w-0">
              <span className="text-sm text-gray-700 flex-shrink-0">Cost:</span>
              <span className="font-bold text-emerald-600 truncate ml-2 text-xs sm:text-sm">
                ${bestCostRoute.totalCostUSD.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center justify-between min-w-0">
              <span className="text-sm text-gray-700 flex-shrink-0">Time:</span>
              <span className="font-medium text-gray-900 truncate ml-2">
                {formatTime(bestCostRoute.estimatedTime)}
              </span>
            </div>
            <div className="pt-2 border-t border-emerald-200">
              <div className="flex items-center gap-1 text-xs text-emerald-700">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Recommended for savings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fastest Route */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-300 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-purple-900 truncate">Fastest Route</div>
              <div className="text-xs text-purple-700">Shortest time</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between min-w-0">
              <span className="text-sm text-gray-700 flex-shrink-0">Bridge:</span>
              <span className="font-semibold text-gray-900 truncate ml-2">
                {fastestRoute.bridgeName}
              </span>
            </div>
            <div className="flex items-center justify-between min-w-0">
              <span className="text-sm text-gray-700 flex-shrink-0">Cost:</span>
              <span className="font-bold text-gray-900 truncate ml-2 text-xs sm:text-sm">
                ${fastestRoute.totalCostUSD.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center justify-between min-w-0">
              <span className="text-sm text-gray-700 flex-shrink-0">Time:</span>
              <span className="font-bold text-purple-600 truncate ml-2">
                {formatTime(fastestRoute.estimatedTime)}
              </span>
            </div>
            <div className="pt-2 border-t border-purple-200">
              <div className="flex items-center gap-1 text-xs text-purple-700">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Recommended for speed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          <span className="font-semibold">Smart Routing Active:</span> Comparing{" "}
          {routes.length} different paths across multiple bridges to find you the
          best deal.
        </div>
      </div>
    </div>
  );
}



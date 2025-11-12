"use client";

import { Zap } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center border-b border-gray-200 px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2.5 rounded-xl shadow-lg">
          <Zap className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Settlement Switch
          </h1>
          <p className="text-xs text-gray-500 hidden sm:block">
            Cheapest & Fastest Cross-Chain Routes
          </p>
        </div>
      </div>

      <div>
        <ConnectButton
          chainStatus="icon"
          accountStatus={{
            smallScreen: "avatar",
            largeScreen: "full",
          }}
          showBalance={{
            smallScreen: false,
            largeScreen: true,
          }}
        />
      </div>
    </nav>
  );
}

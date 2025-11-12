"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { TOKENS } from "../config";

interface TokenSelectorProps {
  selectedToken: string;
  onSelect: (token: string) => void;
}

export default function TokenSelector({
  selectedToken,
  onSelect,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const token = TOKENS.find((t) => t.symbol === selectedToken) || TOKENS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <span className="font-semibold text-gray-900">{token.symbol}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-20 min-w-[160px] overflow-hidden">
            {TOKENS.map((t) => (
              <button
                key={t.symbol}
                onClick={() => {
                  onSelect(t.symbol);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{t.symbol}</div>
                  <div className="text-xs text-gray-500">{t.name}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}



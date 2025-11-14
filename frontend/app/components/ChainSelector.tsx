"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CHAIN_INFO, SUPPORTED_CHAINS, ChainId } from "../config";

interface ChainSelectorProps {
  selectedChainId: ChainId;
  onSelect: (chainId: ChainId) => void;
  label: string;
  excludeChainId?: ChainId;
}

export default function ChainSelector({
  selectedChainId,
  onSelect,
  label,
  excludeChainId,
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableChains = SUPPORTED_CHAINS.filter(
    (chain) => chain.id !== excludeChainId
  );

  const selectedChain = SUPPORTED_CHAINS.find(
    (chain) => chain.id === selectedChainId
  );
  const chainInfo = selectedChain
    ? CHAIN_INFO[selectedChain.id as ChainId]
    : { name: "Select Chain", icon: "⚪", color: "gray" };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{chainInfo.icon}</span>
          <div className="text-left">
            <div className="font-semibold text-gray-900">{chainInfo.name}</div>
            <div className="text-xs text-gray-500">
              {selectedChain ? `Chain ID: ${selectedChain.id}` : "Select network"}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
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
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
            {availableChains.map((chain) => {
              const info = CHAIN_INFO[chain.id];
              return (
                <button
                  key={chain.id}
                  onClick={() => {
                    onSelect(chain.id as ChainId);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-4 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-2xl">{info.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">
                      {info.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Chain ID: {chain.id}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}



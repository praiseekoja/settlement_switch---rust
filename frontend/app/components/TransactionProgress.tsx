"use client";

import { CheckCircle2, Loader2, XCircle, ExternalLink } from "lucide-react";

type TransactionStatus = "idle" | "initiating" | "confirming" | "bridging" | "success" | "error";

interface TransactionProgressProps {
  status: TransactionStatus;
  txHash?: string;
  error?: string;
  onClose: () => void;
}

export default function TransactionProgress({
  status,
  txHash,
  error,
  onClose,
}: TransactionProgressProps) {
  if (status === "idle") return null;

  const steps = [
    { key: "initiating", label: "Initiating transfer..." },
    { key: "confirming", label: "Waiting for confirmations..." },
    { key: "bridging", label: "Bridge processing..." },
  ];

  const getCurrentStepIndex = () => {
    const index = steps.findIndex((step) => step.key === status);
    return index === -1 ? 0 : index;
  };

  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          {isSuccess && (
            <>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Bridge Complete!
              </h3>
              <p className="text-gray-600">
                Your transfer has been successfully completed
              </p>
            </>
          )}

          {isError && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Transaction Failed
              </h3>
              <p className="text-red-600 text-sm">{error || "Unknown error occurred"}</p>
            </>
          )}

          {!isSuccess && !isError && (
            <>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Processing Transaction
              </h3>
              <p className="text-gray-600">Please wait while we process your transfer</p>
            </>
          )}
        </div>

        {/* Progress Steps */}
        {!isSuccess && !isError && (
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isActive = index === getCurrentStepIndex();
              const isCompleted = index < getCurrentStepIndex();

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isActive ? "bg-purple-50" : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-emerald-500"
                        : isActive
                        ? "bg-purple-500"
                        : "bg-gray-300"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-purple-700" : "text-gray-600"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Transaction Hash */}
        {txHash && (
          <a
            href={`https://sepolia.arbiscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
          >
            <span>View on Explorer</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Close Button */}
        {(isSuccess || isError) && (
          <button
            onClick={onClose}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
          >
            {isSuccess ? "Done" : "Try Again"}
          </button>
        )}
      </div>
    </div>
  );
}



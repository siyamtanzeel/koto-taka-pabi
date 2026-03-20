"use client";

import { toPng } from "html-to-image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactBitsSplitText from "@/components/reactbits-split-text";

type Receipt = {
  id: string;
  challengeId: string;
  challengeTitle: string;
  creatorName: string;
  playerName: string;
  maxAmount: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  payout: number;
  generatedAt: string;
};

export default function ReceiptClient() {
  const searchParams = useSearchParams();
  const initialRid = searchParams.get("rid") ?? "";
  const [receiptId, setReceiptId] = useState(initialRid);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const verifyReceipt = async () => {
    if (!receiptId.trim()) {
      setError("Receipt ID দিন।");
      return;
    }

    setLoading(true);
    setError("");
    setReceipt(null);

    try {
      const response = await fetch(`/api/receipts/${receiptId.trim()}`);
      const data = (await response.json()) as Receipt | { error?: string };
      if (!response.ok) {
        setError("Receipt পাওয়া যায়নি।");
        return;
      }
      setReceipt(data as Receipt);
    } catch {
      setError("Verify করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const downloadVerificationPng = async () => {
    const card = document.getElementById("verification-certificate");
    if (!card) return;

    const dataUrl = await toPng(card, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `receipt-verification-${receipt?.id ?? "unknown"}.png`;
    link.href = dataUrl;
    link.click();
  };

  useEffect(() => {
    if (!initialRid) return;

    const run = async () => {
      setLoading(true);
      setError("");
      setReceipt(null);
      try {
        const response = await fetch(`/api/receipts/${initialRid.trim()}`);
        const data = (await response.json()) as Receipt | { error?: string };
        if (!response.ok) {
          setError("Receipt পাওয়া যায়নি।");
          return;
        }
        setReceipt(data as Receipt);
      } catch {
        setError("Verify করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [initialRid]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <ReactBitsSplitText
        text="Receipt Verification"
        className="text-3xl font-bold text-violet-700 md:text-5xl"
      />

      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-zinc-500">Status</p>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              receipt
                ? "bg-emerald-100 text-emerald-700"
                : error
                  ? "bg-rose-100 text-rose-700"
                  : "bg-zinc-100 text-zinc-600"
            }`}>
            {receipt ? "Verified" : error ? "Not Verified" : "Pending"}
          </span>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Receipt ID</span>
          <input
            className="rounded-xl border border-zinc-300 px-3 py-2 outline-none ring-violet-300 focus:ring"
            value={receiptId}
            onChange={(event) => setReceiptId(event.target.value)}
            placeholder="যেমন: a1b2c3d4e5f6"
          />
        </label>

        <button
          type="button"
          onClick={() => void verifyReceipt()}
          disabled={loading}
          className="rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
          {loading ? "Verifying..." : "Verify Receipt"}
        </button>

        {error && (
          <p className="rounded-xl bg-rose-100 p-3 text-rose-700">{error}</p>
        )}
      </section>

      {receipt && (
        <section className="space-y-4">
          <div
            id="verification-certificate"
            className="rounded-2xl border border-emerald-300 bg-linear-to-br from-emerald-50 to-cyan-50 p-5">
            <p className="text-sm font-semibold text-emerald-700">
              Verification Certificate
            </p>
            <h2 className="mt-1 text-2xl font-bold text-emerald-900">
              Receipt Verified
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              Receipt ID: {receipt.id}
            </p>
            <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
              <p>
                <span className="font-medium">Challenge:</span>{" "}
                {receipt.challengeTitle}
              </p>
              <p>
                <span className="font-medium">সালামি দিবেন:</span>{" "}
                {receipt.creatorName}
              </p>
              <p>
                <span className="font-medium">সালামি পাবেন:</span>{" "}
                {receipt.playerName}
              </p>
              <p>
                <span className="font-medium">Payout:</span> ৳{receipt.payout}
              </p>
              <p>
                <span className="font-medium">Score:</span> {receipt.percentage}
                % ({receipt.correctAnswers}/{receipt.totalQuestions})
              </p>
              <p>
                <span className="font-medium">Issued:</span>{" "}
                {new Date(receipt.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void downloadVerificationPng()}
              className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">
              Download Certificate PNG
            </button>
            <Link
              href={`/play/${receipt.challengeId}`}
              className="rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700">
              Go To Challenge
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

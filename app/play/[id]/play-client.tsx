"use client";

import { toPng } from "html-to-image";
import { useEffect, useRef, useState } from "react";
import ReactBitsSplitText from "@/components/reactbits-split-text";

type PublicChallenge = {
  id: string;
  title: string;
  creatorName: string;
  maxAmount: number;
  isClosed: boolean;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
  }>;
};

type ResultPayload = {
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

type LeaderboardItem = {
  id: string;
  playerName: string;
  payout: number;
  percentage: number;
};

export default function PlayClient({ challengeId }: { challengeId: string }) {
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<PublicChallenge | null>(null);
  const [error, setError] = useState<string>("");
  const [playerName, setPlayerName] = useState("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/challenges/${challengeId}`);
        const data = (await response.json()) as PublicChallenge | { error: string };
        if (!response.ok) {
          setError("Challenge পাওয়া যায়নি।");
          return;
        }
        setChallenge(data as PublicChallenge);
        setAnswers(new Array((data as PublicChallenge).questions.length).fill(-1));
        const boardResponse = await fetch(`/api/challenges/${challengeId}/leaderboard`);
        const boardData = (await boardResponse.json()) as { leaderboard?: LeaderboardItem[] };
        if (boardResponse.ok && boardData.leaderboard) {
          setLeaderboard(boardData.leaderboard);
        }
      } catch {
        setError("ডেটা লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [challengeId]);

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (challenge?.isClosed) {
      setError("Challenge is closed.");
      return;
    }
    if (!playerName.trim()) {
      setError("আপনার নাম লিখুন।");
      return;
    }
    if (answers.some((answer) => answer < 0)) {
      setError("সব প্রশ্নের উত্তর দিন।");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/challenges/${challengeId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName,
          answers,
        }),
      });
      const data = (await response.json()) as ResultPayload | { error: string };
      if (!response.ok) {
        setError((data as { error?: string }).error ?? "Submit করা যায়নি।");
        return;
      }
      setResult(data as ResultPayload);
      const boardResponse = await fetch(`/api/challenges/${challengeId}/leaderboard`);
      const boardData = (await boardResponse.json()) as { leaderboard?: LeaderboardItem[] };
      if (boardResponse.ok && boardData.leaderboard) {
        setLeaderboard(boardData.leaderboard);
      }
    } catch {
      setError("Submit করার সময় সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    if (!receiptRef.current || !result) {
      return;
    }
    const dataUrl = await toPng(receiptRef.current, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `salami-receipt-${challengeId}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <ReactBitsSplitText
        text="Salami Challenge Play"
        className="text-3xl font-bold text-violet-700 md:text-5xl"
      />

      {loading && <p className="rounded-xl bg-white p-4">লোড হচ্ছে...</p>}
      {error && <p className="rounded-xl bg-rose-100 p-4 text-rose-700">{error}</p>}

      {challenge && !result && (
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Creator: {challenge.creatorName}</p>
          <h1 className="text-2xl font-semibold">{challenge.title}</h1>
          <p className="text-sm">
            Highest Amount: <span className="font-semibold">৳{challenge.maxAmount}</span>
          </p>
          {challenge.isClosed && (
            <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700">
              এই challenge বন্ধ করা হয়েছে। নতুন submit নেওয়া হচ্ছে না।
            </p>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">আপনার নাম</span>
            <input
              className="rounded-xl border border-zinc-300 px-3 py-2 outline-none ring-violet-300 focus:ring"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="নাম লিখুন"
            />
          </label>

          <div className="space-y-4">
            {challenge.questions.map((question, qIndex) => (
              <div key={question.id} className="rounded-xl border border-zinc-200 p-4">
                <p className="font-medium">
                  {qIndex + 1}. {question.question}
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {question.options.map((option, optionIndex) => {
                    const active = answers[qIndex] === optionIndex;
                    return (
                      <button
                        type="button"
                        key={`${question.id}-${optionIndex}`}
                        className={`rounded-lg border px-3 py-2 text-left transition ${
                          active
                            ? "border-violet-500 bg-violet-100"
                            : "border-zinc-300 hover:bg-zinc-50"
                        }`}
                        onClick={() => handleSelect(qIndex, optionIndex)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || challenge.isClosed}
            aria-disabled={loading || challenge.isClosed}
            className="rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            Submit Answers
          </button>
        </section>
      )}

      {!!leaderboard.length && (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Top Players</h3>
          <div className="mt-3 space-y-2">
            {leaderboard.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2"
              >
                <p className="font-medium">
                  #{index + 1} {item.playerName}
                </p>
                <p className="text-sm">
                  ৳{item.payout} ({item.percentage}%)
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {result && (
        <section className="space-y-4">
          <div
            ref={receiptRef}
            className="rounded-2xl border border-violet-300 bg-linear-to-br from-violet-600 via-indigo-600 to-fuchsia-600 p-6 text-white shadow-xl"
          >
            <p className="text-sm uppercase tracking-widest text-violet-100">Salami Receipt</p>
            <p className="mt-1 text-xs text-violet-100/90">Receipt ID: {result.id}</p>
            <h2 className="mt-2 text-2xl font-bold">{result.challengeTitle}</h2>
            <p className="mt-1 text-violet-100">Player: {result.playerName}</p>
            <p className="text-violet-100">Creator: {result.creatorName}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/15 p-3">Correct: {result.correctAnswers}</div>
              <div className="rounded-xl bg-white/15 p-3">Total: {result.totalQuestions}</div>
              <div className="rounded-xl bg-white/15 p-3">Score: {result.percentage}%</div>
              <div className="rounded-xl bg-white/15 p-3">Max: ৳{result.maxAmount}</div>
            </div>

            <div className="mt-6 rounded-xl bg-black/20 p-4 text-center">
              <p className="text-sm text-violet-100">Payable Salami</p>
              <p className="text-4xl font-extrabold">৳{result.payout}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void downloadReceipt()}
            className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Receipt PNG Download
          </button>
          <a
            href={`/receipt?rid=${result.id}`}
            className="inline-block rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Verify This Receipt
          </a>
        </section>
      )}
    </main>
  );
}

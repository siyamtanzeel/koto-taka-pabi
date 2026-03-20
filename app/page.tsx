"use client";

import { useState } from "react";
import ReactBitsSplitText from "@/components/reactbits-split-text";

type DraftQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export default function Home() {
  const [title, setTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [maxAmount, setMaxAmount] = useState(1000);
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    { question: "", options: ["", "", "", ""], correctIndex: 0 },
  ]);
  const [shareLink, setShareLink] = useState("");
  const [manageLink, setManageLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { question: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  };

  const updateQuestion = (index: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, question: value } : q)),
    );
  };

  const updateOption = (qIndex: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) {
          return q;
        }
        const options = [...q.options];
        options[optionIndex] = value;
        return { ...q, options };
      }),
    );
  };

  const updateCorrect = (qIndex: number, value: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, correctIndex: value } : q)),
    );
  };

  const createChallenge = async () => {
    setError("");
    setShareLink("");
    setManageLink("");

    if (!title.trim() || !creatorName.trim() || maxAmount <= 0) {
      setError("Title, creator name, amount ঠিকভাবে দিন।");
      return;
    }

    if (
      questions.some(
        (q) => !q.question.trim() || q.options.some((o) => !o.trim()),
      )
    ) {
      setError("সব প্রশ্ন ও ৪টা option পূরণ করুন।");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          creatorName,
          maxAmount,
          questions,
        }),
      });

      const data = (await response.json()) as {
        shareLink?: string;
        manageLink?: string;
        error?: string;
      };
      if (!response.ok || !data.shareLink) {
        setError(data.error ?? "Challenge create করা যায়নি।");
        return;
      }

      setShareLink(`${window.location.origin}${data.shareLink}`);
      if (data.manageLink) {
        setManageLink(`${window.location.origin}${data.manageLink}`);
      }
    } catch {
      setError("Network সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <ReactBitsSplitText
        text="Salami koto pabi?"
        className="text-3xl font-bold text-violet-700 md:text-5xl"
      />
      <p className="text-zinc-600">
        Question তৈরি করুন, link share করুন, আর score percentage অনুযায়ী salami
        payout হিসাব হবে।
      </p>

      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Challenge Title</span>
          <input
            className="rounded-xl border border-zinc-300 px-3 py-2 outline-none ring-violet-300 focus:ring"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="যেমন: Eid Salami Quiz"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Creator Name</span>
            <input
              className="rounded-xl border border-zinc-300 px-3 py-2 outline-none ring-violet-300 focus:ring"
              value={creatorName}
              onChange={(event) => setCreatorName(event.target.value)}
              placeholder="আপনার নাম"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Highest Amount (৳)</span>
            <input
              className="rounded-xl border border-zinc-300 px-3 py-2 outline-none ring-violet-300 focus:ring"
              type="number"
              min={1}
              value={maxAmount}
              onChange={(event) => setMaxAmount(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="space-y-4">
          {questions.map((question, qIndex) => (
            <div
              key={`q-${qIndex}`}
              className="rounded-xl border border-zinc-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">Question {qIndex + 1}</p>
                <select
                  className="rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                  value={question.correctIndex}
                  onChange={(event) =>
                    updateCorrect(qIndex, Number(event.target.value))
                  }>
                  <option value={0}>Correct: Option 1</option>
                  <option value={1}>Correct: Option 2</option>
                  <option value={2}>Correct: Option 3</option>
                  <option value={3}>Correct: Option 4</option>
                </select>
              </div>
              <input
                className="mb-3 w-full rounded-xl border border-zinc-300 px-3 py-2 outline-none ring-violet-300 focus:ring"
                value={question.question}
                onChange={(event) => updateQuestion(qIndex, event.target.value)}
                placeholder="প্রশ্ন লিখুন"
              />
              <div className="grid gap-2 md:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <input
                    key={`o-${qIndex}-${optionIndex}`}
                    className="rounded-lg border border-zinc-300 px-3 py-2 outline-none ring-violet-300 focus:ring"
                    value={option}
                    onChange={(event) =>
                      updateOption(qIndex, optionIndex, event.target.value)
                    }
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addQuestion}
            className="rounded-xl bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700">
            + Add Question
          </button>
          <button
            type="button"
            onClick={() => void createChallenge()}
            disabled={loading}
            className="rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
            {loading ? "Creating..." : "Create & Generate Link"}
          </button>
        </div>

        {error && (
          <p className="rounded-xl bg-rose-100 p-3 text-rose-700">{error}</p>
        )}
        {shareLink && (
          <div className="rounded-xl bg-emerald-100 p-3">
            <p className="font-medium text-emerald-800">Share this link:</p>
            <a
              className="break-all text-emerald-900 underline"
              href={shareLink}>
              {shareLink}
            </a>
            {manageLink && (
              <>
                <p className="mt-3 font-medium text-amber-800">
                  Admin manage link (secret):
                </p>
                <a
                  className="break-all text-amber-900 underline"
                  href={manageLink}>
                  {manageLink}
                </a>
              </>
            )}
          </div>
        )}
      </section>
      <footer className="text-slate-500">
        All rights reserved by{" "}
        <a
          href="https://www.facebook.com/siyamtanzeel"
          target="_blank"
          className="text-slate-900">
          Muhammad Tanzeel
        </a>
      </footer>
    </main>
  );
}

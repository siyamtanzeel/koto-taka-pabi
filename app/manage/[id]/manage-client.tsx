"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactBitsSplitText from "@/components/reactbits-split-text";

type AdminChallenge = {
  id: string;
  title: string;
  creatorName: string;
  maxAmount: number;
  isClosed: boolean;
};

export default function ManageChallengeClient({ challengeId }: { challengeId: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [challenge, setChallenge] = useState<AdminChallenge | null>(null);

  const [title, setTitle] = useState("");
  const [maxAmount, setMaxAmount] = useState(0);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (!challengeId || !token) {
      return;
    }

    const loadChallenge = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/challenges/${challengeId}/admin?token=${encodeURIComponent(token)}`);
        const data = (await response.json()) as AdminChallenge | { error?: string };
        if (!response.ok) {
          setError((data as { error?: string }).error ?? "Unauthorized");
          return;
        }
        const payload = data as AdminChallenge;
        setChallenge(payload);
        setTitle(payload.title);
        setMaxAmount(payload.maxAmount);
        setIsClosed(payload.isClosed);
      } catch {
        setError("Manage data load করা যায়নি।");
      } finally {
        setLoading(false);
      }
    };

    void loadChallenge();
  }, [challengeId, token]);

  const saveChanges = async () => {
    if (!challengeId || !token) {
      setError("Missing token.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/challenges/${challengeId}/admin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          title,
          maxAmount,
          isClosed,
        }),
      });
      const data = (await response.json()) as AdminChallenge | { error?: string };
      if (!response.ok) {
        setError((data as { error?: string }).error ?? "Update failed.");
        return;
      }

      const payload = data as AdminChallenge;
      setChallenge(payload);
      setMessage("Challenge updated successfully.");
    } catch {
      setError("Update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <ReactBitsSplitText
        text="Challenge Admin Manage"
        className="text-3xl font-bold text-amber-700 md:text-5xl"
      />

      {!token && <p className="rounded-xl bg-rose-100 p-4 text-rose-700">Manage token missing.</p>}

      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        {loading && <p>লোড হচ্ছে...</p>}
        {error && <p className="rounded-xl bg-rose-100 p-3 text-rose-700">{error}</p>}
        {message && <p className="rounded-xl bg-emerald-100 p-3 text-emerald-700">{message}</p>}

        {challenge && (
          <>
            <p className="text-sm text-zinc-500">Creator: {challenge.creatorName}</p>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Title</span>
              <input
                className="rounded-xl border border-zinc-300 px-3 py-2 outline-none ring-amber-300 focus:ring"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Highest Amount (৳)</span>
              <input
                type="number"
                min={1}
                className="rounded-xl border border-zinc-300 px-3 py-2 outline-none ring-amber-300 focus:ring"
                value={maxAmount}
                onChange={(event) => setMaxAmount(Number(event.target.value))}
              />
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isClosed} onChange={(event) => setIsClosed(event.target.checked)} />
              <span className="text-sm font-medium">Close challenge (block new submissions)</span>
            </label>

            <button
              type="button"
              onClick={() => void saveChanges()}
              disabled={loading}
              className="rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Save Changes
            </button>
          </>
        )}
      </section>
    </main>
  );
}

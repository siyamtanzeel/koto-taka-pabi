import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ChallengeQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

export type Challenge = {
  id: string;
  title: string;
  creatorName: string;
  maxAmount: number;
  questions: ChallengeQuestion[];
  isClosed: boolean;
  adminToken: string;
  createdAt: string;
};

export type PublicChallenge = Omit<Challenge, "questions" | "adminToken"> & {
  questions: Array<Omit<ChallengeQuestion, "correctIndex">>;
};

export type AdminChallenge = Omit<Challenge, "questions" | "adminToken"> & {
  questions: ChallengeQuestion[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "challenges.json");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

export type Submission = {
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

let cache: Map<string, Challenge> | null = null;
let submissionCache: Submission[] | null = null;

async function loadChallenges() {
  if (cache) {
    return cache;
  }

  try {
    const content = await readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as Challenge[];
    cache = new Map(parsed.map((item) => [item.id, item]));
    return cache;
  } catch {
    cache = new Map();
    return cache;
  }
}

async function saveChallenges(challenges: Map<string, Challenge>) {
  await mkdir(DATA_DIR, { recursive: true });
  const payload = JSON.stringify(Array.from(challenges.values()), null, 2);
  await writeFile(DATA_FILE, payload, "utf-8");
}

async function loadSubmissions() {
  if (submissionCache) {
    return submissionCache;
  }

  try {
    const content = await readFile(SUBMISSIONS_FILE, "utf-8");
    submissionCache = JSON.parse(content) as Submission[];
    return submissionCache;
  } catch {
    submissionCache = [];
    return submissionCache;
  }
}

async function saveSubmissions(submissions: Submission[]) {
  await mkdir(DATA_DIR, { recursive: true });
  const payload = JSON.stringify(submissions, null, 2);
  await writeFile(SUBMISSIONS_FILE, payload, "utf-8");
}

export async function createChallenge(input: {
  title: string;
  creatorName: string;
  maxAmount: number;
  questions: ChallengeQuestion[];
}) {
  const challenges = await loadChallenges();
  const id = crypto.randomUUID().slice(0, 8);

  const challenge: Challenge = {
    id,
    title: input.title,
    creatorName: input.creatorName,
    maxAmount: input.maxAmount,
    questions: input.questions,
    isClosed: false,
    adminToken: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  challenges.set(id, challenge);
  await saveChallenges(challenges);
  return challenge;
}

export async function getChallenge(id: string) {
  const challenges = await loadChallenges();
  return challenges.get(id);
}

export async function getPublicChallenge(id: string): Promise<PublicChallenge | null> {
  const challenges = await loadChallenges();
  const challenge = challenges.get(id);
  if (!challenge) {
    return null;
  }

  return {
    id: challenge.id,
    title: challenge.title,
    creatorName: challenge.creatorName,
    maxAmount: challenge.maxAmount,
    isClosed: challenge.isClosed,
    createdAt: challenge.createdAt,
    questions: challenge.questions.map((question) => ({
      id: question.id,
      question: question.question,
      options: question.options,
    })),
  };
}

export async function getAdminChallenge(id: string, adminToken: string): Promise<AdminChallenge | null> {
  const challenge = await getChallenge(id);
  if (!challenge || challenge.adminToken !== adminToken) {
    return null;
  }

  return {
    id: challenge.id,
    title: challenge.title,
    creatorName: challenge.creatorName,
    maxAmount: challenge.maxAmount,
    questions: challenge.questions,
    isClosed: challenge.isClosed,
    createdAt: challenge.createdAt,
  };
}

export async function gradeChallenge(id: string, answers: number[]) {
  const challenges = await loadChallenges();
  const challenge = challenges.get(id);
  if (!challenge) {
    return { error: "not_found" as const };
  }

  if (challenge.isClosed) {
    return { error: "closed" as const };
  }

  const totalQuestions = challenge.questions.length;
  const correctAnswers = challenge.questions.reduce((total, question, index) => {
    return total + (answers[index] === question.correctIndex ? 1 : 0);
  }, 0);

  const percentage = totalQuestions === 0 ? 0 : (correctAnswers / totalQuestions) * 100;
  const payout = (percentage / 100) * challenge.maxAmount;

  return {
    challenge,
    totalQuestions,
    correctAnswers,
    percentage,
    payout,
  };
}

export async function createSubmission(input: {
  challengeId: string;
  playerName: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  payout: number;
}) {
  const challenge = await getChallenge(input.challengeId);
  if (!challenge) {
    return { error: "challenge_not_found" as const };
  }

  if (challenge.isClosed) {
    return { error: "challenge_closed" as const };
  }

  const submissions = await loadSubmissions();
  const normalizedPlayer = input.playerName.trim().toLowerCase();
  const duplicate = submissions.some(
    (item) => item.challengeId === input.challengeId && item.playerName.trim().toLowerCase() === normalizedPlayer,
  );
  if (duplicate) {
    return { error: "duplicate_player" as const };
  }

  const submission: Submission = {
    id: crypto.randomUUID().slice(0, 12),
    challengeId: challenge.id,
    challengeTitle: challenge.title,
    creatorName: challenge.creatorName,
    playerName: input.playerName.trim(),
    maxAmount: challenge.maxAmount,
    totalQuestions: input.totalQuestions,
    correctAnswers: input.correctAnswers,
    percentage: Number(input.percentage.toFixed(2)),
    payout: Number(input.payout.toFixed(2)),
    generatedAt: new Date().toISOString(),
  };

  submissions.push(submission);
  await saveSubmissions(submissions);
  return { submission };
}

export async function getLeaderboard(challengeId: string, limit = 10) {
  const submissions = await loadSubmissions();
  return submissions
    .filter((item) => item.challengeId === challengeId)
    .sort((a, b) => {
      if (b.payout !== a.payout) {
        return b.payout - a.payout;
      }
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      return new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
    })
    .slice(0, limit);
}

export async function getSubmissionById(id: string) {
  const submissions = await loadSubmissions();
  return submissions.find((item) => item.id === id) ?? null;
}

export async function updateChallengeByAdmin(
  id: string,
  adminToken: string,
  updates: {
    title?: string;
    maxAmount?: number;
    isClosed?: boolean;
  },
) {
  const challenges = await loadChallenges();
  const challenge = challenges.get(id);
  if (!challenge || challenge.adminToken !== adminToken) {
    return null;
  }

  if (typeof updates.title === "string" && updates.title.trim()) {
    challenge.title = updates.title.trim();
  }
  if (typeof updates.maxAmount === "number" && Number.isFinite(updates.maxAmount) && updates.maxAmount > 0) {
    challenge.maxAmount = updates.maxAmount;
  }
  if (typeof updates.isClosed === "boolean") {
    challenge.isClosed = updates.isClosed;
  }

  challenges.set(id, challenge);
  await saveChallenges(challenges);
  return challenge;
}

import { NextResponse } from "next/server";
import { createChallenge } from "@/lib/challenge-store";

type IncomingQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    creatorName?: string;
    maxAmount?: number;
    questions?: IncomingQuestion[];
  };

  if (!body.title || !body.creatorName || !body.maxAmount || !Array.isArray(body.questions)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const questions = body.questions
    .map((item, index) => ({
      id: `q-${index + 1}`,
      question: item.question?.trim(),
      options: item.options?.map((opt) => opt.trim()),
      correctIndex: item.correctIndex,
    }))
    .filter(
      (item) =>
        item.question &&
        Array.isArray(item.options) &&
        item.options.length === 4 &&
        item.options.every(Boolean) &&
        Number.isInteger(item.correctIndex) &&
        item.correctIndex >= 0 &&
        item.correctIndex <= 3,
    );

  if (questions.length === 0) {
    return NextResponse.json({ error: "At least one valid question is required." }, { status: 400 });
  }

  const challenge = await createChallenge({
    title: body.title.trim(),
    creatorName: body.creatorName.trim(),
    maxAmount: Number(body.maxAmount),
    questions,
  });

  return NextResponse.json({
    id: challenge.id,
    shareLink: `/play/${challenge.id}`,
    manageLink: `/manage/${challenge.id}?token=${challenge.adminToken}`,
  });
}

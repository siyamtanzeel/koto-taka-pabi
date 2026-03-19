import { NextResponse } from "next/server";
import { createSubmission, gradeChallenge } from "@/lib/challenge-store";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    playerName?: string;
    answers?: number[];
  };

  if (!body.playerName || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const result = await gradeChallenge(id, body.answers);
  if ("error" in result) {
    if (result.error === "closed") {
      return NextResponse.json({ error: "Challenge is closed." }, { status: 403 });
    }
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  const submission = await createSubmission({
    challengeId: id,
    playerName: body.playerName,
    totalQuestions: result.totalQuestions,
    correctAnswers: result.correctAnswers,
    percentage: result.percentage,
    payout: result.payout,
  });

  if ("error" in submission) {
    if (submission.error === "duplicate_player") {
      return NextResponse.json(
        { error: "This player already submitted for this challenge." },
        { status: 409 },
      );
    }
    if (submission.error === "challenge_closed") {
      return NextResponse.json({ error: "Challenge is closed." }, { status: 403 });
    }
    return NextResponse.json({ error: "Could not save submission." }, { status: 500 });
  }

  return NextResponse.json(submission.submission);
}

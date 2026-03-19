import { NextResponse } from "next/server";
import { getChallenge, getLeaderboard } from "@/lib/challenge-store";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await context.params;
  const challenge = await getChallenge(id);

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  const leaderboard = await getLeaderboard(id, 10);
  return NextResponse.json({ leaderboard });
}

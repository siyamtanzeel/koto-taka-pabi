import { NextResponse } from "next/server";
import { getPublicChallenge } from "@/lib/challenge-store";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await context.params;
  const challenge = await getPublicChallenge(id);

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  return NextResponse.json(challenge);
}

import { NextResponse } from "next/server";
import { getAdminChallenge, updateChallengeByAdmin } from "@/lib/challenge-store";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 401 });
  }

  const challenge = await getAdminChallenge(id, token);
  if (!challenge) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json(challenge);
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    token?: string;
    title?: string;
    maxAmount?: number;
    isClosed?: boolean;
  };

  if (!body.token) {
    return NextResponse.json({ error: "Missing token." }, { status: 401 });
  }

  const updated = await updateChallengeByAdmin(id, body.token, {
    title: body.title,
    maxAmount: body.maxAmount,
    isClosed: body.isClosed,
  });

  if (!updated) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    creatorName: updated.creatorName,
    maxAmount: updated.maxAmount,
    isClosed: updated.isClosed,
  });
}

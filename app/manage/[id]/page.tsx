import ManageChallengeClient from "./manage-client";

export default async function ManageChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ManageChallengeClient challengeId={id} />;
}

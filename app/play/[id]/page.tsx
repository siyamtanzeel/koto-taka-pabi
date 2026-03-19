import PlayClient from "./play-client";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlayClient challengeId={id} />;
}

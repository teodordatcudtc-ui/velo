import { notFound } from "next/navigation";
import { DemoVideoPlayer } from "./DemoVideoPlayer";

export default async function DemoVideoPage({
  searchParams,
}: {
  searchParams: Promise<{ autoplay?: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_VIDEO_ENABLED !== "1") {
    notFound();
  }

  const params = await searchParams;
  const autoplay = params.autoplay === "1" || params.autoplay === "true";

  return <DemoVideoPlayer autoplay={autoplay} fillScreen={autoplay} />;
}

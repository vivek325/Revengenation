import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface FeaturedVideo {
  id: string;
  url: string;
  title: string;
}

export async function GET() {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "featured_videos")
    .maybeSingle();

  if (!data?.value) return NextResponse.json({ videos: [] });

  try {
    const videos: FeaturedVideo[] = JSON.parse(data.value);
    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json({ videos: [] });
  }
}

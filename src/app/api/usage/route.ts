import { NextRequest, NextResponse } from "next/server";
import { fetchUsageReport } from "@/lib/anthropic-admin";
import { DEFAULT_DAYS } from "@/lib/constants";
import { getDateRange } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const days = parseInt(searchParams.get("days") ?? String(DEFAULT_DAYS));
    const bucketWidth =
      (searchParams.get("bucket_width") as "1d" | "1h" | "1m") ?? "1d";
    const groupBy = searchParams.getAll("group_by");

    const { start, end } = getDateRange(days);

    const data = await fetchUsageReport({
      start_date: start,
      end_date: end,
      bucket_width: bucketWidth,
      group_by:
        groupBy.length > 0
          ? (groupBy as ("model" | "api_key_id" | "workspace_id")[])
          : ["model"],
    });

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

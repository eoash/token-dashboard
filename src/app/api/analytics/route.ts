import { NextRequest, NextResponse } from "next/server";
import { fetchAnalytics, getDataSource } from "@/lib/data-source";
import { DEFAULT_DAYS } from "@/lib/constants";
import { getDateRange } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const days = parseInt(searchParams.get("days") ?? String(DEFAULT_DAYS));
    const date = searchParams.get("date");

    let start_date: string;
    let end_date: string;

    if (date) {
      start_date = date;
      end_date = date;
    } else {
      const range = getDateRange(days);
      start_date = range.start;
      end_date = range.end;
    }

    const groupBy = searchParams.getAll("group_by");

    const data = await fetchAnalytics({
      start_date,
      end_date,
      group_by:
        groupBy.length > 0
          ? (groupBy as ("actor" | "model" | "date")[])
          : ["actor", "model", "date"],
    });

    return NextResponse.json({
      ...data,
      _source: getDataSource(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

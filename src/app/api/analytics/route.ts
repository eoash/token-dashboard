import { NextRequest, NextResponse } from "next/server";
import { fetchAnalytics, getDataSource } from "@/lib/data-source";
import { DEFAULT_DAYS, EXCLUDED_EMAILS } from "@/lib/constants";
import { getDateRange } from "@/lib/utils";

const VALID_GROUP_BY = ["actor", "model", "date"] as const;
type GroupByValue = typeof VALID_GROUP_BY[number];

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.DASHBOARD_API_SECRET;
  if (!secret) return true; // 미설정 시 개발 환경으로 간주
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function parseGroupBy(raw: string[]): GroupByValue[] {
  const valid = raw.filter((v): v is GroupByValue =>
    (VALID_GROUP_BY as readonly string[]).includes(v)
  );
  return valid.length > 0 ? valid : ["actor", "model", "date"];
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const days = parseInt(searchParams.get("days") ?? String(DEFAULT_DAYS));
    const date = searchParams.get("date");

    let start_date: string;
    let end_date: string;

    if (startParam && endParam) {
      start_date = startParam;
      end_date = endParam;
    } else if (date) {
      start_date = date;
      end_date = date;
    } else {
      const range = getDateRange(days);
      start_date = range.start;
      end_date = range.end;
    }

    const groupBy = parseGroupBy(searchParams.getAll("group_by"));

    const raw = await fetchAnalytics({ start_date, end_date, group_by: groupBy });
    const data = raw.data.filter(
      (d) => !EXCLUDED_EMAILS.has(d.actor.email_address ?? "")
    );

    return NextResponse.json({
      data,
      _source: getDataSource(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

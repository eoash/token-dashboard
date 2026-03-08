import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_BACKFILL_TOKEN;
const REPO = "eoash/token-dashboard";
const BRANCH = "main";

export async function POST(req: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "GITHUB_BACKFILL_TOKEN not configured" },
      { status: 500 }
    );
  }

  let body: { email: string; data: unknown[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.email || !Array.isArray(body.data) || body.data.length === 0) {
    return NextResponse.json(
      { error: "Missing email or empty data array" },
      { status: 400 }
    );
  }

  // 이메일에서 username 추출 (파일명용)
  const raw = body.email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "_");
  const username = raw.replace(/\.\./g, "_");
  if (!username || username.length > 64) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const filePath = `src/lib/backfill/${username}.json`;

  // 기존 파일 읽기 (SHA + 기존 데이터)
  let sha: string | undefined;
  let existingData: Record<string, unknown>[] = [];
  try {
    const existing = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${filePath}?ref=${BRANCH}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
    );
    if (existing.ok) {
      const json = await existing.json();
      sha = json.sha;
      const decoded = Buffer.from(json.content, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed.data)) {
        existingData = parsed.data;
      }
    }
  } catch {
    // 파일 없음 — 새로 생성
  }

  // date+model 키로 merge (새 데이터가 기존 데이터를 덮어씀)
  const merged = new Map<string, unknown>();
  for (const d of existingData) {
    const rec = d as Record<string, unknown>;
    const key = `${rec.date}|${rec.model}`;
    merged.set(key, rec);
  }
  for (const d of body.data) {
    const rec = d as Record<string, unknown>;
    const key = `${rec.date}|${rec.model}`;
    merged.set(key, rec);
  }
  const mergedArray = Array.from(merged.values())
    .filter((d) => (d as Record<string, unknown>).model !== "<synthetic>")
    .sort((a, b) => {
      const da = a as Record<string, string>;
      const db = b as Record<string, string>;
      return da.date < db.date ? -1 : da.date > db.date ? 1
        : da.model < db.model ? -1 : da.model > db.model ? 1 : 0;
    });

  const content = JSON.stringify({ data: mergedArray }, null, 2);
  const b64Content = Buffer.from(content).toString("base64");

  // GitHub Contents API로 커밋
  const ghBody: Record<string, string> = {
    message: `backfill: ${body.email} 데이터 ${sha ? "merge" : "추가"} (${mergedArray.length}건)`,
    content: b64Content,
    branch: BRANCH,
  };
  if (sha) ghBody.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ghBody),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error(`GitHub API error ${res.status}:`, err);
    return NextResponse.json(
      { error: `GitHub API error: ${res.status}` },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    file: filePath,
    records: mergedArray.length,
    added: body.data.length,
    existing: existingData.length,
    message: "Vercel 재배포가 자동으로 트리거됩니다.",
  });
}

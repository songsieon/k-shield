// Design Ref: §11 — 품질 측정 스크립트 (PLAN 23)
// 실행 전 개발 서버를 띄운다: npm run dev → 다른 창에서 npm run eval
// 다른 주소를 잴 때: BASE_URL=https://... npm run eval
// 일부만 잴 때: npm run eval -- I01 I04 B02
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ROOT = process.cwd();
const DONT_KNOW = "잘 모르겠어요";
const MAX_QUESTIONS = 10;

const questions = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "eval", "questions.json"), "utf8"));
const messages = fs.readFileSync(path.join(ROOT, "lib", "messages.ts"), "utf8");
const only = new Set(process.argv.slice(2));

// 데이터에 실제로 있는 조문 식별자 (지어낸 조문 검사용)
const realRefs = new Set(
  fs
    .readdirSync(path.join(ROOT, "data", "documents"))
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => {
      const doc = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "documents", f), "utf8"));
      return doc.articles.map((a) => `${doc.id}#${a.location}`);
    })
);

/** "law-cheongtak#제8조"가 "law-cheongtak#제8조(금품등의 수수 금지)"와 맞는지 (제8조의2와는 맞지 않음) */
function matches(ref, expected) {
  const [docId, prefix] = expected.split("#");
  const [refDoc, location] = [ref.slice(0, ref.indexOf("#")), ref.slice(ref.indexOf("#") + 1)];
  if (refDoc !== docId) return false;
  return /^제\d+조(의\d+)?$/.test(prefix) ? location === prefix || location.startsWith(prefix + "(") : location.startsWith(prefix);
}

// 정답표의 조항이 데이터에 실제로 있는지 먼저 확인한다 (정답표 오타 방지)
const missingExpected = [...questions.integrity, ...questions.businessRisk].flatMap((item) =>
  item.expected.filter((exp) => ![...realRefs].some((ref) => matches(ref, exp))).map((exp) => `${item.id} ${exp}`)
);
if (missingExpected.length) {
  console.error(`정답표에 데이터에 없는 조항이 있습니다:\n${missingExpected.join("\n")}`);
  process.exit(1);
}

async function post(api, body) {
  const started = Date.now();
  const res = await fetch(`${BASE_URL}/api/${api}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json(), sec: (Date.now() - started) / 1000 };
}

/** 청렴 콕!: 질문이 오면 준비한 답을 순서대로 보내고, 결과가 나오면 돌려준다 */
async function runIntegrity(item) {
  const turns = [];
  for (let step = 0; step <= MAX_QUESTIONS; step++) {
    const res = await post("integrity", { situation: item.situation, turns });
    if (res.status !== 200) return { error: res.json.error?.code ?? res.status, sec: res.sec, turns: turns.length };
    if (res.json.kind !== "question") return { ...res, turns: turns.length };
    turns.push({ question: res.json.question, answer: item.answers[turns.length] ?? DONT_KNOW });
  }
  return { error: "질문이 끝나지 않음", sec: 0, turns: turns.length };
}

/** 사업 리스크 콕!: 필수 정보 질문이 오면 준비한 답 또는 "미정"으로 답한다 */
async function runBusinessRisk(item) {
  const turns = [];
  for (let step = 0; step <= 4; step++) {
    const res = await post("business-risk", { plan: item.plan, turns });
    if (res.status !== 200) return { error: res.json.error?.code ?? res.status, sec: res.sec, turns: turns.length };
    if (res.json.kind !== "question") return { ...res, turns: turns.length };
    turns.push({ question: res.json.question, answer: item.answers[turns.length] ?? "미정이에요" });
  }
  return { error: "질문이 끝나지 않음", sec: 0, turns: turns.length };
}

const rows = [];

for (const item of questions.integrity) {
  if (only.size && !only.has(item.id)) continue;
  const run = await runIntegrity(item);
  const result = run.json?.kind === "result" ? run.json.result : null;
  const refs = result ? result.evidence.map((e) => e.ref) : [];
  rows.push({
    id: item.id,
    title: item.title,
    feature: "청렴 콕!",
    ok: refs.some((ref) => item.expected.some((exp) => matches(ref, exp))),
    hasEvidence: refs.length > 0,
    fake: refs.filter((ref) => !realRefs.has(ref)),
    sec: run.sec,
    limit: 30,
    turns: run.turns,
    verdict: result?.verdict ?? run.json?.kind ?? run.error,
    verdictOk: result ? (item.expectedVerdict ?? []).includes(result.verdict) : false,
    refs,
  });
  process.stdout.write(".");
}

for (const item of questions.businessRisk) {
  if (only.size && !only.has(item.id)) continue;
  const run = await runBusinessRisk(item);
  const report = run.json?.kind === "report" ? run.json.report : null;
  const issues = report ? report.experts.flatMap((e) => e.issues) : [];
  const refs = [...new Set(issues.flatMap((i) => i.evidence.map((e) => e.ref)))];
  rows.push({
    id: item.id,
    title: item.title,
    feature: "사업 리스크 콕!",
    ok: refs.some((ref) => item.expected.some((exp) => matches(ref, exp))),
    hasEvidence: issues.length > 0 && issues.every((i) => i.evidence.length > 0),
    fake: refs.filter((ref) => !realRefs.has(ref)),
    sec: run.sec,
    limit: 180,
    turns: run.turns,
    verdict: report ? `쟁점 ${issues.length}개` : run.json?.kind ?? run.error,
    verdictOk: true,
    refs,
  });
  process.stdout.write(".");
}

// ── 기본 점검: 개인정보 차단·정해진 문구 (성공 기준 6·7) ──
const basics = [];
if (!only.size) {
  const privacy1 = await post("integrity", { situation: "업체 담당자 010-1234-5678이 선물을 보냈어요" });
  const privacy2 = await post("business-risk", { plan: "주민번호 900101-1234567인 직원이 담당하는 사업입니다" });
  basics.push(["개인정보 차단 (청렴 콕!)", privacy1.status === 400 && privacy1.json.error?.code === "PRIVACY"]);
  basics.push(["개인정보 차단 (사업 리스크 콕!)", privacy2.status === 400 && privacy2.json.error?.code === "PRIVACY"]);
  const off = await post("integrity", { situation: "오늘 점심 메뉴 추천해 주세요" });
  basics.push(["무관 질문 문구", off.json.kind === "out_of_scope" && off.json.message === "준법 콕은 법령·청렴·윤리 점검만 도와드립니다."]);
  for (const phrase of ["검토 중입니다…", "잠시 후 다시 시도해 주세요", "근거를 찾지 못했습니다. 청렴·윤리 담당 부서에 확인하세요"]) {
    basics.push([`정해진 문구: ${phrase}`, messages.includes(phrase)]);
  }
}

// ── 보고 ──
const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : "-");
const total = rows.length;
const correct = rows.filter((r) => r.ok).length;
const shown = rows.filter((r) => r.hasEvidence).length;
const fakes = rows.flatMap((r) => r.fake);
const timeRate = (feature) => {
  const list = rows.filter((r) => r.feature === feature);
  return { n: list.filter((r) => r.sec <= r.limit).length, d: list.length, max: Math.max(0, ...list.map((r) => r.sec)) };
};
const t1 = timeRate("청렴 콕!");
const t2 = timeRate("사업 리스크 콕!");

console.log("\n\n문항별 결과");
for (const r of rows) {
  console.log(
    `${r.ok ? "✅" : "❌"} ${r.id} ${r.title} | ${r.verdict}${r.feature === "청렴 콕!" ? (r.verdictOk ? "" : " (예상 단계와 다름)") : ""} | 질문 ${r.turns}개 | ${r.sec.toFixed(1)}초`
  );
  if (!r.ok) console.log(`   근거: ${r.refs.join(" | ") || "(없음)"}`);
}

console.log("\n성공 기준");
console.log(`1. 근거 정확도      ${pct(correct, total)} (${correct}/${total}) — 목표 90% 이상 ${correct / total >= 0.9 ? "✅" : "❌"}`);
console.log(`2. 근거 표시율      ${pct(shown, total)} (${shown}/${total}) — 목표 100% ${shown === total ? "✅" : "❌"}`);
console.log(`3. 지어낸 조문      ${fakes.length}건 — 목표 0건 ${fakes.length === 0 ? "✅" : "❌"}`);
if (t1.d) console.log(`4. 청렴 콕! 30초 이내   ${pct(t1.n, t1.d)} (최대 ${t1.max.toFixed(1)}초) — 목표 90% 이상 ${t1.n / t1.d >= 0.9 ? "✅" : "❌"}`);
if (t2.d) console.log(`5. 사업 리스크 콕! 3분 이내 ${pct(t2.n, t2.d)} (최대 ${t2.max.toFixed(1)}초) — 목표 90% 이상 ${t2.n / t2.d >= 0.9 ? "✅" : "❌"}`);
for (const [name, ok] of basics) console.log(`${ok ? "✅" : "❌"} ${name}`);
const verdictRows = rows.filter((r) => r.feature === "청렴 콕!");
if (verdictRows.length) console.log(`(참고) 청렴 콕! 결과 단계가 예상과 맞음: ${pct(verdictRows.filter((r) => r.verdictOk).length, verdictRows.length)}`);

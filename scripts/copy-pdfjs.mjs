// 사업계획서 PDF를 브라우저에서 읽는 데 필요한 pdfjs 파일을 public/pdfjs 로 복사한다.
// (npm install 할 때마다 자동 실행되어 버전이 항상 맞는다)
import { cpSync, mkdirSync, rmSync } from "node:fs";

const from = "node_modules/pdfjs-dist";
const to = "public/pdfjs";

rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
cpSync(`${from}/build/pdf.worker.min.mjs`, `${to}/pdf.worker.min.mjs`);
cpSync(`${from}/cmaps`, `${to}/cmaps`, { recursive: true }); // 한글 등 CJK 글자 해석용
cpSync(`${from}/standard_fonts`, `${to}/standard_fonts`, { recursive: true });
console.log("pdfjs 파일을 public/pdfjs 에 복사했습니다.");

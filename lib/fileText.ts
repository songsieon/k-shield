// 사업계획서 파일(PDF·한글 HWP·TXT)에서 글자만 뽑는다. 브라우저에서만 실행되고 파일은 서버로 보내지 않는다.
import CFB from "cfb";

/** 받을 수 있는 파일 크기 (10MB) */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_FILE_TYPES = ".pdf,.hwp,.txt";

export class FileTextError extends Error {}

export async function extractFileText(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new FileTextError("파일이 너무 큽니다. 10MB 이하 파일만 올릴 수 있어요");
  const name = file.name.toLowerCase();
  let text: string;
  if (name.endsWith(".txt")) text = await file.text();
  else if (name.endsWith(".pdf")) text = await readPdf(file);
  else if (name.endsWith(".hwp")) text = await readHwp(file);
  else throw new FileTextError("PDF, 한글(HWP), TXT 파일만 올릴 수 있어요");

  const cleaned = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) throw new FileTextError("파일에서 글자를 찾지 못했어요. 스캔한 이미지 파일이면 내용을 직접 적어 주세요");
  return cleaned;
}

async function readPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    cMapUrl: "/pdfjs/cmaps/",
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  });
  try {
    const doc = await task.promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const content = await (await doc.getPage(i)).getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : "") : "")).join(""));
    }
    return pages.join("\n");
  } catch {
    throw new FileTextError("PDF를 읽지 못했어요. 암호가 걸린 파일인지 확인해 주세요");
  } finally {
    await task.destroy();
  }
}

/** 한글(HWP 5.0) 파일: 문서 안의 BodyText/SectionN에서 문단 글자만 꺼낸다 */
async function readHwp(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let container: CFB.CFB$Container;
  try {
    container = CFB.read(bytes, { type: "array" });
  } catch {
    // 문서보안(DRM)이 걸린 파일이나 예전 형식(HWP 3.0), HWPX는 이 형식이 아니다
    throw new FileTextError("한글 파일을 읽지 못했어요. 문서보안(DRM)이 걸렸거나 HWP 5.0이 아닌 파일은 PDF로 바꿔 올려 주세요");
  }
  const header = CFB.find(container, "FileHeader")?.content;
  if (!header) throw new FileTextError("한글(HWP 5.0) 파일이 아니에요");
  const headerBytes = Uint8Array.from(header as ArrayLike<number>);
  if ((headerBytes[36] & 0b10) !== 0) throw new FileTextError("암호가 걸린 한글 파일은 읽을 수 없어요");
  const compressed = (headerBytes[36] & 1) === 1;

  const sections = container.FullPaths.filter((p) => /BodyText\/Section\d+$/.test(p)).sort(
    (a, b) => Number(a.match(/\d+$/)?.[0]) - Number(b.match(/\d+$/)?.[0])
  );
  const lines: string[] = [];
  for (const path of sections) {
    const raw = CFB.find(container, path)?.content;
    if (!raw) continue;
    let data: Uint8Array<ArrayBufferLike> = Uint8Array.from(raw as ArrayLike<number>);
    if (compressed) data = await inflateRaw(data);
    lines.push(...paragraphTexts(data));
  }
  return lines.join("\n");
}

/**
 * 압축된 본문을 푼다. 한글 파일은 압축 데이터 뒤에 남는 바이트가 있어 브라우저가 끝에서 오류를 내므로,
 * 오류가 나기 전까지 풀린 내용은 그대로 쓴다.
 */
async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const reader = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } catch (error) {
    if (chunks.length === 0) throw error;
  }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** HWP 레코드 중 문단 글자(HWPTAG_PARA_TEXT, 67)만 UTF-16으로 읽는다 */
function paragraphTexts(data: Uint8Array): string[] {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const lines: string[] = [];
  let pos = 0;
  while (pos + 4 <= data.length) {
    const head = view.getUint32(pos, true);
    pos += 4;
    const tag = head & 0x3ff;
    let size = (head >>> 20) & 0xfff;
    if (size === 0xfff) {
      size = view.getUint32(pos, true);
      pos += 4;
    }
    if (tag === 67) {
      let text = "";
      let i = pos;
      const end = Math.min(pos + size, data.length);
      while (i + 1 < end) {
        const code = view.getUint16(i, true);
        if (code < 32) {
          // 문자 제어(줄바꿈 등)는 2바이트, 확장·인라인 제어(표·그림 등)는 16바이트를 차지한다
          if (code === 10) text += "\n";
          else if (code === 9) text += "\t";
          if ([0, 10, 13, 24, 25, 26, 27, 28, 29, 30, 31].includes(code)) i += 2;
          else i += 16;
          continue;
        }
        text += String.fromCharCode(code);
        i += 2;
      }
      lines.push(text.trimEnd());
    }
    pos += size;
  }
  return lines;
}

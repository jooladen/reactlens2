import { useState } from "react";

// ── 상수 ──────────────────────────────────────────────
const SECTION_HEADERS = {
  imports: "// 1️⃣ imports",
  utils: "// 2️⃣ 유틸 함수",
  innerComponents: "// 3️⃣ 내부 컴포넌트",
  state: "// 4️⃣ 상태",
  handlers: "// 5️⃣ 이벤트/로직",
  sideEffects: "// 6️⃣ 사이드이펙트",
  jsxReturn: "// 7️⃣ JSX 반환",
};

const MSG_EMPTY_INPUT = "코드를 입력해주세요";
const MSG_NO_SECTIONS = "파싱 결과가 없어 원본을 표시합니다";
const MSG_PARSE_ERROR = "파싱 중 오류가 발생했습니다";
const MSG_NOTHING_TO_COPY = "복사할 내용이 없습니다";
const MSG_COPY_FAIL = "복사에 실패했습니다. 직접 선택해서 복사해주세요";
const MSG_COPY_SUCCESS = "복사되었습니다!";
const MSG_PLACEHOLDER = "결과가 여기에 표시됩니다";

const HOOK_PATTERN = /^\s*(?:const|let)\s+\[.*?\]\s*=\s*use(State|Reducer)\s*\(|^\s*(?:const|let)\s+\w+\s*=\s*useRef\s*\(/;
const EFFECT_HOOKS = ["useEffect", "useLayoutEffect", "useCallback", "useMemo"];
const HANDLER_PATTERN = /^\s*(?:const|let|var)\s+(handle[A-Z]\w*|on[A-Z]\w*)\s*=|^\s*function\s+(handle[A-Z]\w*|on[A-Z]\w*)\s*\(/;
const ARROW_FN_PATTERN = /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/;
const FUNCTION_PATTERN = /^\s*(?:export\s+)?function\s+(\w+)\s*\(/;
const EXPORT_DEFAULT_PATTERN = /^\s*(?:export\s+default\s+(?:function|class)\s|function\s+\w+.*\{)/;

// ── 파서 ──────────────────────────────────────────────

function parseCode(code) {
  const lines = code.split("\n");
  const sections = {
    imports: [],
    utils: [],
    innerComponents: [],
    state: [],
    handlers: [],
    sideEffects: [],
    jsxReturn: [],
  };

  // 1️⃣ imports 수집
  for (const line of lines) {
    if (/^\s*import\s+/.test(line)) {
      sections.imports.push(line);
    }
  }

  // export default 컴포넌트 범위 파악
  let exportDefaultStart = -1;
  let exportDefaultEnd = -1;
  let braceDepth = 0;
  let insideExportDefault = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (
      !insideExportDefault &&
      /^\s*(?:export\s+default\s+function|const\s+\w+\s*=.*=>\s*\{)/.test(line)
    ) {
      exportDefaultStart = i;
      insideExportDefault = true;
      braceDepth = 0;
    }

    if (insideExportDefault) {
      for (const ch of line) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
      }
      if (braceDepth <= 0 && exportDefaultStart !== i) {
        exportDefaultEnd = i;
        break;
      }
    }
  }

  // export default 범위 밖 함수 → 2️⃣ 유틸 함수
  // export default 범위 안의 분석
  const outsideLines = [];
  const insideLines = [];

  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s+/.test(lines[i])) continue;
    if (
      exportDefaultStart >= 0 &&
      i >= exportDefaultStart &&
      i <= exportDefaultEnd
    ) {
      insideLines.push({ idx: i, line: lines[i] });
    } else {
      outsideLines.push({ idx: i, line: lines[i] });
    }
  }

  // 2️⃣ 유틸 함수 (export default 밖, JSX 미반환)
  collectFunctions(outsideLines, lines, sections.utils, false);

  // export default 내부 분석
  if (insideLines.length > 0) {
    // 4️⃣ 상태
    for (const { line } of insideLines) {
      if (HOOK_PATTERN.test(line)) {
        sections.state.push(line.trim());
      }
    }

    // 5️⃣ 이벤트/로직 핸들러
    for (const { line } of insideLines) {
      if (HANDLER_PATTERN.test(line)) {
        const name = extractFnName(line);
        sections.handlers.push(`${line.trim().split("{")[0].trim()} { /* ... */ }`);
      }
    }

    // 6️⃣ 사이드이펙트
    for (let j = 0; j < insideLines.length; j++) {
      const { line, idx } = insideLines[j];
      for (const hook of EFFECT_HOOKS) {
        const hookRegex = new RegExp(`^\\s*${hook}\\s*\\(`);
        if (hookRegex.test(line)) {
          const deps = extractDeps(lines, idx);
          sections.sideEffects.push(`${hook}(... , ${deps});`);
        }
      }
    }

    // 3️⃣ 내부 컴포넌트 (export default 안에서 JSX 반환하는 내부 함수)
    collectInnerComponents(insideLines, lines, sections.innerComponents);

    // 7️⃣ JSX 반환 (메인 return)
    const returnIdx = findMainReturn(insideLines);
    if (returnIdx >= 0) {
      sections.jsxReturn.push("return ( /* ... */ );");
    }
  }

  return sections;
}

function collectFunctions(lineEntries, allLines, target, checkJSX) {
  for (const { idx, line } of lineEntries) {
    const fnMatch = FUNCTION_PATTERN.exec(line) || ARROW_FN_PATTERN.exec(line);
    if (fnMatch && !/^\s*export\s+default/.test(line)) {
      const sig = line.trim().split("{")[0].trim();
      target.push(`${sig} { /* ... */ }`);
    }
  }
}

function collectInnerComponents(lineEntries, allLines, target) {
  for (const { idx, line } of lineEntries) {
    if (idx === lineEntries[0]?.idx) continue; // skip export default line itself

    const fnMatch = FUNCTION_PATTERN.exec(line) || ARROW_FN_PATTERN.exec(line);
    if (!fnMatch) continue;
    if (HANDLER_PATTERN.test(line)) continue;

    // 함수 본문에 JSX가 있는지 확인
    let depth = 0;
    let hasJSX = false;
    for (let k = idx; k < allLines.length; k++) {
      for (const ch of allLines[k]) {
        if (ch === "{") depth++;
        if (ch === "}") depth--;
      }
      if (/<\w+[\s/>]/.test(allLines[k])) {
        hasJSX = true;
      }
      if (depth <= 0 && k > idx) break;
    }

    if (hasJSX) {
      const sig = line.trim().split("{")[0].trim();
      target.push(`${sig} { /* ... */ }`);
    }
  }
}

function extractFnName(line) {
  const m = HANDLER_PATTERN.exec(line);
  return m ? m[1] || m[2] : "unknown";
}

function extractDeps(allLines, startIdx) {
  // deps 배열 찾기: 마지막 인자인 [] 부분
  let depth = 0;
  let text = "";
  for (let i = startIdx; i < allLines.length; i++) {
    text += allLines[i] + "\n";
    for (const ch of allLines[i]) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
    }
    if (depth <= 0 && i > startIdx) break;
  }

  // 마지막 대괄호 배열 추출
  const bracketMatch = text.match(/\[([^\]]*)\]\s*\)\s*;?\s*$/);
  if (bracketMatch) {
    return `[${bracketMatch[1].trim()}]`;
  }
  return "[]";
}

function findMainReturn(lineEntries) {
  // 컴포넌트 본문의 return 문 찾기
  let depth = 0;
  for (const { idx, line } of lineEntries) {
    for (const ch of line) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
    }
    // depth 1 = 컴포넌트 함수 본문 최상위
    if (depth === 1 && /^\s*return\s*[\(]/.test(line)) {
      return idx;
    }
  }
  return -1;
}

function formatResult(sections) {
  const parts = [];

  if (sections.imports.length > 0) {
    parts.push(SECTION_HEADERS.imports);
    parts.push(sections.imports.join("\n"));
  }

  if (sections.utils.length > 0) {
    parts.push("");
    parts.push(SECTION_HEADERS.utils);
    parts.push(sections.utils.join("\n"));
  }

  if (sections.innerComponents.length > 0) {
    parts.push("");
    parts.push(SECTION_HEADERS.innerComponents);
    parts.push(sections.innerComponents.join("\n"));
  }

  if (sections.state.length > 0) {
    parts.push("");
    parts.push(SECTION_HEADERS.state);
    parts.push(sections.state.join("\n"));
  }

  if (sections.handlers.length > 0) {
    parts.push("");
    parts.push(SECTION_HEADERS.handlers);
    parts.push(sections.handlers.join("\n"));
  }

  if (sections.sideEffects.length > 0) {
    parts.push("");
    parts.push(SECTION_HEADERS.sideEffects);
    parts.push(sections.sideEffects.join("\n"));
  }

  if (sections.jsxReturn.length > 0) {
    parts.push("");
    parts.push(SECTION_HEADERS.jsxReturn);
    parts.push(sections.jsxReturn.join("\n"));
  }

  return parts.join("\n");
}

// ── UI 컴포넌트 ───────────────────────────────────────

export default function CodeSkeletonViewer() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [message, setMessage] = useState("");

  const handleParse = () => {
    setMessage("");

    if (!input.trim()) {
      setResult("");
      setMessage(MSG_EMPTY_INPUT);
      return;
    }

    try {
      const sections = parseCode(input);
      const formatted = formatResult(sections);

      if (!formatted.trim()) {
        setResult(input);
        setMessage(MSG_NO_SECTIONS);
      } else {
        setResult(formatted);
      }
    } catch (e) {
      setResult(input);
      setMessage(MSG_PARSE_ERROR);
    }
  };

  const handleCopy = async () => {
    if (!result.trim()) {
      setMessage(MSG_NOTHING_TO_COPY);
      return;
    }

    try {
      await navigator.clipboard.writeText(result);
      setMessage(MSG_COPY_SUCCESS);
    } catch {
      setMessage(MSG_COPY_FAIL);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col font-sans">
      {/* 헤더 */}
      <h1 className="text-xl font-bold text-gray-800 mb-4">
        Code Skeleton Viewer
      </h1>

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
        {/* 좌측: 입력 */}
        <div className="flex-1 flex flex-col min-h-0">
          <label className="text-sm font-medium text-gray-600 mb-1">
            원본 코드
          </label>
          <textarea
            className="flex-1 min-h-[200px] p-3 border border-gray-300 rounded-lg font-mono text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="JSX/TSX 코드를 붙여넣으세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* 우측: 결과 */}
        <div className="flex-1 flex flex-col min-h-0">
          <label className="text-sm font-medium text-gray-600 mb-1">
            파싱 결과
          </label>
          <pre className="flex-1 min-h-[200px] p-3 border border-gray-200 rounded-lg font-mono text-sm bg-gray-100 overflow-auto whitespace-pre-wrap">
            {result || (
              <span className="text-gray-400">{MSG_PLACEHOLDER}</span>
            )}
          </pre>
        </div>
      </div>

      {/* 하단 버튼 + 메시지 */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="flex gap-3">
          <button
            onClick={handleParse}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            파싱하기
          </button>
          <button
            onClick={handleCopy}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            복사
          </button>
        </div>
        {message && (
          <p className="text-sm text-amber-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}

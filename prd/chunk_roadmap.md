# Chunk Roadmap — Code Skeleton Viewer

---

## Chunk 0: 사람이 직접 할 것

> Claude Code 아님. 사람이 직접 진행.

- [ ] GitHub 저장소 생성 (빈 저장소, README 없이)
- [ ] CLAUDE.md 파일의 `여기에_GitHub_저장소_URL_입력` 부분에 저장소 URL 채워넣기
- [ ] 아래 파일들을 프로젝트 폴더에 배치
  - `CLAUDE.md` (루트)
  - `prd/PRD.md`
  - `prd/chunk_roadmap.md`
  - `prd/HANDOFF.md`
  - `prd/run.py`

### 완료 조건
- [ ] GitHub 저장소 URL이 CLAUDE.md에 입력됨
- [ ] 로컬 폴더에 파일 5개 배치 완료

---

## Chunk 1: 단일 JSX 파일 생성

**목표:** Code Skeleton Viewer 전체 기능을 담은 단일 JSX 파일 완성

**선행조건:** Chunk 0 완료 (GitHub URL이 CLAUDE.md에 입력되어 있어야 함)

**상세 작업:**

| 파일 | 설명 |
|------|------|
| `CodeSkeletonViewer.jsx` | 전체 앱 (파서 + UI 전부 포함) |

구현 내용:
- 좌우 분할 레이아웃 (데스크탑) / 상하 분할 (모바일)
- 좌측: 코드 입력 textarea
- 우측: 파싱 결과 읽기전용 영역
- [파싱하기] 버튼: 정규식 파싱 실행
- [복사] 버튼: 결과 전체 클립보드 복사

파싱 로직 (정규식):
- 1️⃣ imports: `import `로 시작하는 줄 수집
- 2️⃣ 유틸 함수: `export default` 밖, JSX 미반환 함수/화살표함수
- 3️⃣ 내부 컴포넌트: JSX를 반환하는 내부 함수
- 4️⃣ 상태: `useState`, `useReducer`, `useRef` 선언부 + 초기값
- 5️⃣ 이벤트/로직: `handle*`, `on*` 패턴 함수
- 6️⃣ 사이드이펙트: `useEffect` 등 deps 배열만
- 7️⃣ JSX 반환: return 이후 `/* ... */`
- 없는 섹션은 출력 안 함

에러/빈 상태 처리:
- 빈 입력 → "코드를 입력해주세요"
- 섹션 0개 감지 → 원본 그대로 표시 + 안내 메시지
- try-catch로 파싱 에러 잡기 → 원본 표시
- 복사 내용 없음 → 안내 메시지
- 클립보드 API 실패 → 안내 메시지

**완료 조건:**
- [x] `CodeSkeletonViewer.jsx` 생성됨
- [x] 빈 입력 에러 처리 동작
- [x] import 구문 파싱 동작
- [x] useState 파싱 동작
- [x] useEffect deps 파싱 동작
- [x] 복사 버튼 동작
- [x] 모바일 레이아웃 동작
- [x] git commit + push 완료

---

## Chunk 2: 마무리

**목표:** 코드 정리 및 README 작성

**선행조건:** Chunk 1 완료 (`CodeSkeletonViewer.jsx` 존재)

**상세 작업:**

| 파일 | 설명 |
|------|------|
| `README.md` | 프로젝트 설명, 사용 방법, 향후 계획 |

내용:
- 프로젝트 한 줄 설명
- 사용 방법 (claude.ai 아티팩트에 붙여넣기)
- 7섹션 설명
- 향후 계획 (AST 교체, 출처 추적)

**완료 조건:**
- [x] README.md 생성됨
- [x] git commit + push 완료

# CLAUDE.md — Code Skeleton Viewer

## 프로젝트 정보
- GitHub 저장소: `https://github.com/jooladen/reactlens2`
- 프로젝트 유형: 단일 JSX 파일 (서버/DB/배포 없음)
- 실행 환경: claude.ai 아티팩트

---

## 기본 규칙
- 항상 한국어로 응답
- 작업 시작 시 `prd/HANDOFF.md`와 `prd/chunk_roadmap.md` 먼저 읽기
- `prd/PRD.md`는 기능 상세가 필요할 때 참고

---

## 작업 방식
- 미완료 Chunk만 순서대로 작업
- 한 번에 여러 Chunk 절대 금지
- chunk_roadmap에 없는 기능 임의 추가 금지
- 애매하면 질문하지 말고 최선의 판단으로 진행, HANDOFF.md에 기록

---

## 기존 파일 처리
- 이미 있는 파일/폴더 덮어쓰지 않음
- 단일 JSX 파일 프로젝트이므로 package.json 생성하지 않음

---

## Chunk 완료 시 필수 절차
1. `prd/HANDOFF.md` 업데이트
2. `prd/chunk_roadmap.md` 체크박스 `[x]` 체크
3. git add → commit → push (메시지: `"Chunk N: 한 줄 요약"`)
4. `"Chunk N 완료"` 출력

---

## Git 규칙
- Chunk 완료 시에만 commit + push
- 첫 push: `git push -u origin main`
- 이후: `git push`

---

## 코드 규칙
- 단일 `.jsx` 파일 유지 (분리 금지)
- 에러 처리: try-catch (파싱 로직에 적용)
- 사용자 노출 텍스트 한국어
- 매직 넘버 금지 → 상수로 분리 (파일 상단에 선언)
- 파싱 실패 시 원본 코드 그대로 표시 (에러로 처리하지 않음)

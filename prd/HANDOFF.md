# HANDOFF — Code Skeleton Viewer

## 마지막 완료
Chunk 2

## 현재 상태
모든 Chunk 완료

## 주의사항
- Chunk 0은 사람이 직접 진행 (GitHub 저장소 생성 + CLAUDE.md URL 입력)
- 단일 JSX 파일 프로젝트 — create-next-app 같은 프레임워크 세팅 없음
- 파싱 실패 시 원본 코드 그대로 보여주는 것이 의도된 동작 (에러가 아님)
- 자동 실행: `python prd/run.py` (bat 아님)
- 로그 확인: `prd/run-log.txt`

## 다음 작업
없음 (모든 Chunk 완료)

## 구현 메모
- 파서가 export default 범위를 brace depth로 추적하여 내부/외부를 구분함
- 내부 컴포넌트 감지는 함수 본문에 `<태그` 패턴이 있는지로 판단 (정규식 한계)
- useEffect deps 추출은 마지막 `[...]` 패턴 매칭 방식

## 히스토리
| 시점 | 내용 |
|------|------|
| 프로젝트 생성 | HANDOFF 초기화 |
| Chunk 1 | CodeSkeletonViewer.jsx 생성 (파서 7섹션 + 좌우/상하 반응형 UI) |
| Chunk 2 | README.md 작성 (프로젝트 설명, 사용 방법, 7섹션 규칙, 향후 계획) |

# GitHub 연결·브랜치 설정 인계

상태(2026-10-29): 새 private 저장소 kimmoksan/appliance-hearing 생성. main(.gitignore 첫 커밋)·develop 푸시 완료. 최초 문서는 docs/service-design → develop PR #1로 반영. 브랜치 보호 규칙은 미설정.

## 구조

main (발표/배포) ← develop (통합) ← docs/service-design 또는 feature/<기능>

작은 개인 프로젝트에서 develop은 필수는 아니지만, 이번에는 기능 개발과 발표 상태를 분리하기 위해 채택하는 제안이다.

## 기존 저장소를 사용하는 경우

Claude는 먼저 아래 정보를 확인한다.

```bash
git status
git remote -v
git branch -a
git log -5 --oneline
```

사용자가 지정한 원격인지 확인한다. 기존 작업·커밋·기본 브랜치를 보존한다. fetch 후 원격 develop이 있으면 추적하고 없으면 확인된 기본 브랜치를 기준으로 만든다.

깨끗한 작업 트리이며 원격 기본 브랜치가 main임을 확인한 경우의 예:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c develop
git push -u origin develop
git switch -c docs/service-design
```

develop 또는 docs/service-design이 이미 있으면 위 생성 명령을 반복하지 않고 기존 브랜치를 사용한다. 기존 원격 develop이 있다면 git switch --track origin/develop 등을 상황에 맞게 사용한다.

문서 배치:

- CLAUDE.md → 저장소 루트
- SERVICE_DESIGN.md → docs/SERVICE_DESIGN.md
- GIT_WORKFLOW.md → docs/GIT_WORKFLOW.md

확인 후 문서만 stage하여 커밋한다. 다른 사용자 변경을 포함하지 않는다.

```bash
git add CLAUDE.md docs/SERVICE_DESIGN.md docs/GIT_WORKFLOW.md
git commit -m "docs: add initial service design and Claude workflow"
git push -u origin docs/service-design
```

develop을 대상으로 문서 PR을 만든다. 병합 후 다음 기능 브랜치를 최신 develop에서 생성한다.

## 새 저장소를 사용하는 경우

사용자가 지정한 GitHub 계정·저장소 이름·공개 여부를 확인한다. 지정되지 않았다면 임의의 다른 프로젝트 저장소에 연결하지 않는다.

빈 원격 저장소에 연결할 경우 로컬 main을 초기화하고 .gitignore·문서를 첫 커밋으로 만든 후 origin을 연결한다. 원격에 README 등 커밋이 있으면 clone을 우선하고 이력 충돌을 강제 푸시로 해결하지 않는다.

## 최초 작업 순서

1. docs/service-design → develop: 설계와 인계 규칙.
2. feature/project-bootstrap → develop: 프론트·백엔드 기본 구조, 모의 모드.
3. feature/scene-player → develop: 공통 도트 재생기.
4. feature/product-input → develop: 입력과 정보 확인.
5. feature/ai-scene-planner → develop: AI 장면 계획·검증.
6. feature/hearing → develop: 근거 공방·선택 개입.
7. feature/decision-summary → develop: 결과와 사용자 결정.

한 기능에서 필요한 UI·API·데이터 변경을 함께 완료할 수 있다. 프론트/백엔드별 장기 브랜치로 나누지 않는다.

## 저장소 운영

- main은 가능하면 PR을 통해 반영하고 강제 푸시를 제한한다.
- 빌드와 검사가 마련되면 PR 검사로 연결한다. 보호 규칙 사용 가능 여부는 계정·플랜에서 확인한다.
- 비밀 키·.env·의존성 폴더·개인정보·생성 로그를 커밋하지 않는다.
- 사용자가 승인하지 않은 배포·공개 설정 변경·기존 저장소 이력 수정은 하지 않는다.

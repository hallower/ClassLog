# ClassLog · 클래스로그

개인 과외 선생님을 위한 학생 진도·과제·리포트 통합 관리 도구.
Android 모바일 + Windows PC 모두에서 같은 앱처럼 동작합니다.

---

## 🧑‍🏫 사용 방법 (선생님용)

ClassLog는 **웹 주소 하나만 열면** 바로 쓸 수 있는 도구입니다.
설치 프로그램이나 앱스토어 가입 없이, 평소 쓰시던 브라우저(크롬/사파리/에지)에서 그대로 사용합니다.

### 1. 처음 시작하기

1. 받으신 **ClassLog 주소**(예: `https://classlog.vercel.app`)를 브라우저로 엽니다.
2. 학생 데이터는 **이 기기 안에만** 저장되므로 로그인이 없습니다.
3. 첫 화면에서 **학생 등록** 버튼을 눌러 학생을 추가하면 시작!

### 2. 앱처럼 설치하기 (선택)

매번 브라우저 주소창에 입력하지 않아도 바로 열 수 있게 "앱 설치"를 권장드립니다.

**Windows PC (Chrome / Edge):**
- 주소창 오른쪽 끝에 작은 **모니터+아래화살표 아이콘** (Edge는 +, Chrome은 ⊕)이 보이면 클릭 → **설치**
- 또는 메뉴(⋮) → **앱 → ClassLog 설치**
- 설치하면 시작 메뉴와 바탕화면에 **클래스로그** 아이콘이 생깁니다.

**Android 휴대폰 (Chrome):**
- 주소창 옆 메뉴(⋮) → **홈 화면에 추가** 또는 **앱 설치**
- 홈 화면에 아이콘이 만들어지고, 다음부터는 앱처럼 전체 화면으로 열립니다.

### 3. 데이터 보관 ⚠️ 중요

기본 설정에서는 **데이터가 현재 기기 안에만 저장**됩니다.
브라우저 데이터를 지우거나 폰을 바꾸면 사라질 수 있으므로 **둘 중 하나는 꼭** 해두세요.

#### 방법 A. Google Drive로 자동 백업 (권장)

- 평소 쓰시는 **Gmail 계정의 구글 드라이브**에 자동으로 저장됩니다.
- 다른 기기(노트북↔휴대폰)에서도 같은 데이터로 동기화됩니다.
- 비용 없음 (구글 드라이브 무료 15GB 안에서 운영).
- 설정 방법은 **설정 → Google Drive 동기화** 화면 상단의 안내를 따르시면 됩니다. 한 번만 셋업하면 끝.

#### 방법 B. 가끔 수동으로 파일 내려받기

- **설정 → 데이터 백업 / 복원** → **JSON으로 내보내기**
- 다운로드 폴더에 `classlog-backup-...json` 파일이 저장됩니다.
- 한 달에 한 번 정도 받아서 안전한 곳(드라이브, USB)에 보관해 두시면 됩니다.
- 새 기기에서는 같은 화면의 **JSON에서 복원**으로 그대로 불러올 수 있습니다.

### 4. 주요 화면 한눈에

- **홈** — 오늘·내일 수업 카드(요일·시간으로 자동 계산), 최근 수업 기록 5건
- **학생** — 학생 목록 (이름·학교·학년 검색, 재원/중단/종료 필터)
- **학생 등록/수정** — 정기 수업을 **요일 + 시간**(예: 월 16:00, 목 16:00)으로 여러 개 등록 가능
- **학생 상세** — 진도표 / 모의고사 점수 그래프 / 과제 이행률 그래프 · 주소를 클릭하면 **네이버/카카오 지도**로 바로 열림
- **리포트** — 4회·8회·직접 기간 선택 → PDF 다운로드 → 카톡/메일로 학부모에게 전송
- **알림** — 과제 알림 예약, 메시지 템플릿 편집
- **설정** — 동기화·백업·전체 삭제

### 5. 자주 쓰는 키보드 단축키 (PC)

- 진도표에서 `Ctrl + N` — 새 수업 기록
- 수업 기록 창에서 `Ctrl + Enter` — 저장

---

## 🚀 배포하기 (관리자/도와주시는 분용)

선생님께 ClassLog를 전해드리는 가장 쉬운 방법은 **무료 호스팅(Vercel)에 한 번 배포**해두는 것입니다.
설치·서버 관리 없이 URL 하나만 공유하면 끝납니다.

### 옵션 1. Vercel (가장 쉬움, 권장)

비용 0원, 개인 사용 무제한, GitHub 연결만 하면 자동 배포·자동 업데이트.

1. 이 코드를 GitHub에 올립니다 (이미 `hallower/ClassLog`에 있다면 그대로 사용).
2. <https://vercel.com>에서 **Sign in with GitHub**.
3. **Add New → Project** → `ClassLog` 저장소 **Import**.
4. 설정은 그대로 두고 **Deploy** 클릭. (Next.js를 자동 인식)
5. 1–2분 뒤 `https://classlog-xxx.vercel.app` 같은 주소가 나옵니다. 이 주소를 선생님께 전달하면 끝.
6. 이후 GitHub에 코드를 푸시할 때마다 자동으로 새 버전이 배포됩니다.

도메인을 따로 사고 싶으시면 Vercel의 **Settings → Domains**에서 본인 도메인 연결 (예: `classlog.선생님이름.com`).

#### 동기화 + 로그인 설정 (배포 시 한 번)

여러 기기(PC ↔ 휴대폰)에서 데이터를 공유하려면 두 가지 환경변수가 필요합니다. Google Cloud Console 같은 외부 셋업은 **필요 없습니다**.

**1. Vercel Redis 추가 (Upstash)**
- Vercel 프로젝트 → **Storage 탭 → Marketplace → Upstash Redis** 추가
- 무료 플랜(30,000 commands/월, 256 MB) 선택 → 프로젝트와 연결
- 연결되면 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 환경변수가 자동 주입됨

**2. 비밀번호 환경변수**
- Vercel **Settings → Environment Variables** 에서 다음 추가
  ```
  APP_PASSWORD = (선생님이 사용하실 비밀번호)
  ```
- **Redeploy** 클릭

이제 배포된 URL에 접속하면 비밀번호 화면이 뜨고, 한 번 입력하면 이 기기에서 자동 로그인됩니다. PC와 휴대폰에서 같은 비밀번호로 들어오면 데이터가 자동 동기화됩니다.

> 이 두 환경변수를 비워두면(설정 안 하면) 로그인 없이 로컬 IndexedDB만 쓰는 모드로 동작합니다 — 자체 호스팅이나 한 기기에서만 쓰실 때 사용합니다.

### 옵션 2. Cloudflare Pages

Vercel과 거의 동일한 흐름. <https://pages.cloudflare.com>에서 GitHub 연동 → 빌드 명령 `pnpm build` → 출력 디렉터리 `.next` 자동 감지.
무료 한도가 더 후한 편입니다.

### 옵션 3. PC에서 직접 호스팅 (오프라인 사용)

선생님 PC를 항상 켜 놓고 그 PC에서만 쓰실 경우. **사전 준비는 Node.js LTS만 설치**(<https://nodejs.org>)되어 있으면 됩니다.

**Windows**: 프로젝트 폴더의 `start-classlog.bat`을 더블 클릭
**macOS / Linux**: 터미널에서 `./start-classlog.sh` 실행

처음 실행하면 패키지 설치(1–2분) + 빌드(1–2분)가 자동으로 진행되고, 끝나면 브라우저가 자동으로 `http://localhost:3000`을 엽니다. 두 번째 실행부터는 거의 즉시 시작합니다.

종료할 때는 검은 창에서 `Ctrl+C`.

**부팅 시 자동 실행하려면 (Windows)**: `start-classlog.bat` 바로가기를 만든 뒤 `Win+R → shell:startup` 입력해 열리는 폴더에 넣으세요. PC를 켤 때마다 ClassLog가 자동으로 떠 있게 됩니다.

> ℹ️ 오프라인 사용을 선택하실 경우 Google Drive 동기화는 같은 PC 안에서만 의미가 있으므로, 백업은 **설정 → 데이터 백업 / 복원**에서 JSON 내보내기를 주기적으로 사용하세요.

### 옵션 4. 같은 PC에서 여러 사람이 쓰는 경우

ClassLog는 **단일 사용자 단일 기기** 데이터 모델입니다. 한 PC에서 두 분이 따로 쓰시려면 Windows 사용자 계정을 분리하거나 다른 브라우저(예: 한 명은 Chrome, 한 명은 Edge)에서 접속하세요.

---

## 🛠️ 로컬 개발 (개발자용)

### 사전 요구사항

- **Node.js 20 이상** — <https://nodejs.org>에서 LTS 버전 설치
- **pnpm** — Node 설치 후 PowerShell에서 `npm install -g pnpm`

### 실행

```powershell
pnpm install         # 의존성 설치 (최초 1회)
pnpm dev             # 개발 서버 (http://localhost:3000)
pnpm build           # 프로덕션 빌드
pnpm start           # 프로덕션 서버
pnpm lint            # ESLint
```

### 기술 스택

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- IndexedDB via Dexie.js (`src/lib/db.ts`)
- Recharts (차트), jsPDF + html2canvas (PDF)
- react-hook-form + zod (폼 검증)
- Google Drive REST API (동기화 백엔드, OAuth는 Google Identity Services)

### 디렉터리

```
src/
├── app/                    # App Router 페이지
│   ├── students/           # 학생 목록 · 등록 · 상세 · 수정
│   ├── reports/            # 리포트 목록 · 생성
│   ├── notifications/      # 알림 목록 · 템플릿
│   └── settings/           # 설정 · 백업 · 동기화
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # AppShell (사이드바 + 모바일 탭)
│   ├── students/
│   ├── sessions/
│   ├── charts/             # ScoreLineChart, Completion charts
│   ├── reports/            # ReportPreview (PDF 템플릿)
│   ├── notifications/
│   ├── settings/
│   └── dashboard/
├── lib/
│   ├── db.ts               # Dexie 인스턴스
│   ├── repositories/       # 도메인별 데이터 액세스
│   ├── notifications.ts    # PWA push + SMS scheme + 스케줄러
│   ├── pdf.ts              # html2canvas + jsPDF
│   ├── reports.ts          # 리포트 통계 집계
│   ├── image.ts            # 이미지 리사이즈 + 프리셋 캐릭터
│   ├── utils.ts            # cn, uuid, formatDate, completionBucket
│   └── sync/
│       ├── backup.ts       # JSON export/import
│       └── drive.ts        # Google Drive 동기화
└── types/
    └── models.ts           # Student/Session/Assignment/Report 타입
```

### 구현 상태

| ID | 기능 | 상태 |
|----|------|------|
| F-01 | 학생 등록·프로필 관리 (사진/캐릭터) | ✅ |
| F-02 | 수업 기록 (진도표) · 키보드 단축키 | ✅ |
| F-03 | 과제 이행률 색상 (≤60 핑크 / 61–80 연녹 / >80 노랑) | ✅ |
| F-04 | 모의고사 점수 추이 그래프 | ✅ |
| F-05 | 월간 · 누적 과제 이행률 그래프 | ✅ |
| F-06 | 오늘 / 내일 수업 퀵뷰 + 최근 기록 | ✅ |
| F-07 | 부모용 PDF 리포트 (기간 4 / 8 / 직접) | ✅ |
| F-08 | 과제 알림 (PWA push + SMS scheme) | ✅ |
| Sync | 로컬 백업/복원 + Google Drive 동기화 | ✅ |
| F-09 | 네이버 캘린더 연동 | ⏳ Deferred |
| Kakao | 카카오 알림톡 API | ⏳ Deferred |

### 데이터 규모

- 학생 10명 × 5년 × 주 2회 ≈ 5,200건 수업 기록을 IndexedDB에 보관
- 학생 프로필 이미지는 512px로 자동 축소 후 저장
- Drive 동기화 시 전체 데이터를 단일 JSON으로 push/pull

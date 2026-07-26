# harang-contacts

🌐 [English](README.md) | **한국어**

📖 **[문서](https://search5.github.io/harang-contacts/ko/)** (English / 한국어)

[CardDAV](https://www.rfc-editor.org/rfc/rfc6352) 주소록의 연락처를 노트에서 바로 참조할 수 있게 해주는 [Obsidian](https://obsidian.md) 플러그인입니다. 전용 인라인 문법을 입력해 CardDAV 서버에서 연락처를 선택하면, 노트 안에 작은 칩으로 표시됩니다. 이 플러그인은 **읽기 전용**이며, CardDAV 서버의 데이터를 생성·수정·삭제하지 않습니다.

## 기능

- **`@contact[` 자동완성** — `@contact[`를 입력하고 이름을 이어 쓰면, 캐시된 주소록을 검색해 참조를 삽입합니다. Obsidian 자체의 링크 자동완성과 같은 방식입니다.
- **라이브 프리뷰/읽기 모드 모두 인라인 칩으로 표시** — 참조는 원문 문법이 아니라 연락처 이름(이메일이 있으면 이메일까지)을 보여주는 둥근 알약 모양 칩으로 렌더링됩니다.
- **클릭하면 상세 카드** — 칩을 클릭하면 이메일, 전화번호, 조직 정보를 볼 수 있습니다. 바깥을 클릭하거나 Esc를 누르면 닫힙니다.
- **동명이인이 있어도 정확하게 구분** — 선택한 참조는 정확한 연락처(서버 프로필 + CardDAV UID)에 고정되므로, 이름이 같은 두 사람이 서로 혼동되지 않습니다.
- **여러 CardDAV 서버 지원** — 서버 프로필을 원하는 만큼 등록할 수 있고, 모든 프로필의 연락처가 합쳐져 함께 검색됩니다.
- **표준 CardDAV 자동탐색** — 프로필에 서버 루트나 특정 주소록 URL을 지정하면, 플러그인이 `current-user-principal` → `addressbook-home-set` → 주소록 컬렉션 순서로 자동으로 찾아냅니다.
- **Obsidian UI 언어를 따라감** — 설정, 알림, 카드 라벨이 Obsidian 언어 설정에 따라 한국어 또는 영어로 표시됩니다(공식 `getLanguage()` API 사용).

## 사전 요구 사항

- HTTP(S)로 접속 가능한 CardDAV 호환 주소록 — 예: [Radicale](https://radicale.org/), Nextcloud 연락처, Fastmail, 또는 [RFC 6352](https://www.rfc-editor.org/rfc/rfc6352)를 구현한 다른 서버.
- Obsidian 1.8.7 이상.

자세한 내용은 [사전 준비 사항](https://search5.github.io/harang-contacts/ko/prerequisites.html) 페이지를 참고하세요.

## 설치

**harang-contacts**는 아직 Obsidian 커뮤니티 플러그인 목록에 등록되지 않아, 지금은 수동으로 설치해야 합니다.

### 방법 A — 미리 빌드된 파일 수동 설치

`main.js`, `manifest.json`, `styles.css`를 `<vault>/.obsidian/plugins/harang-contacts/`에 복사한 뒤, **설정 → 커뮤니티 플러그인**에서 **Harang Contacts**를 활성화하세요.

### 방법 B — 소스에서 직접 빌드

**요구 사항:** [Node.js](https://nodejs.org/) 18 이상

```bash
git clone https://github.com/search5/harang-contacts.git
cd harang-contacts
npm install
npm run build
```

빌드된 `main.js`를 `manifest.json`, `styles.css`와 함께 방법 A와 같이 `<vault>/.obsidian/plugins/harang-contacts/`에 복사한 뒤 Obsidian을 재시작하세요.

자세한 내용은 [설치](https://search5.github.io/harang-contacts/ko/installation.html) 페이지를 참고하세요.

## 사용법

1. **설정 → Harang Contacts**에서 서버 프로필(이름, 서버 URL, 사용자명, 비밀번호)을 추가하고 **연결 테스트 및 자동탐색**을 클릭하세요.
2. 노트에서 `@contact[`를 입력하고 이름(의 일부)을 이어 쓴 뒤, 자동완성 팝업에서 연락처를 선택하세요.
3. 삽입된 칩을 클릭하면 연락처의 전체 정보를 볼 수 있습니다.

여러 프로필과 동명이인 처리 방식을 포함한 전체 가이드는 [사용법](https://search5.github.io/harang-contacts/ko/usage.html) 문서를 참고하세요.

## 알려진 제한 사항

- (`@contact[` 자동완성을 거치지 않고) 손으로 직접 입력한 참조는 이름만으로 해석되므로, 같은 이름의 연락처가 여러 명이면 모호할 수 있습니다. 이를 피하려면 항상 자동완성을 통해 참조를 삽입하세요.
- 연락처는 클라이언트 쪽에서 설정 가능한 TTL(기본 30분)로 캐시되며, 서버에서 변경한 내용은 다음 새로고침 전까지 반영되지 않습니다.

## 개발

```bash
npm run dev    # esbuild watch 모드
npm run build  # 타입 체크 + 프로덕션 빌드
npm run lint   # eslint (eslint-plugin-obsidianmd 포함)
```

소스 구조와 데이터 흐름은 [아키텍처](https://search5.github.io/harang-contacts/ko/architecture.html) 문서를 참고하세요.

## 라이선스

BSD-3-Clause — [LICENSE](LICENSE) 참고.

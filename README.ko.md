# harang-contacts

🌐 [English](README.md) | **한국어**

📖 **[문서](https://search5.github.io/harang-contacts/ko/)** (English / 한국어)

[CardDAV](https://www.rfc-editor.org/rfc/rfc6352) 주소록의 연락처를 노트에서 바로 참조할 수 있게 해주는 [Obsidian](https://obsidian.md) 플러그인입니다. 전용 인라인 문법을 입력해 CardDAV 서버에서 연락처를 선택하면, 노트 안에 작은 칩으로 표시됩니다. 이 플러그인은 **읽기 전용**이며, CardDAV 서버의 데이터를 생성·수정·삭제하지 않습니다.

## 기능

- **`{{hrcard:` 단계별 자동완성** — `{{hrcard:`를 입력하면 서버 프로필 → 연락처 이름 순서로 한 팝업에서 이어서 고를 수 있습니다(자매 플러그인 harang-calendar의 `{{hrcal:`와 같은 패턴). `{{hrcard:<프로필ID>:<uid>}}`이 삽입됩니다 — `프로필ID`는 표시 이름이 아니라 프로필의 내부 ID입니다(자동으로 삽입되며 직접 입력하지 않습니다). 그래서 이제 설정에서 프로필 이름을 바꿔도 새로 삽입하는 참조는 깨지지 않습니다. 다만 이 변경 전에 이미 삽입된, 이름 기반 참조는 자동완성으로 다시 삽입해야 합니다.
- **라이브 프리뷰/읽기 모드 모두 인라인 칩으로 표시** — 참조는 원문 문법이 아니라 연락처 이름(이메일이 있으면 이메일까지)을 보여주는 둥근 알약 모양 칩으로 렌더링됩니다.
- **클릭하면 상세 카드** — 칩을 클릭하면 이메일, 전화번호, 조직 정보를 볼 수 있습니다. 바깥을 클릭하거나 Esc를 누르면 닫힙니다.
- **동명이인이 있어도 정확하게 구분** — 선택한 참조는 정확한 연락처(서버 프로필 + CardDAV UID)에 고정되므로, 이름이 같은 두 사람이 서로 혼동되지 않습니다.
- **여러 CardDAV 서버 지원** — 서버 프로필을 원하는 만큼 등록할 수 있고, 모든 프로필의 연락처가 합쳐져 함께 검색됩니다.
- **표준 CardDAV 자동탐색** — 프로필에 서버 루트나 특정 주소록 URL을 지정하면, 플러그인이 `current-user-principal` → `addressbook-home-set` → 주소록 컬렉션 순서로 자동으로 찾아냅니다.
- **Obsidian UI 언어를 따라감** — 설정, 알림, 카드 라벨이 Obsidian 언어 설정에 따라 한국어 또는 영어로 표시됩니다(공식 `getLanguage()` API 사용).

## 사전 요구 사항

- HTTP(S)로 접속 가능한 CardDAV 호환 주소록 — 예: [Radicale](https://radicale.org/), Nextcloud 연락처, Fastmail, 또는 [RFC 6352](https://www.rfc-editor.org/rfc/rfc6352)를 구현한 다른 서버.
- Obsidian 1.13.4 이상.

자세한 내용은 [사전 준비 사항](https://search5.github.io/harang-contacts/ko/prerequisites.html) 페이지를 참고하세요.

## 설치

Obsidian에서 **설정 → 커뮤니티 플러그인 → 찾아보기**를 열고 **"Harang Contacts"**를 검색한 뒤 **설치**와 **활성화**를 클릭하세요.

커뮤니티 플러그인 찾아보기를 사용하고 싶지 않다면 미리 빌드된 파일로 수동 설치하는 방법도 있습니다 — 자세한 내용은 [설치](https://search5.github.io/harang-contacts/ko/installation.html) 페이지를 참고하세요.

## 사용법

1. **설정 → Harang Contacts**에서 서버 프로필(이름, 서버 URL, 사용자명, 비밀번호)을 추가하고 **연결 테스트 및 자동탐색**을 클릭하세요.
2. 노트에서 `{{hrcard:`를 입력하고 프로필을 고른 뒤, 자동완성 팝업에서 연락처를 선택하세요.
3. 삽입된 칩을 클릭하면 연락처의 전체 정보를 볼 수 있습니다.

여러 프로필과 동명이인 처리 방식을 포함한 전체 가이드는 [사용법](https://search5.github.io/harang-contacts/ko/usage.html) 문서를 참고하세요.

## 알려진 제한 사항

- 참조는 `{{hrcard:` 자동완성으로만 삽입하도록 되어 있습니다 — 손으로 직접 입력하려면 정확한 CardDAV UID를 알아야 해서 사실상 외워서 칠 수 없습니다.
- 연락처는 클라이언트 쪽에서 설정 가능한 TTL(기본 30분)로 캐시되며, 서버에서 변경한 내용은 다음 새로고침 전까지 반영되지 않습니다.

## 라이선스

BSD-3-Clause — [LICENSE](LICENSE) 참고.

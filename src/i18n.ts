import { getLanguage } from "obsidian";

const en = {
	settingsCacheTtlName: "Cache lifetime (minutes)",
	settingsCacheTtlDesc: "Contacts are refreshed from the server automatically after this many minutes.",
	settingsCacheTtlValidation: "Enter a number of 1 or greater.",
	settingsRefreshAllName: "Refresh all address books now",
	settingsRefreshButtonIdle: "Refresh",
	settingsRefreshButtonLoading: "Refreshing...",
	settingsRefreshNotice: "Harang contacts: Address books refreshed.",
	settingsProfilesHeading: "CardDAV server profiles",
	settingsProfilesEmptyState: "No servers configured yet.",
	settingsAddProfileName: "Add a new server profile",
	settingsProfileNameLabel: "Profile name",
	settingsServerUrlLabel: "Server URL",
	settingsServerUrlDesc: "CardDAV server address, or an address book collection URL",
	settingsUsernameLabel: "Username",
	settingsPasswordLabel: "Password",
	settingsAddressBookUrlLabel: "Address book URL",
	settingsAddressBookUrlPending: "Not discovered yet. Test the connection below.",
	settingsTestConnectionIdle: "Test connection & auto-discover",
	settingsTestConnectionLoading: "Discovering...",
	settingsDiscoverySuccessNotice: "Harang contacts: Found address books (using the first of {count}: {name}).",
	settingsDiscoveryFailNotice: "Harang contacts: Connection failed - {message}",
	settingsDeleteProfileButton: "Delete this profile",
	settingsUnnamedProfile: "Unnamed profile",
	settingsProfileConnected: "Connected",
	settingsProfileNotConnected: "Not connected",
	commandRefreshContacts: "Refresh contacts",
	cardMissingContact: "This contact could not be found in the address book. A refresh may be needed.",
	cardFieldEmail: "Email",
	cardFieldPhone: "Phone",
	cardFieldOrg: "Organization",
	settingsNewProfileDefaultName: "New server",
	storeRefreshFailedNotice: "Harang contacts: Could not fetch address books from some servers.\n{failures}",
	davRequestFailed: "{method} {url} failed (HTTP {status})",
	davParseError: "Could not parse the server response (XML).",
	davEmptyServerUrl: "The server URL is empty.",
	davPrincipalNotFound: "Could not find the user principal. Please check the server URL.",
	davHomeSetNotFound: "Could not find the address book home location.",
	davNoAddressBooks: "No address books were found.",
};

type TranslationKey = keyof typeof en;

const ko: Record<TranslationKey, string> = {
	settingsCacheTtlName: "캐시 유효 시간(분)",
	settingsCacheTtlDesc: "설정한 시간이 지나면 노트에서 연락처를 다시 참조할 때 서버에서 자동으로 새로고침합니다.",
	settingsCacheTtlValidation: "1 이상의 숫자를 입력하세요.",
	settingsRefreshAllName: "지금 모든 주소록 새로고침",
	settingsRefreshButtonIdle: "새로고침",
	settingsRefreshButtonLoading: "새로고침 중...",
	settingsRefreshNotice: "Harang contacts: 주소록을 새로고침했습니다.",
	settingsProfilesHeading: "CardDAV 서버 프로필",
	settingsProfilesEmptyState: "등록된 서버가 없습니다.",
	settingsAddProfileName: "새 서버 프로필 추가",
	settingsProfileNameLabel: "프로필 이름",
	settingsServerUrlLabel: "서버 URL",
	settingsServerUrlDesc: "CardDAV 서버 주소 또는 주소록 컬렉션 URL",
	settingsUsernameLabel: "사용자명",
	settingsPasswordLabel: "비밀번호",
	settingsAddressBookUrlLabel: "주소록 URL",
	settingsAddressBookUrlPending: "아직 탐색되지 않았습니다. 아래 버튼으로 연결을 테스트하세요.",
	settingsTestConnectionIdle: "연결 테스트 및 자동탐색",
	settingsTestConnectionLoading: "탐색 중...",
	settingsDiscoverySuccessNotice: "Harang contacts: 주소록을 찾았습니다 ({count}개 중 첫 번째 사용: {name}).",
	settingsDiscoveryFailNotice: "Harang contacts: 연결 실패 - {message}",
	settingsDeleteProfileButton: "이 프로필 삭제",
	settingsUnnamedProfile: "이름 없는 프로필",
	settingsProfileConnected: "연결됨",
	settingsProfileNotConnected: "미연결",
	commandRefreshContacts: "주소록 새로고침",
	cardMissingContact: "이 연락처를 주소록에서 찾을 수 없습니다. 새로고침이 필요할 수 있습니다.",
	cardFieldEmail: "이메일",
	cardFieldPhone: "전화",
	cardFieldOrg: "조직",
	settingsNewProfileDefaultName: "새 서버",
	storeRefreshFailedNotice: "Harang contacts: 일부 서버에서 주소록을 가져오지 못했습니다.\n{failures}",
	davRequestFailed: "{method} {url} 실패 (HTTP {status})",
	davParseError: "서버 응답(XML)을 해석할 수 없습니다.",
	davEmptyServerUrl: "서버 URL이 비어 있습니다.",
	davPrincipalNotFound: "사용자 principal을 찾을 수 없습니다. 서버 URL을 확인해주세요.",
	davHomeSetNotFound: "주소록 홈 위치를 찾을 수 없습니다.",
	davNoAddressBooks: "주소록을 찾지 못했습니다.",
};

const locales: Record<string, Record<TranslationKey, string>> = { en, ko };

/** Expects a language code from the https://github.com/obsidianmd/obsidian-translations list. Falls back to English for unsupported languages. */
export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
	const dict = locales[getLanguage()] ?? en;
	let text = dict[key] ?? en[key];
	if (vars) {
		for (const [name, value] of Object.entries(vars)) {
			text = text.split(`{${name}}`).join(String(value));
		}
	}
	return text;
}

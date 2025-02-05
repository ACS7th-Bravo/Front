import { writable, get } from 'svelte/store';

// ✅ YouTube API 키 목록
export const youtubeApiKeys = [
	'AIzaSyAwcUsgAODlJAndOnlnYKqbGGtnjS_L61E',
	'AIzaSyDjf1hY6e6IOQYz92SErP4QWWD_dLWU6Mg',
	'AIzaSyB13uyTh3SCMhfAB7RNjJq8HBwe61wpqU0',
	'AIzaSyBGPRpwt-kaZV4THET0AYyxo8w0AZ7DQ9E',
	'AIzaSyAybmmX582Mt6HJa8VGTPRHABl8vHh_euk'
];

// ✅ 현재 API 키를 관리하는 스토어
export const currentApiKeyIndex = writable(0);
export const youtubeApiKey = writable(youtubeApiKeys[0]);

// ✅ 2분마다 API 키 변경
function rotateApiKey() {
	// 🔹 currentApiKeyIndex 값을 업데이트
	currentApiKeyIndex.update((n) => (n + 1) % youtubeApiKeys.length);

	// 🔹 즉시 get()으로 업데이트된 값을 가져옴
	const newIndex = get(currentApiKeyIndex);
	youtubeApiKey.set(youtubeApiKeys[newIndex]);

	// ✅ `$번째` 형식으로 로그 출력
	console.log(`🔄 ${newIndex + 1}번째 YouTube API 키 변경됨: ${youtubeApiKeys[newIndex]}`);
}

// ✅ 2분마다 실행
setInterval(rotateApiKey, 2 * 60 * 1000);

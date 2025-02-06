const clientId = '0ff07a899a8845c88e23c98afbce43ab'; // 🔹 클라이언트 ID
const clientSecret = '55f10044db254b02aa33dee00a4883e3'; // 🔹 클라이언트 시크릿

let accessToken = null;
const TOKEN_LIFETIME = 3600; // ✅ 1시간 (3600초)

// ✅ 저장된 Access Token 가져오기
export function getStoredToken() {
	const tokenData = localStorage.getItem('spotify_token');
	if (tokenData) {
		const { token, expires_at } = JSON.parse(tokenData);
		if (new Date().getTime() < expires_at) {
			console.log('✅ 기존 토큰 사용:', token);
			return token;
		}
	}
	return null;
}

// ✅ Access Token 저장 + 주기적 자동 갱신 (setInterval 사용)
function storeAccessToken(token) {
	const expires_at = new Date().getTime() + TOKEN_LIFETIME * 1000;
	localStorage.setItem('spotify_token', JSON.stringify({ token, expires_at }));
	accessToken = token;
	console.log('🔄 Access Token 저장 완료 (1시간 유효)');

	// ✅ 1시간(3600초)마다 자동 갱신 실행
	startAutoRefresh();
}

// ✅ 자동 갱신 실행 (setInterval 사용)
function startAutoRefresh() {
	if (window.tokenRefreshInterval) {
		clearInterval(window.tokenRefreshInterval); // 기존 Interval 삭제
	}
	window.tokenRefreshInterval = setInterval(
		async () => {
			const newToken = await fetchAccessToken();
			accessToken = newToken; // ✅ 동기화
		},
		(TOKEN_LIFETIME - 60) * 1000 // 🔄 59분 후 (1시간마다 실행)
	);
	console.log('🔄 1시간마다 자동 토큰 갱신 설정 완료');
}

// ✅ Spotify Access Token 요청
export async function fetchAccessToken() {
	console.log('🔄 Spotify Access Token 요청 중...');
	const url = 'https://accounts.spotify.com/api/token';
	const body = new URLSearchParams({
		grant_type: 'client_credentials',
		client_id: clientId,
		client_secret: clientSecret
	});

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body
	});

	const data = await response.json();
	if (data.access_token) {
		storeAccessToken(data.access_token);
		console.log('🎉 새 Access Token 발급 완료:', data.access_token);
		return data.access_token;
	} else {
		console.error('❌ Access Token 발급 실패:', data);
		return null;
	}
}

// ✅ 필요한 경우 Access Token 자동 가져오기
export async function getAccessToken() {
	accessToken = getStoredToken(); // ✅ 항상 최신 토큰 확인

	if (!accessToken) {
		console.log('🔹 토큰이 없습니다. 새로 발급합니다.');
		accessToken = await fetchAccessToken();
	}

	return accessToken;
}

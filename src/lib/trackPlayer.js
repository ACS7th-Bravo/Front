// /bravo-front/src/lib/trackPlayer.js
import { get } from 'svelte/store';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// ✅ YouTube에서 videoId 가져오기
export async function getYouTubeVideo(trackName, artistName) {
	if (!trackName || !artistName) {
		console.error('❌ 영어 제목 또는 아티스트명이 없습니다.');
		return null;
	}

	// 백엔드의 /api/youtube/search 엔드포인트 호출
	const url = `${backendUrl}/api/youtube/search?trackName=${encodeURIComponent(trackName)}&artistName=${encodeURIComponent(artistName)}`;
	console.log('🔍 YouTube 검색 키워드:', `${trackName} ${artistName} official audio`);
	console.log('🛰 백엔드 유튜브 검색 URL:', url);

	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				// ngrok 환경에서 브라우저 경고 우회가 필요하다면 추가
				'ngrok-skip-browser-warning': '69420'
			}
		});

		if (!response.ok) {
			// 403이면 YouTube API Key 문제, 도메인 제한 등이 원인일 가능성 큼
			throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
		}

		const data = await response.json();
		// 백엔드가 { videoId } 형태로 응답한다고 가정
		return data.videoId || null;
	} catch (error) {
		console.error('❌ YouTube 검색 요청 실패:', error);
		return null;
	}
}

// ✅ 트랙 재생 함수
export async function playTrack(track, index) {
	// 로그인 검증
	if (!localStorage.getItem('jwt_token')) {
		alert('로그인 후 음악을 재생할 수 있습니다.');
		return;
	}

	if (!track) {
		console.error('❌ 재생할 트랙 정보가 없습니다:', track);
		alert('❌ 재생할 수 없는 트랙입니다.');
		return;
	}

	console.log("▶️ 재생할 track 정보:", track);

	// ✅ 영어 제목 & 영어 아티스트명을 우선적으로 사용 (없으면 fallback)
	const trackName = track.englishTrackName || track.name || "Unknown Track";
	const artistName = track.englishArtistName
		? track.englishArtistName
		: track.artists
			? track.artists.map(a => a.name).join(', ')
			: track.artist || "Unknown Artist";

	console.log("🎵 English Name:", trackName);
	console.log("🎵 English Artist:", artistName);

	// YouTube videoId 가져오기
	const videoId = await getYouTubeVideo(trackName, artistName);
	console.log("▶️ 찾은 YouTube Video ID:", videoId);

	if (videoId) {
		// 재생 이벤트를 전역으로 디스패치
		window.dispatchEvent(new CustomEvent('playTrack', {
			detail: { videoId, track, index }
		}));
	} else {
		alert('❌ YouTube에서 영상을 찾을 수 없습니다.');
	}
}
// /bravo-front/src/lib/trackPlayer.js
import { get } from 'svelte/store';

// ✅ YouTube에서 videoId 가져오기 (백엔드 호출)
async function getYouTubeVideo(trackName, artistName) {
	const url = `http://localhost:3001/api/youtube/search?trackName=${encodeURIComponent(
		trackName
	)}&artistName=${encodeURIComponent(artistName)}`;
	console.log('검색한 키워드: ', `${trackName} ${artistName} official audio`);
	console.log('백엔드 유튜브 검색 url은: ', url);

	try {
		const response = await fetch(url);
		const data = await response.json();
		return data.videoId || null;
	} catch (error) {
		console.error('❌ YouTube 검색 요청 실패:', error);
		return null;
	}
}

// ✅ 트랙 재생 함수
export async function playTrack(track, index) {
	const videoId = await getYouTubeVideo(track.name, track.artists[0].name);
	if (videoId) {
		window.dispatchEvent(
			new CustomEvent('playTrack', {
				detail: { videoId, track, index }
			})
		);
	} else {
		alert('❌ YouTube에서 영상을 찾을 수 없습니다.');
	}
}

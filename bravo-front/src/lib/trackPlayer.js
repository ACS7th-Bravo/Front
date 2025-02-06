import { youtubeApiKey } from '$lib/youtubeStore.js';
import { get } from 'svelte/store';

// ✅ YouTube에서 videoId 가져오기
async function getYouTubeVideo(trackName, artistName) {
	const searchQueryText = `${trackName} ${artistName} official audio`;
	const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(searchQueryText)}&key=${get(youtubeApiKey)}&maxResults=1`;

	try {
		const response = await fetch(url);
		const data = await response.json();
		return data.items?.[0]?.id?.videoId || null;
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

const BACKEND_URL = "http://localhost:3000"; // 백엔드 URL 정의

// ✅ YouTube에서 videoId 가져오기 (백엔드 호출)
async function getYouTubeVideo(trackName, artistName) {
	const url = `${BACKEND_URL}/api/youtube/search?trackName=${encodeURIComponent(trackName)}&artistName=${encodeURIComponent(artistName)}`; //
	console.log('검색한 키워드: ', `${trackName} ${artistName} official audio`);
	console.log('백엔드 유튜브 검색 url은: ', url);

	try {
		const response = await fetch(url, {
			headers: {
				'Content-Type': 'application/json', // ✅ JSON 요청
				'ngrok-skip-browser-warning': '69420' // ✅ ngrok 보안 경고 우회
			}
		});
		if (!response.ok) {
			throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
		}
		const data = await response.json();
		return data.videoId || null;
	} catch (error) {
		console.error('❌ YouTube 검색 요청 실패:', error);
		return null;
	}
}

export async function playTrack(track, index) {
  // 로그인이 되어 있지 않으면 재생 기능을 막음.
  if (!localStorage.getItem("jwt_token")) {
    alert("로그인 후 음악을 재생할 수 있습니다.");
    return;
  }
  
  console.log(`🎵 재생 요청: ${track.name} - ${track.artists[0].name}`);
  
  const videoId = await getYouTubeVideo(track.name, track.artists[0].name);
  console.log(`▶️ 찾은 YouTube Video ID:`, videoId);
  
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

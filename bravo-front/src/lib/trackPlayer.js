const BACKEND_URL = "http://localhost:3000"; // 백엔드 URL 정의

async function getYouTubeVideo(trackName, artistName) {
  try {
    const url = `${BACKEND_URL}/api/youtube/search?track=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}`;
    console.log(`🔍 YouTube API 요청: ${url}`);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube 검색 실패! HTTP 상태 코드: ${res.status}`);
    
    const data = await res.json();
    console.log(`✅ YouTube API 응답:`, data);
    
    return data.videoId || null;
  } catch (error) {
    console.error('❌ YouTube 검색 오류:', error);
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

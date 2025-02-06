<script lang="ts">
  import { onMount } from "svelte";

  let searchQuery = "";
  let searchResults: any[] = [];
  let youtubePlayer: any;
  let currentYouTubeVideoId: string | null = null;
  let isPlaying = false;
  let isLoggedIn = false;
  let accessToken = "";

  const BACKEND_URL = "http://localhost:3000"; // 백엔드 서버 주소


      // ✅ URL에서 토큰 가져오기
      onMount(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (token) {
          localStorage.setItem("jwt_token", token);
          window.history.replaceState({}, document.title, "/");
      }
      checkLoginStatus();
  });

  // ✅ 로그인 상태 확인
  async function checkLoginStatus() {
      const token = localStorage.getItem("jwt_token");
      if (!token) {
          isLoggedIn = false;
          return;
      }

      try {
          const res = await fetch(`${BACKEND_URL}/api/verify-token`, {
              headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          isLoggedIn = data.valid;
          accessToken = data.valid ? token : "";
      } catch (error) {
          console.error("🚨 로그인 상태 확인 오류:", error);
          isLoggedIn = false;
          localStorage.removeItem("jwt_token");
      }
  }


  // ✅ 로그인 & 로그아웃
  function login() { window.location.href = `${BACKEND_URL}/api/google-login`; }
  function logout() { localStorage.removeItem("jwt_token"); isLoggedIn = false; accessToken = ""; alert("로그아웃 완료"); }

  // ✅ 검색
  async function searchTracks() {
      if (!isLoggedIn) { alert("로그인하세요!"); return; }
      if (!searchQuery) return;

      try {
          const res = await fetch(`${BACKEND_URL}/api/search?query=${encodeURIComponent(searchQuery)}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
          });
          searchResults = await res.json();
      } catch (error) { console.error("🚨 검색 오류:", error); }
  }



  // ✅ YouTube에서 해당 트랙의 videoId 검색
  async function getYouTubeVideo(trackName: string, artistName: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/youtube?track=${encodeURIComponent(trackName)}&artist=${encodeURIComponent(artistName)}`);
      if (!res.ok) throw new Error("YouTube 검색 실패");
      const data = await res.json();
      return data.videoId || null;
    } catch (error) {
      console.error("🚨 YouTube 검색 오류:", error);
      return null;
    }
  }

  // ✅ 선택한 트랙 재생 (YouTube)
  async function playTrack(track: any) {
    console.log(`🎵 선택한 트랙: ${track.name}`);
    const videoId = await getYouTubeVideo(track.name, track.artists[0].name);

    if (videoId) {
      currentYouTubeVideoId = videoId;
      if (!youtubePlayer) {
        youtubePlayer = new YT.Player("youtube-player", {
          height: "0",
          width: "0",
          videoId: videoId,
          playerVars: { autoplay: 1, controls: 0, modestbranding: 1, loop: 1, rel: 0 },
        });
      } else {
        youtubePlayer.loadVideoById(videoId);
      }
      isPlaying = true;
    } else {
      alert("해당 트랙의 YouTube 영상을 찾을 수 없습니다.");
    }
  }

  // ✅ 재생/일시정지 토글
  function togglePause() {
    if (youtubePlayer) {
      if (isPlaying) {
        youtubePlayer.pauseVideo();
        console.log("⏸️ 오디오 일시정지");
      } else {
        youtubePlayer.playVideo();
        console.log("▶️ 오디오 재생");
      }
      isPlaying = !isPlaying;
    }
  }

  // ✅ YouTube API 로드
  function loadYouTubeAPI() {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
  }

  onMount(() => {
    loadYouTubeAPI();
    checkLoginStatus(); // ✅ 로그인 상태 확인
  });
</script>

<style>
  .search-container {
    text-align: center;
    margin-bottom: 20px;
  }
  input {
    padding: 10px;
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 16px;
    box-sizing: border-box;
  }
  .track-list {
    max-width: 100%;
    text-align: left;
  }
  .track {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #ddd;
    transition: background 0.2s;
  }
  .track:hover {
    background: #f4f4f4;
  }
  .track img {
    width: 50px;
    height: 50px;
    margin-right: 10px;
  }
  .button-container {
    text-align: center;
  }
  button {
    background: #1DB954;
    color: white;
    border: none;
    padding: 8px 12px;
    font-size: 14px;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s;
    margin-right: 5px;
  }
  button:hover {
    background: #17a74a;
  }
</style>

<!-- 로그인 / 로그아웃 버튼 -->
<div class="button-container">
  {#if isLoggedIn}
    <button on:click={logout}>🚪 로그아웃</button>
  {:else}
    <button on:click={login}>🎵 Google 로그인</button>
  {/if}
</div>

<!-- 검색 UI -->
<div class="search-container">
  <input type="text" bind:value={searchQuery} placeholder="🎵 검색할 곡 제목을 입력하세요..." on:keydown={(e) => e.key === 'Enter' && searchTracks()} />
  <button on:click={searchTracks}>검색</button>
</div>

<!-- 검색 결과 리스트 -->
{#if searchResults.length > 0}
  <div class="track-list">
    <h3>검색 결과:</h3>
    {#each searchResults as track}
      <div class="track">
        <img src={track.album.images[0]?.url} alt="Album Cover" />
        <div>
          <strong>{track.name}</strong>
          <p>{track.artists.map((artist: any) => artist.name).join(", ")}</p>
        </div>
        <button on:click={() => playTrack(track)}>▶️ 재생</button>
      </div>
    {/each}
  </div>
{/if}

<!-- 일시정지 버튼 -->
{#if currentYouTubeVideoId}
  <div class="button-container">
    <button on:click={togglePause}>{isPlaying ? "⏸️ 일시정지" : "▶️ 재생"}</button>
  </div>
{/if}

<!-- YouTube 플레이어 -->
<div id="youtube-player"></div>

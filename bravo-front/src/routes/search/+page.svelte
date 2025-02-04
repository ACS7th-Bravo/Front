<script lang="ts">
  import { onMount } from "svelte";

  const token = "BQBmAKXCN4Ofa06XjzF4z2OCgYHL_r0TcuJGcd5nzUumgmc0PZyIuB4ij3B947SPf9WDDT3Pj63l9oK5h8Dcl-2pj6lpT4efsKBKuxOoHsGWpNfvrYleuK0HMP0hAXKv8ZK7Mx0yIDirHSuwn33oOWJ9WxWpdA2FcQzd4hbXgMc9FCYOOam5KN3z_d9ZDni4n9uVOIH6xEbdeVyAZwpqN_x8ZSaDb9AQU-8nFQbgE7wMYUAetF4HNUXvWJvI5i4F54XvlA7RUKth2XvIArw0QFkiDsh1DxwCCPb-ywcepOcMmY37HQVnKz6ZMCOQIg"; // 🔹 Spotify API 토큰
  const youtubeApiKey = "AIzaSyAY4kyW7ZyTrZAalwL7BsM2FDZ83Nmg2tM"; // 🔹 YouTube API 키

  let searchQuery = "";
  let searchResults: any[] = [];
  let youtubePlayer: any;
  let currentYouTubeVideoId: string | null = null;
  let isPlaying = false; // 현재 재생 상태 (재생 중인지 여부)

  // ✅ YouTube IFrame API 로드
  function loadYouTubeAPI() {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
  }

  // ✅ YouTube 플레이어 초기화
  function onYouTubeIframeAPIReady() {
    youtubePlayer = new YT.Player("youtube-player", {
      height: "0", // 화면 숨기기
      width: "0",
      playerVars: {
        autoplay: 1,
        controls: 0,
        showinfo: 0,
        modestbranding: 1,
        loop: 1,
        rel: 0,
      },
    });
  }

  // ✅ Spotify에서 트랙 검색
  async function searchTracks() {
    if (!searchQuery) return;
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    });

    const data = await res.json();
    if (data.tracks) {
      searchResults = data.tracks.items;
    }
  }

  // ✅ YouTube에서 해당 트랙의 videoId 검색
  async function getYouTubeVideo(trackName: string, artistName: string) {
    const searchQuery = `${trackName} ${artistName} official audio`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(searchQuery)}&key=${youtubeApiKey}&maxResults=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.items.length > 0) {
      return data.items[0].id.videoId;
    } else {
      console.error("❌ 관련 영상이 없습니다.");
      return null;
    }
  }

  // ✅ 트랙 재생 (YouTube에서 검색된 영상 재생)
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
          playerVars: {
            autoplay: 1,
            controls: 0,
            showinfo: 0,
            modestbranding: 1,
            loop: 1,
            rel: 0,
          },
        });
      } else {
        youtubePlayer.loadVideoById(videoId);
      }
      isPlaying = true; // 현재 재생 중
      console.log(`🎥 YouTube 오디오 재생 중: ${videoId}`);
    } else {
      alert("해당 트랙의 YouTube 영상을 찾을 수 없습니다.");
    }
  }

  // ✅ 일시정지 기능 추가
  function togglePause() {
    if (youtubePlayer) {
      if (isPlaying) {
        youtubePlayer.pauseVideo();
        console.log("⏸️ 오디오 일시정지");
      } else {
        youtubePlayer.playVideo();
        console.log("▶️ 오디오 재생");
      }
      isPlaying = !isPlaying; // 상태 토글
    }
  }

  onMount(() => {
    loadYouTubeAPI();
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

<div class="search-container">
  <input
    type="text"
    bind:value={searchQuery}
    placeholder="🎵 검색할 곡 제목을 입력하세요..."
    on:keydown={(e) => e.key === 'Enter' && searchTracks()}
  />
  <button on:click={searchTracks}>검색</button>
</div>

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
    <button on:click={togglePause}>
      {isPlaying ? "⏸️ 일시정지" : "▶️ 재생"}
    </button>
  </div>
{/if}

<!-- YouTube 오디오 플레이어 -->
<div id="youtube-player"></div>

<script>
	import { onMount } from 'svelte';
	import { searchResults } from '$lib/searchStore.js';
	import { playTrack } from '$lib/trackPlayer.js';
  
	let isLoggedIn = false;
  
	// 로그아웃 함수
	function logout() {
	  localStorage.removeItem("jwt_token");
	  isLoggedIn = false;
	  window.location.href = "/";
	}
  
	// onMount 시 URL에서 토큰 추출, localStorage 저장, 로그인 상태 업데이트
	onMount(() => {
	  const urlParams = new URLSearchParams(window.location.search);
	  const token = urlParams.get("token");
	  if (token) {
		localStorage.setItem("jwt_token", token);
		isLoggedIn = true;
		// 토큰을 URL에서 제거하여 보안 강화
		window.history.replaceState({}, document.title, "/");
	  } else {
		isLoggedIn = !!localStorage.getItem("jwt_token");
	  }
  
	  // 5초마다 로그인 상태와 JWT 토큰(있는 경우)을 콘솔에 출력
	  setInterval(() => {
		console.log("로그인 상태:", isLoggedIn, "JWT 토큰:", localStorage.getItem("jwt_token"));
	  }, 5000);
  
	  loadYouTubeAPI();
	  window.addEventListener('playTrack', handlePlayTrack);
	});
  
	// 기존 YouTube 플레이어 관련 코드 (생략)
	let isPlaying = false;
	let youtubePlayer;
	let currentYouTubeVideoId = null;
	let currentTrackIndex = -1;
	let currentTrack = {
	  name: '',
	  artist: '',
	  albumImage: ''
	};
	let currentTime = 0;
	let duration = 0;
	let progress = 0;
	let interval = null;
  
	function formatTime(seconds) {
	  const min = Math.floor(seconds / 60);
	  const sec = Math.floor(seconds % 60);
	  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
	}
  
	function handlePlayTrack(event) {
	  const { videoId, track, index } = event.detail;
	  if (videoId) {
		currentTrack = {
		  name: track.name,
		  artist: track.artists.map((a) => a.name).join(', '),
		  albumImage: track.album.images[0]?.url || ''
		};
		currentYouTubeVideoId = videoId;
		currentTrackIndex = index;
		if (!youtubePlayer) {
		  youtubePlayer = new YT.Player('youtube-player', {
			height: '0',
			width: '0',
			videoId: videoId,
			playerVars: {
			  autoplay: 1,
			  controls: 0,
			  showinfo: 0,
			  modestbranding: 1,
			  loop: 0,
			  rel: 0
			},
			events: {
			  onReady: () => {
				youtubePlayer.playVideo();
				startProgressUpdate();
			  },
			  onStateChange: (event) => {
				console.log('🎬 YouTube 플레이어 상태 변경:', event.data);
				if (event.data === YT.PlayerState.ENDED) {
				  playNextTrack();
				} else if (event.data === YT.PlayerState.PLAYING) {
				  startProgressUpdate();
				} else if (event.data === YT.PlayerState.BUFFERING) {
				  console.log('⏳ 버퍼링 중...');
				} else if (event.data === YT.PlayerState.PAUSED) {
				  console.log('⏸️ 곡 일시 정지됨');
				} else {
				  clearInterval(interval);
				}
			  }
			}
		  });
		} else {
		  youtubePlayer.loadVideoById(videoId);
		  startProgressUpdate();
		}
		isPlaying = true;
	  }
	}
  
	async function playNextTrack() {
	  const tracks = $searchResults;
	  if (currentTrackIndex < tracks.length - 1) {
		const nextTrack = tracks[currentTrackIndex + 1];
		playTrack(nextTrack, currentTrackIndex + 1);
	  }
	}
  
	function startProgressUpdate() {
	  clearInterval(interval);
	  interval = setInterval(() => {
		if (youtubePlayer && youtubePlayer.getCurrentTime) {
		  currentTime = youtubePlayer.getCurrentTime();
		  duration = youtubePlayer.getDuration();
		  progress = (currentTime / duration) * 100;
		}
	  }, 500);
	}
  
	function seekTrack(event) {
	  const newTime = (event.target.value / 100) * duration;
	  youtubePlayer.seekTo(newTime, true);
	}
  
	function togglePause() {
	  if (youtubePlayer) {
		isPlaying ? youtubePlayer.pauseVideo() : youtubePlayer.playVideo();
		isPlaying = !isPlaying;
	  }
	}
  
	function loadYouTubeAPI() {
	  const script = document.createElement('script');
	  script.src = 'https://www.youtube.com/iframe_api';
	  script.async = true;
	  document.body.appendChild(script);
	}
  </script>
  
  <!-- 헤더 영역 -->
  <div class="header">
	{#if isLoggedIn}
	  <button class="logout-btn" on:click={logout}>로그아웃</button>
	{:else}
	  <button class="login-btn" on:click={() => window.location.href = "http://localhost:3000/api/google/google-login"}>구글 로그인</button>
	{/if}
  </div>
  
  <div class="layout">
	<div class="sidebar">
	  <h2><a href="/">Playlink</a></h2>
	  <nav>
		<ul>
		  <li><a href="/about">About</a></li>
		  <li><a href="/hi">Hi</a></li>
		  <li><a href="/search">Search</a></li>
		  <li><a href="/podcast">Podcast</a></li>
		</ul>
	  </nav>
	  <h3>Library</h3>
	  <ul>
		<li><a href="/favorites">Favorites</a></li>
		<li><a href="/playlist">Playlist</a></li>
	  </ul>
	  <img src="/logo.png" alt="Logo" class="logo-image" />
	</div>
  
	<div class="main-content">
	  <h1>Play Link!</h1>
	  <slot />
	</div>
  
	<!-- 전역 플레이어 -->
	<div class="player">
	  {#if currentTrack.name}
		<img src={currentTrack.albumImage} alt="Album Cover" class="player-album-cover" />
		<div class="player-track-info">
		  <strong>{currentTrack.name}</strong>
		  <p>{currentTrack.artist}</p>
		</div>
		<div class="wrap-time">
		  <div class="time-info">
			<button on:click={togglePause}>
			  {isPlaying ? '⏸️' : '▶️'}
			</button>
			<span>{formatTime(currentTime)}</span>
			<input
			  type="range"
			  min="0"
			  max="100"
			  step="0.1"
			  bind:value={progress}
			  on:input={seekTrack}
			  class="progress-bar"
			/>
			<span>{formatTime(duration)}</span>
		  </div>
		</div>
	  {/if}
	</div>
  
	<div id="youtube-player"></div>
  </div>
  
  <style>
	:global(body) {
	  margin: 0;
	  padding: 0;
	}
  
	*::-webkit-scrollbar {
	  display: none;
	}
  
	* {
	  -ms-overflow-style: none;
	  scrollbar-width: none;
	}
  
	.header {
	  position: fixed;
	  top: 0;
	  right: 0;
	  padding: 10px;
	  z-index: 200;
	}
  
	.login-btn,
	.logout-btn {
	  padding: 8px 16px;
	  font-size: 14px;
	  background-color: #4285f4;
	  color: white;
	  border: none;
	  border-radius: 4px;
	  cursor: pointer;
	  transition: background-color 0.3s;
	}
  
	.login-btn:hover,
	.logout-btn:hover {
	  background-color: #357ae8;
	}
  
	.layout {
	  display: flex;
	  height: 100vh;
	  overflow: hidden;
	  padding-top: 50px; /* 헤더 높이만큼 패딩 추가 */
	}
  
	.sidebar {
	  width: 250px;
	  background-color: white;
	  color: black;
	  display: flex;
	  flex-direction: column;
	  gap: 20px;
	}
  
	.sidebar h2,
	h3,
	nav {
	  padding-left: 20px;
	}
  
	.logo-image {
	  position: absolute;
	  bottom: 50px;
	  width: 250px;
	}
  
	.sidebar h2 a {
	  color: black;
	  text-decoration: none;
	  font-size: 40px;
	  transition: font-size 0.3s ease;
	}
  
	.sidebar h2 a:hover {
	  color: fuchsia;
	  font-size: 45px;
	}
  
	li {
	  list-style: none;
	}
  
	li a {
	  font-size: 25px;
	  color: black;
	  text-decoration: none;
	  transition: font-size 0.3s ease;
	}
  
	li a:hover {
	  color: deeppink;
	  font-size: 27px;
	}
  
	.main-content {
	  flex-grow: 1;
	  background-color: black;
	  color: white;
	  display: flex;
	  flex-direction: column;
	  overflow: auto;
	  padding-bottom: 70px;
	}
  
	.player {
	  display: flex;
	  align-items: center;
	  justify-content: space-between;
	  position: fixed;
	  bottom: 0;
	  width: 100%;
	  height: 70px;
	  background-color: #222;
	  color: white;
	  padding: 0 40px 0 20px;
	  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
	  z-index: 100;
	}
  
	.player img {
	  width: 50px;
	  height: 50px;
	  border-radius: 5px;
	  margin-right: 10px;
	}
  
	.player-track-info {
	  flex-grow: 1;
	  display: flex;
	  flex-direction: column;
	  max-width: 150px;
	}
  
	.player strong {
	  font-size: 14px;
	}
  
	.player p {
	  font-size: 12px;
	  color: #bbb;
	  margin: 0;
	}
  
	.player button {
	  background: none;
	  border: none;
	  color: white;
	  font-size: 40px;
	  cursor: pointer;
	}
  
	.player button:hover {
	  color: #1db954;
	}
  
	.wrap-time {
	  display: flex;
	  align-items: center;
	  gap: 8px;
	  font-size: 14px;
	  color: #bbb;
	  width: 90%;
	}
  
	.time-info {
	  display: flex;
	  align-items: center;
	  gap: 8px;
	  font-size: 14px;
	  color: #bbb;
	  width: 80%;
	}
  
	.progress-bar {
	  width: 80%;
	  margin: 0 10px;
	  appearance: none;
	  background: #555;
	  height: 5px;
	  border-radius: 5px;
	  cursor: pointer;
	}
  
	.progress-bar::-webkit-slider-thumb {
	  appearance: none;
	  background: #1db954;
	  width: 10px;
	  height: 10px;
	  border-radius: 50%;
	  cursor: pointer;
	}
  </style>
  
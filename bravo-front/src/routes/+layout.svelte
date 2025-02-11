<!-- /bravo-front/src/routes/+layout.svelte -->
<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { searchResults } from '$lib/searchStore.js'; // 검색 결과 스토어 (트랙 목록)
	import { playTrack } from '$lib/trackPlayer.js';
	import * as jwt_decode from 'jwt-decode';
	import { writable } from 'svelte/store';
	import { goto } from '$app/navigation';

	// 로그인 상태 및 사용자 정보 (일반 변수 사용 → 필요 시 writable로 전환)
	let isLoggedIn = false;
	let user = { name: '', picture: '' };

	// 현재 재생 중인 트랙 정보를 저장하는 스토어
	const currentTrack = writable({ name: '', artist: '', albumImage: '' });
	// 하위 페이지에서 사용할 수 있도록 context에 등록
	setContext('currentTrack', currentTrack);

	// 로그아웃 함수
	function logout() {
		localStorage.removeItem("jwt_token");
		isLoggedIn = false;
		user = { name: '', picture: '' };
		window.location.href = "/";
	}

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const tokenFromUrl = urlParams.get("token");
		if (tokenFromUrl) {
			localStorage.setItem("jwt_token", tokenFromUrl);
			isLoggedIn = true;
			try {
				const decoded: any = (jwt_decode as unknown as (token: string) => any)(tokenFromUrl);
				user.name = decoded.name;
				user.picture = decoded.picture;
			} catch (error) {
				console.error("JWT 디코딩 오류:", error);
			}
			window.history.replaceState({}, document.title, "/");
		} else {
			const savedToken = localStorage.getItem("jwt_token");
			if (savedToken) {
				isLoggedIn = true;
				try {
					const decoded: any = (jwt_decode as unknown as (token: string) => any)(savedToken);
					user.name = decoded.name;
					user.picture = decoded.picture;
				} catch (error) {
					console.error("JWT 디코딩 오류:", error);
				}
			} else {
				isLoggedIn = false;
			}
		}

		setInterval(() => {
			console.log("로그인 상태:", isLoggedIn, "JWT 토큰:", localStorage.getItem("jwt_token"));
		}, 5000);

		loadYouTubeAPI();
		window.addEventListener('playTrack', handlePlayTrack);
	});

	// YouTube 플레이어 관련 변수
	let isPlaying = false;
	let youtubePlayer;
	let currentYouTubeVideoId = null;
	let currentTrackIndex = -1; // 전역 변수로 현재 트랙 인덱스 저장
	let currentTime = 0;
	let duration = 0;
	let progress = 0;
	let interval = null;

	function formatTime(seconds) {
		const min = Math.floor(seconds / 60);
		const sec = Math.floor(seconds % 60);
		return `${min}:${sec < 10 ? '0' : ''}${sec}`;
	}

	function navigateToSongPage() {
		goto('/song');
	}

	// 전역 플레이어에서 CustomEvent 'playTrack' 수신
	function handlePlayTrack(event) {
		const { videoId, track, index } = event.detail;
		console.log("handlePlayTrack() received index:", index); // 디버깅용 로그
		if (videoId) {
			currentTrack.update(t => ({
				...t,
				name: track.name,
				artist: track.artists.map(a => a.name).join(', '),
				albumImage: track.album.images[0]?.url || ''
			}));
			currentYouTubeVideoId = videoId;
			currentTrackIndex = index; // index 값 저장
			console.log("저장된 currentTrackIndex:", currentTrackIndex);
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
							console.log('YT 플레이어 상태 변경:', event.data);
							if (event.data === YT.PlayerState.ENDED) {
								console.log('✅ 곡이 끝남! 다음 곡 자동 재생 시작...');
								playNextTrack();
							} else if (event.data === YT.PlayerState.PLAYING) {
								startProgressUpdate();
							} else if (event.data === YT.PlayerState.BUFFERING) {
								console.log('⏳ 버퍼링 중...');
							} else if (event.data === YT.PlayerState.PAUSED) {
								console.log('⏸️ 일시 정지됨');
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

	// 다음 곡 자동 재생 함수
	async function playNextTrack() {
		console.log('⏭️ playNextTrack() 호출됨!');
		const tracks = $searchResults; // 검색 결과 스토어 (트랙 배열)
		console.log('현재 검색된 트랙 목록:', tracks);
		console.log('현재 트랙 인덱스:', currentTrackIndex);
		if (typeof currentTrackIndex === "number" && currentTrackIndex < tracks.length - 1) {
			const nextTrack = tracks[currentTrackIndex + 1];
			console.log('다음 재생할 트랙:', nextTrack);
			// 다음 트랙 재생 시, index를 currentTrackIndex + 1로 전달
			playTrack(nextTrack, currentTrackIndex + 1);
		} else {
			console.log('더 이상 재생할 트랙이 없습니다.');
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
			if (isPlaying) {
				youtubePlayer.pauseVideo();
			} else {
				youtubePlayer.playVideo();
				startProgressUpdate();
			}
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

<!-- Header: 로그인/로그아웃 및 사용자 정보 (구글 로그인 포함) -->
<div class="header">
	{#if isLoggedIn}
		<div class="user-info">
			<img src={user.picture} alt="Profile Picture" class="profile-pic" />
			<span class="user-name">{user.name}</span>
			<button class="logout-btn" on:click={logout}>로그아웃</button>
		</div>
	{:else}
		<button class="login-btn" on:click={() => window.location.href = "http://localhost:3000/api/google/google-login?prompt=select_account"}>
			구글 로그인
		</button>
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
				<li><a href="/song">Podcast</a></li>
			</ul>
		</nav>
		<h3>Library</h3>
		<ul>
			<li><a href="/favorites">Favorites</a></li>
			<li><a href="/playlist">Playlist</a></li>
		</ul>
		<div class="logo-container">
			<img src="/logo.png" alt="Logo" class="logo-image" />
		</div>
	</div>

	<div class="main-content">
		<h1></h1>
		<slot />
	</div>

	<!-- Global Player -->
	<div class="player">
		{#if $currentTrack.name}
			<!-- 앨범 썸네일 클릭 시 상세페이지(/song)로 이동 -->
			<a href="/song" tabindex="0" role="button" on:click|preventDefault={navigateToSongPage}>
				<img src={$currentTrack?.albumImage || ''} alt="Album Cover" class="player-album-cover" />
			</a>
			<div class="player-track-info">
				<strong>{$currentTrack.name}</strong>
				<p>{$currentTrack.artist}</p>
			</div>
			<div class="wrap-time">
				<div class="time-info">
					<button on:click={togglePause}>
						{isPlaying ? '⏸️' : '▶️'}
					</button>
					<span>{formatTime(currentTime)}</span>
					<input type="range" min="0" max="100" step="0.1" bind:value={progress} on:input={seekTrack} class="progress-bar" />
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
		width: 100%;
		background: #222;
		padding: 10px 20px;
		z-index: 300;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 10px;
	}
	.user-info {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.profile-pic {
		width: 40px;
		height: 40px;
		border-radius: 50%;
	}
	.user-name {
		color: white;
		font-size: 16px;
		font-weight: bold;
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
		padding-top: 60px;
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
	.logo-container {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: auto;
		gap: 20px;
		padding-bottom: 70px;
	}
	.logo-image {
		width: 100%;
		max-width: 200px;
		object-fit: contain;
		transition: width 0.3s ease-in-out;
	}
	.sidebar:visited {
		color: black;
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
		overflow: hidden;
		padding-bottom: 70px;
		position: relative;
		z-index: 1;
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
		box-shadow: 0 0 5px rgba(255, 255, 255, 0.6);
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

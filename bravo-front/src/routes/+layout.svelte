<script>
	import { onMount } from 'svelte';
	import { getAccessToken } from '$lib/spotify.js';
	import { youtubeApiKey } from '$lib/youtubeStore.js';
	import { get } from 'svelte/store';

	let isPlaying = false;
	let youtubePlayer;
	let currentYouTubeVideoId = null;

	// ✅ 현재 재생 중인 트랙 정보
	let currentTrack = {
		name: '',
		artist: '',
		albumImage: ''
	};

	// ✅ 전역 플레이어에서 곡 재생
	function handlePlayTrack(event) {
		const { videoId, track } = event.detail;

		if (videoId) {
			// 트랙 정보 업데이트
			currentTrack = {
				name: track.name,
				artist: track.artists.map((a) => a.name).join(', '),
				albumImage: track.album.images[0]?.url || ''
			};

			currentYouTubeVideoId = videoId;
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
						loop: 1,
						rel: 0
					},
					events: {
						onReady: () => youtubePlayer.playVideo()
					}
				});
			} else {
				youtubePlayer.loadVideoById(videoId);
			}
			isPlaying = true;
		}
	}

	// ✅ 일시정지 / 재생 기능 유지
	function togglePause() {
		if (youtubePlayer) {
			if (isPlaying) {
				youtubePlayer.pauseVideo();
			} else {
				youtubePlayer.playVideo();
			}
			isPlaying = !isPlaying;
		}
	}

	// ✅ YouTube API 로드
	function loadYouTubeAPI() {
		const script = document.createElement('script');
		script.src = 'https://www.youtube.com/iframe_api';
		script.async = true;
		document.body.appendChild(script);
	}

	// ✅ Spotify 토큰 검사 및 YouTube API 로드
	onMount(async () => {
		console.log('🚀 앱 시작 - Spotify 토큰 검사 중...');
		await getAccessToken();
		loadYouTubeAPI();
		window.addEventListener('playTrack', handlePlayTrack);
	});
</script>

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
	</div>

	<div class="main-content">
		<h1>this is main</h1>
		<slot />
	</div>

	<!-- ✅ 전역 플레이어 -->
	<div class="player">
		{#if currentTrack.name}
			<img src={currentTrack.albumImage} alt="Album Cover" class="player-album-cover" />
			<div class="player-track-info">
				<strong>{currentTrack.name}</strong>
				<p>{currentTrack.artist}</p>
			</div>
		{/if}
		<button on:click={togglePause}>
			{isPlaying ? '⏸️ 일시정지' : '▶️ 재생'}
		</button>
	</div>

	<div id="youtube-player"></div>
</div>

<style>
	.layout {
		display: flex;
		height: 100vh;
		overflow: hidden;
	}

	.sidebar {
		width: 250px;
		background-color: white;
		color: black;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
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
		position: fixed;
		bottom: 0;
		width: 100%;
		height: 70px;
		background-color: #222;
		color: white;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 20px;
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
		font-size: 18px;
		cursor: pointer;
	}

	.player button:hover {
		color: #1db954;
	}
</style>

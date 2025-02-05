<script lang="ts">
	import { onMount } from 'svelte';
	import { getAccessToken } from '$lib/spotify.js';
	import { youtubeApiKey } from '$lib/youtubeStore.js';
	import { searchQuery, searchResults } from '$lib/searchStore.js';
	import { get } from 'svelte/store';

	let spotifyToken = '';
	let tokenExpiresAt = 0;

	// ✅ Spotify 토큰 갱신
	async function updateSpotifyToken() {
		try {
			spotifyToken = await getAccessToken();
			tokenExpiresAt = Date.now() + 3600 * 1000;
		} catch (error) {
			console.error('❌ Spotify API 토큰 갱신 실패:', error);
		}
	}
	onMount(updateSpotifyToken);

	// ✅ Spotify에서 트랙 검색
	async function searchTracks() {
		if (!get(searchQuery)) return;

		if (Date.now() >= tokenExpiresAt) {
			await updateSpotifyToken();
		}

		try {
			const res = await fetch(
				`https://api.spotify.com/v1/search?q=${encodeURIComponent(get(searchQuery))}&type=track&limit=20`,
				{ headers: { Authorization: `Bearer ${spotifyToken}` } }
			);

			if (!res.ok) throw new Error(`HTTP 오류! 상태 코드: ${res.status}`);
			const data = await res.json();
			searchResults.set(data.tracks?.items || []);
		} catch (error) {
			console.error('❌ Spotify 검색 요청 실패:', error);
		}
	}

	// ✅ YouTube에서 videoId 가져오기
	async function getYouTubeVideo(trackName: string, artistName: string) {
		const searchQueryText = `${trackName} ${artistName} official audio`;
		const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
			searchQueryText
		)}&key=${get(youtubeApiKey)}&maxResults=1`;

		try {
			const response = await fetch(url);
			const data = await response.json();
			return data.items?.[0]?.id?.videoId || null;
		} catch (error) {
			console.error('❌ YouTube 검색 요청 실패:', error);
			return null;
		}
	}

	// ✅ 트랙 재생 시 `+layout.svelte`로 이벤트 전송
	async function playTrack(track) {
		const videoId = await getYouTubeVideo(track.name, track.artists[0].name);
		if (videoId) {
			window.dispatchEvent(
				new CustomEvent('playTrack', {
					detail: { videoId, track }
				})
			);
		} else {
			alert('❌ YouTube에서 영상을 찾을 수 없습니다.');
		}
	}
</script>

<div class="search-container">
	<input
		type="text"
		bind:value={$searchQuery}
		placeholder="🎵 검색할 곡 제목을 입력하세요..."
		on:keydown={(e) => e.key === 'Enter' && searchTracks()}
	/>
	<button on:click={searchTracks}>검색</button>
</div>

{#if $searchResults.length > 0}
	<div class="track-list">
		<h3>검색 결과:</h3>
		{#each $searchResults as track}
			<div class="track">
				<img src={track.album.images[0]?.url} alt="Album Cover" />
				<div>
					<strong>{track.name}</strong>
					<p>{track.artists.map((artist: any) => artist.name).join(', ')}</p>
				</div>
				<button on:click={() => playTrack(track)}>▶️ 재생</button>
			</div>
		{/each}
	</div>
{/if}

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
		color: black;
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
		background: #1db954;
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

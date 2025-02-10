<script lang="ts">
	import { onMount } from 'svelte';
	import { searchQuery, searchResults } from '$lib/searchStore.js';
	import { get } from 'svelte/store';
	import { playTrack } from '$lib/trackPlayer.js';
	import { getLyrics } from '$lib/lyrics.js'; // ✅ 가사 API 추가

	let currentTrack = null;
	let lyrics = "가사를 불러오는 중...";

	// .env 파일에 설정된 백엔드 URL을 사용합니다.
	const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

	// ✅ Spotify에서 트랙 검색 (백엔드 호출)
	async function searchTracks() {
		if (!get(searchQuery)) return;

		try {
			const res = await fetch(
				`${backendUrl}/api/spotify/search?q=${encodeURIComponent(get(searchQuery))}`
			);
			if (!res.ok) throw new Error(`HTTP 오류! 상태 코드: ${res.status}`);
			const data = await res.json();
			searchResults.set(data);
		} catch (error) {
			console.error('❌ Spotify 검색 요청 실패:', error);
		}
	}

		// ✅ 트랙 선택 및 재생, 가사 가져오기
	async function selectTrack(track, index) {
		currentTrack = track;
		playTrack(track); // 트랙 재생 함수 호출
	}

	onMount(searchTracks);
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
		{#each $searchResults as track, index}
			<div class="track">
				<img src={track.album.images[0]?.url} alt="Album Cover" />
				<div>
					<strong>{track.name}</strong>
					<p>{track.artists.map((artist: any) => artist.name).join(', ')}</p>
				</div>
				<button on:click={() => selectTrack(track, index)}>▶️ 재생</button>
			</div>
		{/each}
	</div>
{/if}

<!-- ✅ 현재 재생 중인 트랙 및 가사 표시 -->
{#if currentTrack}
	<div class="now-playing">
		<h2>{currentTrack.name} - {currentTrack.artists.map(a => a.name).join(', ')}</h2>
		<p class="lyrics">{lyrics}</p>
	</div>
{/if}

<style>
	.search-container {
		text-align: center;
		margin-bottom: 20px;
		display: flex;
		flex-direction: row;
	}
	input {
		padding: 10px;
		width: 60%;
		height: 45px;
		border: 1px solid #ccc;
		border-radius: 5px;
		font-size: 16px;
		box-sizing: border-box;
		margin-right: 20px;
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
		cursor: pointer;
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
	.search-container button {
		white-space: nowrap;
		background: #1db954;
		color: white;
		border: none;
		padding: 8px 12px;
		font-size: 14px;
		border-radius: 5px;
		cursor: pointer;
		transition: background 0.3s;
		width: 50px;
		height: 45px;
	}
	.search-container button:hover {
		background: palevioletred;
	}
	.track button {
		background: #1db954;
		color: white;
		border: none;
		padding: 8px 12px;
		font-size: 14px;
		border-radius: 5px;
		cursor: pointer;
		transition: background 0.3s;
		margin-left: 10px;
	}
	.track button:hover {
		background-color: hotpink;
	}

	.now-playing {
		background: black;
		color: white;
		padding: 20px;
		border-radius: 10px;
		margin-top: 20px;
		text-align: center;
	}

	.lyrics {
		white-space: pre-line;
		margin-top: 10px;
		color: #ddd;
		font-size: 16px;
		font-family: "Arial", sans-serif;
	}
</style>

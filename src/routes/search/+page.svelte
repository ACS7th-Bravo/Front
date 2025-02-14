<script lang="ts">
	import { onMount } from 'svelte';
	import { searchQuery, searchResults } from '$lib/searchStore.js';
	import { get } from 'svelte/store';
	import { playTrack } from '$lib/trackPlayer.js';

	const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

	// ✅ Spotify에서 트랙 검색 (백엔드 호출)
	async function searchTracks() {
		if (!get(searchQuery)) return;

		try {
			const res = await fetch(
				`${backendUrl}/api/spotify/search?q=${encodeURIComponent(get(searchQuery))}`,
				{
					headers: {
						'Content-Type': 'application/json',
						'ngrok-skip-browser-warning': '69420',
					},
				}
			);
			if (!res.ok) throw new Error(`HTTP 오류! 상태 코드: ${res.status}`);
			const data = await res.json();

			console.log("🔍 프론트엔드에서 받은 데이터:", data); // ✅ 디버깅 로그 추가
			searchResults.set(data);
		} catch (error) {
			console.error('❌ Spotify 검색 요청 실패:', error);
		}
	}

	onMount(searchTracks);
</script>

<div class="search-container">
	<input
		type="text"
		bind:value={$searchQuery}
		placeholder="🔎 Search"
		on:keydown={(e) => e.key === 'Enter' && searchTracks()}
	/>
	<button on:click={searchTracks}>검색</button>
</div>

<!-- 준현 수정 (아닐 수도 있음)-->
{#if $searchResults && Array.isArray($searchResults) && $searchResults.length > 0}
	<div class="track-list">
		<h3>검색 결과:</h3>
		{#each $searchResults as track, index}
			<div class="track">
				<img src={track.imageUrl || '/default-album.png'} alt="Album Cover" />
				<div>
					<strong>{track.name}</strong>
					<p>{track.artist || "알 수 없음"}</p>
				</div>
				<button on:click={() => playTrack(track, index)}>▶️ 재생</button>
			</div>
		{/each}
	</div>
{/if}


<style>
	.search-container {
		margin-top: 5px;
		text-align: center;
		margin-bottom: 20px;
		display: flex;
		flex-direction: row;
		
	}
	input {
		padding: 10px;
		width: 60%;
		height: 45px;
		border: 1px solid #626262;
		border-radius: 15px;
		font-size: 16px;
		box-sizing: border-box;
		margin-right: 20px;
		margin-left: 5px;
		background-color: #626262;
		color: white; /* 입력한 글자 색상 */
		transition: border 0.5s ease, background-color 0.5s ease; /* 테두리 전환 효과 추가 */


	}
	input::placeholder {
  color: white; /* placeholder 글자 색상 */
}

input:hover{
	background-color: #7c7c7c;

}

input:focus {
  outline: none;
  border: 2px solid white;
	background-color: #7c7c7c;
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
		box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);

	}

	h3{
		margin-left: 5px;
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
		margin-left: auto;
	}
	.track button:hover {
		background-color: hotpink;
	}
</style>

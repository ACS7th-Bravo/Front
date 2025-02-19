<!-- /bravo-front/src/routes/search/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	// 기존 getAccessToken() 호출 제거 (토큰 관리는 백엔드에서 함)
	import { searchQuery, searchResults } from '$lib/searchStore.js';
	import { get } from 'svelte/store';
	import { playTrack } from '$lib/trackPlayer.js';
	import { playlist, addTrackToPlaylist } from '$lib/playlistStore.js';
	// 변경된 부분: 현재 사용자 정보를 context에서 가져와 이메일 사용
	import { getContext } from 'svelte';
	const currentUser = getContext('currentUser');
	let userEmail = '';
	if (currentUser && currentUser.email) {
		userEmail = currentUser.email;
	}

	// .env 파일에 설정된 백엔드 URL을 사용합니다.
	const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

	// ✅ Spotify에서 트랙 검색 (백엔드 호출)
	async function searchTracks() {
		if (!get(searchQuery)) return;

		try {
			const res = await fetch(
				`${backendUrl}/api/spotify/search?q=${encodeURIComponent(get(searchQuery))}`,
				{
					headers: {
						'Content-Type': 'application/json', // ✅ JSON 요청
						'ngrok-skip-browser-warning': '69420' // ✅ ngrok 보안 경고 우회
					}
				}
			);
			if (!res.ok) throw new Error(`HTTP 오류! 상태 코드: ${res.status}`);
			const data = await res.json();
			searchResults.set(data);
		} catch (error) {
			console.error('❌ Spotify 검색 요청 실패:', error);
		}
	}

	// 변경된 부분: 플레이리스트에 트랙 추가하는 함수
	function addToPlaylist(track, index) {
		// 로컬 스토어 업데이트와 함께 DB에 저장 (userEmail를 인자로 전달)
		addTrackToPlaylist(track, userEmail);
		console.log('플레이리스트에 추가:', track);
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

{#if $searchResults.length > 0}
	<div class="track-list">
		<h3>검색 결과:</h3>
		{#each $searchResults as track, index}
			<div class="track">
				<img
					src={track.album?.images[0]?.url || track.imageUrl || '/default-album.png'}
					alt="Album Cover"
				/>
				<div>
					<strong>{track.name}</strong>
					<p>
						{track.artists?.map((artist) => artist.name).join(', ') || track.artist || '알 수 없음'}
					</p>
				</div>
				<div class="track-buttons">
					<!-- 변경된 부분: addToPlaylist 함수 호출 -->
					<button class="playlist-add-btn" on:click={() => addToPlaylist(track, index)}> + </button>
					<button class="playlist-play-btn" on:click={() => playTrack(track, index)}>▶️ 재생</button
					>
				</div>
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
		transition:
			border 0.5s ease,
			background-color 0.5s ease;
		cursor: pointer;
	}
	input::placeholder {
		color: white; /* placeholder 글자 색상 */
	}
	input:hover {
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
	h3 {
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
	.track-buttons {
		margin-left: auto;
		display: flex;
		gap: 8px; /* 버튼 간 간격 */
	}
	.track .playlist-play-btn {
		background: #1db954;
		color: white;
		border: none;
		padding: 8px 12px;
		font-size: 14px;
		border-radius: 5px;
		cursor: pointer;
		transition: background 0.3s;
	}
	/* 플레이리스트 추가 버튼에는 margin-left auto를 제거해 왼쪽에 위치시키고, 값 간격을 조정 */
	.track .playlist-add-btn {
		border: none;
		font-size: 40px;
		font-weight: bold;
		cursor: pointer;
		background: none;
		color: rgb(255, 255, 255);
		-webkit-text-stroke: 1px #1db954; /* 글씨 테두리 */
	}
	.playlist-add-btn:hover {
		color: hotpink;
	}
</style>

<!-- /bravo-front/src/routes/playlistManager/+page.svelte -->
<script>
	import { onMount, getContext } from 'svelte';
	import { playlistManager } from '$lib/playlistManagerStore.js';
	import { playTrack } from '$lib/trackPlayer.js'; // playTrack 함수 임포트

	const currentUser = getContext('currentUser');
	let userEmail = '';
	if (currentUser && currentUser.email) {
		userEmail = currentUser.email;
	}

	const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

	// 각 플레이리스트 그룹(playlist)의 토글 상태를 저장
	let expandedGroups = {};
	// 재생할 트랙 정보를 저장 (클릭 시 activeTrack에 저장)
	let activeTrack = null;

	// 그룹 토글 함수: 해당 그룹을 펼치거나 접습니다.
	function toggleGroup(playlistId) {
		expandedGroups[playlistId] = !expandedGroups[playlistId];
	}

	// 트랙 클릭 시 재생할 트랙을 설정하는 함수입니다.
	function selectTrack(track) {
		activeTrack = track;
	}

	onMount(async () => {
		try {
			// DB에서는 user.email을 기준으로 플레이리스트를 조회합니다.
			const res = await fetch(`${backendUrl}/api/playlist?user_id=${userEmail}`);
			if (!res.ok) {
				throw new Error('플레이리스트 조회 실패');
			}
			const playlists = await res.json();
			playlistManager.set(playlists);
		} catch (error) {
			console.error(error);
		}
	});
</script>

{#if $playlistManager.length > 0}
	<ul>
		{#each $playlistManager as playlist (playlist._id)}
			<li>
				<button type="button" on:click={() => toggleGroup(playlist._id)} class="playlist-toggle">
					{playlist.name}
					{#if expandedGroups[playlist._id]}
						&#9660; <!-- 내림차순 아이콘 -->
					{:else}
						&#9658; <!-- 오른쪽 화살표 아이콘 -->
					{/if}
				</button>
				{#if expandedGroups[playlist._id]}
					<ul>
						{#each playlist.tracks as track}
							<li class="track-item">
								<div class="track-info">
									<button type="button" on:click={() => selectTrack(track)} class="track-button">
										<span>{track.title}</span> - <span>{track.artist}</span>
										<img src={track.albumImage} alt={track.title} width="50" />
									</button>
								</div>

								<!-- 재생 버튼 -->
								<div class="play-button-container">
									<button
										type="button"
										on:click={() => playTrack(track, playlist.tracks.indexOf(track))}
										class="play-button"
									>
										▶️ 재생
									</button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>
{:else}
	<p>등록된 플레이리스트가 없습니다.</p>
{/if}

{#if activeTrack}
	<div class="now-playing">
		<h3>Now Playing: {activeTrack.title} - {activeTrack.artist}</h3>
		{#if activeTrack.audioUrl}
			<audio controls src={activeTrack.audioUrl}></audio>
		{:else}
			<p>재생 가능한 오디오 파일이 없습니다.</p>
		{/if}
	</div>
{/if}

<style>
	.playlist-toggle {
		cursor: pointer;
		font-weight: bold;
	}

	.track-item {
		display: flex;
		align-items: center;
	}

	.track-info {
		display: flex;
		align-items: center;
		cursor: pointer;
	}

	.track-button {
		background: transparent;
		border: none;
		padding: 0;
		color: inherit;
		display: flex;
		align-items: center;
		flex-grow: 1;
	}

	.track-button img {
		margin-left: 10px;
	}

	.play-button-container {
		margin-left: 10px;
	}

	.play-button {
		background: #1db954;
		color: white;
		border: none;
		padding: 5px 10px;
		font-size: 12px;
		border-radius: 5px;
		cursor: pointer;
	}

	.play-button:hover {
		background-color: #1a8e3f;
	}

	.now-playing {
		margin-top: 20px;
	}
</style>

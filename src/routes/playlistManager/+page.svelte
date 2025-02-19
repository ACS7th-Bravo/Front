<!-- /bravo-front/src/routes/playlistManager/+page.svelte -->

<script>
	import { onMount, getContext } from 'svelte';
	import { playlistManager } from '$lib/playlistManagerStore.js';
	import { playTrack, getYouTubeVideo } from '$lib/trackPlayer.js';

	const currentUser = getContext('currentUser');
	let userName = '';
	if (currentUser && currentUser.name) {
		userName = currentUser.name;
	}
	let userEmail = '';
	if (currentUser && currentUser.email) {
		userEmail = currentUser.email;
	}
	const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

	let expandedGroups = {};

	function toggleGroup(playlistId) {
		expandedGroups[playlistId] = !expandedGroups[playlistId];
	}

	// [변경됨: 전역 재생 큐 context를 컴포넌트 초기화 시 가져와서 변수에 저장]
	const currentQueue = getContext('currentQueue');

	onMount(async () => {
		if (userEmail) {
			try {
				const res = await fetch(`${backendUrl}/api/playlist?user_id=${userEmail}`, {
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						'ngrok-skip-browser-warning': '69420'
					}
				});
				if (!res.ok) {
					throw new Error('플레이리스트 조회 실패');
				}
				const text = await res.text();
				console.log('응답 텍스트:', text);
				const data = JSON.parse(text);
				playlistManager.set(data);
			} catch (error) {
				console.error(error);
			}
		}
	});
</script>

{#if !userEmail}
	<div class="login-prompt">
		플레이리스트를 확인하려면 로그인이 필요합니다. 로그인 페이지로 이동해주세요.
	</div>
{:else}
	<div class="playlist-manager-container">
		<h2>{userName}의 플레이리스트</h2>
		{#if $playlistManager.length > 0}
			<div class="playlist-group-list">
				{#each $playlistManager as playlist (playlist._id)}
					<div class="playlist-group">
						<button
							type="button"
							on:click={() => toggleGroup(playlist._id)}
							class="playlist-group-header"
						>
							<span>{playlist.name}</span>
							<span class="toggle-icon">
								{#if expandedGroups[playlist._id]}
									&#9660;
								{:else}
									&#9658;
								{/if}
							</span>
						</button>
						{#if expandedGroups[playlist._id]}
							<div class="playlist-tracks">
								{#each playlist.tracks as track}
									<div class="track">
										<!-- 변경된 부분: DB 필드명 album_image, track_name, artist_name 사용 -->
										<img src={track.album_image} alt={track.track_name} class="track-album" />
										<div class="track-info">
											<strong>{track.track_name}</strong>
											<p>{track.artist_name}</p>
										</div>
										<button
											type="button"
											on:click={() => {
												// [변경됨: 트랙 정보 재구성]
												const formattedTrack = {
													...track,
													// playTrack() 내부에서는 track.id, track.name, track.artist, track.imageUrl 사용
													id: track.track_id, // 필수: track_id
													name: track.track_name, // 필수: track_name
													artist: track.artist_name, // 필수: artist_name
													artist_id: track.artist_id, // 필수: artist_id
													album_id: track.album_id, // 필수: album_id
													imageUrl: track.album_image, // 필수: album_image
													englishTrackName: track.track_name, // (필요 시)
													englishArtistName: track.artist_name,
													source: 'playlist'
												};

												// 현재 재생 큐를 이 플레이리스트의 전체 트랙 배열로 설정
												currentQueue.set(
													playlist.tracks.map((t) => ({
														id: t.track_id,
														name: t.track_name,
														artist: t.artist_name,
														artist_id: t.artist_id,
														album_id: t.album_id,
														imageUrl: t.album_image,
														englishTrackName: t.track_name,
														englishArtistName: t.artist_name,
														source: 'playlist'
													}))
												);
												// 플레이리스트 내에서 해당 트랙의 인덱스를 찾음
												const indexInPlaylist = playlist.tracks.findIndex(
													(t) => t.track_id === track.track_id
												);
												playTrack(formattedTrack, indexInPlaylist);
											}}
											class="play-btn"
										>
											▶️
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p>등록된 플레이리스트가 없습니다.</p>
		{/if}
	</div>
{/if}

<style>
	/* 기존 스타일 그대로 */
	.playlist-manager-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
	}
	h2 {
		text-align: center;
		margin-bottom: 20px;
	}
	.playlist-group {
		margin-bottom: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
	}
	.playlist-group-header {
		width: 100%;
		background-color: #1db954;
		color: white;
		border: none;
		padding: 12px;
		font-size: 18px;
		text-align: left;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		transition: background-color 0.3s;
	}
	.playlist-group-header:hover {
		background-color: #17a048;
	}
	.playlist-tracks {
		background: #f9f9f9;
		padding: 10px;
	}
	.track {
		display: flex;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #eee;
	}
	.track:last-child {
		border-bottom: none;
	}
	.track-album {
		width: 50px;
		height: 50px;
		margin-right: 10px;
		box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
	}

	.track-info {
		color: black;
	}
	.track-info strong {
		display: block;
		font-size: 16px;
	}
	.track-info p {
		margin: 0;
		font-size: 14px;
		color: #666;
	}
	.play-btn {
		margin-left: auto;
		background-color: #1db954;
		border: none;
		color: white;
		padding: 8px 12px;
		font-size: 14px;
		border-radius: 5px;
		cursor: pointer;
		transition: background 0.3s;
	}
	.play-btn:hover {
		background-color: hotpink;
	}
	.login-prompt {
		text-align: center;
		margin-top: 50px;
		font-size: 1.5rem;
		color: #666;
	}
</style>
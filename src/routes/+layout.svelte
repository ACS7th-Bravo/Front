<!-- /bravo-front/src/routes/+layout.svelte -->
<script>
	import { onMount, setContext } from 'svelte'; //2025.02.14 DB 이메일 추출출, onmount랑 합침침
	import { writable, get } from 'svelte/store'; // ✅ writable 추가
	import { page } from '$app/stores'; // ← 추가!
 
	import { youtubeApiKey } from '$lib/youtubeStore.js';
	import { searchResults } from '$lib/searchStore.js'; // ✅ 추가
	import { playTrack } from '$lib/trackPlayer.js';
	import { goto } from '$app/navigation'; //곡 상세페이지로 넘어가는 함수
	import { jwtDecode } from 'jwt-decode';
 
	import { playlistManager } from '$lib/playlistManagerStore.js';
	import { playlist } from '$lib/playlistStore.js';
 
	const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
 
	// 로그인 상태 및 사용자 정보
	let isLoggedIn = false;
	let user = { email: '', picture: '' }; //2025.02.14 DB 이메일 추출
 
	console.log('백엔드 URL:', import.meta.env.VITE_BACKEND_URL);
 
	// 기본 볼륨 값을 50로 설정 (0 ~ 100)
	let volume = 50;
	let isPlaying = false;
	let youtubePlayer;
	let currentYouTubeVideoId = null;
	let currentTrackIndex = -1; // ✅ 현재 재생 중인 곡의 인덱스 추가
 
	// 로그아웃: 로컬 스토리지에서 토큰 삭제 후 메인 페이지 이동
	function logout() {
		localStorage.removeItem('jwt_token');
		isLoggedIn = false;
		user = { email: '', name: '', picture: '' }; // 2025.02.14 플레이리스트트
		window.location.href = '/';
	}
 
	// ✅ 현재 재생 중인 트랙 정보
	let currentTrack = writable({
		name: 'IT-DA',
		artist: 'Team-Bravo',
		albumImage: '/logo2.png'
	});
 
	// ✅ Svelte context에 currentTrack 등록 (하위 페이지에서 사용 가능)
	setContext('currentTrack', currentTrack);
 
	// ===== [추가된 부분] =====
	// 글로벌 가사 펼침 상태 스토어를 생성하고 context에 등록합니다.
	let lyricsExpanded = writable(false); // *** NEW: 글로벌 가사 펼침 상태 스토어 추가 ***
	setContext('lyricsExpanded', lyricsExpanded); // *** NEW: context에 등록 ***
	// ==========================
 
	// NEW: 전역에서 현재 재생시간을 공유할 스토어 생성 및 context에 등록
	let currentTimeStore = writable(0); /* NEW: 전역 currentTimeStore 생성 */
	setContext('currentTime', currentTimeStore);
	// ==========================
 
	// ✅ 프로그레스 바 관련 변수
	let currentTime = 0;
	let duration = 0;
	let progress = 0;
	let interval = null;
 
	//플레이어 글씨 자동 넘김
	let scrollingSongNameElement;
	let isSongNameScrollable = false;
	let scrollingArtistElement;
	let isArtistScrollable = false;
 
	// currentTrack 변화에 반응하도록 (dummy 변수를 사용)
	$: {
		// 현재 트랙의 변화에 의존하도록 dummy 변수를 사용
		const dummy = $currentTrack.name + $currentTrack.artist;
		setTimeout(() => {
			 if (scrollingSongNameElement) {
				 const distance =
					  scrollingSongNameElement.scrollWidth - scrollingSongNameElement.clientWidth;
				 isSongNameScrollable = distance > 0;
				 if (isSongNameScrollable) {
					  // 이동 시간(픽셀/초 속도 50px/s, 최소 5초)
					  const moveTime = Math.max(distance / 50, 5);
					  // 전체 애니메이션 시간 = 이동 시간 / 0.8 (즉, 80% 이동, 20% 정지)
					  const totalDuration = moveTime / 0.8;
					  scrollingSongNameElement.style.setProperty('--marquee-duration', `${totalDuration}s`);
					  scrollingSongNameElement.style.setProperty('--overflow-distance', `${distance}px`);
					  // 새로운 곡 재생 시 강제 재시작
					  scrollingSongNameElement.classList.remove('scrollable');
					  void scrollingSongNameElement.offsetWidth;
					  scrollingSongNameElement.classList.add('scrollable');
				 }
			 }
			 if (scrollingArtistElement) {
				 const distance = scrollingArtistElement.scrollWidth - scrollingArtistElement.clientWidth;
				 isArtistScrollable = distance > 0;
				 if (isArtistScrollable) {
					  const moveTime = Math.max(distance / 50, 5);
					  const totalDuration = moveTime / 0.8;
					  scrollingArtistElement.style.setProperty('--marquee-duration', `${totalDuration}s`);
					  scrollingArtistElement.style.setProperty('--overflow-distance', `${distance}px`);
					  scrollingArtistElement.classList.remove('scrollable');
					  void scrollingArtistElement.offsetWidth;
					  scrollingArtistElement.classList.add('scrollable');
				 }
			 }
		}, 0);
	}
 
	// 별도의 재시작 플래그 선언
	let marqueeRestartingSong = false;
	let marqueeRestartingArtist = false;
 
	// 이름 있는 이벤트 핸들러들
	function handleSongNameAnimationEnd() {
		// 애니메이션 종료 시 이벤트 리스너를 먼저 제거합니다.
		scrollingSongNameElement.removeEventListener('animationend', handleSongNameAnimationEnd);
		// 10초 대기 후 애니메이션을 재시작
		setTimeout(() => {
			 scrollingSongNameElement.classList.remove('scrollable');
			 // 강제 reflow로 애니메이션 리셋
			 void scrollingSongNameElement.offsetWidth;
			 scrollingSongNameElement.classList.add('scrollable');
			 // 새로 애니메이션 종료 이벤트를 등록
			 scrollingSongNameElement.addEventListener('animationend', handleSongNameAnimationEnd);
		}, 10000);
	}
 
	function handleArtistAnimationEnd() {
		scrollingArtistElement.removeEventListener('animationend', handleArtistAnimationEnd);
		setTimeout(() => {
			 scrollingArtistElement.classList.remove('scrollable');
			 void scrollingArtistElement.offsetWidth;
			 scrollingArtistElement.classList.add('scrollable');
			 scrollingArtistElement.addEventListener('animationend', handleArtistAnimationEnd);
		}, 10000);
	}
 
	// ✅ 시간 포맷 변환 (초 → mm:ss)
	function formatTime(seconds) {
		const min = Math.floor(seconds / 60);
		const sec = Math.floor(seconds % 60);
		return `${min}:${sec < 10 ? '0' : ''}${sec}`;
	}
 
	// 곡 상세페이지로 넘어가는 함수
	function navigateToSongPage() {
		const currentPath = get(page).url.pathname;
		if (currentPath === '/song') {
			 goto('/search');
		} else {
			 goto('/song');
		}
	}
 
	// ✅ 전역 플레이어에서 곡 재생
	// 준현 수정 - handlePlayTrack 부분 영문 이름 수정
	// ✅ 전역 플레이어에서 곡 재생
	function handlePlayTrack(event) {
		const { videoId, track, index } = event.detail;
		if (videoId) {
			 currentTrack.update((t) => ({
				 ...t,
				 track_id: track.id, // ← 추가: DB 업데이트에 사용될 track_id 저장
				 name: track.name,
				 artist: track.artist, // 이미 평탄화된 문자열 사용
				 albumImage: track.imageUrl || '/default-album.png',
				 englishTrackName: track.englishTrackName || track.name,
				 englishArtistName: track.englishArtistName || track.artist,
			 }));
 
			 currentYouTubeVideoId = videoId;
			 currentTrackIndex = index;
 
			 // 백엔드에 트랙 정보 저장 요청 (검색 API에서 반환된 평탄화된 필드 사용)
			 fetch(`${backendUrl}/api/track`, {
				 method: 'POST',
				 headers: { 'Content-Type': 'application/json' },
				 body: JSON.stringify({
					  track_id: track.id,
					  track_name: track.name,
					  artist_id: track.artist_id || 'unknown',
					  artist_name: track.artist || '알 수 없음',
					  album_id: track.album_id || 'unknown',
					  album_image: track.imageUrl || '/default-album.png',
					  streaming_id: videoId,
					  plain_lyrics: null,
					  parsed_lyrics: null,
					  lyrics_translation: null,
				 }),
			 })
				 .then((res) => res.json())
				 .then((data) => {
					  console.log('트랙 저장 결과:', data);
				 })
				 .catch((error) => {
					  console.error('트랙 저장 중 오류 발생:', error);
				 });
 
			 // YouTube 플레이어 초기화 또는 업데이트
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
						  rel: 0,
					  },
					  events: {
						  onReady: () => {
							   youtubePlayer.playVideo();
							   startProgressUpdate();
						  },
						  onStateChange: (event) => {
							   console.log('🎬 YouTube 플레이어 상태 변경:', event.data);
							   if (event.data === YT.PlayerState.ENDED) {
								   console.log('✅ 곡이 끝남! 다음 곡 자동 재생 시작...');
								   playNextTrack();
							   } else if (event.data === YT.PlayerState.PLAYING) {
								   console.log('▶️ 곡 재생 중...'); // [수정됨]
								   isPlaying = true;
								   startProgressUpdate();
							   } else if (event.data === YT.PlayerState.PAUSED) {
								   console.log('⏸️ 곡 일시 정지됨'); // [수정됨]
								   isPlaying = false;
							   } else {
								   console.log('⚠️ 알 수 없는 상태 코드:', event.data); // [수정됨]
								   clearInterval(interval);
							   }
						  },
					  },
				 });
			 } else {
				 youtubePlayer.loadVideoById(videoId);
				 startProgressUpdate();
			 }
			 isPlaying = true;
		}
	}
 
	// ✅ 다음 곡 자동 재생 함수
	async function playNextTrack() {
		console.log('⏭️ playNextTrack() 호출됨!'); // [수정됨]
		const tracks = $searchResults;
		console.log('🔍 현재 검색된 트랙 목록:', tracks);
		console.log('🎵 현재 트랙 인덱스:', currentTrackIndex);
		if (currentTrackIndex < tracks.length - 1) {
			 const nextTrack = tracks[currentTrackIndex + 1];
			 console.log('✅ 다음 재생할 트랙:', nextTrack);
			 // ✅ 기존의 playTrack() 함수를 호출하여 자동 재생
			 playTrack(nextTrack, currentTrackIndex + 1);
		} else {
			 console.log('⏹️ 더 이상 재생할 트랙이 없습니다.'); // [수정됨]
		}
	}
 
	// 이전 곡 재생 함수 추가
	function playPreviousTrack() {
		console.log('⏮️ playPreviousTrack() 호출됨!'); // [수정됨]
		if (currentTime > 3) {
			 console.log('현재 재생시간이 3초 이상이므로, 현재 곡을 처음으로 되돌립니다.');
			 if (youtubePlayer && youtubePlayer.seekTo) {
				 youtubePlayer.seekTo(0, true);
			 }
		} else {
			 const tracks = $searchResults;
			 console.log('현재 트랙 인덱스:', currentTrackIndex);
			 if (currentTrackIndex > 0) {
				 const prevTrack = tracks[currentTrackIndex - 1];
				 console.log('이전 재생할 트랙:', prevTrack);
				 playTrack(prevTrack, currentTrackIndex - 1);
			 } else {
				 console.log('이전 곡이 없습니다. 현재 곡을 처음으로 되돌립니다.');
				 if (youtubePlayer && youtubePlayer.seekTo) {
					  youtubePlayer.seekTo(0, true);
				 }
			 }
		}
	}
 
	// ✅ 현재 재생 시간을 업데이트하는 함수
	function startProgressUpdate() {
		clearInterval(interval);
		interval = setInterval(() => {
			 if (youtubePlayer && youtubePlayer.getCurrentTime) {
				 currentTime = youtubePlayer.getCurrentTime();
				 duration = youtubePlayer.getDuration();
				 progress = (currentTime / duration) * 100;
				 currentTimeStore.set(currentTime);
			 }
		}, 500);
	}
 
	// ✅ 사용자가 슬라이더 이동 시 특정 위치로 이동
	function seekTrack(event) {
		const newTime = (event.target.value / 100) * duration;
		youtubePlayer.seekTo(newTime, true);
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
 
	// 볼륨 업데이트 함수: 슬라이더 값이 변경될 때 호출
	function updateVolume(event) {
		const target = event.target;
		volume = +target.value;
		if (youtubePlayer) {
			 youtubePlayer.setVolume(volume);
		}
	}
 
	// ✅ YouTube API 로드
	function loadYouTubeAPI() {
		const script = document.createElement('script');
		script.src = 'https://www.youtube.com/iframe_api';
		script.async = true;
		document.body.appendChild(script);
	}
 
	// ✅ 앱 시작: Spotify 토큰 체크 제거, YouTube API 로드, 이벤트 리스너 등록
	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const tokenFromUrl = urlParams.get('token');
		if (tokenFromUrl) {
			 localStorage.setItem('jwt_token', tokenFromUrl);
			 isLoggedIn = true;
			 try {
				 const decoded = jwtDecode(tokenFromUrl);
				 user = {
					  email: decoded.email,
					  name: decoded.name,
					  picture: decoded.picture
				 };
				 console.log('디코딩된 JWT:', decoded);
				 setContext('currentUser', user);
			 } catch (error) {
				 console.error('JWT 디코딩 오류:', error);
			 }
			 window.history.replaceState({}, document.title, '/');
		} else {
			 const savedToken = localStorage.getItem('jwt_token');
			 if (savedToken) {
				 isLoggedIn = true;
				 try {
					  const decoded = jwtDecode(savedToken);
					  user = {
						  email: decoded.email,
						  name: decoded.name,
						  picture: decoded.picture
					  };
					  console.log('디코딩된 JWT:', decoded);
					  setContext('currentUser', user);
				 } catch (error) {
					  console.error('JWT 디코딩 오류:', error);
				 }
			 } else {
				 isLoggedIn = false;
			 }
		}
		console.log('🚀 앱 시작...');
		loadYouTubeAPI();
		window.addEventListener('playTrack', handlePlayTrack);
		setTimeout(() => {
			 if (scrollingSongNameElement) {
				 isSongNameScrollable =
					  scrollingSongNameElement.scrollWidth > scrollingSongNameElement.clientWidth;
				 scrollingSongNameElement.addEventListener('animationend', handleSongNameAnimationEnd);
			 }
			 if (scrollingArtistElement) {
				 isArtistScrollable =
					  scrollingArtistElement.scrollWidth > scrollingArtistElement.clientWidth;
				 scrollingArtistElement.addEventListener('animationend', handleArtistAnimationEnd);
			 }
		}, 0);
		return () => {
			 window.removeEventListener('playTrack', handlePlayTrack);
			 if (scrollingSongNameElement) {
				 scrollingSongNameElement.removeEventListener('animationend', handleSongNameAnimationEnd);
			 }
			 if (scrollingArtistElement) {
				 scrollingArtistElement.removeEventListener('animationend', handleArtistAnimationEnd);
			 }
		};
	});
 
	// ✅ 플레이리스트 토글 여부 (on/off) 상태 추가 02.13 플레이리스트트
	let showPlaylist = false;
	function togglePlaylist() {
		showPlaylist = !showPlaylist;
	}
 
	// ★ 삭제 기능: 전달받은 인덱스의 트랙을 플레이리스트에서 제거
	function removeFromPlaylist(index) {
		playlist.update((tracks) => tracks.filter((_, i) => i !== index));
	}
 
	let showCreatePlaylist = false;
	let newPlaylistName = '';
 
	function toggleCreatePlaylist() {
		showCreatePlaylist = !showCreatePlaylist;
	}
 
	function createPlaylist() {
		if (newPlaylistName.trim() !== '') {
			 playlist.update((currentList) => [...currentList, { id: Date.now(), name: newPlaylistName }]);
			 newPlaylistName = '';
			 showCreatePlaylist = false;
		}
	}
 
	// ===============================
	// 신규: 플레이리스트 그룹 생성을 위한 변수와 함수 2025.02.14 플레이리스트트
	let showCreatePlaylistGroup = false;
	let newPlaylistGroupName = '';
 
	function toggleCreatePlaylistGroup() {
		showCreatePlaylistGroup = !showCreatePlaylistGroup;
	}
 
	function createPlaylistGroup() {
		if (newPlaylistGroupName.trim() !== '') {
			 const newPlaylistGroup = {
				 user_id: user.email || '로그인된사용자아이디',
				 name: newPlaylistGroupName,
				 tracks: $playlist.map((track) => ({
					  trackId: track.id,
					  title: track.name,
					  artist: track.artists?.map((a) => a.name).join(', ') || track.artist || '알 수 없음',
					  albumImage: track.album?.images[0]?.url || track.imageUrl || ''
				 }))
			 };
			 fetch(`${backendUrl}/api/playlist`, {
				 method: 'POST',
				 headers: { 'Content-Type': 'application/json' },
				 body: JSON.stringify(newPlaylistGroup)
			 })
				 .then((response) => {
					  if (!response.ok) {
						  throw new Error('플레이리스트 그룹 생성 실패');
					  }
					  return response.json();
				 })
				 .then((savedGroup) => {
					  playlistManager.update((groups) => [...groups, savedGroup]);
					  newPlaylistGroupName = '';
					  showCreatePlaylistGroup = false;
				 })
				 .catch((error) => {
					  console.error('Error creating playlist group:', error);
				 });
		}
	}
 </script>
 
 <!-- 로그인/로그아웃 버튼과 사용자 정보는 오른쪽 상단에 고정 -->
 
 <div class="layout">
	<div class="sidebar">
		<h2><a href="/">It-Da</a></h2>
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
			 <li><a href="/playlistManager">Playlist</a></li>
		</ul>
 
		<div class="logo-container">
			 <img src="/logo2.png" alt="Logo" class="logo-image" />
		</div>
	</div>
 
	<div class="main-content">
		<div class="inner-main">
			 <h1 class="typing">It Da!</h1>
			 <div class="login-header" style="top: 0; right: 0; z-index: 1010; padding: 10px;">
				 {#if isLoggedIn}
					  <div class="user-info">
						  <img
							   src={user.picture}
							   alt="{user.name}'s profile picture"
							   style="width:40px; height:40px; border-radius:50%;"
						  />
						  <span>반갑습니다! {user.name} 님</span>
						  <button on:click={logout} style="margin-left: 10px;">로그아웃</button>
						  <button on:click={togglePlaylist}>
							   {showPlaylist ? '플레이리스트 숨기기' : '플레이리스트 보기'}
						  </button>
					  </div>
				 {:else}
					  <button
						  on:click={() =>
							   (window.location.href = `${backendUrl}/api/google/google-login?prompt=select_account`)}
					  >
						  구글 로그인
					  </button>
				 {/if}
			 </div>
		</div>
		<slot />
	</div>
 
	{#if showPlaylist}
		<!-- 02.13 플레이리스트트 -->
		<div class="playlist">
			 <h2>Playlist</h2>
			 {#if $playlist.length > 0}
				 <ul>
					  {#each $playlist as track, index}
						  <li class="playlist-track">
							   <img src={track.album?.images[0]?.url || track.imageUrl || '/default-album.png'} alt="Album Cover" width="30" height="30" />
							   <span class="track-info"
								   >      {track.name} - {track.artists?.map((artist) => artist.name).join(', ') || track.artist || '알 수 없음'}
								   </span>
							   <!-- 삭제 버튼을 오른쪽에 고정 -->
							   <button class="delete-btn" on:click={() => removeFromPlaylist(index)}>-</button>
						  </li>
					  {/each}
				 </ul>
			 {:else}
				 <p>플레이리스트가 비어 있습니다.</p>
			 {/if}
 
			 <!-- 동일한 그룹(컨테이너) 내에서 플레이리스트 그룹 UI 추가 -->
			 <div class="playlist-group-creation">
				 {#if !showCreatePlaylistGroup}
					  <button on:click={toggleCreatePlaylistGroup}>플레이리스트 그룹 생성</button>
				 {:else}
					  <input
						  type="text"
						  bind:value={newPlaylistGroupName}
						  placeholder="플레이리스트 그룹 이름 입력"
					  />
					  <button on:click={createPlaylistGroup}>생성</button>
					  <button on:click={toggleCreatePlaylistGroup}>취소</button>
				 {/if}
			 </div>
		</div>
	{/if}
 
	<!-- ✅ 전역 플레이어 -->
	<div class="player">
		<a href="/song" tabindex="0" role="button" on:click|preventDefault={navigateToSongPage}>
			 <img src={$currentTrack?.albumImage || ''} alt="Album Cover" class="player-album-cover" />
		</a>
		<div class="player-track-info">
			 <div
				 class="scrolling-text song-name"
				 bind:this={scrollingSongNameElement}
				 class:scrollable={isSongNameScrollable}
			 >
				 <strong>{$currentTrack.name}</strong>
			 </div>
			 <div
				 class="scrolling-text artist-name"
				 bind:this={scrollingArtistElement}
				 class:scrollable={isArtistScrollable}
			 >
				 <p>{$currentTrack.artist}</p>
			 </div>
		</div>
 
		<!-- ✅ 현재 재생 시간 / 총 길이 표시 -->
		<div class="wrap-time">
			 <div class="time-info">
				 <button on:click={playPreviousTrack}>⏮️</button>
				 <button on:click={togglePause}>
					  {isPlaying ? '⏸️' : '▶️'}
				 </button>
				 <button on:click={playNextTrack}>⏭️</button>
 
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
		<!-- 볼륨 조절 컨트롤 -->
		<div class="volume-control">
			 <span>Vol</span>
			 <input
				 type="range"
				 min="0"
				 max="100"
				 step="1"
				 bind:value={volume}
				 on:input={updateVolume}
				 class="volume-slider"
			 />
		</div>
	</div>
 
	<div id="youtube-player"></div>
 </div>
 
 <style>
	:global(body) {
		/* this will apply to <body> */
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
	.layout {
		display: flex;
		height: 100vh;
		overflow: hidden;
		z-index: 1000;
	}
 
	.sidebar {
		width: 250px;
		background-color: white;
		color: black;
		text-decoration: none;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
 
	.main-content h1 {
		position: sticky;
		top: 0;
		z-index: 2; /* slot 콘텐츠보다 위에 표시 */
		background-color: black; /* 배경색을 지정하여 아래 내용과 구분 */
		margin: 0;
		padding: 10px;
	}
 
	.sidebar h2,
	h3,
	nav {
		padding-left: 20px;
	}
 
	/* .logo-image {
			 position: absolute;
			 bottom: 50px; 
			 width: 250px;
	} */
 
	.logo-container {
		width: 100%; /* ✅ 사이드바 크기에 맞게 설정 */
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: auto; /* ✅ 사이드바의 하단에 정렬 */
		gap: 20px;
		padding-bottom: 70px;
	}
 
	.logo-image {
		width: 100%; /* ✅ 사이드바 크기에 맞게 조절 */
		max-width: 200px; /* ✅ 최대 크기 제한 */
		object-fit: contain; /* ✅ 이미지 비율 유지 */
		transition: width 0.3s ease-in-out; /* ✅ 크기 변화 애니메이션 */
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
		overflow: auto;
		padding-bottom: 70px;
		position: relative; /* 추가: main-content 내의 절대 위치 요소 기준 */
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
		display: flex;
		padding: 0 40px 0 20px;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
		z-index: 100;
	}
 
	.player img {
		width: 50px;
		height: 50px;
		border-radius: 5px;
		margin-right: 10px;
		box-shadow: 0 0 5px rgba(255, 255, 255, 0.6); /* ✅ 부드러운 흰색 박스 쉐도우 */
	}
 
	.player-track-info {
		width: 150px; /* 고정 너비 */
		overflow: hidden; /* 넘치는 텍스트 숨김 */
		white-space: nowrap; /* 한 줄로 표시 */
	}
 
	.scrolling-text {
		white-space: nowrap;
	}
	/* 'scrollable' 클래스가 있을 때만 marquee 애니메이션 적용 */
	/* 'scrollable' 클래스가 있을 때만 marquee 애니메이션 적용, 1회 실행 */
	.scrolling-text.scrollable {
		/* 전체 애니메이션 시간은 CSS 변수로 계산된 값, 1회 실행 */
		animation: marquee var(--marquee-duration, 10s) linear 1;
	}
 
	@keyframes marquee {
		0% {
			 transform: translateX(0);
		}
		80% {
			 transform: translateX(calc(-1 * var(--overflow-distance)));
		}
		100% {
			 transform: translateX(calc(-1 * var(--overflow-distance)));
		}
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
 
	/* ✅ 프로그레스 바 스타일 */
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
 
	.user-info span {
		color: white;
	}
 
	.login-header button {
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
 
	.login-header button:hover {
		background-color: hotpink;
	}
 
	/* 볼륨 컨트롤 영역 */
	.volume-control {
		display: flex;
		align-items: center;
		gap: 5px;
		margin-left: 20px; /* 필요에 따라 위치 조정 */
		margin-right: 50px;
	}
 
	/* 볼륨 슬라이더 스타일 */
	.volume-slider {
		width: 100px; /* 슬라이더 너비 조정 */
		appearance: none;
		background: #555;
		height: 5px;
		border-radius: 5px;
		cursor: pointer;
	}
 
	/* 웹킷 기반 브라우저용 슬라이더 thumb 스타일 */
	.volume-slider::-webkit-slider-thumb {
		appearance: none;
		background: #1db954;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		cursor: pointer;
	}
 
	/* 파이어폭스 등 다른 브라우저 지원 */
	.volume-slider::-moz-range-thumb {
		background: #1db954;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		cursor: pointer;
	}
 
	/* ===== 플레이리스트 영역 스타일 ===== 02.13 플레이리스트트 */
	.playlist {
		width: 250px;
		background: rgb(255, 70, 70);
		color: black;
		padding: 20px;
		overflow-y: auto;
		margin-bottom: 50px;
		z-index: 3;
	}
 
	.playlist h2 {
		position: fixed;
	}
 
	.playlist-track {
		display: flex;
		align-items: center;
		padding: 5px 0;
	}
 
	/* 트랙 정보에 약간의 여백 추가 */
	.track-info {
		margin-left: 10px;
	}
 
	/* 삭제 버튼을 오른쪽에 고정 */
	.delete-btn {
		margin-left: auto;
		background: none;
		border: none;
		font-size: 40px;
		font-weight: bold;
		cursor: pointer;
		color: rgb(255, 255, 255);
	}
 
	.delete-btn:hover {
		color: rgb(0, 255, 60);
	}
 
	/* 신규: 플레이리스트 그룹 생성 UI 스타일 */
	.playlist-group-creation {
		margin-top: 1rem;
		text-align: center;
	}
 
	/* 버튼과 인풋이 실제 렌더링 될 때 적용되도록 :global 사용 */
	.playlist-group-creation :global(button),
	.playlist-group-creation :global(input) {
		padding: 8px 12px;
		font-size: 14px;
		border: none;
		border-radius: 5px;
		outline: none;
		margin: 0.5rem;
	}
	.inner-main {
		display: flex;
		justify-content: space-between; /* 양쪽 정렬 */
		align-items: center; /* 세로 중앙 정렬 */
		padding: 10px;
		z-index: 2;
		background-color: black;
	}
 </style>
 
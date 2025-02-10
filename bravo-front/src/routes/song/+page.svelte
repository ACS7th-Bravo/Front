<script>
	import { getContext, onMount, tick } from 'svelte';
	import { writable } from 'svelte/store';

	// ✅ `+layout.svelte`에서 공유한 currentTrack 가져오기
	let currentTrack = getContext('currentTrack');

	// ✅ 배경 이미지 상태 관리
	let isBackgroundLoaded = writable(true);  // 초기 상태는 true
	let backgroundImage = writable($currentTrack.albumImage);
	let previousBackgroundImage = writable($currentTrack.albumImage);

	// ✅ 곡이 변경될 때 배경을 자동으로 부드럽게 변경
	$: {
		if ($currentTrack.albumImage && $backgroundImage !== $currentTrack.albumImage) {
			fadeBackground();
		}
	}

	// ✅ 배경 이미지를 부드럽게 변경하는 함수
	async function fadeBackground() {
		isBackgroundLoaded.set(false); // ✅ 기존 배경을 서서히 사라지게 함
		previousBackgroundImage.set($backgroundImage); // ✅ 기존 배경 저장
		await tick(); // ✅ DOM 업데이트 후 실행

		// ✅ 새 배경 이미지 변경 (300ms 후 전환)
		setTimeout(() => {
			backgroundImage.set($currentTrack.albumImage);
			isBackgroundLoaded.set(true); // ✅ 새로운 배경을 서서히 나타나게 함
		}, 300);
	}
</script>

<div class="song-page">
	<!-- ✅ 기존 배경 (페이드 아웃) -->
	<div
		class="background-image previous"
		style="background-image: url({$previousBackgroundImage}); opacity: { $isBackgroundLoaded ? 0 : 1 }"
	></div>

	<!-- ✅ 새로운 배경 (페이드 인) -->
	<div
		class="background-image"
		style="background-image: url({$backgroundImage}); opacity: { $isBackgroundLoaded ? 1 : 0 }"
	></div>

	<!-- ✅ 앨범 이미지 표시 -->
	<img src={$currentTrack.albumImage} alt="Album Cover" class="song-image" />
	<h1 class="song-title">{$currentTrack.name}</h1>
	<p class="song-artist">{$currentTrack.artist}</p>
</div>

<style>
	/* ✅ 전체 페이지 스타일 */
	.song-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		position: relative;
		color: white;
		text-align: center;
		overflow: hidden;
	}

	/* ✅ 배경 이미지 스타일 */
	.background-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		transition: opacity 1s ease-in-out; /* ✅ 페이드 인-아웃 효과 */
	}

	/* ✅ 이전 배경 */
	.previous {
		z-index: 0;
	}

	/* ✅ 새로운 배경 */
	.background-image:not(.previous) {
		z-index: 1;
	}

	/* ✅ 어두운 필터 유지 */
	.song-page::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5); /* ✅ 검은색 배경 + 50% 투명도 */
		z-index: 2;
	}

	/* ✅ 텍스트와 이미지를 위로 올리기 */
	.song-image, .song-title, .song-artist {
		position: relative;
		z-index: 3;
	}

	/* ✅ 앨범 이미지 스타일 */
	.song-image {
		width: 30%;
		max-width: 400px;
		border-radius: 10px;
		margin-bottom: 20px;
		box-shadow: 0 0 20px rgba(255, 255, 255, 0.6); /* ✅ 부드러운 흰색 박스 쉐도우 */
	}

	.song-title {
		font-size: 40px;
		font-weight: bold;
	}

	.song-artist {
		font-size: 24px;
		color: #bbb;
	}
</style>

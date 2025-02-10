<script lang="ts">
	import { getContext, onMount, tick } from 'svelte';
	import { writable } from 'svelte/store';
	import type { Writable } from 'svelte/store';

	// +layout.svelte에서 공유한 currentTrack 스토어 (타입 지정)
	const currentTrack: Writable<{ name: string; artist: string; albumImage: string }> = getContext('currentTrack');

	// 배경 이미지 상태 관리 (페이드 효과)
	let isBackgroundLoaded = writable(true);
	let backgroundImage = writable($currentTrack.albumImage);
	let previousBackgroundImage = writable($currentTrack.albumImage);

	// 가사 상태 변수: 원본과 번역본
	let lyrics = "가사를 불러오는 중...";
	let translatedLyrics = ""; // 초기엔 번역본 없음

	// 현재 트랙 키 (곡명-아티스트 조합) -> 캐싱 키로 사용
	$: trackKey = $currentTrack && $currentTrack.name ? `${$currentTrack.name}-${$currentTrack.artist}` : "";

	// 원본 및 번역 가사를 줄 단위 배열로 분리 (빈 줄 제거)
	$: originalLines = lyrics.split('\n').filter(line => line.trim() !== '');
	$: translatedLines = translatedLyrics.split('\n').filter(line => line.trim() !== '');

	// 배경 이미지 변경 시 부드러운 페이드 효과 적용
	$: {
		if ($currentTrack.albumImage && $backgroundImage !== $currentTrack.albumImage) {
			fadeBackground();
		}
	}

	async function fadeBackground() {
		isBackgroundLoaded.set(false);
		previousBackgroundImage.set($backgroundImage);
		await tick();
		setTimeout(() => {
			backgroundImage.set($currentTrack.albumImage);
			isBackgroundLoaded.set(true);
		}, 300);
	}

	onMount(async () => {
		if ($currentTrack && $currentTrack.name) {
			// 먼저 캐싱된 원본 가사가 있는지 확인
			const cachedLyrics = sessionStorage.getItem(`lyrics-${trackKey}`);
			if (cachedLyrics) {
				lyrics = cachedLyrics;
			} else {
				try {
					// 백엔드의 /api/lyrics 엔드포인트를 호출하여 원본 가사를 가져옴
					const response = await fetch(
						`/api/lyrics?song=${encodeURIComponent($currentTrack.name)}&artist=${encodeURIComponent($currentTrack.artist)}`
					);
					const data = await response.json();
					lyrics = data.lyrics ? data.lyrics : "가사를 찾을 수 없습니다.";
					sessionStorage.setItem(`lyrics-${trackKey}`, lyrics);
				} catch (error) {
					console.error("가사 가져오기 오류:", error);
					lyrics = "가사를 불러오는데 실패했습니다.";
				}
			}

			// 캐싱된 번역 가사가 있는지 확인 (없으면 빈 문자열 유지)
			const cachedTranslated = sessionStorage.getItem(`translated-${trackKey}`);
			if (cachedTranslated) {
				translatedLyrics = cachedTranslated;
			}
		}
	});

	// 번역 요청 버튼을 누르면 실행되는 함수
	async function requestTranslation() {
		if (lyrics) {
			translatedLyrics = "번역 중...";
			try {
				// POST 방식으로 번역 요청 (백엔드 /api/translate 엔드포인트)
				const response = await fetch(`/api/translate`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ lyrics })
				});
				const data = await response.json();
				if (data.translatedLyrics) {
					translatedLyrics = data.translatedLyrics;
					sessionStorage.setItem(`translated-${trackKey}`, translatedLyrics);
				} else {
					translatedLyrics = "번역 결과를 가져오지 못했습니다.";
				}
			} catch (error) {
				console.error("번역 요청 오류:", error);
				translatedLyrics = "번역 요청 실패";
			}
		}
	}
</script>

<div class="song-page">
	<!-- 배경 이미지 (페이드 효과 적용) -->
	<div class="background-image previous"
	     style="background-image: url({$previousBackgroundImage}); opacity: { $isBackgroundLoaded ? 0 : 1 }">
	</div>
	<div class="background-image"
	     style="background-image: url({$backgroundImage}); opacity: { $isBackgroundLoaded ? 1 : 0 }">
	</div>

	<img src={$currentTrack.albumImage} alt="Album Cover" class="song-image" />
	<h1 class="song-title">{$currentTrack.name}</h1>
	<p class="song-artist">{$currentTrack.artist}</p>

	<!-- 가사 섹션: 각 원본 줄 아래에 대응하는 번역 줄 출력 (영어/한글 교차) -->
	<div class="lyrics">
		{#if originalLines.length > 0}
			{#each originalLines as orig, i}
				<p class="original">{orig}</p>
				{#if translatedLines[i]}
					<p class="translated">{translatedLines[i]}</p>
				{/if}
			{/each}
		{:else}
			<p>{lyrics}</p>
		{/if}
	</div>

	<!-- 번역 요청 버튼: 아직 번역본이 없을 경우 표시 -->
	{#if translatedLyrics === ""}
		<button on:click={requestTranslation} class="translate-button">번역 요청</button>
	{/if}
</div>

<style>
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
	.background-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		transition: opacity 1s ease-in-out;
	}
	.previous {
		z-index: 0;
	}
	.background-image:not(.previous) {
		z-index: 1;
	}
	.song-page::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 2;
	}
	.song-image, .song-title, .song-artist, .lyrics, .translate-button {
		position: relative;
		z-index: 3;
	}
	.song-image {
		width: 30%;
		max-width: 400px;
		border-radius: 10px;
		margin-bottom: 20px;
		box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
	}
	.song-title {
		font-size: 40px;
		font-weight: bold;
	}
	.song-artist {
		font-size: 24px;
		color: #bbb;
	}
	.lyrics {
		margin-top: 20px;
		font-size: 20px;
		line-height: 1.5;
		max-width: 90%;
		overflow-y: auto;
		padding: 10px;
		text-align: left;
		/* 스크롤바 숨기기 */
		scrollbar-width: none; /* Firefox */
	}
	.lyrics::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}
	.lyrics p {
		margin: 0.5rem 0;
	}
	.lyrics p.original {
		font-weight: bold;
	}
	.lyrics p.translated {
		margin-left: 20px;
		color: #ccc;
	}
	.translate-button {
		margin-top: 20px;
		padding: 10px 20px;
		font-size: 18px;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		background-color: #1db954;
		color: white;
		transition: background-color 0.3s;
	}
	.translate-button:hover {
		background-color: #17a44d;
	}
</style>

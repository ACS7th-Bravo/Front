<!-- /bravo-front/src/routes/song/+page.svelte -->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { writable } from 'svelte/store';
	import type { Writable } from 'svelte/store';
	import { goto } from '$app/navigation';
	import Lyrics from './lyrics/page.svelte';

	// 현재 재생 중인 트랙 정보를 공유하는 store (layout에서 setContext한 currentTrack을 사용)
	// (여기서는 현재 페이지가 하위 페이지이므로, context로부터 currentTrack을 가져옵니다)
	import { getContext } from 'svelte';
	const currentTrack: Writable<{ name: string; artist: string; albumImage: string }> = getContext('currentTrack');

	// 가사 토글 여부 store
	let showLyrics = writable(false);
	function toggleLyrics() {
		showLyrics.update(n => !n);
	}

	// 배경 이미지 상태 관리 (페이드 효과)
	let isBackgroundLoaded = writable(true);
	let backgroundImage = writable($currentTrack.albumImage);
	let previousBackgroundImage = writable($currentTrack.albumImage);

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

	// 헤더 스크롤 효과 관련 (옵션)
	let headerScale = writable(1);
	let headerTranslateY = writable(0);
	const maxScroll = 150;
	let songPage;
	function handleScroll() {
		const scrollTop = songPage ? songPage.scrollTop : 0;
		if (scrollTop < maxScroll) {
			const scale = 1 - (scrollTop / maxScroll) * 0.3;
			headerScale.set(scale);
			headerTranslateY.set(-scrollTop);
		} else {
			headerScale.set(0.7);
			headerTranslateY.set(-maxScroll);
		}
	}
	onMount(() => {
		if (songPage) songPage.addEventListener('scroll', handleScroll);
		return () => {
			if (songPage) songPage.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<div class="song-page" bind:this={songPage} style="height: {$showLyrics ? 'auto' : '100vh'}; overflow: {$showLyrics ? 'auto' : 'hidden'};">
	<!-- 배경 이미지 (페이드 효과) -->
	<div class="background-image previous"
	     style="background-image: url({$previousBackgroundImage}); opacity: {$isBackgroundLoaded ? 0 : 1};">
	</div>
	<div class="background-image"
	     style="background-image: url({$backgroundImage}); opacity: {$isBackgroundLoaded ? 1 : 0};">
	</div>

	<!-- 헤더 컨테이너: 곡 정보 및 가사 토글 버튼 -->
	<div class="header-container" style="transform: scale({$headerScale}) translateY({$headerTranslateY}px);">
		<img src={$currentTrack.albumImage} alt="Album Cover" class="song-image" />
		<h1 class="song-title">{$currentTrack.name}</h1>
		<p class="song-artist">{$currentTrack.artist}</p>
		<button class="lyrics-toggle" on:click={toggleLyrics}>
			{#if $showLyrics}▲ 가사 접기{:else}▼ 가사 보기{/if}
		</button>
	</div>

	<!-- Lyrics 컴포넌트: 가사 및 번역 출력 -->
	<div class="lyrics-wrapper { $showLyrics ? 'show' : '' }">
		<Lyrics />
	</div>
</div>

<style>
	*::-webkit-scrollbar {
		display: none;
	}
	* {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.song-page {
		position: relative;
		padding: 20px 0 60px;
		color: white;
		text-align: center;
		box-sizing: border-box;
	}
	.background-image {
		position: fixed;
		top: 0;
		left: 250px;
		width: calc(100% - 250px);
		height: 100vh;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		transition: opacity 1s ease-in-out;
		z-index: -100;
	}
	.song-page::before {
		content: "";
		position: fixed;
		top: 0;
		left: 250px;
		width: calc(100% - 250px);
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		z-index: -50;
	}
	.header-container {
		position: sticky;
		top: 60px;
		z-index: 10;
		padding: 20px;
		transition: transform 0.2s ease-out;
		transform-origin: top center;
	}
	.song-image {
		width: 30%;
		max-width: 400px;
		border-radius: 10px;
		margin-bottom: 10px;
		box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
	}
	.song-title {
		font-size: 40px;
		font-weight: bold;
		margin: 0;
	}
	.song-artist {
		font-size: 24px;
		color: #bbb;
		margin: 0;
	}
	.lyrics-toggle {
		margin-top: 20px;
		background: #1db954;
		color: white;
		border: none;
		padding: 12px 20px;
		font-size: 16px;
		border-radius: 5px;
		cursor: pointer;
		transition: background 0.3s;
		z-index: 10;
	}
	.lyrics-toggle:hover {
		background: #1a954b;
	}
	.lyrics-wrapper {
		width: 80%;
		margin: 0 auto;
		padding: 0;
		color: white;
		border-radius: 10px;
		text-align: center;
		opacity: 0;
		max-height: 0;
		overflow: hidden;
		transition: max-height 0.5s ease-in-out,
					opacity 0.5s ease-in-out,
					padding 0.5s ease-in-out,
					margin 0.5s ease-in-out;
		z-index: 5;
	}
	.lyrics-wrapper.show {
		opacity: 1;
		max-height: fit-content;
		margin: 20px auto 0;
		padding: 20px;
	}
</style>

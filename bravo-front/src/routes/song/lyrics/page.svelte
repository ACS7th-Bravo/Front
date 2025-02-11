<!-- /bravo-front/src/routes/song/Lyrics.svelte -->
<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import type { Writable } from 'svelte/store';

	// +layout.svelte에서 공유한 currentTrack 스토어 가져오기 (타입 지정)
	const currentTrack: Writable<{ name: string; artist: string; albumImage: string }> = getContext('currentTrack');

	// 가사 상태 변수: 원본과 번역본
	let lyrics = "가사를 불러오는 중...";
	let translatedLyrics = ""; // 번역본은 버튼 클릭 시 요청

	// 현재 트랙 키 (곡명-아티스트 조합) -> 캐싱 키로 사용
	$: trackKey = $currentTrack && $currentTrack.name ? `${$currentTrack.name}-${$currentTrack.artist}` : "";

	// 원본 및 번역 가사를 줄 단위 배열로 분리 (빈 줄 제거)
	$: originalLines = lyrics.split('\n').filter(line => line.trim() !== '');
	$: translatedLines = translatedLyrics.split('\n').filter(line => line.trim() !== '');

	async function requestTranslation() {
		if (lyrics) {
			translatedLyrics = "번역 중...";
			try {
				const response = await fetch(`/api/translate`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
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

	// onMount: 가사 캐싱 및 가져오기
	onMount(async () => {
		if ($currentTrack && $currentTrack.name) {
			const cachedLyrics = sessionStorage.getItem(`lyrics-${trackKey}`);
			if (cachedLyrics) {
				lyrics = cachedLyrics;
			} else {
				try {
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
			const cachedTranslated = sessionStorage.getItem(`translated-${trackKey}`);
			if (cachedTranslated) {
				translatedLyrics = cachedTranslated;
			}
		}
	});
</script>

<div class="lyrics-container">
	<h2>{$currentTrack.name} - {$currentTrack.artist}</h2>
	<div class="lyrics-content">
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
	{#if translatedLyrics === ""}
		<button on:click={requestTranslation} class="translate-button">번역 요청</button>
	{/if}
</div>

<style>
    
	.lyrics-container {
		width: 100%;
		max-width: 800px;
		padding: 20px;
		border-radius: 20px;
		margin: 20px auto 0;
		color: #ddd;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		font-family: "Arial", sans-serif;
	}
	.lyrics-content {
		white-space: pre-line;
		font-size: 24px;
		font-family: "Arial", sans-serif;
	}
	.original {
		font-weight: bold;
	}
	.translated {
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

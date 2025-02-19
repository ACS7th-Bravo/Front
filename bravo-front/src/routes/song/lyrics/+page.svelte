<script>
<<<<<<< HEAD
   import { getContext, onMount, tick, createEventDispatcher } from 'svelte';
   import { writable } from 'svelte/store';

   const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
   let currentTrack = getContext('currentTrack');
   let showLyrics = getContext('lyricsExpanded');
   let currentTimeStore = getContext('currentTime');
   let currentTimeVal = 0;
   currentTimeStore.subscribe((value) => {
      currentTimeVal = value;
   });
=======
	import { getContext, onMount, onDestroy, tick, createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';

	const currentTrack = getContext('currentTrack');
	const showLyrics = getContext('lyricsExpanded');
	const currentTimeStore = getContext('currentTime');

	let currentTimeVal = 0;
	currentTimeStore.subscribe((value) => {
		currentTimeVal = value;
	});
>>>>>>> 6b65afb (가사 빈거 해결)

   let lyrics = '가사를 불러오는 중...';
   let translatedLyrics = '';
   let isTranslating = false;
   let refining = false;
   let parsedLyrics = null;

<<<<<<< HEAD
   //자동 스크롤 해제 부분
   let autoScrollPaused = false;
   let autoScrollPauseTimeout;

   $: trackKey =
      $currentTrack && $currentTrack.name ? `${$currentTrack.name}-${$currentTrack.artist}` : '';
   $: originalLines = lyrics.split('\n');
   $: translatedLines = translatedLyrics.split('\n');

   function convertTimeToSeconds(timeStr) {
      const parts = timeStr.split(':');
      if (parts.length === 2) {
         return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      }
      return 0;
   }

   let activeLineIndex = -1;
   $: if (parsedLyrics) {
      activeLineIndex = -1;
      for (let i = 0; i < parsedLyrics.length; i++) {
         const lineTime = convertTimeToSeconds(parsedLyrics[i].time);
         if (currentTimeVal >= lineTime) {
            activeLineIndex = i;
         } else {
            break;
         }
      }
   }

   $: if (parsedLyrics && activeLineIndex !== -1 && !autoScrollPaused) {
      // 현재 재생 시간(currentTimeVal)과 타임스탬프(lineTime)에 기반하여 자동 스크롤 처리
      requestAnimationFrame(() => {
         const currentLine = parsedLyrics[activeLineIndex];
         const lineTime = convertTimeToSeconds(currentLine.time);

         // 현재 재생 시간과 타임스탬프 비교 후, 스크롤
         if (lineTime <= currentTimeVal) {
            // activeLineIndex에 맞는 라인을 자동으로 스크롤
            const lineEl = lyricsContainer.querySelector(
               `.lyrics-content[data-line-time="${lineTime}"]`
            );
            if (lineEl) {
               // 해당 라인을 화면 중앙으로 이동
               lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
         }
      });
   }

   async function fetchLyrics(song, artist, englishTrackName, englishArtistName) {
      //const cacheKey = `lyrics-${song}-${artist}`;

      const trackId = $currentTrack && $currentTrack.track_id ? $currentTrack.track_id : '';

      //  // sessionStorage를 사용하기 전에 브라우저 환경인지 확인
      //  if (typeof window !== 'undefined') {
      //       const cached = sessionStorage.getItem(cacheKey); // sessionStorage 사용
      //       if (cached) {
      //           const cachedData = JSON.parse(cached);
      //           lyrics = cachedData.lyrics;
      //           parsedLyrics = cachedData.parsedLyrics;
      //           return;
      //       }
      //  }

      try {
         const res = await fetch(
            `${backendUrl}/api/lyrics?track_id=${encodeURIComponent(trackId)}&song=${encodeURIComponent(song)}&artist=${encodeURIComponent(artist)}&englishTrackName=${encodeURIComponent(englishTrackName || '')}&englishArtistName=${encodeURIComponent(englishArtistName || '')}`,
            {
               headers: {
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': '69420'
               }
            }
         );
         const data = await res.json();
         if (data.lyrics) {
            lyrics = data.lyrics;
            if (data.parsedLyrics) {
               parsedLyrics = data.parsedLyrics;
            }

            //  // sessionStorage를 사용하기 전에 브라우저 환경인지 확인
            //  if (typeof window !== 'undefined') {
            //       sessionStorage.setItem(cacheKey, JSON.stringify({ lyrics, parsedLyrics })); // sessionStorage 사용
            //  }
         } else {
            lyrics = '가사를 찾을 수 없습니다.';
            parsedLyrics = null; // parsedLyrics도 초기화
         }
      } catch (error) {
         console.error('가사 가져오기 오류:', error);
         lyrics = '가사를 불러오는데 실패했습니다.';
         parsedLyrics = null;
      }
   }
=======
	// 자동 스크롤 제어
	let autoScrollPaused = false;
	let autoScrollPauseTimeout;

	// trackKey는 캐싱 키 정도로 사용 가능
	$: trackKey =
		$currentTrack && $currentTrack.name ? `${$currentTrack.name}-${$currentTrack.artist}` : '';

	$: originalLines = lyrics.split('\n');
	$: translatedLines = translatedLyrics.split('\n');

	function convertTimeToSeconds(timeStr) {
		// "mm:ss.xx" 형태를 [분, 초, 소수점(백분단위)]로 파싱
		const parts = timeStr.split(':');
		if (parts.length === 2) {
			const [mm, rest] = parts;
			const [ss, ms = 0] = rest.split('.') || [];
			const minutes = parseInt(mm, 10) || 0;
			const seconds = parseInt(ss, 10) || 0;
			const hundredths = parseInt(ms, 10) || 0;
			return minutes * 60 + seconds + hundredths / 100;
		}
		return 0;
	}

	let activeLineIndex = -1;

	$: if (parsedLyrics) {
		activeLineIndex = -1;
		for (let i = 0; i < parsedLyrics.length; i++) {
			const lineTime = convertTimeToSeconds(parsedLyrics[i].time);
			if (currentTimeVal >= lineTime) {
				activeLineIndex = i;
			} else {
				break;
			}
		}
	}

	$: if (parsedLyrics && activeLineIndex !== -1 && !autoScrollPaused) {
		requestAnimationFrame(() => {
			const currentLine = parsedLyrics[activeLineIndex];
			const lineTime = convertTimeToSeconds(currentLine.time);
			if (lineTime <= currentTimeVal) {
				const el = lyricsContainer.querySelector(`.lyrics-content[data-line-time="${lineTime}"]`);
				if (el) {
					el.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			}
		});
	}

	const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

	async function fetchLyrics(song, artist, englishTrackName, englishArtistName) {
		const trackId = $currentTrack?.track_id || '';

		try {
			const res = await fetch(
				`${backendUrl}/api/lyrics?` +
					new URLSearchParams({
						track_id: trackId,
						song,
						artist,
						englishTrackName: englishTrackName || '',
						englishArtistName: englishArtistName || ''
					}),
				{
					headers: {
						'Content-Type': 'application/json',
						'ngrok-skip-browser-warning': '69420'
					}
				}
			);
			const data = await res.json();

			if (data.lyrics) {
				lyrics = data.lyrics;
				if (data.parsedLyrics) {
					parsedLyrics = data.parsedLyrics;
				}
			} else {
				lyrics = '가사를 찾을 수 없습니다.';
				parsedLyrics = null;
			}
		} catch (error) {
			console.error('가사 fetch 실패:', error);
			lyrics = '가사를 불러오는데 실패했습니다.';
			parsedLyrics = null;
		}
	}
>>>>>>> 6b65afb (가사 빈거 해결)

   const dispatch = createEventDispatcher();

<<<<<<< HEAD
   async function requestTranslation() {
      if (translatedLyrics) {
         translatedLyrics = '';
         //sessionStorage.removeItem(`translated-${trackKey}`);
         // 상태 변화 이벤트 디스패치
         dispatch('update', { isTranslating, refining });
         return;
      }
      if (lyrics) {
         isTranslating = true;
         dispatch('update', { isTranslating, refining });
         try {
            const response = await fetch(`${backendUrl}/api/translate`, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': '69420'
               },
               body: JSON.stringify({ lyrics, track_id: $currentTrack.track_id || '' })
            });
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            while (!done) {
               const { value, done: doneReading } = await reader.read();
               done = doneReading;
               const chunk = decoder.decode(value);
               const lines = chunk.split('\n').filter((line) => line.trim() !== '');
               for (const line of lines) {
                  if (line.startsWith('data: ')) {
                     const jsonStr = line.slice(6);
                     const data = JSON.parse(jsonStr);
                     if (data.stage === 'amazon') {
                        translatedLyrics = data.translation;
                        //sessionStorage.setItem(`translated-${trackKey}`, translatedLyrics);
                     } else if (data.stage === 'update') {
                        refining = true;
                     } else if (data.stage === 'refined') {
                        /**
                         *  만약 백엔드가 "이미 한국어"라 판단해 원문만 반환한 경우,
                         *  data.translation === lyrics 일 수 있다.
                         *  이런 경우, 중복 표시를 막기 위해 translatedLyrics를 ''로 둔다.
                         */
                        if (data.translation === lyrics) {
                           console.log('🔔 원문 그대로 반환됨 → 번역 없이 표시');
                           translatedLyrics = '';
                        } else {
                           translatedLyrics = data.translation;
                        }
                        refining = false;
                        //sessionStorage.setItem(`translated-${trackKey}`, translatedLyrics);
                     } else if (data.stage === 'error') {
                        translatedLyrics = data.message;
                     }
                     dispatch('update', { isTranslating, refining });
                     await tick();
                  }
               }
            }
         } catch (error) {
            console.error('번역 요청 오류:', error);
            translatedLyrics = '번역 요청 실패';
         } finally {
            isTranslating = false;
            dispatch('update', { isTranslating, refining });
         }
      }
   }
=======
	async function requestTranslation() {
		if (translatedLyrics) {
			// 이미 번역되어 있다면 다시 누를 시 번역 해제
			translatedLyrics = '';
			dispatch('update', { isTranslating, refining });
			return;
		}

		if (lyrics) {
			isTranslating = true;
			dispatch('update', { isTranslating, refining });

			try {
				const response = await fetch(`${backendUrl}/api/translate`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'ngrok-skip-browser-warning': '69420'
					},
					body: JSON.stringify({
						lyrics,
						track_id: $currentTrack.track_id || ''
					})
				});
				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let done = false;

				while (!done) {
					const { value, done: doneReading } = await reader.read();
					done = doneReading;

					const chunk = decoder.decode(value);
					const lines = chunk.split('\n').filter((line) => line.trim() !== '');

					for (const line of lines) {
						if (line.startsWith('data: ')) {
							const jsonStr = line.slice(6);
							const data = JSON.parse(jsonStr);

							if (data.stage === 'amazon') {
								translatedLyrics = data.translation;
							} else if (data.stage === 'update') {
								refining = true;
							} else if (data.stage === 'refined') {
								if (data.translation === lyrics) {
									translatedLyrics = '';
								} else {
									translatedLyrics = data.translation;
								}
								refining = false;
							} else if (data.stage === 'error') {
								translatedLyrics = data.message;
							}

							dispatch('update', { isTranslating, refining });
							await tick();
						}
					}
				}
			} catch (error) {
				console.error('번역 요청 실패:', error);
				translatedLyrics = '번역 요청 실패';
			} finally {
				isTranslating = false;
				dispatch('update', { isTranslating, refining });
			}
		}
	}
>>>>>>> 6b65afb (가사 빈거 해결)

   let previousTrackId = null;

<<<<<<< HEAD
   const unsubscribe = currentTrack.subscribe((track) => {
      if (track && track.track_id) {
         const newTrackId = track.track_id;
         // 이전 트랙이 있다면(즉, 처음이 아니라면) 새 트랙과 다를 경우 가사창을 닫습니다.
         if (previousTrackId && previousTrackId !== newTrackId) {
            showLyrics.set(false);
            lyrics = '';
         }
         previousTrackId = newTrackId;

         translatedLyrics = '';
         isTranslating = false;
         refining = false;

         fetchLyrics(track.name, track.artist, track.englishTrackName, track.englishArtistName);
      }
   });

   //자동 스크롤 제어 함수
   function pauseAutoScroll() {
      autoScrollPaused = true;
      if (autoScrollPauseTimeout) {
         clearTimeout(autoScrollPauseTimeout);
      }
      autoScrollPauseTimeout = setTimeout(() => {
         autoScrollPaused = false;
      }, 3000); // 5000ms = 5초 후에 자동 스크롤 재개
   }

   function updateParagraphOpacity() {
      const paragraphs = lyricsContainer.querySelectorAll('.lyrics-content');
      paragraphs.forEach((p) => {
         const rect = p.getBoundingClientRect();
         let opacity;
         if (rect.top <= fadeStart) {
            opacity = 0;
         } else if (rect.top >= fadeEnd) {
            opacity = 1;
         } else {
            opacity = (rect.top - fadeStart) / (fadeEnd - fadeStart);
         }
         p.style.opacity = opacity;
      });
   }

   let lyricsContainer;
   const fadeStart = 320;
   const fadeEnd = 475;

   onMount(() => {
      const songPage = document.querySelector('.song-page');
      if (songPage) {
         songPage.addEventListener('scroll', updateParagraphOpacity);
         songPage.addEventListener('scroll', pauseAutoScroll);
      }

      // lyricsContainer 관련 이벤트 등록
      const handleUserScroll = () => {
         pauseAutoScroll();
      };
      if (lyricsContainer) {
         lyricsContainer.addEventListener('scroll', handleUserScroll);
      }
      updateParagraphOpacity();
      // 정리(cleanup) 함수
      return () => {
         if (songPage) {
            songPage.removeEventListener('scroll', updateParagraphOpacity);
            songPage.removeEventListener('scroll', pauseAutoScroll);
         }
         if (lyricsContainer) {
            lyricsContainer.removeEventListener('scroll', handleUserScroll);
         }
      };
   });

   // 기존 export 대신 이벤트로 상태를 부모에게 알림
   export { requestTranslation };
=======
	// ✅ 구독 해제용 변수
	let unsubscribe = null;

	onMount(() => {
		// Svelte store 구독 설정
		unsubscribe = currentTrack.subscribe((track) => {
			if (!track || !track.track_id) return;

			const newTrackId = track.track_id;
			if (previousTrackId && previousTrackId !== newTrackId) {
				// 다른 곡으로 바뀔 때 기존 가사/번역 초기화
				showLyrics.set(false);
				lyrics = '';
				translatedLyrics = '';
				isTranslating = false;
				refining = false;
			}
			previousTrackId = newTrackId;

			// 새 곡 정보에 맞춰 가사 fetch
			fetchLyrics(track.name, track.artist, track.englishTrackName, track.englishArtistName);
		});
	});

	onDestroy(() => {
		// ✅ 컴포넌트가 언마운트될 때 구독 해제
		if (unsubscribe) {
			unsubscribe();
		}
	});

	// 자동 스크롤 중단
	function pauseAutoScroll() {
		autoScrollPaused = true;
		if (autoScrollPauseTimeout) {
			clearTimeout(autoScrollPauseTimeout);
		}
		autoScrollPauseTimeout = setTimeout(() => {
			autoScrollPaused = false;
		}, 3000);
	}

	let lyricsContainer;
	const fadeStart = 320;
	const fadeEnd = 475;

	function updateParagraphOpacity() {
		if (!lyricsContainer) return;
		const paragraphs = lyricsContainer.querySelectorAll('.lyrics-content');
		paragraphs.forEach((p) => {
			const rect = p.getBoundingClientRect();
			let opacity;
			if (rect.top <= fadeStart) {
				opacity = 0;
			} else if (rect.top >= fadeEnd) {
				opacity = 1;
			} else {
				opacity = (rect.top - fadeStart) / (fadeEnd - fadeStart);
			}
			p.style.opacity = opacity;
		});
	}

	// page scroll / lyricsContainer scroll 이벤트
	onMount(() => {
		const songPage = document.querySelector('.song-page');
		const handleUserScroll = () => {
			pauseAutoScroll();
			updateParagraphOpacity();
		};

		if (songPage) {
			songPage.addEventListener('scroll', handleUserScroll);
		}
		if (lyricsContainer) {
			lyricsContainer.addEventListener('scroll', handleUserScroll);
		}

		// 초기 한 번
		updateParagraphOpacity();

		return () => {
			if (songPage) {
				songPage.removeEventListener('scroll', handleUserScroll);
			}
			if (lyricsContainer) {
				lyricsContainer.removeEventListener('scroll', handleUserScroll);
			}
		};
	});

	export { requestTranslation };
>>>>>>> 6b65afb (가사 빈거 해결)
</script>

<!-- 가사 영역 -->
<div class="lyrics-container" bind:this={lyricsContainer}>
   {#if parsedLyrics}
      {#each parsedLyrics as line, i}
         <div class="line-pair">
            <p
               class="lyrics-content original {i === activeLineIndex ? 'highlight' : ''}"
               data-line-time={convertTimeToSeconds(line.time)}
            >
               {line.text}
            </p>
            {#if translatedLines[i]}
               <p
                  class="lyrics-content translated-lyrics {i === activeLineIndex ? 'highlight' : ''}"
                  data-line-time={convertTimeToSeconds(line.time)}
               >
                  {translatedLines[i]}
               </p>
            {/if}
         </div>
      {/each}
   {:else if originalLines.length > 0}
      {#each originalLines as line, i}
         <div class="line-pair">
            <p class="lyrics-content original">{line}</p>
            {#if translatedLines[i]}
               <p class="lyrics-content translated-lyrics">{translatedLines[i]}</p>
            {/if}
         </div>
      {/each}
   {:else}
      <p class="lyrics-content">{lyrics}</p>
   {/if}
</div>

<style>
<<<<<<< HEAD
   .highlight {
      color: #1db954;
      font-weight: bold;
   }
   .lyrics-container {
      width: 100%;
      max-width: 900px;
      padding: 20px;
      border-radius: 10px;
      margin: 20px auto 0;
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
   }
   .lyrics-content {
      white-space: pre-line;
      font-size: 20px;
      transition: opacity 0.3s ease;
   }
   .line-pair {
      margin-bottom: 1px;
   }
   .line-pair .original {
      margin-bottom: 2px;
   }
   .translated-lyrics {
      text-decoration: underline;
      text-decoration-color: #17a44d;
      text-decoration-thickness: 2px;
   }
</style>
=======
	.highlight {
		color: #1db954;
		font-weight: bold;
	}

	.lyrics-container {
		width: 100%;
		max-width: 900px;
		padding: 20px;
		border-radius: 10px;
		margin: 20px auto 0;
		color: white;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
	}

	.lyrics-content {
		white-space: pre-line;
		font-size: 20px;
		transition: opacity 0.3s ease;
	}

	.line-pair {
		margin-bottom: 1px;
	}
	.line-pair .original {
		margin-bottom: 2px;
	}
	.translated-lyrics {
		text-decoration: underline;
		text-decoration-color: #17a44d;
		text-decoration-thickness: 2px;
	}
</style>
>>>>>>> 6b65afb (가사 빈거 해결)

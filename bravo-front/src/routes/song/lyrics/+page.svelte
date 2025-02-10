<!-- /bruavo-front/src/routes/song/lyrics/+page.svelte -->
<script>
  import { getContext, onMount } from 'svelte';
  let currentTrack = getContext('currentTrack');

  // lyricsContainer: 이 컨테이너 내에 있는 p 태그에 fade 효과를 적용합니다.
  let lyricsContainer;

  // fade 효과 범위 설정 (예: 상단 0px ~ 800px 사이에서 선형 보간)
  const fadeStart = 300;
  const fadeEnd = 800;

  function updateParagraphOpacity() {
    // lyricsContainer 안의 모든 .lyrics-content 요소 선택
    const paragraphs = lyricsContainer.querySelectorAll('.lyrics-content');
    paragraphs.forEach(p => {
      const rect = p.getBoundingClientRect();
      let opacity;
      if (rect.top <= fadeStart) {
        opacity = 0;
      } else if (rect.top >= fadeEnd) {
        opacity = 1;
      } else {
        // fadeStart와 fadeEnd 사이이면 선형 보간으로 opacity 계산
        opacity = (rect.top - fadeStart) / (fadeEnd - fadeStart);
      }
      // 계산된 opacity 값을 inline 스타일로 적용
      p.style.opacity = opacity;
      // (디버깅용) 콘솔에 각 p 태그의 위치와 opacity 출력
      console.log('p rect.top:', rect.top, '=> opacity:', opacity);
    });
  }

  onMount(() => {
    // 실제 스크롤이 발생하는 부모 컨테이너 (.song-page)를 선택
    const songPage = document.querySelector('.song-page');
    if (songPage) {
      songPage.addEventListener('scroll', updateParagraphOpacity);
    }
    // 페이지 로드시 한 번 초기 업데이트
    updateParagraphOpacity();
    return () => {
      if (songPage) {
        songPage.removeEventListener('scroll', updateParagraphOpacity);
      }
    };
  });
</script>

<div class="lyrics-container" bind:this={lyricsContainer}>
  <p class="lyrics-content">
   Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
  </p>
  <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
   <p class="lyrics-content">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla condimentum tortor vitae orci suscipit, eu gravida eros accumsan.
   </p>
  <!-- 필요에 따라 추가 <p> 태그를 넣으세요 -->
</div>

<style>
  .lyrics-container {
    width: 100%;
    max-width: 300px;
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
    font-size: 16px;
    transition: opacity 0.3s ease; /* opacity 변화가 부드럽게 전환됩니다 */
  }
</style>

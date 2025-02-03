<script>
  import { onMount } from "svelte";

  // 기본 플레이스홀더 데이터 (빈 화면 방지)
  let musicList = [
    { title: "Loading...", artist: "Unknown", duration: "--:--", image: "https://via.placeholder.com/60" },
    { title: "Loading...", artist: "Unknown", duration: "--:--", image: "https://via.placeholder.com/60" },
    { title: "Loading...", artist: "Unknown", duration: "--:--", image: "https://via.placeholder.com/60" }
  ];

  // 외부에서 데이터를 주입할 수 있도록 설정
  export let data = [];

  // 데이터가 있으면 업데이트
  onMount(() => {
    if (data.length > 0) {
      musicList = data;
    }
  });
</script>

<style>

  .music-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 600px;
    margin: auto;
  }

  .music-item {
    display: flex;
    align-items: center;
    gap: 15px;
    background: #f9f9f9;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
  }

  .music-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
  }

  .music-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .title {
    font-size: 16px;
    font-weight: bold;
  }

  .artist {
    font-size: 14px;
    color: #666;
  }

  .duration {
    font-size: 12px;
    color: #999;
  }
</style>

<h1>PlayLink</h1>


<div class="music-list">
  {#each musicList as song}
    <div class="music-item">
      <img class="music-image" src={song.image} alt="Album Art" />
      <div class="music-info">
        <div class="title">{song.title}</div>
        <div class="artist">{song.artist}</div>
        <div class="duration">{song.duration}</div>
      </div>
    </div>
  {/each}
</div>

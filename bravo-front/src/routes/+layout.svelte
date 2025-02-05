<script>
    import { onMount } from "svelte";
    
    let isPlaying = false;
    
    function togglePlay() {
        isPlaying = !isPlaying;
    }
  </script>
  
  <style>
    .layout {
        display: flex;
        height: 100vh;
        overflow: hidden;
    }
  
    .sidebar {
        width: 250px;
        background-color: white;
        color: black;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
  
    .main-content {
        flex-grow: 1;
        background-color: black;
        color: white;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }
  
    .player {
        position: fixed;
        bottom: 0;
        width: 100%;
        height: 70px;
        background-color: #222;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
    }
  
    .player button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
    }
  
    .player button:hover {
        color: #1db954;
    }
  </style>
  
  <div class="layout">
    <!-- Sidebar -->
    <div class="sidebar">
        <h2><a href="/">Playlink</a></h2>
        <nav>
            <ul>
                <li><a href="/about">About</a></li>
                <li><a href="/hi">Hi</a></li>
                <li><a href="/search">search</a></li>
                <li><a href="/podcast">Podcast</a></li>
            </ul>
        </nav>
        <h3>Library</h3>
        <ul>
            <li><a href="/favorites">Favorites</a></li>
            <li><a href="/playlist">Playlist</a></li>
        </ul>
    </div>
  
    <!-- Dynamic Content -->
    <div class="main-content">
      <h1>this is main</h1>
        <slot />
    </div>
  </div>
  
  
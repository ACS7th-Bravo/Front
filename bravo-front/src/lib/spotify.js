const res = await fetch(
	`http://localhost:3000/api/spotify/search?q=${encodeURIComponent(get(searchQuery))}`
  );
  
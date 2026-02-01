const search = document.getElementById("search");
const searchBtn = document.getElementById("searchBtn");
const grid = document.getElementById("grid");
const artistBox = document.getElementById("artist");
const albumPage = document.getElementById("albumPage");
const albumBox = document.getElementById("album");
const tracksBox = document.getElementById("tracks");
const trackSearch = document.getElementById("trackSearch");
const back = document.getElementById("back");

const nowPlaying = document.getElementById("nowPlaying");
const playPause = document.getElementById("playPause");
const prev = document.getElementById("prev");
const next = document.getElementById("next");

let audio = new Audio();
let queue = [];
let index = 0;

const favs = JSON.parse(localStorage.favs || "{}");
const recent = JSON.parse(localStorage.recent || "[]");

document.getElementById("toggleTheme").onclick =
  () => document.body.classList.toggle("light");

searchBtn.onclick = run;
search.onkeydown = e => e.key === "Enter" && run();

function ms(ms) {
  if (!ms) return "—";
  let m = Math.floor(ms / 60000);
  let s = Math.floor(ms % 60000 / 1000).toString().padStart(2, "0");
  return `${m}:${s}`;
}

async function run() {
  const q = search.value.trim();
  if (!q) return;

  artistBox.textContent = "Searching…";
  grid.innerHTML = "";
  albumPage.style.display = "none";

  const a = await fetch(`https://musicbrainz.org/ws/2/artist/?query=${q}&fmt=json`).then(r => r.json());
  const artist = a.artists[0];
  artistBox.innerHTML = `<h2>${artist.name}</h2>`;

  const r = await fetch(`https://musicbrainz.org/ws/2/release-group?artist=${artist.id}&fmt=json`).then(r => r.json());
  grid.innerHTML = "";

  r["release-groups"].forEach(al => {
    const d = document.createElement("div");
    d.className = "album";
    d.innerHTML = `
      <img src="https://coverartarchive.org/release-group/${al.id}/front-250">
      <strong>${al.title}</strong>
    `;
    d.onclick = () => openAlbum(al.id);
    grid.appendChild(d);
  });
}

async function openAlbum(id) {
  grid.style.display = "none";
  albumPage.style.display = "block";
  albumBox.textContent = "Loading…";

  const g = await fetch(`https://musicbrainz.org/ws/2/release-group/${id}?fmt=json`).then(r => r.json());
  const r = await fetch(`https://musicbrainz.org/ws/2/release?release-group=${id}&inc=recordings&fmt=json`).then(r => r.json());
  const release = r.releases[0];

  albumBox.innerHTML = `
    <div class="album-header">
      <img id="cover" src="https://coverartarchive.org/release-group/${id}/front-500">
      <div>
        <h2>${g.title}</h2>
        <a href="https://coverartarchive.org/release-group/${id}/front-500" download>Download Cover</a>
      </div>
    </div>
  `;

  document.getElementById("cover").onload = e => {
    const c = document.createElement("canvas").getContext("2d");
    c.drawImage(e.target, 0, 0, 1, 1);
    const [r,g,b] = c.getImageData(0,0,1,1).data;
    document.documentElement.style.setProperty("--accent",`rgb(${r},${g},${b})`);
  };

  queue = release.media[0].tracks;
  tracksBox.innerHTML = "";

  queue.forEach((t,i) => {
    const d = document.createElement("div");
    d.className = "track";
    d.textContent = `${i+1}. ${t.title} (${ms(t.length)})`;
    d.onclick = () => play(i);
    tracksBox.appendChild(d);
  });
}

function play(i) {
  index = i;
  const t = queue[index];
  nowPlaying.textContent = t.title;
  recent.unshift(t);
  localStorage.recent = JSON.stringify(recent.slice(0,20));
  audio.src = "";
  audio.play().catch(()=>{});
}

playPause.onclick = () => audio.paused ? audio.play() : audio.pause();
next.onclick = () => queue[index+1] && play(index+1);
prev.onclick = () => queue[index-1] && play(index-1);

document.addEventListener("keydown", e => {
  if (e.key === "/") { e.preventDefault(); search.focus(); }
  if (e.key === "Escape") { albumPage.style.display="none"; grid.style.display="grid"; }
  if (e.code === "Space") { e.preventDefault(); playPause.click(); }
  if (e.key === "ArrowRight") next.click();
  if (e.key === "ArrowLeft") prev.click();
});

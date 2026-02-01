const view = document.getElementById("view");
const search = document.getElementById("search");
const audio = document.getElementById("audio");

const cover = id =>
  `https://coverartarchive.org/release-group/${id}/front-250`;

let queue = [], index = 0;

search.onkeydown = e=>{
  if(e.key==="Enter") searchArtists(search.value);
};

async function searchArtists(q){
  const res = await fetch(
    `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(q)}&fmt=json`
  );
  const data = await res.json();
  view.innerHTML="";
  data.artists.slice(0,20).forEach(a=>{
    const div=document.createElement("div");
    div.className="card";
    div.innerHTML=`<strong>${a.name}</strong>`;
    div.onclick=()=>loadAlbums(a.id,a.name);
    view.append(div);
  });
}

async function loadAlbums(id,name){
  const res = await fetch(
    `https://musicbrainz.org/ws/2/release-group?artist=${id}&type=album&fmt=json`
  );
  const data = await res.json();
  view.innerHTML="";
  data["release-groups"].forEach(r=>{
    const div=document.createElement("div");
    div.className="card";
    const img=new Image();
    img.src=cover(r.id);
    div.append(img);
    div.innerHTML+=`<strong>${r.title}</strong>`;
    div.onclick=()=>openAlbum(r);
    view.append(div);
  });
}

async function openAlbum(album){
  const res = await fetch(
    `https://musicbrainz.org/ws/2/release-group/${album.id}?inc=releases&fmt=json`
  );
  const rel = (await res.json()).releases?.[0];
  if(!rel) return;

  const tracks = await fetch(
    `https://musicbrainz.org/ws/2/release/${rel.id}?inc=recordings&fmt=json`
  ).then(r=>r.json());

  view.innerHTML=`
    <div class="album-view">
      <div class="album-hero">
        <img src="${cover(album.id)}" />
        <h2>${album.title}</h2>
        <button onclick="downloadCover('${album.id}')">Download Cover</button>
      </div>
      <div id="tracks"></div>
    </div>
  `;

  const t=document.getElementById("tracks");
  queue = tracks.media[0].tracks;
  queue.forEach((tr,i)=>{
    const div=document.createElement("div");
    div.className="track";
    div.innerHTML=`<span>${tr.title}</span><span>${ms(tr.length)}</span>`;
    div.onclick=()=>playTrack(i);
    t.append(div);
  });
}

function playTrack(i){
  index=i;
  document.getElementById("player-title").textContent=queue[i].title;
  document.getElementById("player-artist").textContent="MusicBrainz";
  document.getElementById("player-cover").src=document.querySelector(".album-hero img").src;
  document.querySelector(".player").classList.add("playing");
  if(navigator.vibrate) navigator.vibrate(8);
}

document.getElementById("play").onclick=()=>{
  audio.paused?audio.play():audio.pause();
};

function ms(m){
  if(!m) return "--:--";
  const s=Math.floor(m/1000);
  return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;
}

function downloadCover(id){
  const a=document.createElement("a");
  a.href=cover(id);
  a.download="cover.jpg";
  a.click();
}

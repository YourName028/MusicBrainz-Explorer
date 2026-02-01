const view=document.getElementById("view");
const search=document.getElementById("search");
const playerCover=document.getElementById("player-cover");
const playerTitle=document.getElementById("player-title");
const playerArtist=document.getElementById("player-artist");

// Track info panel
let trackInfo = document.createElement("div");
trackInfo.className="track-info";
document.body.appendChild(trackInfo);

// Navigation stack
let navStack=[];

// Initialize player
playerCover.src="https://via.placeholder.com/48x48?text=?";
playerTitle.textContent="Nothing Playing";
playerArtist.textContent="";
document.querySelector(".player").classList.add("hidden");

search.addEventListener("keydown",e=>{if(e.key==="Enter") searchArtists(search.value);});

async function searchArtists(query){
  if(!query)return;
  view.innerHTML="<p>Searching...</p>";
  const res=await fetch(`https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(query)}&fmt=json`);
  const data=await res.json();
  view.innerHTML="";
  const artists=data.artists.slice(0,20);
  navStack.push({type:"artistList", data:artists});
  artists.forEach(a=>{
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`<strong>${a.name}</strong>`;
    card.onclick=()=>loadAlbums(a.id,a.name);
    view.appendChild(card);
  });
}

async function loadAlbums(artistId,artistName){
  view.innerHTML="<p>Loading albums...</p>";
  const res=await fetch(`https://musicbrainz.org/ws/2/release-group?artist=${artistId}&type=album&fmt=json`);
  const data=await res.json();
  const albums=data["release-groups"];
  view.innerHTML="";
  navStack.push({type:"albumList", data:{albums, artistName, artistId}});
  albums.forEach(r=>{
    const card=document.createElement("div");
    card.className="card";
    const img=new Image();
    img.src=`https://coverartarchive.org/release-group/${r.id}/front-250`;
    img.onerror=()=>img.src="";
    card.appendChild(img);
    card.innerHTML+=`<strong>${r.title}</strong>`;
    card.onclick=()=>openAlbum(r,artistName);
    view.appendChild(card);
  });
}

async function openAlbum(album,artistName){
  view.innerHTML="<p>Loading tracks...</p>";
  const res=await fetch(`https://musicbrainz.org/ws/2/release?release-group=${album.id}&inc=recordings+labels+artist-credits&fmt=json`);
  const data=await res.json();
  const release=data.releases?.[0];
  if(!release)return;

  view.innerHTML=`
    <button class="back-btn">← Back</button>
    <div class="album-view">
      <div class="album-hero">
        <img src="https://coverartarchive.org/release-group/${album.id}/front-500" />
        <h2>${album.title}</h2>
        <div class="info">Artist: ${artistName}</div>
        <div class="info">Date: ${release.date||"Unknown"}</div>
        <div class="info">Label: ${release["label-info"]?.map(l=>l.label?.name).join(", ")||"Unknown"}</div>
        <button class="download">Download Cover</button>
      </div>
      <div id="tracklist"></div>
    </div>
  `;
  view.querySelector(".back-btn").onclick=()=>goBack();
  view.querySelector(".download").onclick=()=>downloadCover(album.id);

  const tracklist=document.getElementById("tracklist");
  const tracks=release.media[0].tracks||[];
  tracks.forEach((t,i)=>{
    const tr=document.createElement("div");
    tr.className="track";
    tr.innerHTML=`<span>${i+1}. ${t.title}</span> <span class="info">${t.length?msToTime(t.length):""}</span>`;
    tr.onclick=()=>{
      playTrack(album.id,t,artistName);
      showTrackInfo(t,i);
    };
    tracklist.appendChild(tr);
  });

  navStack.push({type:"album", data:{album, artistName, release}});
}

function goBack(){
  navStack.pop(); // current
  const previous=navStack.pop();
  if(!previous)return;
  if(previous.type==="artistList"){
    searchArtists(search.value);
  } else if(previous.type==="albumList"){
    loadAlbums(previous.data.artistId, previous.data.artistName);
  } else if(previous.type==="album"){
    openAlbum(previous.data.album, previous.data.artistName);
  }
}

function playTrack(albumId, track, artistName){
  const player=document.querySelector(".player");
  playerCover.src=`https://coverartarchive.org/release-group/${albumId}/front-250`;
  playerTitle.textContent=track.title;
  playerArtist.textContent=artistName;
  updateAmbientGlow(playerCover);
  player.classList.remove("hidden");
}

function showTrackInfo(track,index){
  trackInfo.style.display="block";
  trackInfo.innerHTML=`
    <h3>${track.title}</h3>
    <span>Track #${index+1}</span>
    <span>Length: ${track.length?msToTime(track.length):"Unknown"}</span>
  `;
  setTimeout(()=>{trackInfo.style.display="none";},4000); // auto-hide
}

function downloadCover(id){
  const a=document.createElement("a");
  a.href=`https://coverartarchive.org/release-group/${id}/front-500`;
  a.download="cover.jpg";
  a.click();
}

function updateAmbientGlow(img){
  const canvas=document.createElement("canvas");
  canvas.width=canvas.height=1;
  const ctx=canvas.getContext("2d");
  ctx.drawImage(img,0,0,1,1);
  const [r,g,b]=ctx.getImageData(0,0,1,1).data;
  document.body.style.background=`radial-gradient(circle at 30% 20%, rgba(${r},${g},${b},0.18), var(--bg))`;
}

function msToTime(ms){
  if(!ms)return "";
  let s=Math.floor(ms/1000);
  let m=Math.floor(s/60);
  s=s%60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

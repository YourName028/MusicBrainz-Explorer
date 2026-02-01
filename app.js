const view=document.getElementById("view");
const search=document.getElementById("search");
const playerCover=document.getElementById("player-cover");
const playerTitle=document.getElementById("player-title");
const playerArtist=document.getElementById("player-artist");

search.addEventListener("keydown",e=>{if(e.key==="Enter") searchArtists(search.value);});

async function searchArtists(query){
  if(!query)return;
  view.innerHTML="<p>Searching...</p>";
  const res=await fetch(`https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(query)}&fmt=json`);
  const data=await res.json();
  view.innerHTML="";
  data.artists.slice(0,20).forEach(a=>{
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
  view.innerHTML="";
  data["release-groups"].forEach(r=>{
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
  const res=await fetch(`https://musicbrainz.org/ws/2/release?release-group=${album.id}&inc=recordings&fmt=json`);
  const data=await res.json();
  const release=data.releases?.[0];
  if(!release)return;
  view.innerHTML=`
    <div class="album-view">
      <div class="album-hero">
        <img src="https://coverartarchive.org/release-group/${album.id}/front-500" />
        <h2>${album.title}</h2>
        <button class="download">Download Cover</button>
      </div>
      <div id="tracklist"></div>
    </div>
  `;
  view.querySelector(".download").onclick=()=>downloadCover(album.id);

  const tracklist=document.getElementById("tracklist");
  const tracks=release.media[0].tracks||[];
  tracks.forEach((t,i)=>{
    const tr=document.createElement("div");
    tr.className="track";
    tr.innerHTML=`<span>${i+1}. ${t.title}</span>`;
    tr.onclick=()=>{
      playerCover.src=`https://coverartarchive.org/release-group/${album.id}/front-250`;
      playerTitle.textContent=t.title;
      playerArtist.textContent=artistName;
      updateAmbientGlow(playerCover);
    };
    tracklist.appendChild(tr);
  });
}

function downloadCover(id){
  const a=document.createElement("a");
  a.href=`https://coverartarchive.org/release-group/${id}/front-500`;
  a.download="cover.jpg";
  a.click();
}

// Ambient Glow based on album cover
function updateAmbientGlow(img){
  const canvas=document.createElement("canvas");
  canvas.width=canvas.height=1;
  const ctx=canvas.getContext("2d");
  ctx.drawImage(img,0,0,1,1);
  const [r,g,b]=ctx.getImageData(0,0,1,1).data;
  document.body.style.background=`radial-gradient(circle at 30% 20%, rgba(${r},${g},${b},0.18), var(--bg))`;
}

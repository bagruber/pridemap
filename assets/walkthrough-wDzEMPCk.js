import{p as C}from"./index-DYxR5wiw.js";const f={lng:13.456,lat:48.574},e=t=>new Promise(a=>setTimeout(a,t*(.85+Math.random()*.3))),c=t=>console.log(`[walkthrough] ${t}`);async function g(t,a=15e3){const i=Date.now();for(;Date.now()-i<a;){const s=t();if(s)return s;await new Promise(w=>setTimeout(w,100))}throw new Error("walkthrough: timed out")}function E(){const t=document.createElement("style");t.textContent=`
@keyframes demo-tap-pulse {
  0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0.85; }
  100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
}
.demo-tap {
  position: fixed;
  z-index: 9999;
  width: 38px; height: 38px;
  border-radius: 50%;
  background: rgba(255,255,255,0.45);
  border: 1.5px solid rgba(255,255,255,0.7);
  pointer-events: none;
  animation: demo-tap-pulse 420ms ease-out forwards;
}
.demo-hint {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.75);
  color: #e8e8e8;
  font: 14px/1.6 system-ui, sans-serif;
  text-align: center;
  padding: 24px;
}`,document.head.appendChild(t)}function k(t,a){const i=document.createElement("div");i.className="demo-tap",i.style.left=`${t}px`,i.style.top=`${a}px`,document.body.appendChild(i),setTimeout(()=>i.remove(),450)}async function o(t){if(!t)return;const a=t.getBoundingClientRect();k(a.left+a.width/2,a.top+a.height/2),await e(140);for(const i of["mousedown","mouseup"])t.dispatchEvent(new MouseEvent(i,{bubbles:!0,cancelable:!0,view:window}));t.click(),await e(200)}const r=t=>document.querySelector(t);function u(t,a=document){const i=(Array.isArray(t)?t:[t]).map(s=>s.toLowerCase());return[...a.querySelectorAll("button")].find(s=>i.includes(s.textContent.trim().toLowerCase()))}const T=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;async function S(t,a){for(const i of a)T.call(t,t.value+i),t.dispatchEvent(new Event("input",{bubbles:!0})),await e(45+Math.random()*50)}function b(t,a,i){return new Promise(s=>{const w=t.scrollTop,l=performance.now(),d=m=>1-Math.pow(1-m,3),p=m=>{const n=Math.min(1,(m-l)/i);t.scrollTop=w+a*d(n),n<1?requestAnimationFrame(p):s()};requestAnimationFrame(p)})}async function v(t,a){const i=t.project([a.lng,a.lat]),s=t.getCanvas().getBoundingClientRect();k(s.left+i.x,s.top+i.y),await e(160),t.fire("click",{lngLat:a,point:i}),await e(200)}let x=!1;async function z(){if(x)return;if(x=!0,E(),window.innerWidth>=768){const n=document.createElement("div");n.className="demo-hint",n.textContent="Walkthrough braucht die mobile Ansicht — Fenster auf < 768px verkleinern oder Geräte-Emulation aktivieren. Startet dann automatisch.",document.body.appendChild(n);try{await g(()=>window.innerWidth<768,12e4)}catch{n.remove();return}n.remove(),await e(800)}const t=await g(()=>{const n=window.__pridemapMap;return n&&n.getSource&&n.getSource("parades")?n:null});c("start"),await e(1100),c("act 1: pan over Europe"),t.easeTo({center:[7,50.5],zoom:4.5,duration:1700}),await e(1850),t.easeTo({center:[15.5,48.5],zoom:4.6,duration:1400}),await e(1550),c("act 1: list scroll"),await o(r(".sheet-chevron")),await o(u(["List","Liste"])),await o(r(".sheet-chevron")),await e(350);const a=r(".list-items");a&&(await b(a,1600,750),await e(280),await b(a,1900,800),await e(400)),await o(r(".sheet-chevron")),await o(u(["Map","Karte"])),await o(r(".sheet-chevron")),await e(350),c("act 1: searches");for(const n of["Barcelona","Norwich","Cham"]){const h=r(".map-search-input");await o(h),await S(h,n.toLowerCase()),await e(320);const y=await g(()=>r(".map-search-item"),5e3).catch(()=>null);if(!y){T.call(h,""),h.dispatchEvent(new Event("input",{bubbles:!0}));continue}await o(y),await e(1900)}await o(r(".detail-close")),c("act 2: zoom out, filters"),t.easeTo({center:[12,51],zoom:4.4,duration:1500}),await e(1700),await o(r(".sheet-chevron"));const i=r(".month-grid"),s=u(["Jul"],i??document);await o(s),await e(450),await o(s);const w=u(["Large","Groß"]);await o(w),await e(450),await o(w),await o(u(["Past","Vergangen"])),await e(650),await o(r(".sheet-chevron")),await o(u(["This weekend","Dieses Wochenende"])),await e(1300),c("act 3: my location → Passau"),Object.defineProperty(navigator,"geolocation",{configurable:!0,value:{getCurrentPosition:n=>setTimeout(()=>n({coords:{latitude:f.lat,longitude:f.lng}}),400)}}),await o(r(".geo-btn")),await e(1700),t.easeTo({zoom:7.6,duration:900}),await e(1050),c("act 3: isochrones"),await o(r(".iso-fab")),await o(u(["Set origin","Startpunkt setzen"])),await v(t,f),await e(2300),await o(r(".iso-fab")),await e(1100),c("act 3: swipe towards Vienna");for(let n=0;n<3;n++)t.panBy([165,18],{duration:500}),await e(640);const l=C.find(n=>n.city==="Wien");t.easeTo({center:[l.lon,l.lat],zoom:8.6,duration:650}),await e(850),c("act 3: select Vienna");const d=t.project([l.lon,l.lat]),p=t.queryRenderedFeatures([[d.x-25,d.y-25],[d.x+25,d.y+25]],{layers:["parades-circles","parades-circles-cluster"]}),m=p.length?{lng:p[0].geometry.coordinates[0],lat:p[0].geometry.coordinates[1]}:{lng:l.lon,lat:l.lat};await v(t,m),await e(1700),c("act 3: website link"),await o(r(".detail-link-btn")),c("done")}export{z as runWalkthrough};

import{n as e}from"./index-Ch9N6Wej.js";var t={lng:13.456,lat:48.574},n=e=>new Promise(t=>setTimeout(t,e*(.85+Math.random()*.3))),r=e=>console.log(`[walkthrough] ${e}`);async function i(e,t=15e3){let n=Date.now();for(;Date.now()-n<t;){let t=e();if(t)return t;await new Promise(e=>setTimeout(e,100))}throw Error(`walkthrough: timed out`)}function a(){let e=document.createElement(`style`);e.textContent=`
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
}`,document.head.appendChild(e)}function o(e,t){let n=document.createElement(`div`);n.className=`demo-tap`,n.style.left=`${e}px`,n.style.top=`${t}px`,document.body.appendChild(n),setTimeout(()=>n.remove(),450)}async function s(e){if(!e)return;let t=e.getBoundingClientRect();o(t.left+t.width/2,t.top+t.height/2),await n(140);for(let t of[`mousedown`,`mouseup`])e.dispatchEvent(new MouseEvent(t,{bubbles:!0,cancelable:!0,view:window}));e.click(),await n(200)}var c=e=>document.querySelector(e);function l(e,t=document){let n=(Array.isArray(e)?e:[e]).map(e=>e.toLowerCase());return[...t.querySelectorAll(`button`)].find(e=>n.includes(e.textContent.trim().toLowerCase()))}var u=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,`value`).set;async function d(e,t){for(let r of t)u.call(e,e.value+r),e.dispatchEvent(new Event(`input`,{bubbles:!0})),await n(45+Math.random()*50)}function f(e,t,n){return new Promise(r=>{let i=e.scrollTop,a=performance.now(),o=e=>1-(1-e)**3,s=c=>{let l=Math.min(1,(c-a)/n);e.scrollTop=i+t*o(l),l<1?requestAnimationFrame(s):r()};requestAnimationFrame(s)})}async function p(e,t){let r=e.project([t.lng,t.lat]),i=e.getCanvas().getBoundingClientRect();o(i.left+r.x,i.top+r.y),await n(160),e.fire(`click`,{lngLat:t,point:r}),await n(200)}var m=!1;async function h(){if(m)return;if(m=!0,a(),window.innerWidth>=768){let e=document.createElement(`div`);e.className=`demo-hint`,e.textContent=`Walkthrough braucht die mobile Ansicht — Fenster auf < 768px verkleinern oder Geräte-Emulation aktivieren. Startet dann automatisch.`,document.body.appendChild(e);try{await i(()=>window.innerWidth<768,12e4)}catch{e.remove();return}e.remove(),await n(800)}let o=await i(()=>{let e=window.__pridemapMap;return e&&e.getSource&&e.getSource(`parades`)?e:null});r(`start`),await n(1100),r(`act 1: pan over Europe`),o.easeTo({center:[7,50.5],zoom:4.5,duration:1700}),await n(1850),o.easeTo({center:[15.5,48.5],zoom:4.6,duration:1400}),await n(1550),r(`act 1: list scroll`),await s(c(`.sheet-chevron`)),await s(l([`List`,`Liste`])),await s(c(`.sheet-chevron`)),await n(350);let h=c(`.list-items`);h&&(await f(h,1600,750),await n(280),await f(h,1900,800),await n(400)),await s(c(`.sheet-chevron`)),await s(l([`Map`,`Karte`])),await s(c(`.sheet-chevron`)),await n(350),r(`act 1: searches`);for(let e of[`Barcelona`,`Norwich`,`Cham`]){let t=c(`.map-search-input`);await s(t),await d(t,e.toLowerCase()),await n(320);let r=await i(()=>c(`.map-search-item`),5e3).catch(()=>null);if(!r){u.call(t,``),t.dispatchEvent(new Event(`input`,{bubbles:!0}));continue}await s(r),await n(1900)}await s(c(`.detail-close`)),r(`act 2: zoom out, filters`),o.easeTo({center:[12,51],zoom:4.4,duration:1500}),await n(1700),await s(c(`.sheet-chevron`));let g=l([`Jul`],c(`.month-grid`)??document);await s(g),await n(450),await s(g);let _=l([`Large`,`Groß`]);await s(_),await n(450),await s(_),await s(l([`Past`,`Vergangen`])),await n(650),await s(c(`.sheet-chevron`)),await s(l([`This weekend`,`Dieses Wochenende`])),await n(1300),r(`act 3: my location → Passau`),Object.defineProperty(navigator,"geolocation",{configurable:!0,value:{getCurrentPosition:e=>setTimeout(()=>e({coords:{latitude:t.lat,longitude:t.lng}}),400)}}),await s(c(`.geo-btn`)),await n(1700),o.easeTo({zoom:7.6,duration:900}),await n(1050),r(`act 3: isochrones`),await s(c(`.iso-fab`)),await s(l([`Set origin`,`Startpunkt setzen`])),await p(o,t),await n(2300),await s(c(`.iso-fab`)),await n(1100),r(`act 3: swipe towards Vienna`);for(let e=0;e<3;e++)o.panBy([165,18],{duration:500}),await n(640);let v=e.find(e=>e.id===`at-wien`);o.easeTo({center:[v.lon,v.lat],zoom:8.6,duration:650}),await n(850),r(`act 3: select Vienna`);let y=o.project([v.lon,v.lat]),b=o.queryRenderedFeatures([[y.x-25,y.y-25],[y.x+25,y.y+25]],{layers:[`parades-circles`,`parades-circles-cluster`]});await p(o,b.length?{lng:b[0].geometry.coordinates[0],lat:b[0].geometry.coordinates[1]}:{lng:v.lon,lat:v.lat}),await n(1700),r(`act 3: website link`),await s(c(`.detail-link-btn`)),r(`done`)}export{h as runWalkthrough};
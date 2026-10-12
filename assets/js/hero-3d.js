// Datamaks hero 3D: kontejnerski "zivi" prikaz skladista/distributivnog centra.
// Svijetla tema (uskladjeno sa Tehnoplast demoom): imenovani regali sa stanjem, boja po zalihama,
// meke sjenke, IBL refleksije. Ucitava se lijeno samo na desktopu (hero-image kolona skrivena na mobilnom).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const GRAD = ['Banja Luka','Tuzla','Sarajevo','Gradiška','Doboj','Prijedor','Bijeljina'];
// genericki distributivni artikli (izmisljeni podaci, stvarna logika)
const MAG = [
  { id:'KERAMIKA',      naziv:'Keramicke plocice',   jm:'pal',   stanje:18,  min:10,  reg:'A-1' },
  { id:'FASADNA BOJA',  naziv:'Fasadna boja 15L',    jm:'kanti', stanje:6,   min:15,  reg:'A-2' },
  { id:'IZOLACIJA',     naziv:'Kamena vuna',         jm:'rolni', stanje:40,  min:20,  reg:'A-3' },
  { id:'CEMENT',        naziv:'Cement 25kg',         jm:'vreca', stanje:120, min:60,  reg:'B-1' },
  { id:'VODOMATERIJAL', naziv:'Vodovodni fiting',    jm:'kom',   stanje:9,   min:30,  reg:'B-2' },
  { id:'HDPE CIJEVI',   naziv:'HDPE cijev PE100',    jm:'snop',  stanje:28,  min:18,  reg:'B-3' },
];
const rnd = (a,b)=> a + Math.random()*(b-a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const pad = n => String(n).padStart(2,'0');

export function initHero3D(mount){
  if(!mount) return null;

  let renderer, scene, camera, controls, raycaster, pointer, clock, ro;
  let running = true;
  const pickables = [], forklifts = [], docks = [], magRacks = [];
  let arriving = null;

  // --- HUD (svijetle plocice; stil kroz index.html CSS) ---
  const hud = document.createElement('div');
  hud.className = 'hero3d-hud';
  hud.innerHTML =
    '<div class="hero3d-badge"><span class="hero3d-dot"></span>UŽIVO</div>'+
    '<div class="hero3d-kpis">'+
      '<div class="hero3d-kpi"><b id="h3_izd">0</b><span>izdato paleta</span></div>'+
      '<div class="hero3d-kpi"><b id="h3_dok">0</b><span>na doku</span></div>'+
      '<div class="hero3d-kpi hero3d-kpi-warn"><b id="h3_low">0</b><span>ispod min.</span></div>'+
    '</div>'+
    '<div class="hero3d-ticker" id="h3_ticker">Pokretanje prikaza...</div>';
  mount.appendChild(hud);

  const card = document.createElement('div');
  card.className = 'hero3d-card';
  mount.appendChild(card);

  const full = document.createElement('a');
  full.className = 'hero3d-full';
  full.href = '/mockups/dc-3d/';
  full.textContent = 'Preko cijelog ekrana';
  mount.appendChild(full);

  const K = { izd:0, low:0 };
  const el = id => mount.querySelector('#'+id) || document.getElementById(id);

  // ---------- helperi (natpisi preuzeti iz Tehnoplast demoa) ----------
  const mat = (c,opts)=> new THREE.MeshStandardMaterial(Object.assign({ color:c, roughness:.72, metalness:.06 }, opts||{}));
  const colForLevel = (st,min)=> st < min ? 0xef4444 : (st < min*1.3 ? 0xf59e0b : 0x5fb97a);
  function roundRect(x,a,b,w,h,r){ x.beginPath(); x.moveTo(a+r,b); x.arcTo(a+w,b,a+w,b+h,r); x.arcTo(a+w,b+h,a,b+h,r); x.arcTo(a,b+h,a,b,r); x.arcTo(a,b,a+w,b,r); x.closePath(); }
  function fitFont(g,text,max,start){ let s=start; g.font='bold '+s+'px -apple-system,Segoe UI,Roboto,Arial'; while(g.measureText(text).width>max && s>18){ s-=2; g.font='bold '+s+'px -apple-system,Segoe UI,Roboto,Arial'; } return s; }
  function drawSign(o){
    const g=o.g, W=512, H=200; g.clearRect(0,0,W,H);
    const acc='#'+o.accent.toString(16).padStart(6,'0');
    g.fillStyle='rgba(255,255,255,.97)'; roundRect(g,5,5,W-10,H-10,28); g.fill();
    g.save(); roundRect(g,5,5,W-10,H-10,28); g.clip();
    g.fillStyle=acc; g.fillRect(0,0,W,H*0.52); g.restore();
    g.strokeStyle=acc; g.globalAlpha=.5; g.lineWidth=4; roundRect(g,6,6,W-12,H-12,28); g.stroke(); g.globalAlpha=1;
    g.textAlign='center';
    const fs=fitFont(g,o.title,W-60,66); g.fillStyle='#ffffff'; g.font='bold '+fs+'px -apple-system,Segoe UI,Roboto,Arial';
    g.fillText(o.title, W/2, H*0.40);
    const fs2=fitFont(g,o.sub,W-50,46); g.fillStyle='#0f172a'; g.font='bold '+fs2+'px -apple-system,Segoe UI,Roboto,Arial';
    g.fillText(o.sub, W/2, H*0.82);
    if(o.tex) o.tex.needsUpdate=true;
  }
  function makeSign(title, sub, x, y, z, scale, accent){
    const cv=document.createElement('canvas'); cv.width=512; cv.height=200;
    const o={ title, sub, cv, g:cv.getContext('2d'), accent:accent||0x0e7490 };
    drawSign(o);
    const tex=new THREE.CanvasTexture(cv); tex.anisotropy=8;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true }));
    sp.scale.set(scale, scale*200/512, 1); sp.position.set(x,y,z);
    o.tex=tex; sp.userData.sign=o; return sp;
  }

  function size(){
    const w = mount.clientWidth || 600;
    const h = mount.clientHeight || Math.round(w*0.72);
    renderer.setSize(w, h, false);
    camera.aspect = w/h; camera.updateProjectionMatrix();
  }

  function gradientSky(){
    const cv=document.createElement('canvas'); cv.width=16; cv.height=256; const g=cv.getContext('2d');
    const grd=g.createLinearGradient(0,0,0,256);
    grd.addColorStop(0,'#eef5ff'); grd.addColorStop(0.5,'#dde9f8'); grd.addColorStop(1,'#c7d9ee');
    g.fillStyle=grd; g.fillRect(0,0,16,256);
    const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; return t;
  }

  function build(){
    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.domElement.className = 'hero3d-canvas';
    mount.insertBefore(renderer.domElement, hud);

    scene = new THREE.Scene();
    scene.background = gradientSky();
    scene.fog = new THREE.Fog(0xd6e4f5, 85, 210);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;

    camera = new THREE.PerspectiveCamera(46, 1.4, 0.1, 400);
    camera.position.set(34, 27, 37);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(4, 2, 0);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI/2.2; controls.minDistance = 22; controls.maxDistance = 72;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.autoRotate = !reduce; controls.autoRotateSpeed = 0.45;
    controls.addEventListener('start', ()=>{ controls.autoRotate = false; });

    scene.add(new THREE.HemisphereLight(0xffffff, 0xccd8ea, 0.6));
    const sun = new THREE.DirectionalLight(0xfff4e2, 1.9);
    sun.position.set(32, 50, 22); sun.castShadow = true;
    sun.shadow.mapSize.set(1024,1024);
    const s=52, c=sun.shadow.camera; c.left=-s;c.right=s;c.top=s;c.bottom=-s;c.near=1;c.far=140;
    sun.shadow.bias=-0.0003; sun.shadow.radius=4; sun.shadow.normalBias=0.02;
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xbfe0ff, 0.45); rim.position.set(-18,16,36); scene.add(rim);

    buildFloor(); buildMagacin(); buildDockWall(); buildTrucks(); buildForklifts();

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
    clock = new THREE.Clock();

    renderer.domElement.addEventListener('pointerdown', onPick);
    size();
    if(window.ResizeObserver){ ro = new ResizeObserver(size); ro.observe(mount); }
    else window.addEventListener('resize', size);
  }

  function buildFloor(){
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(90,74),
      new THREE.MeshStandardMaterial({ color:0xccd6e4, roughness:.66, metalness:.1, envMapIntensity:.7 }));
    floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(90, 30, 0x8aa0c0, 0xb3c0d6);
    grid.position.y = 0.02; grid.material.opacity=.55; grid.material.transparent=true; scene.add(grid);
    // zone trake
    stripe(14, -6, 26, 32, 0x0ea5e9);   // magacin
    stripe(-20, 0, 12, 34, 0x3b82f6);    // dokovi
    scene.add(makeSign('SKLADIŠTE','prijem · izdavanje · zalihe', 14, 12, -24, 9, 0x0e7490));
    scene.add(makeSign('DOKOVI','utovar i otprema', -20, 11, -20, 7.5, 0x2563eb));
  }
  function stripe(x,z,w,d,col){
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w,d), new THREE.MeshStandardMaterial({ color:col, transparent:true, opacity:.1, roughness:1 }));
    m.rotation.x=-Math.PI/2; m.position.set(x,0.03,z); scene.add(m);
  }

  // LIVE magacin: kantilever regal (stubovi + grede + snopovi), boja po stanju, natpis iznad
  function buildMagacin(){
    const baseX = 2;
    MAG.forEach((item,i)=>{
      const x = baseX + (i%3)*8;
      const z = -11 + Math.floor(i/3)*12;
      const grp = new THREE.Group();
      const steel = mat(0x7f8ca6,{metalness:.35,roughness:.5});
      [[-2.6,-1.3],[2.6,-1.3],[-2.6,1.3],[2.6,1.3]].forEach(([px,pz])=>{
        const post=new THREE.Mesh(new THREE.BoxGeometry(.36,6,.36),steel); post.position.set(px,3,pz); post.castShadow=true; grp.add(post);
      });
      const col = colForLevel(item.stanje,item.min);
      const fill = Math.max(0.12, Math.min(1, item.stanje/(item.min*1.6)));
      for(let lvl=0;lvl<3;lvl++){
        const beam=new THREE.Mesh(new THREE.BoxGeometry(5.6,.2,.28),steel); beam.position.set(0,1.1+lvl*1.9,-1.3); beam.castShadow=true; grp.add(beam);
        const beam2=beam.clone(); beam2.position.z=1.3; grp.add(beam2);
        const bars = Math.round(fill*5);
        for(let b=0;b<bars;b++){
          const bar=new THREE.Mesh(new THREE.BoxGeometry(5.0,.38,.38), mat(col,{metalness:.1}));
          bar.position.set(0, 1.1+lvl*1.9+0.35, -1.0+b*0.5); bar.castShadow=true; grp.add(bar);
        }
      }
      const low = item.stanje<item.min;
      if(low) K.low++;
      const sign = makeSign(item.id, item.stanje+' '+item.jm+(low?' · NISKO':''), x, 7.2, z, 6.2, low?0xdc2626:0x0e7490);
      item.sign = sign.userData.sign; scene.add(sign);
      grp.position.set(x,0,z);
      grp.userData = { type:'Artikal', ref:item };
      grp.children.forEach(ch=>{ if(!ch.userData.type) ch.userData = grp.userData; });
      pickables.push(grp); scene.add(grp); magRacks.push({ item, grp });
    });
  }

  function buildDockWall(){
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.2,9,58), mat(0xdbe3ee));
    wall.position.set(-26,4.5,0); wall.castShadow=true; wall.receiveShadow=true; scene.add(wall);
    for(let d=0; d<4; d++){
      const z = -18 + d*12;
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.4,6.4,6), mat(0x9fb0c6));
      door.position.set(-25.3, 3.6, z); scene.add(door);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(.2,1.2,2), mat(0x29a3dc,{emissive:0x1a6b91,emissiveIntensity:.25}));
      plate.position.set(-24.6, 7.6, z); scene.add(plate);
      docks.push({ z, busy:false });
    }
  }

  function makeTruckMesh(color){
    const g = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3.2,3.2,3.2), mat(color,{metalness:.2,roughness:.45})); cab.position.set(4.4,2.0,0); cab.castShadow=true; g.add(cab);
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(9,4,3.4), mat(0xf1f5fb,{metalness:.1,roughness:.5})); trailer.position.set(-1.6,2.6,0); trailer.castShadow=true; g.add(trailer);
    const glass = new THREE.MeshStandardMaterial({color:0x2a3550,metalness:.4,roughness:.15});
    [1.62,-1.62].forEach(z=>{ const w=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.0,.05),glass); w.position.set(5.6,2.5,z); g.add(w); });
    const wheelMat = mat(0x1f2630,{metalness:.2,roughness:.6});
    [-4,-1,3.6].forEach(x=>{ [1.9,-1.9].forEach(z=>{
      const w = new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.5,14), wheelMat);
      w.rotation.x=Math.PI/2; w.position.set(x,.8,z); w.castShadow=true; g.add(w);
    })});
    return g;
  }

  function buildTrucks(){
    const colors=[0x2563eb,0xef4444,0x22c55e];
    for(let i=0;i<3;i++){
      const t = makeTruckMesh(colors[i]);
      const id='TR-'+(2100+Math.floor(rnd(10,99)));
      t.userData={ type:'Kamion', id, roba:pick(MAG).naziv, odrediste:pick(GRAD), dok:i+1 };
      const dk = docks[i]; dk.busy=true;
      t.position.set(-20,0,dk.z);
      pickables.push(t); scene.add(t);
    }
  }

  function makeForkliftMesh(){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8,1.3,1.3), mat(0xf2b01e,{metalness:.2,roughness:.5})); body.position.y=1.0; body.castShadow=true; g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.0,1.1,1.1), mat(0x334155)); cab.position.set(-.3,2.1,0); g.add(cab);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(.2,2.6,1.1), mat(0x475569)); mast.position.set(1.0,1.6,0); g.add(mast);
    const forks = new THREE.Mesh(new THREE.BoxGeometry(1.3,.15,1.0), mat(0x94a3b8,{metalness:.3})); forks.position.set(1.7,.5,0); g.add(forks);
    const load = new THREE.Mesh(new THREE.BoxGeometry(1.3,1.0,1.1), mat(0xcaa472)); load.position.set(1.7,1.15,0); load.visible=false; g.add(load);
    g.userData={ load };
    return g;
  }

  function buildForklifts(){
    const routes = [
      [ new THREE.Vector3(-18,0,-6), new THREE.Vector3(-2,0,-6), new THREE.Vector3(2,0,-11), new THREE.Vector3(-2,0,-6), new THREE.Vector3(-18,0,-6) ],
      [ new THREE.Vector3(-18,0,4),  new THREE.Vector3(-6,0,4), new THREE.Vector3(-6,0,10), new THREE.Vector3(-6,0,4), new THREE.Vector3(-18,0,4) ],
      [ new THREE.Vector3(-18,0,10), new THREE.Vector3(6,0,10), new THREE.Vector3(10,0,1),  new THREE.Vector3(6,0,10), new THREE.Vector3(-18,0,10) ],
    ];
    routes.forEach((route,i)=>{
      const f = makeForkliftMesh();
      f.userData = Object.assign(f.userData, { type:'Viljuskar', id:'V'+(i+1), roba:pick(MAG).naziv });
      f.position.copy(route[0]);
      f.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
      pickables.push(f); scene.add(f);
      forklifts.push({ mesh:f, route, seg:0, t:Math.random(), speed:rnd(2.2,3.0) });
    });
  }

  function onPick(e){
    controls.autoRotate = false;
    const r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX-r.left)/r.width)*2 - 1;
    pointer.y = -((e.clientY-r.top)/r.height)*2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickables, true);
    if(!hits.length){ card.style.display='none'; return; }
    let o = hits[0].object; while(o && !o.userData.type) o = o.parent;
    if(!o){ card.style.display='none'; return; }
    const u = o.userData; let html='';
    if(u.type==='Kamion'){
      html = '<div class="h">'+u.id+' <span class="tag ok">dok '+u.dok+'</span></div>'+
        '<div class="row"><b>Roba</b><span>'+u.roba+'</span></div>'+
        '<div class="row"><b>Odredište</b><span>'+u.odrediste+'</span></div>';
    } else if(u.type==='Viljuskar'){
      const carrying = o.userData.load && o.userData.load.visible;
      html = '<div class="h">'+u.id+' <span class="tag move">'+(carrying?'nosi paletu':'u vožnji')+'</span></div>'+
        '<div class="row"><b>Zadatak</b><span>'+(carrying?'odlaganje u regal':'preuzimanje sa doka')+'</span></div>'+
        '<div class="row"><b>Roba</b><span>'+u.roba+'</span></div>';
    } else if(u.type==='Artikal'){
      const it=u.ref, low=it.stanje<it.min;
      const tag = low ? '<span class="tag warn">NISKO</span>' : '<span class="tag ok">uredno</span>';
      html = '<div class="h">'+it.id+' '+tag+'</div>'+
        '<div class="row"><b>Artikal</b><span>'+it.naziv+'</span></div>'+
        '<div class="row"><b>Regal</b><span>'+it.reg+'</span></div>'+
        '<div class="row"><b>Stanje</b><span>'+it.stanje+' '+it.jm+'</span></div>'+
        '<div class="row"><b>Minimum</b><span>'+it.min+' '+it.jm+'</span></div>';
    }
    card.innerHTML = html; card.style.display='block';
    const rr = mount.getBoundingClientRect();
    const cx = Math.min(e.clientX-rr.left+12, rr.width-180);
    const cy = Math.min(e.clientY-rr.top+12, rr.height-120);
    card.style.left = Math.max(8,cx)+'px'; card.style.top = Math.max(8,cy)+'px';
  }

  function moveForklift(f, dt){
    const a=f.route[f.seg], b=f.route[f.seg+1], d=a.distanceTo(b), m=f.mesh;
    f.t += (f.speed*dt)/Math.max(d,0.001);
    if(f.t>=1){ f.t=0; f.seg++; if(f.seg>=f.route.length-1) f.seg=0;
      const atDock = f.route[f.seg].x < -14; m.userData.load.visible = !atDock; }
    m.position.lerpVectors(a,b,f.t);
    const dir = new THREE.Vector3().subVectors(b,a);
    if(dir.lengthSq()>1e-4) m.rotation.y = Math.atan2(dir.x, dir.z) - Math.PI/2;
  }

  function cycleTrucks(dt){
    const free = docks[3];
    if(!arriving && Math.random()<0.004){
      const t = makeTruckMesh(0xf59e0b);
      const id='TR-'+(2100+Math.floor(rnd(10,99)));
      t.userData={ type:'Kamion', id, roba:pick(MAG).naziv, odrediste:pick(GRAD), dok:4 };
      t.position.set(-8,0,34); t.rotation.y=0;
      pickables.push(t); scene.add(t);
      arriving = { mesh:t, phase:'in', timer:0 };
      ticker('Kamion '+id+' najavljen, dok 4');
    }
    if(arriving){
      const t=arriving.mesh;
      if(arriving.phase==='in'){
        if(t.position.z > free.z+0.2){ t.position.z -= 9*dt; }
        else if(t.position.x > -20){ t.rotation.y=Math.PI/2; t.position.x -= 7*dt; }
        else { arriving.phase='wait'; arriving.timer=rnd(6,10); free.busy=true;
               ticker('Kamion '+t.userData.id+' na doku 4, istovar'); }
      } else if(arriving.phase==='wait'){
        arriving.timer-=dt; if(arriving.timer<=0){ arriving.phase='out'; t.rotation.y=0;
               ticker('Kamion '+t.userData.id+' krenuo, '+t.userData.odrediste); }
      } else {
        t.position.z += 10*dt;
        if(t.position.z>38){ scene.remove(t); const i=pickables.indexOf(t); if(i>=0)pickables.splice(i,1); free.busy=false; arriving=null; }
      }
    }
  }

  function setK(){ const a=el('h3_izd'),b=el('h3_dok'),c=el('h3_low');
    if(a)a.textContent=K.izd; if(b)b.textContent=docks.filter(d=>d.busy).length; if(c)c.textContent=K.low; }
  function ticker(txt){ const d=new Date(), t=el('h3_ticker'); if(t) t.textContent=pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds())+'  '+txt; }

  const EVENTS = [
    ()=>{ K.izd++; return 'Viljuškar '+pick(['V1','V2','V3'])+' odložio paletu '+pick(MAG).naziv; },
    ()=> 'Narudžba N-'+Math.floor(rnd(3000,3999))+' spremna za utovar',
    ()=> 'Prijem robe: '+pick(MAG).naziv+' '+Math.floor(rnd(4,20))+' paleta',
    ()=> 'Viljuškar '+pick(['V1','V2','V3'])+' preuzeo paletu sa doka',
    ()=> 'Niska zaliha: '+pick(MAG.filter(m=>m.stanje<m.min).concat(MAG)).naziv+' ispod minimuma',
    ()=> 'Kupac '+pick(['Market','Gradnja','Trgovina','Kooperant'])+' '+pick(GRAD)+', nova narudžba',
  ];
  let evTimer;
  function tickEvent(){ ticker(pick(EVENTS)()); setK(); }

  let raf;
  function animate(){
    if(!running) return;
    raf = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    forklifts.forEach(f=>moveForklift(f,dt));
    cycleTrucks(dt);
    controls.update();
    renderer.render(scene,camera);
  }

  let io;
  function visibility(){
    if(!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(es=>{ es.forEach(e=>{
      if(e.isIntersecting){ if(!running){ running=true; clock.start(); animate(); } }
      else { running=false; }
    });}, { threshold:0.05 });
    io.observe(mount);
  }

  try{
    build();
    K.izd = Math.floor(rnd(120,200)); setK();
    mount.classList.add('hero3d-ready');
    animate();
    for(let i=0;i<4;i++) setTimeout(tickEvent, i*300);
    evTimer = setInterval(tickEvent, 2800);
    visibility();
  }catch(err){
    console.error('[hero3d] init greska:', err);
    return null;
  }

  return {
    destroy(){ running=false; if(raf)cancelAnimationFrame(raf); if(evTimer)clearInterval(evTimer);
      if(ro)ro.disconnect(); if(io)io.disconnect(); if(renderer){ renderer.dispose(); renderer.domElement.remove(); } }
  };
}

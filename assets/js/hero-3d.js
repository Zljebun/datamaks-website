// Datamaks hero 3D: kontejnerski "zivi" prikaz skladista/distributivnog centra.
// Ucitava se lijeno samo na desktopu (hero-image kolona je skrivena na mobilnom CSS-om),
// uz provjeru WebGL / reduced-motion / save-data u bootstrapu na naslovnoj.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SKU = ['HDPE cijev PE100','PVC profil','Fasadna boja','Keramika','Cement','Izolacija','Vodomaterijal','Alat'];
const GRAD = ['Banja Luka','Tuzla','Sarajevo','Gradiška','Doboj','Prijedor','Bijeljina'];
const rnd = (a,b)=> a + Math.random()*(b-a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const pad = n => String(n).padStart(2,'0');

export function initHero3D(mount){
  if(!mount) return null;

  let renderer, scene, camera, controls, raycaster, pointer, clock, ro;
  let running = true, userTouched = false;
  const pickables = [], forklifts = [], docks = [];
  let arriving = null;

  // --- HUD (gradi modul da naslovna ostane cista) ---
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

  function size(){
    const w = mount.clientWidth || 600;
    const h = mount.clientHeight || Math.round(w*0.72);
    renderer.setSize(w, h, false);
    camera.aspect = w/h; camera.updateProjectionMatrix();
  }

  function build(){
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'hero3d-canvas';
    mount.insertBefore(renderer.domElement, hud);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1830);
    scene.fog = new THREE.Fog(0x0e1830, 70, 190);

    camera = new THREE.PerspectiveCamera(48, 1.4, 0.1, 400);
    camera.position.set(30, 26, 36);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 0);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI/2.2; controls.minDistance = 20; controls.maxDistance = 70;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    controls.autoRotate = !reduce; controls.autoRotateSpeed = 0.55;

    scene.add(new THREE.HemisphereLight(0xbcd3ff, 0x20273a, 0.95));
    const sun = new THREE.DirectionalLight(0xfff2d6, 1.45);
    sun.position.set(28, 42, 18); sun.castShadow = true;
    sun.shadow.mapSize.set(1024,1024);
    const s=50, c=sun.shadow.camera; c.left=-s;c.right=s;c.top=s;c.bottom=-s;c.near=1;c.far=130;
    scene.add(sun);

    buildFloor(); buildRacks(); buildDockWall(); buildTrucks(); buildForklifts();

    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
    clock = new THREE.Clock();

    renderer.domElement.addEventListener('pointerdown', onPick);
    size();
    if(window.ResizeObserver){ ro = new ResizeObserver(size); ro.observe(mount); }
    else window.addEventListener('resize', size);
  }

  const labelMat = c => new THREE.MeshStandardMaterial({ color:c, roughness:.8, metalness:.05 });

  function buildFloor(){
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80,72), new THREE.MeshStandardMaterial({ color:0x2a3550, roughness:.95 }));
    floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(80, 32, 0x3f557a, 0x33435f);
    grid.position.y = 0.02; scene.add(grid);
  }

  function makeRack(x, z){
    const g = new THREE.Group();
    const steel = labelMat(0x8795ad);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(6,7,2.4), new THREE.MeshStandardMaterial({color:0x5b6b86, roughness:.9, transparent:true, opacity:.25}));
    frame.position.y = 3.5; g.add(frame);
    let low = 0;
    for(let lvl=0; lvl<3; lvl++){
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(6,.15,2.4), steel);
      shelf.position.set(0, 1.2+lvl*2.2, 0); shelf.castShadow=true; shelf.receiveShadow=true; g.add(shelf);
      for(let p=0; p<3; p++){
        if(Math.random()<0.18) continue;
        const full = Math.random();
        const col = full<0.16 ? 0xef4444 : (full<0.34 ? 0xf59e0b : 0xcaa472);
        if(full<0.16) low++;
        const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.6,1.1,1.9), labelMat(col));
        pallet.position.set(-2+p*2, 1.2+lvl*2.2+0.63, 0); pallet.castShadow=true; g.add(pallet);
      }
    }
    g.position.set(x,0,z);
    g.userData = { type:'Regal', id:'R-'+(x<0?'A':'B')+Math.abs(Math.round(z)), low };
    pickables.push(g); scene.add(g);
  }

  function buildRacks(){
    for(let r=0; r<4; r++){
      const z = -14 + r*8;
      makeRack(-12, z); makeRack(-4, z); makeRack(12, z); makeRack(20, z);
    }
  }

  function buildDockWall(){
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.2,10,62), labelMat(0x37425e));
    wall.position.set(-28, 5, 0); wall.castShadow=true; wall.receiveShadow=true; scene.add(wall);
    for(let d=0; d<4; d++){
      const z = -18 + d*12;
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.4,7,6), labelMat(0x202a40));
      door.position.set(-27.3, 4, z); scene.add(door);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(.2,1.4,2.2), labelMat(0x29a3dc));
      plate.position.set(-26.5, 8.6, z); scene.add(plate);
      docks.push({ z, busy:false });
    }
  }

  function makeTruckMesh(color){
    const g = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3.2,3.2,3.2), labelMat(color));
    cab.position.set(4.4,2.0,0); cab.castShadow=true; g.add(cab);
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(9,4,3.4), labelMat(0xd7ddea));
    trailer.position.set(-1.6,2.6,0); trailer.castShadow=true; g.add(trailer);
    const wheelMat = labelMat(0x11151f);
    [-4,-1,3.6].forEach(x=>{ [1.9,-1.9].forEach(z=>{
      const w = new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.5,12), wheelMat);
      w.rotation.x=Math.PI/2; w.position.set(x,.8,z); g.add(w);
    })});
    return g;
  }

  function buildTrucks(){
    const colors=[0x2563eb,0xef4444,0x22c55e];
    for(let i=0;i<3;i++){
      const t = makeTruckMesh(colors[i]);
      const id='TR-'+(2100+Math.floor(rnd(10,99)));
      t.userData={ type:'Kamion', id, roba:pick(SKU), odrediste:pick(GRAD), dok:i+1 };
      const dk = docks[i]; dk.busy=true;
      t.position.set(-22,0,dk.z);
      pickables.push(t); scene.add(t);
    }
  }

  function makeForkliftMesh(){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8,1.3,1.3), labelMat(0xf2b01e)); body.position.y=1.0; body.castShadow=true; g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.0,1.1,1.1), labelMat(0x25303f)); cab.position.set(-.3,2.1,0); g.add(cab);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(.2,2.6,1.1), labelMat(0x333a46)); mast.position.set(1.0,1.6,0); g.add(mast);
    const forks = new THREE.Mesh(new THREE.BoxGeometry(1.3,.15,1.0), labelMat(0x8a929e)); forks.position.set(1.7,.5,0); g.add(forks);
    const load = new THREE.Mesh(new THREE.BoxGeometry(1.3,1.0,1.1), labelMat(0xcaa472)); load.position.set(1.7,1.15,0); load.visible=false; g.add(load);
    g.userData={ load };
    return g;
  }

  function buildForklifts(){
    const routes = [
      [ new THREE.Vector3(-20,0,-6), new THREE.Vector3(0,0,-6), new THREE.Vector3(8,0,-14), new THREE.Vector3(0,0,-6), new THREE.Vector3(-20,0,-6) ],
      [ new THREE.Vector3(-20,0,4),  new THREE.Vector3(-8,0,4), new THREE.Vector3(-8,0,10), new THREE.Vector3(-8,0,4), new THREE.Vector3(-20,0,4) ],
      [ new THREE.Vector3(-20,0,10), new THREE.Vector3(4,0,10), new THREE.Vector3(16,0,2),  new THREE.Vector3(4,0,10), new THREE.Vector3(-20,0,10) ],
    ];
    routes.forEach((route,i)=>{
      const f = makeForkliftMesh();
      f.userData = Object.assign(f.userData, { type:'Viljuskar', id:'V'+(i+1), roba:pick(SKU) });
      f.position.copy(route[0]);
      pickables.push(f); scene.add(f);
      forklifts.push({ mesh:f, route, seg:0, t:Math.random(), speed:rnd(2.2,3.0) });
    });
  }

  function onPick(e){
    userTouched = true; controls.autoRotate = false;
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
    } else if(u.type==='Regal'){
      const tag = u.low>0 ? '<span class="tag warn">'+u.low+' ispod min.</span>' : '<span class="tag ok">uredno</span>';
      html = '<div class="h">Regal '+u.id+' '+tag+'</div>'+
        '<div class="row"><b>Zona</b><span>'+(u.id.includes('A')?'Zapad':'Istok')+'</span></div>'+
        '<div class="row"><b>Niske zalihe</b><span>'+u.low+'</span></div>';
    }
    card.innerHTML = html; card.style.display='block';
    const rr = mount.getBoundingClientRect();
    const cx = Math.min(e.clientX-rr.left+12, rr.width-170);
    const cy = Math.min(e.clientY-rr.top+12, rr.height-110);
    card.style.left = Math.max(8,cx)+'px'; card.style.top = Math.max(8,cy)+'px';
  }

  function moveForklift(f, dt){
    const a=f.route[f.seg], b=f.route[f.seg+1], d=a.distanceTo(b), m=f.mesh;
    f.t += (f.speed*dt)/Math.max(d,0.001);
    if(f.t>=1){ f.t=0; f.seg++; if(f.seg>=f.route.length-1) f.seg=0;
      const atDock = f.route[f.seg].x < -16; m.userData.load.visible = !atDock; }
    m.position.lerpVectors(a,b,f.t);
    const dir = new THREE.Vector3().subVectors(b,a);
    if(dir.lengthSq()>1e-4) m.rotation.y = Math.atan2(dir.x, dir.z) - Math.PI/2;
  }

  function cycleTrucks(dt){
    const free = docks[3];
    if(!arriving && Math.random()<0.004){
      const t = makeTruckMesh(0xf59e0b);
      const id='TR-'+(2100+Math.floor(rnd(10,99)));
      t.userData={ type:'Kamion', id, roba:pick(SKU), odrediste:pick(GRAD), dok:4 };
      t.position.set(-10,0,36); t.rotation.y=0;
      pickables.push(t); scene.add(t);
      arriving = { mesh:t, phase:'in', timer:0 };
      ticker('Kamion '+id+' najavljen, dok 4');
    }
    if(arriving){
      const t=arriving.mesh;
      if(arriving.phase==='in'){
        if(t.position.z > free.z+0.2){ t.position.z -= 9*dt; }
        else if(t.position.x > -22){ t.rotation.y=Math.PI/2; t.position.x -= 7*dt; }
        else { arriving.phase='wait'; arriving.timer=rnd(6,10); free.busy=true;
               ticker('Kamion '+t.userData.id+' na doku 4, istovar'); }
      } else if(arriving.phase==='wait'){
        arriving.timer-=dt; if(arriving.timer<=0){ arriving.phase='out'; t.rotation.y=0;
               ticker('Kamion '+t.userData.id+' krenuo, '+t.userData.odrediste); }
      } else {
        t.position.z += 10*dt;
        if(t.position.z>40){ scene.remove(t); const i=pickables.indexOf(t); if(i>=0)pickables.splice(i,1); free.busy=false; arriving=null; }
      }
    }
  }

  function recountLow(){ K.low = pickables.filter(p=>p.userData.type==='Regal').reduce((a,p)=>a+(p.userData.low||0),0); }
  function setK(){ const a=el('h3_izd'),b=el('h3_dok'),c=el('h3_low');
    if(a)a.textContent=K.izd; if(b)b.textContent=docks.filter(d=>d.busy).length; if(c)c.textContent=K.low; }
  function ticker(txt){ const d=new Date(), t=el('h3_ticker'); if(t) t.textContent=pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds())+'  '+txt; }

  const EVENTS = [
    ()=>{ K.izd++; return 'Viljuškar '+pick(['V1','V2','V3'])+' odložio paletu '+pick(SKU); },
    ()=> 'Narudžba N-'+Math.floor(rnd(3000,3999))+' spremna za utovar',
    ()=> 'Prijem robe: '+pick(SKU)+' '+Math.floor(rnd(4,20))+' paleta',
    ()=> 'Viljuškar '+pick(['V1','V2','V3'])+' preuzeo paletu sa doka',
    ()=> 'Niska zaliha: '+pick(SKU)+' ispod minimuma',
    ()=> 'Kupac '+pick(['Market','Gradnja','Trgovina','Kooperant'])+' '+pick(GRAD)+', nova narudzba',
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

  // pauziraj kad hero nije u vidokrugu (stedi bateriju/CPU)
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
    recountLow();
    K.izd = Math.floor(rnd(120,200)); setK();
    mount.classList.add('hero3d-ready'); // sakriva poster
    animate();
    for(let i=0;i<4;i++) setTimeout(tickEvent, i*300);
    evTimer = setInterval(tickEvent, 2800);
    visibility();
  }catch(err){
    // ostavi poster kao fallback
    return null;
  }

  return {
    destroy(){ running=false; if(raf)cancelAnimationFrame(raf); if(evTimer)clearInterval(evTimer);
      if(ro)ro.disconnect(); if(io)io.disconnect(); if(renderer){ renderer.dispose(); renderer.domElement.remove(); } }
  };
}

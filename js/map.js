/* LocateIQ v3 — Map Module */
const MapMod = (() => {
  let map, ps, geocoder, svPano;
  let locMarkers=[], compMarkers=[], iws=[], heat=null;
  let curType='roadmap';

  /* SVG paths for icons */
  const LOCATION_PIN = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';
  const COMP_PIN = 'M12 22q-3.475-3.15-5.238-5.925T5 11q0-3.65 2.413-5.825T12 3t4.588 2.175T19 11q0 2.3-1.763 5.075T12 22z';

  function init() {
    map = new google.maps.Map(document.getElementById('map'), {
      center:{lat:23.0225,lng:72.5714}, zoom:12,
      styles: MAP_DARK,
      disableDefaultUI:false, zoomControl:true,
      mapTypeControl:false, streetViewControl:false, fullscreenControl:false
    });
    geocoder = new google.maps.Geocoder();
    ps       = new google.maps.places.PlacesService(map);
    svPano   = new google.maps.StreetViewPanorama(document.getElementById('streetview'),{
      pov:{heading:34,pitch:10}, zoom:1, addressControl:false, showRoadLabels:false
    });
    UI.setStatus('Map ready — enter any location and click Analyze','ok');
  }

  function setType(t) {
    curType = t;
    map.setMapTypeId(t);
    map.setOptions({ styles: t==='roadmap' ? (Theme.get()==='dark'?MAP_DARK:MAP_LIGHT) : [] });
    document.querySelectorAll('.mtb').forEach(b=>b.classList.remove('on'));
    document.getElementById('mt-'+t)?.classList.add('on');
    const icons={roadmap:'🗺️ Road',satellite:'🛰️ Satellite',hybrid:'🛰️ Hybrid',terrain:'⛰️ Terrain'};
    const el=document.getElementById('mapTypeInd'); if(el) el.innerHTML=icons[t];
  }

  function geocode(loc) {
    return new Promise((res,rej)=>geocoder.geocode({address:loc},(r,s)=>{
      if(s==='OK'&&r[0]) res(r[0]);
      else rej(new Error('Cannot find: '+loc));
    }));
  }

  function nearby(loc,type,radius) {
    return new Promise(res=>ps.nearbySearch({location:loc,radius,type},(r,s)=>res(s==='OK'?(r||[]):[])));
  }

  function getDetails(placeId) {
    return new Promise(res=>ps.getDetails({
      placeId,
      fields:['name','rating','user_ratings_total','formatted_address','formatted_phone_number','website','opening_hours','price_level','geometry','url','photos','business_status']
    },(r,s)=>res(s==='OK'?r:null)));
  }

  function searchMap() {
    const q=document.getElementById('mapSearchInput').value.trim();
    if(!q) return;
    geocoder.geocode({address:q},(r,s)=>{
      if(s==='OK'&&r[0]){map.setCenter(r[0].geometry.location);map.setZoom(15);}
      else UI.toast('Location not found');
    });
  }

  /* Place LOCATION markers (big colored pins) */
  function placeLocMarkers(results) {
    clearLocMarkers();
    results.forEach((r,i)=>{
      const color=r.score.composite>=75?'#10b981':r.score.composite>=60?'#f59e0b':'#ef4444';
      const scale=i===0?2.5:i<=2?2.0:1.75;
      const isDark=Theme.get()==='dark';
      const stroke=isDark?'#000':'#fff';

      const marker=new google.maps.Marker({
        position:r.point, map,
        icon:{path:LOCATION_PIN,fillColor:color,fillOpacity:1,strokeColor:stroke,strokeWeight:1.5,scale,anchor:new google.maps.Point(12,22)},
        zIndex:200-i, title:`#${i+1} · ${r.areaName} · ${r.score.composite}/100`,
        label:i<3?{text:String(i+1),color:'#000',fontFamily:'Syne,sans-serif',fontWeight:'800',fontSize:'11px'}:null
      });

      const gmUrl=`https://www.google.com/maps/search/?api=1&query=${r.point.lat},${r.point.lng}`;
      const dirUrl=`https://www.google.com/maps/dir/?api=1&destination=${r.point.lat},${r.point.lng}`;
      const bg=isDark?'#0d1117':'#ffffff', tx=isDark?'#e2e8f0':'#0f172a', mu=isDark?'#4b5563':'#94a3b8';

      const iw=new google.maps.InfoWindow({content:`
        <div style="background:${bg};color:${tx};padding:14px;border-radius:10px;min-width:240px;font-family:'Plus Jakarta Sans',sans-serif">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:9px;letter-spacing:2px;color:#00d4aa;margin-bottom:4px">#${i+1} LOCATION · ${r.score.grade.label.toUpperCase()}</div>
          <div style="font-size:14px;font-weight:700;margin-bottom:10px;line-height:1.3">${r.areaName}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:12px;font-size:11px">
            <div><div style="color:${mu}">Score</div><div style="font-weight:800;color:${color};font-family:'Syne',sans-serif;font-size:20px">${r.score.composite}<span style="font-size:11px">/100</span></div></div>
            <div><div style="color:${mu}">Risk</div><div style="font-weight:700;color:${r.risk.overall.color}">${r.risk.overall.level}</div></div>
            <div><div style="color:${mu}">Est Revenue</div><div style="font-weight:700;color:#10b981">₹${fmtINR(r.roi.monthly.revenue)}/mo</div></div>
            <div><div style="color:${mu}">Payback</div><div style="font-weight:700">${r.roi.metrics.payback} mo</div></div>
            <div><div style="color:${mu}">Competitors</div><div style="font-weight:700">${r.competitors.length}</div></div>
            <div><div style="color:${mu}">Rent/sqft</div><div style="font-weight:700">₹${r.roi.rentDetails.rentPerSqft}</div></div>
          </div>
          <div style="display:flex;gap:5px">
            <a href="${gmUrl}" target="_blank" style="flex:1;padding:7px;text-align:center;border-radius:8px;background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.3);color:#60a5fa;font-size:10px;font-weight:700;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:4px">
              📍 Maps
            </a>
            <a href="${dirUrl}" target="_blank" style="flex:1;padding:7px;text-align:center;border-radius:8px;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:#34d399;font-size:10px;font-weight:700;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:4px">
              🧭 Directions
            </a>
            <button onclick="MapMod.openSV(${r.point.lat},${r.point.lng},'${r.areaName.replace(/'/g,"\\'")}');this.closest('.gm-style-iw').style.display='none'" style="flex:1;padding:7px;border-radius:8px;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);color:#fbbf24;font-size:10px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:4px">
              🚶 Street
            </button>
          </div>
        </div>`
      });

      marker.addListener('click',()=>{
        iws.forEach(w=>w.close()); iw.open(map,marker); App.selectLoc(i);
      });
      locMarkers.push(marker); iws.push(iw);
    });
  }

  /* Place COMPETITOR markers (different icon — orange diamond/shop) */
  function placeCompMarkers(comps, areaName) {
    clearCompMarkers();
    comps.forEach((c,i)=>{
      if(!c.lat||!c.lng) return;
      const isDark=Theme.get()==='dark';
      const stroke=isDark?'#000':'#fff';

      // Orange/red smaller diamond-style pin for competitors
      const marker=new google.maps.Marker({
        position:{lat:c.lat,lng:c.lng}, map,
        icon:{
          path:'M12 2L4 12l8 10 8-10L12 2z', /* diamond shape */
          fillColor:'#f97316', fillOpacity:.9,
          strokeColor:stroke, strokeWeight:1.5,
          scale:1.3, anchor:new google.maps.Point(12,12)
        },
        zIndex:50,
        title:`🏪 ${c.name} · ${c.rating?c.rating+'★':''}`
      });

      const bg=isDark?'#0d1117':'#ffffff', tx=isDark?'#e2e8f0':'#0f172a', mu=isDark?'#4b5563':'#94a3b8';
      const openStr=c.isOpen===true?'<span style="background:rgba(16,185,129,.2);color:#34d399;padding:1px 6px;border-radius:10px;font-size:9px;font-weight:700">OPEN</span>':c.isOpen===false?'<span style="background:rgba(239,68,68,.2);color:#f87171;padding:1px 6px;border-radius:10px;font-size:9px;font-weight:700">CLOSED</span>':'';
      const stars=c.rating?'⭐'.repeat(Math.round(c.rating)):'';

      const iw=new google.maps.InfoWindow({content:`
        <div style="background:${bg};color:${tx};padding:12px;border-radius:10px;min-width:210px;font-family:'Plus Jakarta Sans',sans-serif">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:9px;letter-spacing:2px;color:#f97316;margin-bottom:4px">🏪 COMPETITOR NEAR ${areaName.toUpperCase().slice(0,20)}</div>
          <div style="font-size:13px;font-weight:700;margin-bottom:5px;line-height:1.3">${c.name}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            ${openStr}
            ${c.rating?`<span style="color:#f59e0b;font-weight:700;font-size:12px">${stars} ${c.rating}</span><span style="color:${mu};font-size:10px">(${c.totalRatings||0})</span>`:''}
          </div>
          <div style="font-size:10.5px;color:${mu};margin-bottom:8px">${c.address||''}</div>
          ${c.phone?`<div style="font-size:10px;color:${mu};margin-bottom:8px">📞 ${c.phone}</div>`:''}
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            <a href="${c.mapsUrl}" target="_blank" style="padding:5px 9px;border-radius:7px;background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.3);color:#60a5fa;font-size:10px;font-weight:700;text-decoration:none">📍 Open Maps</a>
            <button onclick="MapMod.openSV(${c.lat},${c.lng},'${(c.name||'').replace(/'/g,"\\'")}');this.closest('.gm-style-iw').style.display='none'" style="padding:5px 9px;border-radius:7px;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);color:#fbbf24;font-size:10px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">🚶 Street View</button>
            ${c.website?`<a href="${c.website}" target="_blank" style="padding:5px 9px;border-radius:7px;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);color:#a78bfa;font-size:10px;font-weight:700;text-decoration:none">🌐 Website</a>`:''}
          </div>
        </div>`
      });

      marker.addListener('click',()=>{ iws.forEach(w=>w.close()); iw.open(map,marker); });
      compMarkers.push(marker); iws.push(iw);
    });
  }

  function clearLocMarkers(){ locMarkers.forEach(m=>m.setMap(null)); locMarkers=[]; iws.forEach(w=>w.close()); iws=[]; }
  function clearCompMarkers(){ compMarkers.forEach(m=>m.setMap(null)); compMarkers=[]; }
  function bounceMarker(idx){ locMarkers.forEach((m,i)=>m?.setAnimation(i===idx?google.maps.Animation.BOUNCE:null)); setTimeout(()=>locMarkers[idx]?.setAnimation(null),1400); }
  function closeIWs(){ iws.forEach(w=>w.close()); }

  function renderHeat(results){
    if(heat){heat.setMap(null);heat=null;}
    heat=new google.maps.visualization.HeatmapLayer({
      data:results.map(r=>({location:new google.maps.LatLng(r.point.lat,r.point.lng),weight:r.score.composite/100})),
      map, radius:55, opacity:.42,
      gradient:['rgba(239,68,68,0)','rgba(239,68,68,.7)','rgba(245,158,11,.9)','rgba(0,212,170,1)']
    });
  }
  function clearHeat(){ if(heat){heat.setMap(null);heat=null;} }

  function openSV(lat,lng,name){ document.getElementById('svPanel').classList.add('open'); svPano.setPosition({lat,lng}); UI.setStatus('Street View: '+name,'ok'); }
  function closeSV(){ document.getElementById('svPanel').classList.remove('open'); }

  function panTo(lat,lng){ map.panTo({lat,lng}); }
  function setCenter(ll,z){ map.setCenter(ll); if(z)map.setZoom(z); }
  function updateStyles(){ if(curType==='roadmap') map.setOptions({styles:Theme.get()==='dark'?MAP_DARK:MAP_LIGHT}); }

  return {init,setType,geocode,nearby,getDetails,searchMap,placeLocMarkers,placeCompMarkers,clearLocMarkers,clearCompMarkers,bounceMarker,closeIWs,renderHeat,clearHeat,openSV,closeSV,panTo,setCenter,updateStyles,get map(){return map;}};
})();
window.MapMod=MapMod;

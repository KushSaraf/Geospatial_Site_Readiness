/* LocateIQ v3 — App Controller */
const App = (() => {
  let bizTypes=null, realData=null;
  let results=[], selIdx=-1;
  let currentAreaName='';
  let heatOn=true;

  async function init() {
    Theme.init();
    try {
      const [rd,bt]=await Promise.all([
        fetch('data/realdata.json').then(r=>r.json()),
        fetch('data/business-types.json').then(r=>r.json())
      ]);
      realData=rd; bizTypes=bt;
      Object.keys(bizTypes).forEach(k=>bizTypes[k].key=k);
      UI.setStatus('Ready — 5 real datasets loaded. Search any Gujarat location or Indian city','ok');
    } catch(e) {
      UI.toast('⚠️ Using built-in data');
      UI.setStatus('Ready — enter any location to analyze','ok');
    }
  }

  async function analyze() {
    const locInput = document.getElementById('locInput').value.trim();
    const bizKey   = document.getElementById('bizType').value;
    const radius   = parseInt(document.getElementById('radius').value);
    const budget   = document.getElementById('budget').value;
    const audience = document.getElementById('audience').value;
    if(!locInput){UI.toast('Please enter a location');return;}
    const bizConfig = bizTypes?.[bizKey];
    if(!bizConfig){UI.toast('Invalid business type');return;}

    resetState();
    document.getElementById('analyzeBtn').disabled=true;
    document.getElementById('div1').style.display='block';
    UI.showLoader('Geocoding location…'); UI.setLP(5);

    try {
      // Geocode ANY location
      UI.setLT('Geocoding: '+locInput+' …');
      const geoResult = await MapMod.geocode(locInput+', India');
      const center    = geoResult.geometry.location;
      const addrComp  = geoResult.address_components||[];

      // Extract city/district from geocode result
      const cityName  = extractCityName(addrComp, locInput);
      const cityKey   = normKey(cityName);

      MapMod.setCenter(center, 13);
      UI.setCityBadge(cityName);
      UI.setLP(20);

      // Resolve real data for this location
      const cityMeta  = resolveCityMeta(cityKey, addrComp);

      // Generate candidate points around the searched location
      UI.setLT('Generating search grid…');
      const candidates = genGrid(center, radius);
      UI.setLP(30);

      // Analyze all candidates
      const areaResults = await analyzeAll(candidates, bizConfig, radius, center, cityMeta, cityName, budget, audience);
      UI.setLP(88);

      UI.setLT('Finalizing scores…');
      await sleep(250);
      results = areaResults.sort((a,b)=>b.score.composite-a.score.composite).slice(0,CFG.MAX_RESULTS);
      UI.setLP(95);

      UI.hideLoader();
      renderResults(cityName, cityMeta, bizConfig, budget, audience);

    } catch(e) {
      UI.hideLoader();
      UI.toast('Error: '+e.message);
      UI.setStatus('Analysis failed — '+e.message,'error');
      console.error(e);
    }
    document.getElementById('analyzeBtn').disabled=false;
  }

  /* Extract city name from geocode address components */
  function extractCityName(comps, fallback) {
    const types=['locality','administrative_area_level_2','administrative_area_level_3','sublocality_level_1','sublocality'];
    for(const t of types){
      const c=comps.find(c=>c.types.includes(t));
      if(c) return c.long_name;
    }
    return fallback.split(',')[0].trim();
  }

  /* Normalize location key for lookup */
  function normKey(name){
    return name.toLowerCase()
      .replace(/\s+/g,'')
      .replace('ahmedabad','ahmedabad')
      .replace(/municipal corporation|district|taluka|city/gi,'')
      .trim();
  }

  /* Resolve city metadata from Gujarat data or other city overrides */
  function resolveCityMeta(cityKey, addrComps) {
    // 1. Try Gujarat expanded data
    const guj = GUJARAT_DATA.cities[cityKey];
    if(guj) return {
      rent:     guj.rent,
      safety:   guj.safety,
      malls:    guj.malls,
      density:  guj.density,
      tier:     guj.tier,
      fssai:    GUJARAT_DATA.fssaiTotal,
      crimeRate:GUJARAT_DATA.crimeRate,
      state:    'Gujarat'
    };

    // 2. Try other major cities
    const override = CITY_OVERRIDES[cityKey];
    if(override) return { ...override };

    // 3. Check if state is Gujarat from address components
    const stateComp = addrComps?.find(c=>c.types.includes('administrative_area_level_1'));
    if(stateComp?.long_name?.toLowerCase().includes('gujarat')){
      return {
        rent: GUJARAT_DATA.rentBase, safety: GUJARAT_DATA.safetyIndex,
        malls: 0, density: GUJARAT_DATA.urbanDensity,
        fssai: GUJARAT_DATA.fssaiTotal, crimeRate: GUJARAT_DATA.crimeRate,
        state:'Gujarat', tier:'tier3'
      };
    }

    // 4. Try realdata.json
    if(realData){
      const city = Object.entries(realData.cities).find(([k])=>k===cityKey||cityKey.includes(k)||k.includes(cityKey));
      if(city){
        const c=city[1];
        return {
          rent:c.rentData?.avg||80, safety:c.safetyIndex||60,
          malls:c.mallCount||0, density:c.urbanDensity||5000,
          fssai:c.fssaiTotal||0, crimeRate:c.crimeRate||400,
          state:c.state||'India', tier:'metro'
        };
      }
    }

    // 5. Generic India defaults
    return { rent:70, safety:55, malls:2, density:6000, fssai:50000, crimeRate:400, state:'India', tier:'unknown' };
  }

  /* Generate grid of candidate points around center */
  function genGrid(center, radius) {
    const pts=[{lat:center.lat(),lng:center.lng()}];
    const km=radius/1000;
    [0.3, 0.6, 0.9].forEach(d=>{
      [0,45,90,135,180,225,270,315].forEach(angle=>{
        const rad=angle*Math.PI/180;
        const dlat=(d*km*Math.cos(rad))/111;
        const dlng=(d*km*Math.sin(rad))/(111*Math.cos(center.lat()*Math.PI/180));
        pts.push({lat:center.lat()+dlat,lng:center.lng()+dlng});
      });
    });
    return pts.slice(0,14);
  }

  /* Analyze all candidate points */
  async function analyzeAll(candidates, bizConfig, radius, center, cityMeta, cityName, budget, audience) {
    const sr=Math.min(radius*0.45,1400), out=[];
    for(let i=0;i<candidates.length;i++){
      UI.setLT(`Analyzing area ${i+1}/${candidates.length} via Google Places…`);
      UI.setLP(30+Math.round((i/candidates.length)*55));
      const pt=candidates[i];
      try{
        const [comps, transitPlaces]=await Promise.all([
          MapMod.nearby(pt,bizConfig.types[0],sr),
          MapMod.nearby(pt,'transit_station',Math.min(sr,1000))
        ]);
        const transit=transitPlaces.length;

        // Build area object (blend real data with position-based estimates)
        const distKm=haversine(pt.lat,pt.lng,center.lat(),center.lng());
        const normDist=Math.min(distKm/(radius/1000),1);
        const area={
          name:'Area',
          tier:normDist<0.3?'premium':normDist<0.7?'mid':'budget',
          rentMult:1.0-normDist*0.35,
          footfallIdx:Math.round(80-normDist*28),
          incomeIdx:Math.round(75-normDist*22)
        };

        // Try to get a name from nearby places
        const areaName=comps[0]?.vicinity?.split(',').slice(-2).join(',').trim()
          ||transitPlaces[0]?.vicinity?.split(',').slice(-2).join(',').trim()
          ||cityName+(distKm>0.3?` (${distKm.toFixed(1)}km)`:' Centre');

        const sc  = Scoring.score({area,cityMeta,competitors:comps,transit,bizConfig,budget,audience});
        const roi = Scoring.calcROI({area,cityMeta,bizConfig,budget,score:sc.composite,cnt:comps.length});
        const risk= Scoring.assessRisk({score:sc.composite,cnt:comps.length,roi,area,cityMeta,bizConfig,budget});

        out.push({
          point:pt, score:sc, competitors:comps, transit, roi, risk,
          area, cityMeta, areaName, cityName,
          distKm:+distKm.toFixed(1)
        });
      }catch(e){/* skip */}
      await sleep(CFG.DELAY);
    }
    return out;
  }

  /* Render all results */
  function renderResults(cityName, cityMeta, bizConfig, budget, audience) {
    if(!results.length){UI.setStatus('No results found — try expanding radius','error');return;}
    const top=results[0];
    UI.renderHero(top);
    UI.renderAIRec(genRec(results,bizConfig,budget,audience,cityMeta));
    UI.renderList(results,selectLoc);
    UI.showExportBar();
    UI.showBStats(results);
    UI.setStatus(`✅ ${results.length} locations scored in ${cityName} — Best: ${top.score.composite}/100`,'ok');
    UI.setRight(`${top.areaName} · ${top.score.composite}/100`);
    MapMod.placeLocMarkers(results);
    if(heatOn) MapMod.renderHeat(results);
    document.getElementById('mapLegend')?.classList.add('show');
    selectLoc(0);
  }

  /* Select a location */
  async function selectLoc(idx) {
    selIdx=idx;
    const r=results[idx];
    if(!r)return;
    currentAreaName=r.areaName;
    UI.setActive(idx);
    MapMod.bounceMarker(idx);
    MapMod.panTo(r.point.lat,r.point.lng);
    MapMod.closeIWs();
    UI.renderDetailSection(r);
    ;
    ;
    ;
    
    ;
    // Show competitor strip with real place data
    UI.renderCompStrip(r.competitors, r.areaName);
    // Skeleton comp map markers — real ones come after detail fetch
    MapMod.placeCompMarkers(
      r.competitors.filter(c=>c.geometry).map(c=>({
        name:c.name, lat:c.geometry.location.lat(), lng:c.geometry.location.lng(),
        rating:c.rating, isOpen:c.opening_hours?.open_now,
        mapsUrl:`https://www.google.com/maps/place/?q=place_id:${c.place_id}`
      })), r.areaName
    );
  }

  /* Focus on a competitor */
  function focusComp(lat,lng,name) {
    if(!lat||!lng)return;
    MapMod.panTo(lat,lng); MapMod.openSV(lat,lng,name);
  }

  /* AI Recommendation */
  function genRec(res,bizConfig,budget,audience,cityMeta){
    const top=res[0],sec=res[1];
    const blab={low:'low budget',medium:'mid-range budget',high:'premium budget'}[budget];
    const safety=cityMeta.safety||55;
    if(top.score.composite>=80)
      return `🏆 Strong opportunity confirmed using ${CFG.DATA_SOURCES.length} verified datasets. ${top.areaName} leads with ${top.score.composite}/100 — excellent footfall & manageable competition (${top.competitors.length} competitors). Safety index: ${safety}/100 (NCRB), Avg rent: ₹${cityMeta.rent||70}/sqft. Estimated payback: ${top.roi.metrics.payback} months on a ${blab}.${sec?` #2 pick: ${sec.areaName} (${sec.score.composite}/100) for diversification.`:''}`;
    if(top.score.composite>=65)
      return `✅ Viable market found. Best candidate scores ${top.score.composite}/100. Real data: Safety=${safety}/100, Malls=${cityMeta.malls||0}, Rent=₹${cityMeta.rent||70}/sqft. Payback: ${top.roi.metrics.payback} months. Recommend ground survey before committing capital.`;
    return `⚠️ Challenging conditions. Best available: ${top.score.composite}/100. Safety=${safety}/100, Rent=₹${cityMeta.rent||70}/sqft. Consider larger radius or nearby area.`;
  }

  /* Scenario Simulator */
  function runScenario() {
    if(!results.length){UI.toast('Run analysis first');return;}
    const r=results[selIdx>=0?selIdx:0];
    const rent =parseFloat(document.getElementById('rentChg').value)||0;
    const traf =parseFloat(document.getElementById('trafChg').value)||0;
    const comp =parseFloat(document.getElementById('compChg').value)||0;
    const nr=Math.round(r.roi.monthly.revenue*(1+traf/100));
    const newRent=Math.round(r.roi.rentDetails.monthlyRent*(1+rent/100));
    const newCost=r.roi.monthly.totalCost-r.roi.rentDetails.monthlyRent+newRent;
    const np=nr-newCost;
    const roi_=Math.round((np*12/r.roi.metrics.budgetAmt)*100);
    const ns=Math.min(97,Math.max(10,Math.round(r.score.composite-rent*0.28+traf*0.45-comp*2.5)));
    UI.renderScenario({
      ns, nr, np, roi_:roi_, dp:np-r.roi.monthly.profit, ds:ns-r.score.composite,
      roi:roi_,
      verdict:np>r.roi.monthly.profit*1.1?'Significantly Improved':np>0?'Still Viable':'Not Viable'
    });
  }

  /* Exports */
  function exportJSON(){
    if(!results.length){UI.toast('No data');return;}
    const blob=new Blob([JSON.stringify({
      exportedAt:new Date().toISOString(), dataSources:CFG.DATA_SOURCES,
      query:{location:document.getElementById('locInput').value,businessType:document.getElementById('bizType').value,budget:document.getElementById('budget').value},
      results:results.map((r,i)=>({
        rank:i+1,area:r.areaName,city:r.cityName,score:r.score.composite,grade:r.score.grade.grade,
        lat:r.point.lat,lng:r.point.lng,competitors:r.competitors.length,
        rentPerSqft:r.roi.rentDetails.rentPerSqft,monthlyRent:r.roi.rentDetails.monthlyRent,
        estRevenue:r.roi.monthly.revenue,estProfit:r.roi.monthly.profit,
        annualROI:r.roi.metrics.annualROI,paybackMonths:r.roi.metrics.payback,
        safetyIndex:r.cityMeta.safety,mallCount:r.cityMeta.malls,riskLevel:r.risk.overall.level,
        signals:{positive:r.score.signals.positive,negative:r.score.signals.negative}
      }))
    },null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download=`locateiq-${Date.now()}.json`;a.click();UI.toast('JSON exported');
  }

  function exportCSV(){
    if(!results.length){UI.toast('No data');return;}
    const h=['Rank','Area','City','Score','Grade','Lat','Lng','Competitors','Rent/sqft','Monthly Rent','Est Revenue','Est Profit','Annual ROI','Payback (mo)','Safety','Malls','Risk'];
    const rows=results.map((r,i)=>[i+1,r.areaName,r.cityName,r.score.composite,r.score.grade.grade,r.point.lat,r.point.lng,r.competitors.length,r.roi.rentDetails.rentPerSqft,r.roi.rentDetails.monthlyRent,r.roi.monthly.revenue,r.roi.monthly.profit,r.roi.metrics.annualROI+'%',r.roi.metrics.payback,r.cityMeta.safety,r.cityMeta.malls,r.risk.overall.level]);
    const csv=[h,...rows].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`locateiq-${Date.now()}.csv`;a.click();UI.toast('CSV exported');
  }

  function toggleHeat(){
    heatOn=!heatOn;
    const btn=document.getElementById('heatBtn');
    btn?.classList.toggle('on',heatOn);
    if(heatOn&&results.length) MapMod.renderHeat(results);
    else MapMod.clearHeat();
  }

  function resetState(){
    MapMod.clearLocMarkers(); MapMod.clearCompMarkers(); MapMod.clearHeat();
    UI.resetAll(); results=[]; selIdx=-1; currentAreaName='';
  }

  function resetAll(){ resetState(); UI.setStatus('Reset — enter any location to analyze','ok'); UI.toast('Reset'); }

  return {init,analyze,selectLoc,focusComp,runScenario,exportJSON,exportCSV,toggleHeat,resetAll,get currentAreaName(){return currentAreaName;}};
})();
window.App=App;

/* Globals */
function fmtINR(n){const a=Math.abs(n),s=n<0?'-':'';if(a>=10000000)return s+(a/10000000).toFixed(1)+'Cr';if(a>=100000)return s+(a/100000).toFixed(1)+'L';if(a>=1000)return s+(a/1000).toFixed(0)+'K';return s+a;}
function haversine(la1,lo1,la2,lo2){const R=6371,dL=(la2-la1)*Math.PI/180,dG=(lo2-lo1)*Math.PI/180;const a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dG/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function initMap(){MapMod.init();App.init();}

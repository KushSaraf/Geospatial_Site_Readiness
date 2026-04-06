/* LocateIQ v4 — UI Module (Scrollable Layout) */
const UI = (() => {
  function setStatus(t,s='ok'){
    const el=document.getElementById('sText'),dot=document.getElementById('sDot');
    if(el)el.textContent=t;
    if(dot){dot.className='sdot';if(s==='loading')dot.classList.add('pulse');if(s==='error')dot.classList.add('err');}
  }
  function setRight(t){const el=document.getElementById('sRight');if(el)el.textContent=t;}
  function toast(msg,d=2800){const el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),d);}
  function showLoader(t){document.getElementById('loader')?.classList.add('show');setLT(t||'Analyzing…');setLP(0);}
  function hideLoader(){document.getElementById('loader')?.classList.remove('show');}
  function setLT(t){const el=document.getElementById('lText');if(el)el.textContent=t;setStatus(t,'loading');}
  function setLP(p){const el=document.getElementById('lFill');if(el)el.style.width=p+'%';}
  function setCityBadge(c){const el=document.getElementById('cityBadge');if(el)el.textContent='📍 '+c;}

  /* SCORE HERO (sidebar) */
  function renderHero(top){
    txt('scoreNum',top.score.composite); txt('gradeLabel',top.score.grade.label);
    txt('mFoot',top.score.breakdown.footfall.score+'%');
    txt('mComp',top.competitors.length+' found');
    txt('mROI',top.roi.metrics.annualROI+'%');
    txt('mRisk',top.risk.overall.level);
    const pct=top.score.composite/100;
    setTimeout(()=>{
      const c=document.getElementById('ringC');if(c)c.style.strokeDashoffset=163.4-(163.4*pct);
      const l=document.getElementById('ringL');if(l)l.textContent=top.score.composite;
    },80);
    document.getElementById('scoreHero')?.classList.add('show');
  }

  function renderAIRec(t){
    const el=document.getElementById('aiRecText');if(el)el.textContent=t;
    document.getElementById('aiRec')?.classList.add('show');
  }

  /* RANKED LIST (sidebar) */
  function renderList(results,onSel){
    const c=document.getElementById('listItems');if(!c)return;c.innerHTML='';
    results.forEach((r,i)=>{
      const p=r.score.composite>=75?'p-g':r.score.composite>=60?'p-y':'p-r';
      const e=i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
      const d=document.createElement('div');
      d.className='ri'+(i===0?' on':'');d.id='ri'+i;
      d.innerHTML=`
        <div class="ri-rnk">${e} RANK ${i+1} &nbsp;·&nbsp; ${r.distKm}km from center</div>
        <div class="ri-name">${r.areaName}</div>
        <div class="ri-foot">
          <span class="pill ${p}">${r.score.composite}/100 — ${r.score.grade.label}</span>
          <span style="font-size:10.5px;color:var(--muted)">${r.competitors.length} competitors</span>
        </div>`;
      d.onclick=()=>onSel(i); c.appendChild(d);
    });
    document.getElementById('resList')?.classList.add('show');
  }
  function setActive(idx){
    document.querySelectorAll('.ri').forEach((el,i)=>el.classList.toggle('on',i===idx));
    document.getElementById('ri'+idx)?.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  /* BELOW-MAP DETAIL SECTION */
  function renderDetailSection(r){
    const sec=document.getElementById('detailSection');
    if(!sec)return;
    sec.style.display='block';
    const sc=r.score.composite;
    const scColor=sc>=75?'var(--green)':sc>=60?'var(--yellow)':'var(--red)';
    const profit=r.roi.monthly.profit;
    const profColor=profit>0?'var(--green)':'var(--red)';

    sec.innerHTML=`
    <!-- SECTION HEADER -->
    <div class="section-header">
      <div>
        <div class="section-title">
          <span>📍</span> ${r.areaName}
          <span class="pill ${sc>=75?'p-g':sc>=60?'p-y':'p-r'}" style="font-size:12px;padding:4px 12px">${sc}/100</span>
        </div>
        <div class="section-sub">${r.cityName} &nbsp;·&nbsp; ${r.area.tier} tier &nbsp;·&nbsp; ${r.distKm}km from searched location</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="la la-maps" href="https://www.google.com/maps/search/?api=1&query=${r.point.lat},${r.point.lng}" target="_blank" style="width:auto;padding:9px 18px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          Google Maps
        </a>
        <a class="la la-dir" href="https://www.google.com/maps/dir/?api=1&destination=${r.point.lat},${r.point.lng}" target="_blank" style="width:auto;padding:9px 18px">🧭 Directions</a>
        <div class="la la-sv" style="width:auto;padding:9px 18px" onclick="MapMod.openSV(${r.point.lat},${r.point.lng},'${r.areaName.replace(/'/g,"\\'")}')">🚶 Street View</div>
      </div>
    </div>

    <!-- BIG 4 STATS -->
    <div class="big-score-row">
      <div class="bsc">
        <div class="bsc-val" style="color:${scColor}">${sc}/100</div>
        <div class="bsc-lbl">Suitability Score</div>
      </div>
      <div class="bsc">
        <div class="bsc-val" style="color:var(--green)">₹${fmtINR(r.roi.monthly.revenue)}</div>
        <div class="bsc-lbl">Est Monthly Revenue</div>
      </div>
      <div class="bsc">
        <div class="bsc-val" style="color:${profColor}">₹${fmtINR(profit)}</div>
        <div class="bsc-lbl">Est Monthly Profit</div>
      </div>
      <div class="bsc">
        <div class="bsc-val" style="color:${r.risk.overall.color}">${r.risk.overall.level}</div>
        <div class="bsc-lbl">Risk Level</div>
      </div>
    </div>

    <!-- 3 COLUMN DETAIL GRID -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">

      <!-- COL 1: Score Breakdown -->
      <div class="detail-card">
        <div class="card-t">📈 SCORE BREAKDOWN</div>
        ${renderBarsHTML(r.score.breakdown)}
      </div>

      <!-- COL 2: Financial Data -->
      <div class="detail-card">
        <div class="card-t">💰 FINANCIAL OVERVIEW</div>
        <div class="irow"><span class="ik">Payback Period</span><span class="iv">${r.roi.metrics.paybackLabel}</span></div>
        <div class="irow"><span class="ik">Annual ROI</span><span class="iv" style="color:${r.roi.metrics.annualROI>=0?'var(--green)':'var(--red)'}">${r.roi.metrics.annualROI}%</span></div>
        <div class="irow"><span class="ik">Net Margin</span><span class="iv">${r.roi.metrics.netMargin}%</span></div>
        <div class="irow"><span class="ik">Rent / sqft</span><span class="iv">₹${r.roi.rentDetails.rentPerSqft}</span></div>
        <div class="irow"><span class="ik">Monthly Rent Est.</span><span class="iv">₹${fmtINR(r.roi.rentDetails.monthlyRent)}</span></div>
        <div class="irow"><span class="ik">Staff Cost</span><span class="iv">₹${fmtINR(r.roi.monthly.costs.staff)}/mo</span></div>
        <div class="irow"><span class="ik">Raw Material</span><span class="iv">₹${fmtINR(r.roi.monthly.costs.rawMaterial)}/mo</span></div>
        <div class="irow"><span class="ik">Total Monthly Cost</span><span class="iv" style="color:var(--red)">₹${fmtINR(r.roi.monthly.totalCost)}</span></div>
      </div>

      <!-- COL 3: Real Data -->
      <div class="detail-card">
        <div class="card-t">🗂️ REAL DATA METRICS</div>
        <div class="irow"><span class="ik">🚌 Transit Stops</span><span class="iv" style="color:${(r.transit||0)>2?'var(--green)':(r.transit||0)>0?'var(--yellow)':'var(--muted)'}">${r.transit||0} nearby <small style="color:var(--green)">✓</small></span></div>
        <div class="irow"><span class="ik">🏬 City Malls</span><span class="iv" style="color:${(r.cityMeta.malls||0)>5?'var(--green)':(r.cityMeta.malls||0)>0?'var(--yellow)':'var(--muted)'}">${r.cityMeta.malls||0} malls <small style="color:var(--green)">✓</small></span></div>
        <div class="irow"><span class="ik">👥 Urban Density</span><span class="iv">${(r.cityMeta.density||0)>10000?'High':(r.cityMeta.density||0)>5000?'Medium':'Low'} <small style="color:var(--green)">✓</small></span></div>
        <div class="irow"><span class="ik">💰 Avg Rent/sqft</span><span class="iv">₹${r.cityMeta.rent||70}/sqft <small style="color:var(--green)">✓</small></span></div>
        <div class="irow"><span class="ik">🔒 Safety (NCRB)</span><span class="iv" style="color:${(r.cityMeta.safety||55)>=70?'var(--green)':(r.cityMeta.safety||55)>=50?'var(--yellow)':'var(--red)'}">${r.cityMeta.safety||55}/100 <small style="color:var(--green)">✓</small></span></div>
        <div class="irow"><span class="ik">🍽️ FSSAI Licenses</span><span class="iv">${r.cityMeta.fssai?fmtINR(r.cityMeta.fssai)+' state':'N/A'} <small style="color:var(--green)">✓</small></span></div>
        <div class="irow"><span class="ik">🏙️ City Tier</span><span class="iv" style="color:var(--ac)">${r.cityMeta.tier||'unknown'}</span></div>
        <div class="src-chips">${CFG.DATA_SOURCES.map(s=>`<span class="src-chip">✓ ${s}</span>`).join('')}</div>
      </div>
    </div>

    <!-- 2 COLUMN: Projections + Signals + Risk -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">

      <!-- Projections chart -->
      <div class="detail-card">
        <div class="card-t">📊 4-YEAR REVENUE PROJECTIONS</div>
        <div class="chart-wrap">
          <div class="chart-bars" id="projChart"></div>
          <div class="chart-xl" id="projLabels"></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px">
          ${r.roi.projections.map(p=>`<div style="text-align:center;background:var(--s3);border-radius:var(--r8);padding:8px 4px">
            <div style="font-family:var(--fh);font-size:12px;font-weight:700;color:${p.profit>=0?'var(--green)':'var(--red)'}">${p.roi>=0?'+':''}${p.roi}%</div>
            <div style="font-size:9.5px;color:var(--muted)">${p.year} ROI</div>
          </div>`).join('')}
        </div>
      </div>

      <!-- Signals + Risk -->
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="detail-card">
          <div class="card-t">⚡ MARKET SIGNALS</div>
          ${renderSignalsHTML(r.score.signals)}
        </div>
        <div class="detail-card">
          <div class="card-t">⚠️ RISK ANALYSIS &nbsp;<span class="pill ${r.risk.overall.level==='Low'?'p-g':r.risk.overall.level==='Moderate'?'p-y':r.risk.overall.level==='High'?'p-o':'p-r'}">${r.risk.overall.level} Risk</span></div>
          ${renderRiskHTML(r.risk)}
        </div>
      </div>
    </div>
    `;

    // Animate projection chart
    setTimeout(()=>renderChartInto(r.roi.projections,'projChart','projLabels'),100);
    // Animate bars
    setTimeout(()=>document.querySelectorAll('.bf[data-w]').forEach(b=>b.style.width=b.dataset.w+'%'),120);
    // Scroll to detail
    setTimeout(()=>sec.scrollIntoView({behavior:'smooth',block:'start'}),200);
  }

  function renderBarsHTML(bd){
    const clr={footfall:'#00c896',competition:'#3b82f6',income:'#10b981',accessibility:'#f59e0b',rentFit:'#8b5cf6',safety:'#ef4444',audience:'#ec4899'};
    return Object.entries(bd).map(([k,v])=>`
      <div class="br">
        <div class="bl"><span>${v.label}</span><span style="color:${clr[k]||'#64748b'}">${v.score}/100</span></div>
        <div class="bt"><div class="bf" data-w="${v.score}" style="width:0%;background:${clr[k]||'#64748b'}"></div></div>
      </div>`).join('');
  }

  function renderSignalsHTML(s){
    const pos=s.positive.map(x=>`<div class="sig sig-p"><span class="sig-ico">✅</span><span>${x.replace(/^✅\s?/,'')}</span></div>`);
    const neu=s.neutral.map(x=>`<div class="sig sig-u"><span class="sig-ico">⚡</span><span>${x.replace(/^⚡\s?/,'')}</span></div>`);
    const neg=s.negative.map(x=>`<div class="sig sig-n"><span class="sig-ico">⚠️</span><span>${x.replace(/^[⚠️🚨🔍]\s?/,'')}</span></div>`);
    return [...pos,...neu,...neg].join('')||'<div style="font-size:12px;color:var(--muted)">Standard market conditions</div>';
  }

  function renderRiskHTML(risk){
    const lc={Critical:'var(--red)',High:'var(--orange)',Moderate:'var(--yellow)',Low:'var(--green)'};
    let html=risk.risks.length
      ?risk.risks.map(r=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:10.5px;font-weight:700;color:${lc[r.level]};margin-bottom:3px">[${r.level}] ${r.cat}</div>
          <div style="font-size:12px;color:var(--text2)">${r.detail}</div>
        </div>`).join('')
      :'<div class="sig sig-p"><span>✅</span><span>No major risks detected</span></div>';
    if(risk.mitigations.length){
      html+=`<div style="margin-top:10px"><div style="font-family:var(--fh);font-size:9px;font-weight:700;letter-spacing:1.5px;color:var(--ac);margin-bottom:8px">💡 MITIGATIONS</div>
        ${risk.mitigations.map(m=>`<div class="sig sig-p" style="margin-bottom:5px"><span>💡</span><span>${m}</span></div>`).join('')}</div>`;
    }
    return html;
  }

  function renderChartInto(projs,chartId,labelId){
    const ce=document.getElementById(chartId),le=document.getElementById(labelId);if(!ce||!le)return;
    const colors=['#3b82f6','#00c896','#10b981','#f59e0b'],vals=projs.map(p=>p.revenue),mx=Math.max(...vals)||1;
    ce.innerHTML=vals.map((v,i)=>`<div class="chart-bar" style="background:${colors[i]};height:${Math.round((v/mx)*100)}%">
      <div class="chart-tip">${projs[i].year}: ₹${fmtINR(v)}<br>Profit: ₹${fmtINR(projs[i].profit)}<br>ROI: ${projs[i].roi}%</div></div>`).join('');
    le.innerHTML=projs.map(p=>`<div class="chart-xlbl">${p.year}</div>`).join('');
  }

  /* COMPETITOR STRIP */
  function renderCompStrip(comps, areaName){
    const strip=document.getElementById('compStrip');
    const scroll=document.getElementById('compScroll');
    const title=document.getElementById('csTitle');
    if(!strip||!scroll)return;
    if(title)title.textContent=`🏪 COMPETITORS NEAR ${areaName.toUpperCase().slice(0,28)} (${comps.length})`;

    if(!comps.length){
      scroll.innerHTML=`<div style="display:flex;align-items:center;gap:12px;font-size:12px;color:var(--muted);padding:4px 0;min-width:300px">
        <span style="font-size:28px">🔍</span>
        <div><strong style="color:var(--text2);font-size:13px">No direct competitors found nearby</strong><br>Market may be unvalidated — conduct ground survey before investing.</div>
      </div>`;
      strip.classList.add('open');return;
    }

    // Skeleton
    scroll.innerHTML=Array.from({length:Math.min(comps.length,5)}).map(()=>`
      <div class="cc" style="opacity:.45">
        <div class="skel" style="height:15px;width:72%;margin-bottom:10px"></div>
        <div class="skel" style="height:11px;width:90%;margin-bottom:6px"></div>
        <div class="skel" style="height:11px;width:55%;margin-bottom:10px"></div>
        <div style="display:flex;gap:6px">
          <div class="skel" style="height:26px;width:85px;border-radius:8px"></div>
          <div class="skel" style="height:26px;width:70px;border-radius:8px"></div>
        </div>
      </div>`).join('');
    strip.classList.add('open');
    fetchAndRenderCards(comps, scroll, areaName);
  }

  async function fetchAndRenderCards(comps, container, areaName){
    const enriched=[];
    for(const c of comps.slice(0,8)){
      try{
        const det=await MapMod.getDetails(c.place_id);
        enriched.push({
          name:c.name, rating:c.rating||null, totalRatings:c.user_ratings_total||0,
          address:c.vicinity||det?.formatted_address||'',
          lat:c.geometry?.location?.lat(), lng:c.geometry?.location?.lng(),
          isOpen:c.opening_hours?.open_now, priceLevel:c.price_level,
          phone:det?.formatted_phone_number||null, website:det?.website||null,
          mapsUrl:det?.url||`https://www.google.com/maps/place/?q=place_id:${c.place_id}`,
          hours:det?.opening_hours?.weekday_text||[], placeId:c.place_id
        });
      }catch{
        enriched.push({
          name:c.name, rating:c.rating, totalRatings:c.user_ratings_total||0,
          address:c.vicinity||'', lat:c.geometry?.location?.lat(), lng:c.geometry?.location?.lng(),
          isOpen:c.opening_hours?.open_now, mapsUrl:`https://www.google.com/maps/place/?q=place_id:${c.place_id}`,
          hours:[], phone:null, website:null, placeId:c.place_id
        });
      }
      await sleep(150);
    }
    MapMod.placeCompMarkers(enriched, areaName);
    container.innerHTML=enriched.map(c=>{
      const oc=c.isOpen===true?'y':c.isOpen===false?'n':'u';
      const ot=c.isOpen===true?'OPEN':c.isOpen===false?'CLOSED':'HRS N/A';
      const price=c.priceLevel?'₹'.repeat(c.priceLevel):'';
      const rc=!c.rating?'var(--muted)':c.rating>=4.5?'var(--green)':c.rating>=4.0?'var(--yellow)':'var(--orange)';
      const stars=c.rating?Array.from({length:5},(_,i)=>`<span class="cc-star${Math.round(c.rating)>i?'':' e'}">★</span>`).join(''):'';
      return `<div class="cc" onclick="App.focusComp(${c.lat},${c.lng},'${(c.name||'').replace(/'/g,"\\'")}')">
        <div class="cc-top"><div class="cc-name">${c.name}</div><span class="cc-open ${oc}">${ot}</span></div>
        ${c.rating?`<div class="cc-rating"><div class="cc-stars">${stars}</div><span style="color:${rc};font-weight:700">${c.rating}</span><span style="color:var(--muted);font-size:10px">(${c.totalRatings})</span></div>`:''}
        <div class="cc-addr">📍 ${c.address||'Address N/A'}</div>
        <div class="cc-tags">
          ${c.rating?`<span class="cc-tag" style="background:var(--yel-dim);color:var(--yellow)">⭐ ${c.rating}/5</span>`:''}
          ${price?`<span class="cc-tag" style="background:var(--green-dim);color:var(--green)">${price}</span>`:''}
          ${c.phone?`<span class="cc-tag" style="background:var(--blue-dim);color:var(--blue)">📞 Has Phone</span>`:''}
        </div>
        ${c.hours.length?`<div class="cc-hours">${c.hours.slice(0,1).join('<br>')}</div>`:''}
        <div class="cc-acts">
          <a class="ca ca-maps" href="${c.mapsUrl}" target="_blank" onclick="event.stopPropagation()">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            Open in Maps
          </a>
          ${c.lat?`<div class="ca ca-sv" onclick="event.stopPropagation();MapMod.openSV(${c.lat},${c.lng},'${(c.name||'').replace(/'/g,"\\'")}')">🚶 Street View</div>`:''}
          ${c.website?`<a class="ca ca-web" href="${c.website}" target="_blank" onclick="event.stopPropagation()">🌐 Website</a>`:''}
        </div>
      </div>`;
    }).join('');
  }

  function hideCompStrip(){document.getElementById('compStrip')?.classList.remove('open');}
  function showExportBar(){document.getElementById('expBar')?.classList.add('show');['exportBtn','csvBtn'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='flex'});}
  function showBStats(results){
    const el=document.getElementById('mapBStats');if(!el)return;
    const top=results[0];
    el.innerHTML=`<div style="display:flex;align-items:center;gap:4px">🔍 Analyzed <strong style="margin-left:3px">${results.length}</strong></div>
      <div style="color:var(--border2)">|</div>
      <div>Best <strong style="color:var(--ac)">${top.score.composite}/100</strong></div>
      <div style="color:var(--border2)">|</div>
      <div>📍 <strong>${top.areaName.slice(0,20)}</strong></div>
      <div style="color:var(--border2)">|</div>
      <div>Profit <strong style="color:var(--green)">₹${fmtINR(top.roi.monthly.profit)}/mo</strong></div>`;
    el.classList.add('show');
  }

  function renderScenario(d){
    const el=document.getElementById('scContent');if(!el)return;
    const dc=d.dp>=0?'var(--green)':'var(--red)',ds=d.ds>=0?'var(--green)':'var(--red)';
    el.innerHTML=`<div style="line-height:1.9">New Score: <b style="color:${ds}">${d.ns}/100 (${d.ds>=0?'+':''}${d.ds})</b><br>
      Revenue: <b>₹${fmtINR(d.nr)}/mo</b><br>
      Profit: <b style="color:${dc}">₹${fmtINR(d.np)}/mo (${d.dp>=0?'+':''}₹${fmtINR(d.dp)})</b><br>
      ROI: <b style="color:${d.roi>=0?'var(--green)':'var(--red)'}">${d.roi}%</b><br>
      Verdict: <b style="color:${d.ns>=60?'var(--green)':'var(--red)'}">${d.verdict}</b></div>`;
    document.getElementById('scRes')?.classList.add('show');
  }

  function resetAll(){
    ['scoreHero','aiRec','resList','expBar','mapLegend','mapBStats'].forEach(id=>document.getElementById(id)?.classList.remove('show'));
    const ds=document.getElementById('detailSection');if(ds)ds.style.display='none';
    document.getElementById('belowEmpty').style.display='flex';
    document.getElementById('scRes')?.classList.remove('show');
    document.getElementById('div1').style.display='none';
    ['exportBtn','csvBtn'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none'});
    setRight(''); MapMod.closeSV(); hideCompStrip();
  }

  function txt(id,v){const el=document.getElementById(id);if(el)el.textContent=v;}
  function html(id,h){const el=document.getElementById(id);if(el)el.innerHTML=h;}

  return {setStatus,setRight,toast,showLoader,hideLoader,setLT,setLP,setCityBadge,
    renderHero,renderAIRec,renderList,setActive,renderDetailSection,
    renderCompStrip,hideCompStrip,showExportBar,showBStats,renderScenario,resetAll,txt,html};
})();
window.UI=UI;

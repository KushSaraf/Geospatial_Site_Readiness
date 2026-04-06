/* LocateIQ v3 — Scoring Engine */
const Scoring = (() => {

  function score({ area, cityMeta, competitors, transit, bizConfig, budget, audience }) {
    const W = bizConfig.weights;
    const rent     = cityMeta.rent || 80;
    const budgetAmt= CFG.BUDGET_AMOUNTS[budget] || 1500000;

    // 1. FOOTFALL
    const mallB    = Math.min((cityMeta.malls||0) * 3, 18);
    const footfall = Math.min(100, (area.footfallIdx || 70) + (transit * 12) + mallB);

    // 2. COMPETITION
    const cnt = competitors.length;
    const { idealMin:mn, idealMax:mx, saturation:sat } = bizConfig;
    let comp;
    if (cnt === 0)       comp = 58;
    else if (cnt <= mx)  comp = 88 + (cnt >= mn ? 5 : 0);
    else if (cnt <= sat) comp = Math.round(88 - (cnt - mx) * (36 / (sat - mx)));
    else                 comp = Math.max(15, 55 - (cnt - sat) * 6);
    // FSSAI food density penalty
    const fpen = ['cafe','restaurant','bakery','grocery'].includes(bizConfig.key)
      ? Math.min((cityMeta.fssai||0) / 600000, 1) * 7 : 0;
    const competition = Math.max(12, Math.round(comp - fpen));

    // 3. INCOME
    const income = area.incomeIdx || 68;

    // 4. ACCESSIBILITY
    const access = Math.min(100, Math.round(
      (area.footfallIdx || 70) * 0.6 + transit * 10 + ((cityMeta.density||5000) > 10000 ? 10 : 4)
    ));

    // 5. RENT FIT
    const areaRent    = Math.round(rent * (area.rentMult || 1.0));
    const monthlyRent = areaRent * bizConfig.sqft;
    const annualRent  = monthlyRent * 12;
    const idealAnn    = budgetAmt * 0.20;
    const ratio       = annualRent / idealAnn;
    let rentFit;
    if (ratio < 0.5)       rentFit = 72;
    else if (ratio <= 1.0) rentFit = Math.min(100, 90 + Math.round((1 - ratio) * 20));
    else if (ratio <= 1.5) rentFit = Math.round(90 - (ratio - 1) * 44);
    else if (ratio <= 2.0) rentFit = Math.round(68 - (ratio - 1.5) * 44);
    else                   rentFit = Math.max(10, 46 - Math.round((ratio - 2) * 22));

    // 6. SAFETY BONUS
    const safeB = Math.round(((cityMeta.safety || 55) - 50) / 10);

    // 7. AUDIENCE
    const audScore = bizConfig.audience[audience] || 75;

    const raw =
      footfall    * W.footfall +
      competition * W.competition +
      income      * W.income +
      access      * W.accessibility +
      rentFit     * W.rent +
      audScore    * 0.05 + safeB;

    const composite = Math.min(97, Math.max(28, Math.round(raw)));

    return {
      composite,
      grade: getGrade(composite),
      breakdown: {
        footfall:      { score: footfall,    weight: W.footfall,      label: 'Footfall'       },
        competition:   { score: competition, weight: W.competition,   label: 'Competition'    },
        income:        { score: income,      weight: W.income,        label: 'Income Power'   },
        accessibility: { score: access,      weight: W.accessibility, label: 'Accessibility'  },
        rentFit:       { score: rentFit,     weight: W.rent,          label: 'Rent Fit'       },
        safety:        { score: cityMeta.safety||55, weight:.03,      label: 'Safety (NCRB)'  },
        audience:      { score: audScore,    weight:.05,              label: 'Audience Match' }
      },
      signals: genSignals({ footfall, competition, income, rentFit, cnt, cityMeta, area, bizConfig, ratio }),
      rentDetails: { areaRent, monthlyRent, annualRent }
    };
  }

  function genSignals({ footfall, competition, income, rentFit, cnt, cityMeta, area, bizConfig, ratio }) {
    const pos=[], neg=[], neu=[];
    if (footfall >= 75)       pos.push('✅ High foot traffic — transit & commercial zones nearby');
    else if (footfall >= 55)  neu.push('⚡ Moderate foot traffic — marketing needed for visibility');
    else                      neg.push('⚠️ Low foot traffic — depends on destination customers');
    if (cnt === 0)            neu.push('🔍 No direct competitors — validate demand before investing');
    else if (cnt <= bizConfig.idealMax) pos.push(`✅ Ideal competition level (${cnt}) — market validated`);
    else if (cnt <= bizConfig.saturation) neg.push(`⚠️ ${cnt} competitors — differentiation is critical`);
    else                      neg.push(`🚨 ${cnt} competitors — market is heavily saturated`);
    if (income >= 80)         pos.push('✅ High purchasing power — premium pricing viable');
    else if (income <= 55)    neu.push('💰 Price-sensitive market — value positioning recommended');
    if (rentFit >= 85)        pos.push('✅ Rent well within budget — strong financial buffer');
    else if (ratio > 1.8)     neg.push('⚠️ Rent strains budget — negotiate hard or choose nearby area');
    if ((cityMeta.safety||55) >= 70) pos.push(`✅ Safe area — Safety Index ${cityMeta.safety}/100 (NCRB verified)`);
    else if ((cityMeta.safety||55) <= 30) neg.push(`⚠️ Low safety index (${cityMeta.safety}/100) — affects customer comfort`);
    if ((cityMeta.malls||0) >= 5) pos.push(`✅ ${cityMeta.malls} malls in this city — strong retail ecosystem`);
    if (area.tier === 'premium') pos.push('✅ Premium tier location — strong brand visibility');
    return { positive: pos, negative: neg, neutral: neu };
  }

  function calcROI({ area, cityMeta, bizConfig, budget, score, cnt }) {
    const budgetAmt  = CFG.BUDGET_AMOUNTS[budget] || 1500000;
    const rent       = cityMeta.rent || 80;
    const areaRent   = Math.round(rent * (area.rentMult || 1));
    const monthlyRent= areaRent * bizConfig.sqft;
    const baseRev    = bizConfig.revBase[budget] || bizConfig.revBase.medium;
    const sm         = 0.5 + (score / 100) * 1.0;
    const im         = 0.7 + ((area.incomeIdx||68) / 100) * 0.6;
    const cm         = cnt===0?0.82 : cnt<=bizConfig.idealMax?1.05 : Math.max(0.60,1-(cnt-bizConfig.idealMax)*0.04);
    const estRev     = Math.round(baseRev * sm * im * cm / 10000) * 10000;
    const costs      = {
      rent:        monthlyRent,
      staff:       Math.round(estRev * 0.20),
      rawMaterial: Math.round(estRev * 0.28),
      utilities:   Math.round(monthlyRent * 0.12),
      marketing:   Math.round(estRev * 0.05),
      misc:        Math.round(estRev * 0.03)
    };
    const totalCost  = Object.values(costs).reduce((a,b)=>a+b,0);
    const profit     = estRev - totalCost;
    const annualROI  = Math.round((profit * 12 / budgetAmt) * 100);
    const payback    = profit > 0 ? Math.round(budgetAmt / profit) : 999;
    const netMargin  = Math.round((profit / estRev) * 100);
    const projs      = [1, 1.15, 1.29, 1.42].map((g,i) => ({
      year: `Yr ${i+1}`,
      revenue: Math.round(estRev * 12 * g),
      profit:  Math.round(profit * 12 * g),
      roi:     Math.round((profit * 12 * g / budgetAmt) * 100)
    }));
    return {
      monthly:  { revenue: estRev, costs, totalCost, profit },
      annual:   { revenue: estRev*12, profit: profit*12 },
      metrics:  { annualROI, payback, paybackLabel: fmtPay(payback), netMargin, budgetAmt },
      projections: projs,
      rentDetails: { sqft: bizConfig.sqft, rentPerSqft: areaRent, monthlyRent, annualRent: monthlyRent*12 }
    };
  }

  function assessRisk({ score, cnt, roi, area, cityMeta, bizConfig, budget }) {
    const risks=[], mits=[];
    if (roi.monthly.profit <= 0) {
      risks.push({level:'Critical',cat:'Financial Viability',detail:`Monthly loss ₹${fmtINR(Math.abs(roi.monthly.profit))} — costs exceed revenue`});
      mits.push('Reduce space by 25%','Increase budget','Choose lower-rent micro-area');
    } else if (roi.metrics.payback > 36) {
      risks.push({level:'High',cat:'Payback Period',detail:`${roi.metrics.payback}-month payback exceeds 36-month benchmark`});
      mits.push('Negotiate rent cap clause','Launch delivery revenue early');
    }
    if (cnt > bizConfig.saturation * 1.5) {
      risks.push({level:'Critical',cat:'Market Saturation',detail:`${cnt} competitors — far beyond saturation (${bizConfig.saturation})`});
      mits.push('Target niche sub-segment','Strong brand investment needed');
    } else if (cnt > bizConfig.saturation) {
      risks.push({level:'High',cat:'Market Saturation',detail:`${cnt} competitors exceeds saturation`});
    }
    const rentPct = Math.round((roi.monthly.costs.rent / roi.monthly.revenue) * 100);
    if (rentPct > 30) {
      risks.push({level:'High',cat:'Rent Burden',detail:`Rent = ${rentPct}% of revenue (safe: ≤20%)`});
      mits.push('Negotiate revenue-share lease','Consider smaller unit');
    }
    if ((cityMeta.safety||55) <= 30) {
      risks.push({level:'Moderate',cat:'Safety Index',detail:`Low safety index (${cityMeta.safety}/100) from NCRB data`});
      mits.push('Invest in security & lighting');
    }
    const riskPct = risks.length ? Math.round(risks.reduce((s,r)=>s+{Critical:4,High:3,Moderate:2,Low:1}[r.level],0)/(risks.length*4)*100) : 20;
    const overall = riskPct<=25?{level:'Low',color:'var(--green)'}:riskPct<=50?{level:'Moderate',color:'var(--yellow)'}:riskPct<=75?{level:'High',color:'var(--orange)'}:{level:'Critical',color:'var(--red)'};
    return { overall, risks, mitigations:[...new Set(mits)], riskPct };
  }

  function getGrade(s) {
    if (s>=86) return {grade:'A+',label:'Exceptional', color:'#00d4aa'};
    if (s>=78) return {grade:'A', label:'Excellent',   color:'#22c55e'};
    if (s>=70) return {grade:'B+',label:'Very Good',   color:'#84cc16'};
    if (s>=62) return {grade:'B', label:'Good',        color:'#f59e0b'};
    if (s>=54) return {grade:'C+',label:'Moderate',    color:'#f97316'};
    if (s>=45) return {grade:'C', label:'Fair',        color:'#ef4444'};
    return          {grade:'D', label:'Poor',          color:'#dc2626'};
  }

  function fmtPay(m){
    if(m>=999) return 'Not viable';
    if(m<=12)  return `${m} months ✅`;
    if(m<=24)  return `${m} months 🟡`;
    if(m<=36)  return `${m} months ⚠️`;
    return `${m} months 🚨`;
  }

  return { score, calcROI, assessRisk, getGrade };
})();

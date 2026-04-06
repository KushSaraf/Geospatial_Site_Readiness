/* LocateIQ v3 — Config */
const CFG = {
  GKEY: 'AIzaSyDE9XKikkX34uhZYJJWvZg1I3vL9yoNRVQ',
  MAX_RESULTS: 8,
  MAX_COMP_DETAIL: 8,
  DELAY: 180,
  BUDGET_AMOUNTS: { low: 500000, medium: 1500000, high: 5000000 },
  DATA_SOURCES: ['NCRB Crime Data 2023','FSSAI FoSCoS','Rent Survey 2025','Census Urban Data','India Mall Database (320)']
};

/* GUJARAT EXPANDED — every major city/area/district */
const GUJARAT_DATA = {
  /* State-level defaults */
  state: 'Gujarat',
  crimeRate: 806.3, safetyIndex: 51,
  rentBase: 70, mallBonus: 0,
  fssaiTotal: 196625, urbanDensity: 8000,

  /* City overrides — matched by geocoded name */
  cities: {
    'ahmedabad': { rent:115, safety:51, malls:3, density:11948, tier:'metro' },
    'surat':     { rent:95,  safety:51, malls:2, density:9500,  tier:'metro' },
    'vadodara':  { rent:80,  safety:51, malls:1, density:5200,  tier:'tier1' },
    'baroda':    { rent:80,  safety:51, malls:1, density:5200,  tier:'tier1' },
    'rajkot':    { rent:75,  safety:51, malls:1, density:4300,  tier:'tier1' },
    'bhavnagar': { rent:55,  safety:55, malls:0, density:3100,  tier:'tier2' },
    'jamnagar':  { rent:55,  safety:58, malls:0, density:3000,  tier:'tier2' },
    'junagadh':  { rent:50,  safety:60, malls:0, density:2800,  tier:'tier2' },
    'gandhinagar':{ rent:80, safety:60, malls:1, density:4000,  tier:'tier1' },
    'anand':     { rent:50,  safety:62, malls:0, density:2500,  tier:'tier2' },
    'navsari':   { rent:45,  safety:62, malls:0, density:2200,  tier:'tier2' },
    'valsad':    { rent:45,  safety:60, malls:0, density:2100,  tier:'tier2' },
    'mehsana':   { rent:45,  safety:58, malls:0, density:2000,  tier:'tier2' },
    'patan':     { rent:40,  safety:62, malls:0, density:1800,  tier:'tier3' },
    'morbi':     { rent:45,  safety:60, malls:0, density:2200,  tier:'tier2' },
    'surendranagar':{ rent:40, safety:62,malls:0, density:1700, tier:'tier3' },
    'bharuch':   { rent:50,  safety:58, malls:0, density:2400,  tier:'tier2' },
    'ankleshwar':{ rent:48,  safety:58, malls:0, density:2300,  tier:'tier2' },
    'porbandar': { rent:40,  safety:62, malls:0, density:1800,  tier:'tier3' },
    'amreli':    { rent:38,  safety:64, malls:0, density:1600,  tier:'tier3' },
    'veraval':   { rent:38,  safety:62, malls:0, density:1700,  tier:'tier3' },
    'gondal':    { rent:40,  safety:62, malls:0, density:1800,  tier:'tier3' },
    'botad':     { rent:35,  safety:65, malls:0, density:1500,  tier:'tier3' },
    'dahod':     { rent:35,  safety:65, malls:0, density:1400,  tier:'tier3' },
    'godhra':    { rent:38,  safety:60, malls:0, density:1600,  tier:'tier3' },
    'kheda':     { rent:38,  safety:62, malls:0, density:1700,  tier:'tier3' },
    'nadiad':    { rent:45,  safety:60, malls:0, density:2100,  tier:'tier2' },
    'modasa':    { rent:35,  safety:64, malls:0, density:1500,  tier:'tier3' },
    'himmatnagar':{ rent:40, safety:62, malls:0, density:1800,  tier:'tier3' },
    'palanpur':  { rent:38,  safety:62, malls:0, density:1700,  tier:'tier3' },
    'deesa':     { rent:35,  safety:64, malls:0, density:1500,  tier:'tier3' },
    'unjha':     { rent:38,  safety:62, malls:0, density:1600,  tier:'tier3' },
    'vapi':      { rent:55,  safety:58, malls:0, density:2800,  tier:'tier2' },
    'bardoli':   { rent:42,  safety:62, malls:0, density:1900,  tier:'tier3' },
    'olpad':     { rent:38,  safety:64, malls:0, density:1600,  tier:'tier3' },
    'kalol':     { rent:40,  safety:62, malls:0, density:1800,  tier:'tier3' },
    'visnagar':  { rent:38,  safety:62, malls:0, density:1700,  tier:'tier3' },
    'idar':      { rent:35,  safety:65, malls:0, density:1400,  tier:'tier3' },
    'dhoraji':   { rent:38,  safety:64, malls:0, density:1700,  tier:'tier3' },
    'upleta':    { rent:35,  safety:64, malls:0, density:1500,  tier:'tier3' },
    'jetpur':    { rent:38,  safety:62, malls:0, density:1700,  tier:'tier3' },
    'wankaner':  { rent:38,  safety:62, malls:0, density:1600,  tier:'tier3' },
    'dwarka':    { rent:35,  safety:65, malls:0, density:1200,  tier:'tier3' },
    'somnath':   { rent:38,  safety:65, malls:0, density:1300,  tier:'tier3' },
    'diu':       { rent:45,  safety:70, malls:0, density:2000,  tier:'tier2' },
    'sasan gir': { rent:35,  safety:70, malls:0, density:1000,  tier:'tier3' },
    'kutch':     { rent:40,  safety:62, malls:0, density:1500,  tier:'tier3' },
    'bhuj':      { rent:45,  safety:62, malls:0, density:2000,  tier:'tier2' },
    'mundra':    { rent:45,  safety:60, malls:0, density:2100,  tier:'tier2' },
    'gandhidham':{ rent:55,  safety:58, malls:0, density:2800,  tier:'tier2' },
    'anjar':     { rent:42,  safety:62, malls:0, density:1900,  tier:'tier3' },
    'mandvi':    { rent:38,  safety:64, malls:0, density:1600,  tier:'tier3' }
  }
};

/* OTHER MAJOR CITIES */
const CITY_OVERRIDES = {
  'mumbai':    { rent:150, safety:71, malls:19, density:27000, state:'Maharashtra', crimeRate:470.4, fssai:979599 },
  'delhi':     { rent:130, safety:2,  malls:32, density:11297, state:'Delhi',       crimeRate:1602,  fssai:96865  },
  'bangalore': { rent:115, safety:81, malls:12, density:13000, state:'Karnataka',   crimeRate:315.8, fssai:0      },
  'bengaluru': { rent:115, safety:81, malls:12, density:13000, state:'Karnataka',   crimeRate:315.8, fssai:0      },
  'pune':      { rent:85,  safety:71, malls:2,  density:8500,  state:'Maharashtra', crimeRate:470.4, fssai:979599 },
  'hyderabad': { rent:80,  safety:70, malls:9,  density:18100, state:'Telangana',   crimeRate:481.6, fssai:0      },
  'chennai':   { rent:75,  safety:57, malls:15, density:26903, state:'Tamil Nadu',  crimeRate:701.4, fssai:557013 }
};

/* Dark + Light map styles */
const MAP_DARK = [
  {elementType:'geometry',stylers:[{color:'#0d1117'}]},
  {elementType:'labels.text.stroke',stylers:[{color:'#0d1117'}]},
  {elementType:'labels.text.fill',stylers:[{color:'#546270'}]},
  {featureType:'administrative',elementType:'geometry.stroke',stylers:[{color:'#1c2333'}]},
  {featureType:'poi',elementType:'geometry',stylers:[{color:'#0f1521'}]},
  {featureType:'poi',elementType:'labels.text.fill',stylers:[{color:'#3d4f5e'}]},
  {featureType:'poi.park',elementType:'geometry',stylers:[{color:'#0c1a10'}]},
  {featureType:'road',elementType:'geometry',stylers:[{color:'#162032'}]},
  {featureType:'road.arterial',elementType:'geometry',stylers:[{color:'#1a2844'}]},
  {featureType:'road.highway',elementType:'geometry',stylers:[{color:'#1f3054'}]},
  {featureType:'road.highway',elementType:'labels.text.fill',stylers:[{color:'#2c4a70'}]},
  {featureType:'transit',elementType:'geometry',stylers:[{color:'#0d1520'}]},
  {featureType:'water',elementType:'geometry',stylers:[{color:'#050c1a'}]},
  {featureType:'water',elementType:'labels.text.fill',stylers:[{color:'#1a3a5c'}]}
];
const MAP_LIGHT = [
  {featureType:'water',elementType:'geometry',stylers:[{color:'#dde8f0'}]},
  {featureType:'landscape',elementType:'geometry',stylers:[{color:'#f5f5f0'}]},
  {featureType:'road.highway',elementType:'geometry',stylers:[{color:'#ffffff'},{weight:1.5}]},
  {featureType:'poi.park',elementType:'geometry',stylers:[{color:'#d8ead3'}]},
  {featureType:'poi',elementType:'labels',stylers:[{visibility:'off'}]}
];

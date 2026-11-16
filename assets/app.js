(function(){
'use strict';
var D, SOC = 'ALL', MOIS;
var KEYS = ['SACRI','DEFI','TR','SAFIR','PST'];
var LOGO = {SACRI:null, DEFI:'logo-defi.png', TR:'logo-trans.png', SAFIR:'logo-safir.png', PST:'logo-pst.png'};
var COL = {SACRI:'#E95B0F', DEFI:'#878480', TR:'#C7470A', SAFIR:'#B9B6B2', PST:'#55534F'};
var MN = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
var MC = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
var charts = {};
var $ = function(id){ return document.getElementById(id); };

function nb(x, d){ return Number(x).toLocaleString('fr-FR', {minimumFractionDigits:d||0, maximumFractionDigits:d||0}).replace(/\u202f|\u00a0/g, '\u00a0'); }
function fcfa(x){
  var a = Math.abs(x);
  if (a >= 1e9) return nb(x/1e9, 2) + '\u00a0Md';
  if (a >= 1e6) return nb(x/1e6, a >= 1e8 ? 0 : 1) + '\u00a0M';
  return nb(x/1e3, 0) + '\u00a0k';
}
function mlong(m){ return MN[+m.slice(5)-1] + ' ' + m.slice(0,4); }
function mcourt(m){ return MC[+m.slice(5)-1] + ' ' + m.slice(2,4); }
function prevYear(m){ return (+m.slice(0,4)-1) + m.slice(4); }
function prevMonth(m){ var i = D.mois.indexOf(m); return i > 0 ? D.mois[i-1] : null; }
function sel(){ return SOC === 'ALL' ? KEYS : [SOC]; }
function sum(fn, ks){ return (ks||sel()).reduce(function(a,k){ return a + fn(D.societes[k], k); }, 0); }
function pct(a, b){ return b ? (a/b - 1) * 100 : 0; }
function delta(v, inv, unit){
  var up = v >= 0, good = inv ? !up : up;
  return '<span class="' + (good ? 'up' : 'down') + '">' + (up ? '+' : '\u2212') + nb(Math.abs(v), 1) + (unit || '\u00a0%') + '</span>';
}
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function name(k){ return D.societes[k].nom; }

function axisFmt(v){ return v === 0 ? '0' : fcfa(v).replace('\u00a0', ' '); }
var baseOpts = function(){ return {
  responsive:true, maintainAspectRatio:false, animation:false,
  interaction:{mode:'index', intersect:false},
  plugins:{legend:{display:false}, tooltip:{backgroundColor:'#222', titleFont:{family:'Inter', weight:'600'}, bodyFont:{family:'Inter'}, padding:10, cornerRadius:6}},
  scales:{
    x:{grid:{display:false}, ticks:{font:{family:'Inter', size:11}, color:'#878480', maxRotation:0, autoSkip:true, autoSkipPadding:8}, border:{color:'#E3E1DE'}},
    y:{grid:{color:'#EEEDEB'}, border:{display:false}, ticks:{font:{family:'Inter', size:11}, color:'#878480', maxTicksLimit:5}}
  }
}; };
function draw(id, cfg){ if (charts[id]) charts[id].destroy(); charts[id] = new Chart($(id), cfg); }

function months12(){ var i = D.mois.indexOf(MOIS); return D.mois.slice(i-11, i+1); }

/* ---------- filtres ---------- */
function buildFilters(){
  var h = '<button class="grp" data-k="ALL">Groupe</button>';
  KEYS.forEach(function(k){ h += '<button data-k="' + k + '">' + esc(name(k)) + '</button>'; });
  $('socs').innerHTML = h;
  $('socs').addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return;
    SOC = b.getAttribute('data-k'); render();
  });
  var s = '';
  D.mois12.slice().reverse().forEach(function(m){ s += '<option value="' + m + '">' + mlong(m).replace(/^./, function(c){return c.toUpperCase();}) + '</option>'; });
  $('f-mois').innerHTML = s;
  $('f-mois').addEventListener('change', function(){ MOIS = this.value; render(); });
}

/* ---------- rendu ---------- */
function render(){
  [].forEach.call($('socs').children, function(b){ b.classList.toggle('on', b.getAttribute('data-k') === SOC); b.setAttribute('aria-selected', b.getAttribute('data-k') === SOC); });
  $('f-mois').value = MOIS;
  if (SOC === 'ALL'){ $('titre').textContent = 'Groupe SACRI, cinq sociétés'; $('metier').textContent = 'SACRI, DEFI, Trans-Roulements, SAFIR et PST-CI consolidés'; $('soc-logo').hidden = true; }
  else {
    $('titre').textContent = name(SOC); $('metier').textContent = D.societes[SOC].metier;
    if (LOGO[SOC]){ $('soc-logo').src = 'assets/' + LOGO[SOC]; $('soc-logo').alt = name(SOC); $('soc-logo').hidden = false; } else $('soc-logo').hidden = true;
  }
  $('contrib-box').style.display = SOC === 'ALL' ? '' : 'none';
  kpis(); ventes(); devis(); stocks(); sav(); finance();
}

function kpis(){
  var ca = sum(function(s){ return s.ventes[MOIS].ca; });
  var py = prevYear(MOIS), ca1 = D.mois.indexOf(py) >= 0 ? sum(function(s){ return s.ventes[py].ca; }) : 0;
  var mg = sum(function(s){ return s.ventes[MOIS].marge; });
  var pm = prevMonth(MOIS), mgp = pm ? sum(function(s){ return s.ventes[pm].marge; }) / sum(function(s){ return s.ventes[pm].ca; }) * 100 : 0;
  var m12 = months12(), ca12 = 0;
  m12.forEach(function(m){ ca12 += sum(function(s){ return s.ventes[m].ca; }); });
  var ao = D.ao.filter(function(a){ return sel().indexOf(a.soc) >= 0 && ['Préparation','Déposé','En négociation'].indexOf(a.etape) >= 0; });
  var pond = ao.reduce(function(a,x){ return a + x.montant * x.proba / 100; }, 0);
  var tr = sum(function(s){ return s.fin[MOIS].treso; });
  var trp = pm ? sum(function(s){ return s.fin[pm].treso; }) : tr;
  var mgr = mg/ca*100;
  var h = '';
  h += '<div class="kpi"><p class="l">Chiffre d\'affaires du mois</p><p class="v">' + fcfa(ca) + '<small>FCFA</small></p><p class="d">' + delta(pct(ca, ca1)) + ' sur ' + MC[+MOIS.slice(5)-1] + ' ' + py.slice(0,4) + '</p></div>';
  h += '<div class="kpi"><p class="l">Marge brute du mois</p><p class="v">' + nb(mgr, 1) + '<small>%</small></p><p class="d">' + fcfa(mg) + ' FCFA · ' + delta(mgr - mgp, false, '\u00a0pt') + ' sur le mois précédent</p></div>';
  h += '<div class="kpi"><p class="l">Affaires en cours, pondérées</p><p class="v">' + fcfa(pond) + '<small>FCFA</small></p><p class="d">' + ao.length + ' appels d\'offres et gros devis ouverts</p></div>';
  h += '<div class="kpi' + (tr < trp*.85 ? ' warn' : '') + '"><p class="l">Trésorerie disponible</p><p class="v">' + fcfa(tr) + '<small>FCFA</small></p><p class="d">' + delta(pct(tr, trp)) + ' sur fin ' + (pm ? MN[+pm.slice(5)-1] : '') + '</p></div>';
  $('kpis').innerHTML = h;

  // phrase de synthèse
  var enc = sum(function(s){ return s.fin[MOIS].encours; }), p60 = sum(function(s){ return s.fin[MOIS].b61_90 + s.fin[MOIS].b90; });
  var rup = sum(function(s){ return s.stock[MOIS].ruptures; });
  var dd = sum(function(s){ return s.sav[MOIS].dans_delai * s.sav[MOIS].entrees; }) / sum(function(s){ return s.sav[MOIS].entrees; });
  var t = 'En ' + mlong(MOIS) + ', ' + (SOC === 'ALL' ? 'le groupe' : name(SOC)) + ' a facturé <b>' + fcfa(ca) + ' FCFA</b>, ' + (ca >= ca1 ? 'en hausse' : 'en baisse') + ' de ' + nb(Math.abs(pct(ca, ca1)), 1) + '\u00a0% sur un an, pour <b>' + fcfa(ca12) + ' FCFA</b> sur douze mois. ';
  t += '<b>' + nb(rup) + ' articles</b> sont en rupture, ' + nb(dd, 0) + '\u00a0% des réparations sortent dans le délai prévu, et <b>' + nb(p60/enc*100, 0) + '\u00a0%</b> des sommes dues par les clients ont plus de 60 jours.';
  $('phrase').innerHTML = t;
}

function ventes(){
  var m12 = months12(), py = m12.map(prevYear);
  var cur = m12.map(function(m){ return sum(function(s){ return s.ventes[m].ca; }); });
  var old = py.map(function(m){ return D.mois.indexOf(m) >= 0 ? sum(function(s){ return s.ventes[m].ca; }) : null; });
  $('leg-ca').innerHTML = '<i class="sw o"></i>' + m12[0].slice(0,4) + '-' + m12[11].slice(2,4) + ' <i class="sw g"></i>Un an plus tôt';
  var o = baseOpts(); o.scales.y.ticks.callback = axisFmt;
  o.plugins.tooltip.callbacks = {label:function(c){ return ' ' + c.dataset.label + ' : ' + fcfa(c.raw) + ' FCFA'; }};
  draw('c-ca', {type:'bar', data:{labels:m12.map(mcourt), datasets:[
    {label:'Un an plus tôt', data:old, backgroundColor:'#D7D5D2', borderRadius:3, barPercentage:.8, categoryPercentage:.75},
    {label:'Chiffre d\'affaires', data:cur, backgroundColor:m12.map(function(m){ return m === MOIS ? '#E95B0F' : '#F2A06F'; }), borderRadius:3, barPercentage:.8, categoryPercentage:.75}
  ]}, options:o});

  // familles
  var fam = {};
  sel().forEach(function(k){ var f = D.societes[k].ventes[MOIS].fam; for (var x in f){ var lab = SOC === 'ALL' ? x + '|' + k : x; fam[lab] = (fam[lab]||0) + f[x]; } });
  var arr = Object.keys(fam).map(function(k){ return [k, fam[k]]; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0, SOC === 'ALL' ? 8 : 10);
  var tot = sum(function(s){ return s.ventes[MOIS].ca; }), mx = arr[0][1], h = '';
  arr.forEach(function(a){
    var p = a[0].split('|');
    h += '<div class="bar"><div class="t"><span>' + (p[1] ? '<span class="stag">' + esc(name(p[1])) + '</span>' : '') + esc(p[0]) + '</span><b>' + fcfa(a[1]) + ' <i>' + nb(a[1]/tot*100, 0) + '\u00a0%</i></b></div><div class="tr"><div class="fi" style="width:' + (a[1]/mx*100).toFixed(1) + '%"></div></div></div>';
  });
  $('cap-fam').textContent = (SOC === 'ALL' ? 'Premières familles de produits du groupe, ' : 'Familles de produits, ') + mlong(MOIS);
  $('familles').innerHTML = h;

  if (SOC === 'ALL'){
    var tt = {}, all = 0;
    KEYS.forEach(function(k){ tt[k] = 0; m12.forEach(function(m){ tt[k] += D.societes[k].ventes[m].ca; }); all += tt[k]; });
    var b = '', l = '';
    KEYS.forEach(function(k){
      var p = tt[k]/all*100;
      b += '<div data-k="' + k + '" title="' + esc(name(k)) + '" style="width:' + p.toFixed(2) + '%;background:' + COL[k] + '">' + (p > 7 ? nb(p, 0) + '\u00a0%' : '') + '</div>';
      l += '<span><i class="sw" style="background:' + COL[k] + '"></i><b>' + esc(name(k)) + '</b> ' + fcfa(tt[k]) + ' FCFA</span>';
    });
    $('contrib').innerHTML = b;
    var lg = $('contrib').nextElementSibling;
    if (!lg || !lg.classList.contains('contrib-l')){ lg = document.createElement('div'); lg.className = 'contrib-l'; $('contrib').after(lg); }
    lg.innerHTML = l;
    $('contrib').onclick = function(e){ var d = e.target.closest('[data-k]'); if (d){ SOC = d.getAttribute('data-k'); render(); window.scrollTo({top:0, behavior:'smooth'}); } };
  }
}

function devis(){
  var dv = sum(function(s){ return s.devis[MOIS].nb; }), val = sum(function(s){ return s.devis[MOIS].valeur; }), g = sum(function(s){ return s.devis[MOIS].gagne; });
  var pm = prevMonth(MOIS), tp = pm ? sum(function(s){ return s.devis[pm].gagne; }) / sum(function(s){ return s.devis[pm].valeur; }) * 100 : 0;
  var tx = g/val*100;
  var ao = D.ao.filter(function(a){ return sel().indexOf(a.soc) >= 0; });
  var gag = ao.filter(function(a){ return a.etape === 'Gagné'; }), per = ao.filter(function(a){ return a.etape === 'Perdu'; });
  var tauxAO = (gag.length + per.length) ? gag.length / (gag.length + per.length) * 100 : null;
  var h = '';
  h += '<div class="mini"><p class="l">Devis émis dans le mois</p><p class="v">' + nb(dv) + '</p><p class="d">pour ' + fcfa(val) + ' FCFA</p></div>';
  h += '<div class="mini"><p class="l">Taux de transformation, en valeur</p><p class="v">' + nb(tx, 1) + '<small>%</small></p><p class="d">' + delta(tx - tp, false, '\u00a0pt') + ' sur le mois précédent</p></div>';
  h += '<div class="mini"><p class="l">Devis gagnés dans le mois</p><p class="v">' + fcfa(g) + '<small>FCFA</small></p><p class="d">en commandes signées</p></div>';
  h += '<div class="mini"><p class="l">Appels d\'offres gagnés</p><p class="v">' + (tauxAO === null ? '\u2013' : nb(tauxAO, 0) + '<small>%</small>') + '</p><p class="d">' + gag.length + ' gagnés, ' + per.length + ' perdus depuis août</p></div>';
  $('devis-k').innerHTML = h;

  var et = ['Préparation','Déposé','En négociation','Gagné','Perdu'], mx = 0, by = {};
  et.forEach(function(e){ var l = ao.filter(function(a){ return a.etape === e; }); by[e] = {n:l.length, v:l.reduce(function(s,a){ return s + a.montant; }, 0)}; mx = Math.max(mx, by[e].v); });
  var f = '';
  et.forEach(function(e){
    var cls = e === 'Gagné' ? 'gagne' : e === 'Perdu' ? 'perdu' : '';
    f += '<div class="fn ' + cls + '"><span class="lab">' + e + '</span><div class="tr"><div class="fi" style="width:' + (mx ? Math.max(by[e].v/mx*100, by[e].n ? 3 : 0) : 0).toFixed(1) + '%;opacity:' + (cls ? 1 : .35 + .25 * et.indexOf(e)) + '"></div><span class="val">' + fcfa(by[e].v) + '<i>' + by[e].n + ' dossier' + (by[e].n > 1 ? 's' : '') + '</i></span></div></div>';
  });
  var ouv = ao.filter(function(a){ return et.slice(0,3).indexOf(a.etape) >= 0; });
  f += '<p class="fn-tot">En cours : <b>' + fcfa(ouv.reduce(function(s,a){ return s + a.montant; }, 0)) + ' FCFA</b> en valeur brute, <b>' + fcfa(ouv.reduce(function(s,a){ return s + a.montant*a.proba/100; }, 0)) + ' FCFA</b> pondérés par la probabilité de gain.</p>';
  $('funnel').innerHTML = f;

  var m12 = months12();
  var o = baseOpts(); o.scales.y.ticks.callback = function(v){ return v + ' %'; }; o.scales.y.suggestedMin = 15; o.scales.y.suggestedMax = 50;
  o.plugins.tooltip.callbacks = {label:function(c){ return ' ' + nb(c.raw, 1) + ' %'; }};
  draw('c-devis', {type:'line', data:{labels:m12.map(mcourt), datasets:[{data:m12.map(function(m){ return sum(function(s){ return s.devis[m].gagne; }) / sum(function(s){ return s.devis[m].valeur; }) * 100; }), borderColor:'#E95B0F', backgroundColor:'rgba(233,91,15,.08)', fill:true, tension:.3, pointRadius:m12.map(function(m){ return m === MOIS ? 5 : 2.5; }), pointBackgroundColor:'#E95B0F', borderWidth:2}]}, options:o});

  var ord = {'En négociation':0, 'Déposé':1, 'Préparation':2, 'Gagné':3, 'Perdu':4};
  var rows = ao.filter(function(a){ return ord[a.etape] < 3; }).sort(function(a,b){ return ord[a.etape]-ord[b.etape] || b.montant-a.montant; }).slice(0, 10);
  var t = '<thead><tr><th>Dossier</th>' + (SOC === 'ALL' ? '<th>Société</th>' : '') + '<th>Nature</th><th class="r">Montant</th><th>Étape</th><th class="r">Échéance</th></tr></thead><tbody>';
  rows.forEach(function(a){
    var pc = a.etape === 'Gagné' ? 'v' : a.etape === 'Perdu' ? '' : a.etape === 'En négociation' ? 'o' : '';
    t += '<tr><td><span class="ref">' + a.ref + '</span> ' + esc(a.objet) + '<span class="cl">' + esc(a.client) + '</span></td>' + (SOC === 'ALL' ? '<td data-l="Société">' + esc(name(a.soc)) + '</td>' : '') + '<td data-l="Nature">' + esc(a.type) + '</td><td class="r" data-l="Montant">' + fcfa(a.montant) + ' FCFA</td><td><span class="pill ' + pc + '">' + a.etape + (a.proba && a.proba < 100 ? ' · ' + a.proba + '\u00a0%' : '') + '</span></td><td class="r" data-l="Échéance">' + mcourt(a.echeance) + '</td></tr>';
  });
  $('t-ao').innerHTML = t + '</tbody>';
}

function stocks(){
  var v = sum(function(s){ return s.stock[MOIS].valeur; }), dor = sum(function(s){ return s.stock[MOIS].dormant; });
  var cov = sum(function(s){ return s.stock[MOIS].couverture * s.stock[MOIS].valeur; }) / v;
  var rup = sum(function(s){ return s.stock[MOIS].ruptures; }), refs = sum(function(s){ return s.stock[MOIS].refs; });
  var pm = prevMonth(MOIS), rp = pm ? sum(function(s){ return s.stock[pm].ruptures; }) : rup;
  var h = '';
  h += '<div class="mini"><p class="l">Valeur du stock</p><p class="v">' + fcfa(v) + '<small>FCFA</small></p><p class="d">au prix d\'achat</p></div>';
  h += '<div class="mini"><p class="l">Couverture</p><p class="v">' + nb(cov) + '<small>jours</small></p><p class="d">de ventes au rythme actuel</p></div>';
  h += '<div class="mini"><p class="l">Articles en rupture</p><p class="v">' + nb(rup) + '</p><p class="d">' + nb(rup/refs*100, 1) + '\u00a0% des références · ' + delta(pct(rup, rp), true) + '</p></div>';
  h += '<div class="mini"><p class="l">Stock sans mouvement depuis 12 mois</p><p class="v">' + fcfa(dor) + '<small>FCFA</small></p><p class="d">' + nb(dor/v*100, 0) + '\u00a0% de la valeur du stock</p></div>';
  $('stock-k').innerHTML = h;

  var m12 = months12();
  var cv = m12.map(function(m){ var vv = sum(function(s){ return s.stock[m].valeur; }); return sum(function(s){ return s.stock[m].couverture * s.stock[m].valeur; }) / vv; });
  var rr = m12.map(function(m){ return sum(function(s){ return s.stock[m].ruptures; }); });
  var o = baseOpts();
  o.scales.y.ticks.callback = function(x){ return x + ' j'; };
  o.scales.y2 = {position:'right', grid:{display:false}, border:{display:false}, ticks:{font:{family:'Inter', size:11}, color:'#878480', maxTicksLimit:5}, beginAtZero:true};
  o.plugins.tooltip.callbacks = {label:function(c){ return c.datasetIndex === 0 ? ' Couverture : ' + nb(c.raw) + ' jours' : ' Ruptures : ' + nb(c.raw); }};
  draw('c-stock', {type:'bar', data:{labels:m12.map(mcourt), datasets:[
    {type:'line', data:cv, borderColor:'#E95B0F', backgroundColor:'#E95B0F', borderWidth:2, tension:.3, pointRadius:2.5, yAxisID:'y', order:0},
    {data:rr, backgroundColor:'#D7D5D2', borderRadius:3, yAxisID:'y2', order:1, barPercentage:.6}
  ]}, options:o});

  var l = D.ruptures.filter(function(r){ return sel().indexOf(r.soc) >= 0; }).sort(function(a,b){ return b.jours - a.jours; }).slice(0, 7), u = '';
  l.forEach(function(r){
    u += '<li><span class="a">' + (SOC === 'ALL' ? '<span class="stag">' + esc(name(r.soc)) + '</span>' : '') + esc(r.article) + '</span><span class="j' + (r.jours > 21 ? ' down' : '') + '">' + r.jours + ' j</span><span class="s">' + (r.cmd === 'À commander' ? '<span class="pill r">À commander</span>' : r.cmd + ' le ' + r.arrivee.slice(8) + '/' + r.arrivee.slice(5,7)) + '</span></li>';
  });
  $('rupt').innerHTML = u || '<li class="empty">Aucune rupture.</li>';
}

function sav(){
  var e = sum(function(s){ return s.sav[MOIS].entrees; }), so = sum(function(s){ return s.sav[MOIS].sorties; });
  var dd = sum(function(s){ return s.sav[MOIS].dans_delai * s.sav[MOIS].entrees; }) / e;
  var ga = sum(function(s){ return s.sav[MOIS].garantie; }), cs = sum(function(s){ return s.sav[MOIS].ca_sav; });
  var pm = prevMonth(MOIS), ddp = pm ? sum(function(s){ return s.sav[pm].dans_delai * s.sav[pm].entrees; }) / sum(function(s){ return s.sav[pm].entrees; }) : dd;
  var h = '';
  h += '<div class="mini"><p class="l">Matériels reçus à l\'atelier</p><p class="v">' + nb(e) + '</p><p class="d">' + nb(so) + ' rendus aux clients</p></div>';
  h += '<div class="mini"><p class="l">Réparés dans le délai prévu</p><p class="v">' + nb(dd, 0) + '<small>%</small></p><p class="d">' + delta(dd - ddp, false, '\u00a0pt') + ' sur le mois précédent</p></div>';
  h += '<div class="mini"><p class="l">Retours sous garantie</p><p class="v">' + nb(ga) + '</p><p class="d">' + nb(ga/e*100, 0) + '\u00a0% des entrées</p></div>';
  h += '<div class="mini"><p class="l">Facturé par l\'atelier</p><p class="v">' + fcfa(cs) + '<small>FCFA</small></p><p class="d">main-d\'œuvre et pièces posées</p></div>';
  $('sav-k').innerHTML = h;

  var m12 = months12();
  var o = baseOpts();
  draw('c-sav', {type:'bar', data:{labels:m12.map(mcourt), datasets:[
    {label:'Entrés', data:m12.map(function(m){ return sum(function(s){ return s.sav[m].entrees; }); }), backgroundColor:m12.map(function(m){ return m === MOIS ? '#E95B0F' : '#F2A06F'; }), borderRadius:3, barPercentage:.8, categoryPercentage:.7},
    {label:'Sortis', data:m12.map(function(m){ return sum(function(s){ return s.sav[m].sorties; }); }), backgroundColor:'#C9C6C2', borderRadius:3, barPercentage:.8, categoryPercentage:.7}
  ]}, options:o});

  var at = {}; sel().forEach(function(k){ var a = D.societes[k].atelier; for (var x in a) at[x] = (at[x]||0) + a[x]; });
  var mx = Math.max.apply(null, Object.keys(at).map(function(x){ return at[x]; })), b = '';
  Object.keys(at).forEach(function(x, i){
    b += '<div class="bar' + (i >= 2 ? ' red' : '') + '"><div class="t"><span>' + x + '</span><b>' + nb(at[x]) + ' matériel' + (at[x] > 1 ? 's' : '') + '</b></div><div class="tr"><div class="fi" style="width:' + (at[x]/mx*100).toFixed(1) + '%"></div></div></div>';
  });
  $('atelier').innerHTML = b;

  var dl = m12.map(function(m){ return sum(function(s){ return s.sav[m].delai * s.sav[m].entrees; }) / sum(function(s){ return s.sav[m].entrees; }); });
  var ci = m12.map(function(m){ return sum(function(s){ return s.sav[m].cible * s.sav[m].entrees; }) / sum(function(s){ return s.sav[m].entrees; }); });
  var o2 = baseOpts(); o2.scales.y.beginAtZero = true; o2.scales.y.ticks.callback = function(x){ return x + ' j'; };
  o2.plugins.tooltip.callbacks = {label:function(c){ return ' ' + (c.datasetIndex ? 'Objectif' : 'Délai moyen') + ' : ' + nb(c.raw, 1) + ' jours'; }};
  draw('c-delai', {type:'line', data:{labels:m12.map(mcourt), datasets:[
    {data:dl, borderColor:'#E95B0F', borderWidth:2, tension:.3, pointRadius:2, pointBackgroundColor:'#E95B0F'},
    {data:ci, borderColor:'#222', borderWidth:1.2, borderDash:[5,4], pointRadius:0, tension:0}
  ]}, options:o2});
}

function finance(){
  var f = function(key){ return sum(function(s){ return s.fin[MOIS][key]; }); };
  var enc = f('encours'), p60 = f('b61_90') + f('b90');
  var dso = sum(function(s){ return s.fin[MOIS].dso * s.fin[MOIS].encours; }) / enc;
  var pm = prevMonth(MOIS), dsop = pm ? sum(function(s){ return s.fin[pm].dso * s.fin[pm].encours; }) / sum(function(s){ return s.fin[pm].encours; }) : dso;
  var tr = f('treso');
  var h = '';
  h += '<div class="mini"><p class="l">Sommes dues par les clients</p><p class="v">' + fcfa(enc) + '<small>FCFA</small></p><p class="d">à fin ' + MN[+MOIS.slice(5)-1] + '</p></div>';
  h += '<div class="mini"><p class="l">Délai moyen de paiement</p><p class="v">' + nb(dso) + '<small>jours</small></p><p class="d">' + delta(dso - dsop, true, '\u00a0j') + ' sur le mois précédent</p></div>';
  h += '<div class="mini"><p class="l">Dû depuis plus de 60 jours</p><p class="v">' + fcfa(p60) + '<small>FCFA</small></p><p class="d">' + nb(p60/enc*100, 0) + '\u00a0% des sommes dues</p></div>';
  h += '<div class="mini"><p class="l">Trésorerie disponible</p><p class="v">' + fcfa(tr) + '<small>FCFA</small></p><p class="d">soit ' + nb(tr / (sum(function(s){ return s.ventes[MOIS].ca * (1 - s.ventes[MOIS].marge / s.ventes[MOIS].ca); }) / 30 * 1.15), 0) + ' jours de dépenses courantes</p></div>';
  $('fin-k').innerHTML = h;

  var B = [['b0_30','0 à 30 jours'],['b31_60','31 à 60 jours'],['b61_90','61 à 90 jours'],['b90','Plus de 90 jours']], a = '';
  var mx = Math.max.apply(null, B.map(function(b){ return f(b[0]); }));
  B.forEach(function(b, i){ var x = f(b[0]); a += '<div class="bar' + (i === 1 ? ' alt' : i >= 2 ? ' red' : '') + '"><div class="t"><span>' + b[1] + '</span><b>' + fcfa(x) + ' <i>' + nb(x/enc*100, 0) + '\u00a0%</i></b></div><div class="tr"><div class="fi" style="width:' + (x/mx*100).toFixed(1) + '%"></div></div></div>'; });
  $('aged').innerHTML = a;

  var m12 = months12();
  var o = baseOpts(); o.scales.y.ticks.callback = axisFmt; o.scales.y.beginAtZero = true;
  o.plugins.tooltip.callbacks = {label:function(c){ return ' ' + fcfa(c.raw) + ' FCFA'; }};
  draw('c-treso', {type:'line', data:{labels:m12.map(mcourt), datasets:[{data:m12.map(function(m){ return sum(function(s){ return s.fin[m].treso; }); }), borderColor:'#E95B0F', backgroundColor:'rgba(233,91,15,.08)', fill:true, tension:.3, borderWidth:2, pointRadius:m12.map(function(m){ return m === MOIS ? 5 : 2; }), pointBackgroundColor:'#E95B0F'}]}, options:o});

  var l = D.impayes.filter(function(r){ return sel().indexOf(r.soc) >= 0; }).slice(0, 7);
  var t = '<thead><tr><th>Client</th>' + (SOC === 'ALL' ? '<th>Société</th>' : '') + '<th class="r">Montant</th><th class="r">Retard</th><th>Suite donnée</th></tr></thead><tbody>';
  l.forEach(function(r){ t += '<tr><td>' + esc(r.client) + '</td>' + (SOC === 'ALL' ? '<td data-l="Société">' + esc(name(r.soc)) + '</td>' : '') + '<td class="r" data-l="Montant">' + fcfa(r.montant) + ' FCFA</td><td class="r' + (r.jours > 90 ? ' down' : '') + '" data-l="Retard">' + r.jours + ' j</td><td><span class="pill' + (/demeure/.test(r.relance) ? ' r' : '') + '">' + esc(r.relance) + '</span></td></tr>'; });
  $('t-imp').innerHTML = t + '</tbody>';
}

/* ---------- démarrage ---------- */
fetch('data/donnees.json?v=20261116a').then(function(r){ return r.json(); }).then(function(d){
  D = d; MOIS = d.mois12[d.mois12.length - 1];
  $('arrete').textContent = mlong(MOIS);
  Chart.defaults.font.family = 'Inter';
  buildFilters();
  var q = new URLSearchParams(location.search);
  if (q.get('s') && (q.get('s') === 'ALL' || KEYS.indexOf(q.get('s')) >= 0)) SOC = q.get('s');
  if (q.get('m') && d.mois12.indexOf(q.get('m')) >= 0) MOIS = q.get('m');
  render();
  document.body.setAttribute('data-ready', '1');
});
})();

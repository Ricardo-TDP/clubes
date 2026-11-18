/* Padel Atlas LATAM — lógica de directorio + base de datos data.json
   Sin dependencias. Escritura en archivo vía File System Access API con respaldo local. */
(function () {
'use strict';

/* ============ utilidades ============ */
var $ = function (s) { return document.querySelector(s); };
var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); };
var ic = function (n, st) { return '<svg class="ic"' + (st ? ' style="' + st + '"' : '') + ' aria-hidden="true"><use href="#i-' + n + '"/></svg>'; };
var fl = function (k) { return '<svg class="fl" aria-hidden="true"><use href="#f-' + k + '"/></svg>'; };
var mqCards = matchMedia('(max-width:1240px)');
var reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ============ configuración ============ */
var C = [
 ['co', 'Colombia', 'Colombia', '#FFC53D', '57', ['Bogotá D.C.', 'Cundinamarca', 'Antioquia', 'Valle del Cauca', 'Atlántico', 'Bolívar', 'Magdalena']],
 ['sv', 'El Salvador', 'El Salvador', '#4D8DFF', '503', ['San Salvador', 'La Libertad']],
 ['ni', 'Nicaragua', 'Nicaragua', '#38BDF8', '505', ['Managua']],
 ['gt', 'Guatemala', 'Guatemala', '#2DD4BF', '502', ['Guatemala', 'Sacatepéquez', 'Suchitepéquez']],
 ['do', 'Rep. Dominicana', 'R. Dom.', '#FF5A6E', '1', ['Distrito Nacional', 'Santiago', 'La Romana']],
 ['ec', 'Ecuador', 'Ecuador', '#FF9838', '593', ['Pichincha', 'Guayas']],
 ['pe', 'Perú', 'Perú', '#FF3DA6', '51', ['Lima', 'Lima (Cañete)', 'Arequipa', 'La Libertad', 'Lambayeque']],
 ['bo', 'Bolivia', 'Bolivia', '#4ADE80', '591', ['Santa Cruz', 'Cochabamba', 'La Paz', 'Beni']]
];
var CM = {}, CO = {};
C.forEach(function (c, i) { CM[c[0]] = { key: c[0], name: c[1], short: c[2], color: c[3], code: c[4], regions: c[5] }; CO[c[0]] = i; });
var SRC = {
 padelocal: ['Padelocal', 'https://padelocal.com/'], padelgt: ['PadelGT', 'https://padel.com.gt/'],
 fdp: ['FDP.do', 'https://www.fdp.do/if_consultaclub2.aspx'], limapadel: ['LimaPadel', 'https://limapadel.pe/clubes/lima'],
 padelmesh: ['PadelMesh', 'https://padelmesh.com/es/bo/clubs'], gsearch: ['Búsqueda', ''], csv: ['CSV', ''], atlas: ['Atlas', ''], manual: ['Manual', '']
};
var GS = { sv: 'https://www.google.com/search?q=clubes+padel+El+Salvador', ni: 'https://www.google.com/search?q=clubes+padel+Nicaragua', ec: 'https://www.google.com/search?q=clubes+padel+Ecuador' };
var FIELDS = ['id', 'name', 'country', 'region', 'city', 'addr', 'ig', 'wa', 'src', 'maps', 'note', 'csv', 'ph', 'alt', 'verified'];
var SIZES = [50, 100, 300, 500];
var RL = { listo: 'Listo', wa: 'WA', ig: 'IG', none: 'Sin contacto' };

/* ============ semilla integrada (respaldo si data.json no es legible) ============ */
var SEED = [
["c01","Locos por Pádel","co","Bogotá D.C.","Bogotá","Cl. 147 #58C-04","locosporpadel","573160234639","padelocal"],
["c02","La Pala Club de Pádel","co","Bogotá D.C.","Bogotá","","lapalabogota","","padelocal","","Conflicto de handles: Excel @lapalabogota vs CSV @lapalapadel. El CSV traía un WhatsApp placeholder; descartado.",1,"573100000000","lapalapadel"],
["c03","Pádel Planet Co","co","Bogotá D.C.","Bogotá","","padelplanetco","","padelocal"],
["c04","Spin Padel","co","Bogotá D.C.","Bogotá","Cl. 134 #55-30","","","padelocal"],
["c05","Bogotá Pádel Club","co","Bogotá D.C.","Bogotá","Ak 7 #69-41","bogotapadelclub","573165306717","padelocal","","WhatsApp coincide en Excel y CSV. IG aportado por el CSV.",1],
["c06","Pádel Drop 92","co","Bogotá D.C.","Bogotá","Calle 92 #15-32","padeldrop92","573183950958","padelocal"],
["c07","Distrito Padel","co","Bogotá D.C.","Bogotá","Ak. 58 #169-02","","","padelocal"],
["c08","PZD | Pro Padel Zone","co","Bogotá D.C.","Bogotá","Cra. 19a #78-99","","","padelocal"],
["c09","Padelhub Club El Rodeo","co","Antioquia","Medellín","Cl. 2 Sur #65-535","","573208323013","padelocal"],
["c10","La Bodega del Padel","co","Antioquia","Medellín","Cra. 44 #25-59","","573052274979","padelocal"],
["c11","Club Santa María (Padelhub)","co","Antioquia","Medellín","Cl. 7B Sur #29C-100","","573112321560","padelocal"],
["c12","Ultimate Padel","co","Valle del Cauca","Cali","Cra. 125 #19-59","","573173725231","padelocal"],
["c13","Panoramic Padel Cali","co","Valle del Cauca","Cali","Cra. 125 #16A-02","","573168337987","padelocal"],
["c14","Gran Padel Social Club","co","Atlántico","Barranquilla","Cra. 59B #81-158","","573102105284","padelocal"],
["c15","Padel House Cartagena","co","Bolívar","Cartagena","Barrio Crespo","padelhousectg","573216990205","padelocal"],
["c16","Arena Pádel Club Santa Marta","co","Magdalena","Santa Marta","Sector Tres Cazuelas, Rodadero","","573007655566","padelocal"],
["a01","Green Padel Club","co","Cundinamarca","Chía","","greenpadelclub","","atlas","","Complemento Atlas: club 100% pádel con academia y torneos. Confirmar contacto comercial."],
["a02","Club El Nogal","co","Bogotá D.C.","Bogotá","","clubelnogal","","atlas","","Complemento Atlas: club social premium con canchas indoor."],
["a03","Club Los Lagartos","co","Bogotá D.C.","Bogotá","","clubloslagartos","","atlas","","Complemento Atlas: confirmar encargado de pádel."],
["a04","Country Club de Bogotá","co","Bogotá D.C.","Bogotá","","countryclubdebogota","","atlas","","Complemento Atlas: escuela de pádel activa."],
["a05","Club Campestre de Cali","co","Valle del Cauca","Cali","","clubcampestrecali","","atlas","","Complemento Atlas: confirmar sección de pádel."],
["s01","Padel Town","sv","San Salvador","San Salvador","Calle #1","padeltown","50369995172","gsearch","","El CSV traía placeholder 50371111111; se usa el número real del Excel.",1],
["s02","Círculo Deportivo Internacional","sv","San Salvador","San Salvador","Alameda Manuel Enrique Araujo y Calle Lorena","","50325283700","gsearch","","Cancha de pádel dentro del club social."],
["s03","Padel One","sv","La Libertad","Nuevo Cuscatlán","","padelone.sv","","csv","","Aporte CSV. WhatsApp placeholder descartado: verificar vía IG.",0,"503700000000"],
["a06","Club Salvadoreño","sv","San Salvador","San Salvador","","clubsalvadoreno","","atlas","","Complemento Atlas: confirmar sección de pádel."],
["n01","Raqueteo Padel Club","ni","Managua","Managua","Camino Oriente, frente edificio Kakau","raqueteoclub","50589228877","gsearch","","El CSV traía placeholder 505800000000; se usa el real del Excel.",1],
["n02","Zona Padel","ni","Managua","Managua","Costado noroeste Rotonda Jean Paul Genie","","","gsearch"],
["n03","Café Las Flores Padel Club","ni","Managua","Managua (Las Colinas)","","cafelasflores","50558612098","csv","","Aporte CSV con WhatsApp real."],
["a07","Club Terraza","ni","Managua","Managua","","clubterraza","","atlas","","Complemento Atlas: principal club de raquetas; confirmar canchas de pádel."],
["g01","Futeca Padel","gt","Guatemala","Ciudad de Guatemala","Zona 14","","50250008392","padelgt"],
["g02","Padel Arena","gt","Guatemala","Ciudad de Guatemala","3 Avenida 9-33, Zona 9","","50256310897","padelgt"],
["g03","Rally Padel","gt","Guatemala","Ciudad de Guatemala","Zona 16","","50230132166","padelgt"],
["g04","Padel Park","gt","Guatemala","Ciudad de Guatemala","14 Avenida 15-02, Zona 10","","50235735304","padelgt"],
["g05","La Finca Country Club","gt","Suchitepéquez","Cuyotenango","Finca El Rosario km 166.5","","50242712875","padelgt"],
["g06","Club de Padel Garadian","gt","Guatemala","Ciudad de Guatemala","Boulevard Austriaco 37-01, Zona 16","","50255790242","padelgt"],
["g07","Vista Hermosa Padel","gt","Guatemala","Ciudad de Guatemala","Zona 15","","50230204531","padelgt"],
["g08","El Sótano Club de Pádel","gt","Guatemala","Ciudad de Guatemala","Calzada Roosevelt 33-85, Zona 11","elsotanopadel","50230494036","padelgt","","WhatsApp coincide en Excel y CSV. IG aportado por el CSV.",1],
["g09","Quattro Padel Club","gt","Sacatepéquez","Antigua Guatemala","Finca Colombia","quattropadel","50237814161","padelgt","","El CSV traía placeholder 502400000000; se usa el real del Excel.",1],
["d01","Grove Padel Club","do","Distrito Nacional","Santo Domingo","Av. Santo Cerro","grovepadelclub","18093752929","fdp","","El CSV traía placeholder 18090000000; se usa el real de la FDP.",1],
["d02","Padel Republic","do","Distrito Nacional","Santo Domingo","Av. 27 de Febrero 583","","18292087896","fdp"],
["d03","Santo Domingo Padel Club (SDpadelClub)","do","Distrito Nacional","Santo Domingo","Av. Winston Churchill","","18097290975","fdp"],
["d04","Padel Social Club","do","Distrito Nacional","Santo Domingo","Calle Simón Bolívar 969","","18495077674","fdp"],
["d05","Padel Oasis","do","Distrito Nacional","Santo Domingo","Av. George Washington 500","","18094182813","fdp"],
["d06","Padel Warehouse","do","Distrito Nacional","Santo Domingo","Calle 4 #3, Ensanche Camelita","","18293423393","fdp"],
["d07","Dominican Padel Club","do","Distrito Nacional","Santo Domingo","Av. Luperón 25","","18495173645","fdp"],
["d08","Teniclu Sports & Wellness","do","Santiago","Licey al Medio (Santiago)","Los Castillos, Las Palomas","","18099712687","fdp"],
["d09","STI Racket Club","do","Santiago","Santiago de los Caballeros","","stiracketclub","18498861200","csv","","Aporte CSV con WhatsApp real."],
["a08","Casa de Campo Resort & Villas","do","La Romana","La Romana","","casadecampodr","","atlas","","Complemento Atlas: resort con canchas de pádel; contacto vía depto. deportivo."],
["a09","Club Deportivo Naco","do","Distrito Nacional","Santo Domingo","","clubnaco","","atlas","","Complemento Atlas: club social top de Santo Domingo."],
["e01","Club Padel Calderón","ec","Pichincha","Quito (Calderón)","Calle Vancouver y Av. Cacha","","593958736900","gsearch"],
["e02","LaPala Club","ec","Pichincha","Quito (Tumbaco)","C. Carchi y Ruta Viva","","593999977500","gsearch"],
["e03","La Pampa Padel Club","ec","Pichincha","Quito","Av. La Pampa y Av. Manuel Córdova Galarza","","593958963450","gsearch"],
["e04","Q-Pádel","ec","Pichincha","Quito","Alfonso Lamiña","","593964069883","gsearch"],
["e05","Urban Pádel","ec","Pichincha","Quito","Av. de la República y La Pradera","","593986999023","gsearch"],
["e06","Miravalle Padel Hub","ec","Pichincha","Quito","Av. Interoceánica km 4","","593963519388","gsearch"],
["e07","Cumbayá Padel Center","ec","Pichincha","Quito (Cumbayá)","Calle Isidro Ayora y Av. Oswaldo Guayasamín","cumbayapadelcenter","593995738363","gsearch","","WhatsApp coincide en Excel y CSV. IG aportado por el CSV.",1],
["e08","World Padel Center — La Catedral","ec","Pichincha","Quito (Tumbaco)","E28C km 14.5","","593997614247","gsearch"],
["e09","Go Padel Center","ec","Guayas","Guayaquil","C. 13, Portón de las Lomas","","","gsearch"],
["e10","18 Padel Club","ec","Pichincha","Quito","","18padelclub","","csv","","Aporte CSV. WhatsApp placeholder descartado: verificar vía IG.",0,"593980000000"],
["a10","Guayaquil Tenis Club","ec","Guayas","Guayaquil","","guayaquiltenisclub","","atlas","","Complemento Atlas: club de raqueta líder en Guayaquil."],
["p01","Bohemia Pádel Club","pe","Lima","San Borja","Av. San Borja Sur 1228","","","limapadel"],
["p02","Club Pádel Lima (La Once)","pe","Lima","Surquillo","Av. Tomás Marsano 630","clubpadellima","","limapadel","","IG del CSV. WhatsApp placeholder descartado; el directorio no publica número.",1,"51900000000"],
["p03","Club Petroperú","pe","Lima","Santiago de Surco","Av. Club Golf Los Incas 320","","","limapadel"],
["p04","Club X3","pe","Lima","Miraflores","Av. Paseo de la República 5840","","","limapadel"],
["p05","Inside Court Pádel","pe","Lima","La Molina","Ca. Viña del Mar 235, Sol de la Molina","","","limapadel"],
["p06","International Padel Asia — GIAC Sports","pe","Lima (Cañete)","Asia","Km 98, Panamericana Sur","","","limapadel","","Balnearios de Asia: temporada alta dic–mar."],
["p07","Mad Pádel Surco","pe","Lima","Santiago de Surco","Jr. Venegas 898","","","limapadel"],
["p08","Más+ Pádel Perú","pe","Lima","San Miguel","Av. Bertolotto 611","","","limapadel"],
["p09","One Padel — Centro Naval","pe","Lima","San Borja","Av. San Luis 2347","","","limapadel"],
["p10","One Padel — Domingo Orué","pe","Lima","Surquillo","Pje. Recabarraca s/n","","","limapadel"],
["p11","One Padel — El Trigal","pe","Lima","Santiago de Surco","C. Los Antares 298","","","limapadel"],
["p12","One Padel — Manuel Olguín","pe","Lima","Santiago de Surco","Av. Manuel Olguín 245","","","limapadel"],
["p13","Pádel Arena Surco","pe","Lima","Santiago de Surco","El Polo 843","","","limapadel"],
["p14","Peru Padel Center — Benavides","pe","Lima","Miraflores","Av. Benavides","","","limapadel"],
["p15","Peru Padel Center — Mendiburu","pe","Lima","Miraflores","Av. Gral. Mendiburu 671","","","limapadel"],
["p16","Pro Padel Peru","pe","Lima","Magdalena del Mar","Av. del Ejército 750","","","limapadel"],
["p17","Top Padel La Molina","pe","Lima","La Molina","Av. Melgarejo 147","","","limapadel"],
["p18","X Pádel Lima","pe","Lima","Jesús María","Club Lawn Tennis, Av. General Salaverry 399","","","limapadel"],
["p19","AQP Pádel Center","pe","Arequipa","Cerro Colorado (Arequipa)","Prolongación Villa Hermoza s/n","","","limapadel"],
["p20","Padel Nation","pe","Arequipa","Cerro Colorado (Arequipa)","Av. Aviación km 4","","","limapadel"],
["p21","The Urban Padel Hub","pe","La Libertad","Trujillo","Mz D Lote 5D, Urb. El Golf","","","limapadel"],
["p22","X Pádel Trujillo","pe","La Libertad","Trujillo","El Golf","","","limapadel"],
["p23","Jockey Club de Chiclayo","pe","Lambayeque","Chiclayo (La Victoria)","Los Incas 379","","","limapadel"],
["p24","Larena Club","pe","Lambayeque","Pimentel","Prol. Los Arenales s/n, Los Sauces","","","limapadel"],
["p25","Igma Padel Center","pe","Lima","Santiago de Surco","","igmapadel","","csv","https://maps.google.com/?q=Yoy+Lima+Box+Park+Club+El+Jockey+Lima","WhatsApp placeholder descartado. El Maps del CSV apunta a Box Park El Jockey: confirmar sede real.",0,"51911000000"],
["a11","Club Terrazas","pe","Lima","Miraflores","","clubterrazas","","atlas","","Complemento Atlas: referente del pádel limeño."],
["a12","Club Regatas Lima","pe","Lima","Chorrillos","","clubregataslima","","atlas","","Complemento Atlas: gran club deportivo; confirmar contacto de pádel."],
["b01","Go Padel Santa Cruz","bo","Santa Cruz","Santa Cruz de la Sierra","","","","padelmesh"],
["b02","Black Padel Cochabamba","bo","Cochabamba","Cochabamba","","","","padelmesh"],
["b03","Zona Padel","bo","La Paz","La Paz","","","","padelmesh"],
["b04","Costanera Central Padel Club","bo","Santa Cruz","Santa Cruz de la Sierra","Avenida 4to Anillo","","","padelmesh"],
["b05","Top Padel","bo","Santa Cruz","Santa Cruz de la Sierra","","","","padelmesh"],
["b06","Nación Padel","bo","Cochabamba","Cochabamba","","","","padelmesh"],
["b07","El Mero Mero Pádel Club Tiquipaya","bo","Cochabamba","Tiquipaya","","","","padelmesh"],
["b08","PadelBo Norte","bo","Santa Cruz","Santa Cruz de la Sierra","","","","padelmesh"],
["b09","Pádel Sport SC","bo","Santa Cruz","Santa Cruz de la Sierra","Av. Banzer, entre 3er y 4to anillo","padelsportsc","59167877725","padelmesh"],
["b10","360 Padel Club","bo","Santa Cruz","Santa Cruz de la Sierra","","","","padelmesh"],
["b11","Padel Chopp","bo","Beni","Trinidad","","","","padelmesh"],
["b12","Padel Zone","bo","Cochabamba","Quillacollo","","","","padelmesh"],
["b13","Central Padel Club","bo","Cochabamba","Cochabamba","","","","padelmesh"],
["b14","Pro Padel Cochabamba","bo","Cochabamba","Cochabamba","","","","padelmesh"],
["b15","Fiori’s Padel Club","bo","La Paz","La Paz","Carreras 5","fioris_padel_club","59177259952","padelmesh"],
["b16","Cape Padel","bo","Santa Cruz","Colinas del Urubó","Avenida Segunda","capepadel.scz","59179894724","padelmesh"],
["b17","Elite Padel","bo","Santa Cruz","Santa Cruz de la Sierra","Dr. Alejandro Ramirez","","59176201122","padelmesh"],
["b18","Padel House","bo","La Paz","La Paz","Av. Arequipa","","59177761003","padelmesh"],
["b19","Gatorade Padel Park","bo","La Paz","La Paz (Calacoto)","Calacoto Calle 16","gatoradepadelpark","","csv","","Aporte CSV. WhatsApp placeholder descartado: verificar vía IG.",0,"59170000000"],
["b20","Boli Padel","bo","Santa Cruz","Santa Cruz de la Sierra (Equipetrol)","Equipetrol Manzana 40","bolipadel","","csv","","Aporte CSV. WhatsApp placeholder descartado: verificar vía IG.",0,"59171111111"],
["a13","Club Tenis Santa Cruz","bo","Santa Cruz","Santa Cruz de la Sierra","","clubtenissantacruz","","atlas","","Complemento Atlas: referente del pádel boliviano."]
];

/* ============ serialización ============ */
function unpackRow(a) { var o = {}; FIELDS.forEach(function (k, i) { o[k] = a[i] != null ? a[i] : (k === 'csv' || k === 'verified' ? 0 : ''); }); return o; }
function packRow(c) {
  var a = FIELDS.map(function (k) { return c[k] != null ? c[k] : (k === 'csv' || k === 'verified' ? 0 : ''); });
  while (a.length > 9 && (a[a.length - 1] === '' || a[a.length - 1] === 0)) a.pop();
  return a;
}
function parseDB(p) {
  var rows = p.rows || p.clubs || [];
  var clubs = rows.map(function (r) { return Array.isArray(r) ? unpackRow(r) : Object.assign(unpackRow([]), r); });
  return {
    clubs: clubs, order: p.order || [], views: p.views || [],
    prefs: Object.assign({ pageSize: 50, dens: 'cozy', view: 'table', rail: 1, note: 1 }, p.prefs || {}),
    updatedAt: p.updatedAt ? Date.parse(p.updatedAt) || 0 : 0
  };
}
function serialize() {
  return {
    format: 'padel-atlas/1', schema: FIELDS, updatedAt: new Date(DB.updatedAt || Date.now()).toISOString(),
    prefs: DB.prefs, views: DB.views, order: DB.order, rows: DB.clubs.map(packRow)
  };
}
function jsonText() { return JSON.stringify(serialize(), null, 1); }

/* ============ estado ============ */
var DB = { clubs: [], order: [], views: [], prefs: { pageSize: 50, dens: 'cozy', view: 'table', rail: 1, note: 1 }, updatedAt: 0 };
var S = { f: blank(), sort: { k: 'country', d: 1 }, page: 1, per: 50, sel: {}, drawer: null, edit: null, origin: 'seed' };
function blank() { return { q: '', country: 'all', region: 'all', src: 'all', contact: 'all', ver: false }; }
var KEY = 'padelAtlas.v4', lsOK = true, handle = null, saveTimer = null, dirty = false, lastSave = 0;
try { localStorage.setItem(KEY + 't', '1'); localStorage.removeItem(KEY + 't'); } catch (e) { lsOK = false; }

/* ============ acceso a datos ============ */
var all = function () { return DB.clubs; };
var byId = function (id) { for (var i = 0; i < DB.clubs.length; i++) if (DB.clubs[i].id === id) return DB.clubs[i]; return null; };
var idxOf = function (id) { for (var i = 0; i < DB.clubs.length; i++) if (DB.clubs[i].id === id) return i; return -1; };
var isV = function (c) { return !!c.verified; };
var ready = function (c) { return c.wa && c.ig ? 'listo' : c.wa ? 'wa' : c.ig ? 'ig' : 'none'; };
var igU = function (c) { return c.ig ? 'https://www.instagram.com/' + c.ig + '/' : 'https://www.google.com/search?q=' + encodeURIComponent('site:instagram.com ' + c.name + ' pádel ' + c.city); };
var waU = function (c) { return c.wa ? 'https://wa.me/' + c.wa : 'https://www.google.com/search?q=' + encodeURIComponent('"' + c.name + '" ' + c.city + ' WhatsApp pádel'); };
var mpU = function (c) { return c.maps || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.name + ', ' + (c.addr || c.city) + ', ' + CM[c.country].name); };
var srU = function (c) { return (SRC[c.src] && SRC[c.src][1]) || (c.src === 'gsearch' ? (GS[c.country] || '') : ''); };
var srL = function (c) { return SRC[c.src] ? SRC[c.src][0] : '—'; };
var hasConf = function (c) { return !!c.alt || /confirmar sede/i.test(c.note || ''); };
function ensureOrder() {
  var seen = {};
  DB.order = DB.order.filter(function (id) { if (seen[id] || idxOf(id) < 0) return false; seen[id] = 1; return true; });
  DB.clubs.forEach(function (c) { if (!seen[c.id]) DB.order.push(c.id); });
}
function mirror() { if (!lsOK) return; try { localStorage.setItem(KEY, JSON.stringify(serialize())); } catch (e) { lsOK = false; } }
function persist() {
  DB.updatedAt = Date.now(); dirty = true; mirror();
  if (handle) { clearTimeout(saveTimer); saveTimer = setTimeout(function () { writeFile(false); }, 600); chip('busy', 'Guardando…'); }
  else chip('off', 'Sin guardar');
  dataPanel(); footState();
}
function chip(st, txt) { $('#saveChip').dataset.st = st; $('#saveTxt').textContent = txt; }
function hhmm(t) { var d = new Date(t); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function footState() {
  $('#footState').textContent = (handle ? 'vinculado ✓' : S.origin === 'file' ? 'leído ✓' : S.origin === 'cache' ? 'respaldo local' : 'semilla') +
    (DB.updatedAt ? ' · ' + hhmm(DB.updatedAt) : '');
}
function dataPanel() {
  $('#dataStatus').textContent = handle ? 'data.json · vinculado' : S.origin === 'file' ? 'data.json · leído' : S.origin === 'cache' ? 'respaldo del navegador' : 'semilla integrada';
  $('#dataRows').textContent = DB.clubs.length;
  $('#dataSaved').textContent = lastSave ? hhmm(lastSave) + ' (archivo)' : DB.updatedAt ? hhmm(DB.updatedAt) + ' (local)' : '—';
  $('#pUpd').textContent = DB.updatedAt ? 'ACT · ' + hhmm(DB.updatedAt) : 'SEMILLA';
}
async function writeFile(first) {
  if (!handle) return;
  try {
    chip('busy', 'Guardando…');
    var w = await handle.createWritable();
    await w.write(new Blob([jsonText()], { type: 'application/json' }));
    await w.close();
    lastSave = Date.now(); dirty = false;
    chip('ok', 'Guardado ' + hhmm(lastSave));
    if (first) toast('success', 'data.json vinculado: cada cambio se escribe solo en el archivo');
    dataPanel(); footState();
  } catch (e) {
    handle = null; chip('err', 'Error al guardar');
    toast('danger', 'No se pudo escribir data.json', { label: 'Reintentar', fn: saveFlow });
  }
}
function downloadJSON() {
  dl(new Blob([jsonText()], { type: 'application/json' }), 'data.json');
  dirty = false; chip('ok', 'Descargado ✓');
  toast('success', 'data.json descargado — reemplaza el archivo de la carpeta del proyecto');
  dataPanel();
}
async function saveFlow() {
  if (handle) { clearTimeout(saveTimer); await writeFile(false); toast('success', 'Cambios guardados en data.json'); return; }
  if (window.showSaveFilePicker) {
    try {
      handle = await window.showSaveFilePicker({ suggestedName: 'data.json', types: [{ description: 'Base de datos JSON', accept: { 'application/json': ['.json'] } }] });
      S.origin = 'file'; await writeFile(true); return;
    } catch (e) { if (e && e.name === 'AbortError') return; handle = null; }
  }
  downloadJSON();
}
async function linkFlow() {
  if (window.showOpenFilePicker) {
    try {
      var picks = await window.showOpenFilePicker({ multiple: false, mode: 'readwrite', types: [{ description: 'Base de datos JSON', accept: { 'application/json': ['.json'] } }] });
      handle = picks[0];
      var f = await handle.getFile(); var txt = await f.text();
      var p = parseDB(JSON.parse(txt));
      if (p.clubs.length) { adopt(p, 'file'); toast('success', 'data.json cargado y vinculado · ' + p.clubs.length + ' clubes'); }
      else toast('info', 'Archivo vacío: se conservan los datos actuales');
      S.origin = 'file'; await writeFile(false); render(true); return;
    } catch (e) { if (e && e.name === 'AbortError') return; handle = null; }
  }
  $('#filePick').click();
}
function adopt(p, origin) {
  DB = p; S.origin = origin;
  S.per = SIZES.indexOf(p.prefs.pageSize) >= 0 ? p.prefs.pageSize : 50;
  ensureOrder(); applyPrefs(); mirror();
}
function applyPrefs() {
  document.body.classList.toggle('compact', DB.prefs.dens === 'compact');
  document.body.classList.toggle('norail', !DB.prefs.rail && !mqCards.matches);
  S.view = DB.prefs.view;
}
function loadNote() {
  var n = $('#loadNote');
  if (!DB.prefs.note) { n.hidden = true; return; }
  if (S.origin === 'file' && handle) { n.hidden = true; return; }
  n.hidden = false;
  if (S.origin === 'file') $('#loadTxt').innerHTML = '<b>data.json leído.</b> Vincúlalo para que cada cambio se guarde solo en el archivo.';
  else if (S.origin === 'cache') $('#loadTxt').innerHTML = '<b>Respaldo del navegador.</b> No se pudo leer data.json (restricción de <code>file://</code>). Vincula el archivo o sirve la carpeta con un servidor local.';
  else $('#loadTxt').innerHTML = '<b>Semilla integrada (108 clubes).</b> Vincula <b>data.json</b> para leer y guardar tus cambios en el archivo.';
}

/* ============ filtrado / orden ============ */
function pass(c, f) {
  if (f.country !== 'all' && c.country !== f.country) return false;
  if (f.region !== 'all' && c.region !== f.region) return false;
  if (f.src !== 'all' && c.src !== f.src) return false;
  if (f.ver && !isV(c)) return false;
  var k = f.contact;
  if (k === 'listo' && !(c.wa && c.ig)) return false;
  if (k === 'wa' && !(c.wa && !c.ig)) return false;
  if (k === 'ig' && !(c.ig && !c.wa)) return false;
  if (k === 'none' && (c.wa || c.ig)) return false;
  if (k === 'ph' && !c.ph) return false;
  if (k === 'conf' && !hasConf(c)) return false;
  if (f.q) {
    var h = (c.name + ' ' + CM[c.country].name + ' ' + c.region + ' ' + c.city + ' ' + c.addr + ' ' + c.ig + ' ' + c.alt + ' ' + c.wa + ' ' + c.note + ' ' + srL(c)).toLowerCase();
    if (h.indexOf(f.q.toLowerCase()) < 0) return false;
  }
  return true;
}
var RK = { listo: 0, wa: 1, ig: 2, none: 3 };
function view() {
  var a = all().filter(function (c) { return pass(c, S.f); }), k = S.sort.k, d = S.sort.d;
  if (k === 'manual') { ensureOrder(); var oi = {}; DB.order.forEach(function (id, i) { oi[id] = i; }); return a.sort(function (x, y) { return (oi[x.id] - oi[y.id]) * d; }); }
  var cmp = {
    country: function (a, b) { return (CO[a.country] - CO[b.country]) || a.name.localeCompare(b.name, 'es'); },
    name: function (a, b) { return a.name.localeCompare(b.name, 'es'); },
    region: function (a, b) { return a.region.localeCompare(b.region, 'es') || a.name.localeCompare(b.name, 'es'); },
    ready: function (a, b) { return (RK[ready(a)] - RK[ready(b)]) || a.name.localeCompare(b.name, 'es'); }
  }[k];
  return a.sort(function (x, y) { return cmp(x, y) * d; });
}
function slice(list) {
  var mp = Math.max(1, Math.ceil(list.length / S.per));
  S.page = Math.min(Math.max(1, S.page), mp);
  return list.slice((S.page - 1) * S.per, S.page * S.per);
}
var PRE = [
 { id: 'r', c: 'r', n: 'Listos para contactar', i: 'ckc', f: { contact: 'listo' } },
 { id: 'w', c: 'w', n: 'Solo WhatsApp', i: 'wa', f: { contact: 'wa' } },
 { id: 'i', c: 'i', n: 'Solo Instagram', i: 'ig', f: { contact: 'ig' } },
 { id: 'n', c: 'n', n: 'Sin contacto directo', i: 'al', f: { contact: 'none' } },
 { id: 'ph', c: 'ph', n: 'Placeholders WA', i: 'al', f: { contact: 'ph' } },
 { id: 'cf', c: 'cf', n: 'Conflictos de datos', i: 'al', f: { contact: 'conf' } },
 { id: 'at', c: 'at', n: 'Complementos Atlas', i: 'gl', f: { src: 'atlas' } }
];

/* ============ render ============ */
function hl(t, q) { t = String(t == null ? '' : t); if (!q) return esc(t); var i = t.toLowerCase().indexOf(q.toLowerCase()); if (i < 0) return esc(t); return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); }
function chipSrc(c) {
  var u = srU(c), cl = c.src === 'csv' ? 'csv' : (c.src === 'atlas' || c.src === 'manual') ? 'atlas' : c.src === 'gsearch' ? 'gsearch' : '';
  return (u ? '<a class="sc ' + cl + '" href="' + u + '" target="_blank" rel="noopener" title="Abrir fuente">' + esc(srL(c)) + '</a>' : '<span class="sc ' + cl + '">' + esc(srL(c)) + '</span>') + (c.csv ? '<span class="plus" title="También en 2.csv">+CSV</span>' : '');
}
function chipR(c) { var r = ready(c); return '<span class="rd ' + r + '">' + RL[r] + '</span>'; }
function flags(c) { var s = ''; if (c.ph) s += '<svg class="ic fli" aria-label="Placeholder descartado"><use href="#i-al"/></svg>'; if (hasConf(c)) s += '<svg class="ic fli" aria-label="Conflicto de datos"><use href="#i-al"/></svg>'; return s; }
function vm(c) { return isV(c) ? '<svg class="ic vok" aria-label="Verificado"><use href="#i-ckc"/></svg>' : ''; }
var manual = function () { return S.sort.k === 'manual'; };

function renderTop() {
  var a = all(), wa = 0, ig = 0, rd = 0, ve = 0, cnt = {};
  C.forEach(function (c) { cnt[c[0]] = 0; });
  a.forEach(function (c) { if (c.wa) wa++; if (c.ig) ig++; if (c.wa && c.ig) rd++; if (isV(c)) ve++; cnt[c.country]++; });
  $('#kTotal').textContent = a.length; $('#kWA').textContent = wa; $('#kReady').textContent = rd;
  $('#pTotal').textContent = a.length; $('#pMiniWA').textContent = wa; $('#pMiniIG').textContent = ig; $('#pMiniReady').textContent = rd; $('#pMiniVer').textContent = ve;
  var d = $('#pDist');
  if (!d.children.length) C.forEach(function (c) { var b = document.createElement('button'); b.dataset.country = c[0]; b.style.background = c[3]; b.title = c[1] + ' — filtrar'; d.appendChild(b); });
  var tot = Math.max(a.length, 1);
  requestAnimationFrame(function () { Array.prototype.forEach.call(d.children, function (b) { b.style.width = (cnt[b.dataset.country] / tot * 100) + '%'; }); });
  if (!$('#pLeg').children.length) $('#pLeg').innerHTML = C.map(function (c) { return '<span><i style="background:' + c[3] + '"></i>' + esc(c[2]) + '</span>'; }).join('');
  var pv = [['Excel', '#2DD4BF', a.filter(function (c) { return ['csv', 'atlas', 'manual'].indexOf(c.src) < 0; }).length],
            ['CSV', '#FF7BC0', a.filter(function (c) { return c.src === 'csv'; }).length],
            ['Atlas', '#FFC53D', a.filter(function (c) { return c.src === 'atlas' || c.src === 'manual'; }).length]];
  $('#pProv').innerHTML = pv.map(function (p) { return '<i style="width:' + (p[2] / tot * 100) + '%;background:' + p[1] + '"></i>'; }).join('');
  $('#pProvLeg').innerHTML = pv.map(function (p) { return '<span><i style="background:' + p[1] + '"></i>' + p[0] + ' <b>' + p[2] + '</b></span>'; }).join('');
  var facet = a.filter(function (c) { return pass(c, Object.assign(blank(), S.f, { country: 'all' })); });
  $('#rail').innerHTML = '<button class="rc' + (S.f.country === 'all' ? ' on' : '') + '" data-country="all">' + ic('gl', 'width:13px;height:13px') + ' Todos <b>' + facet.length + '</b></button>' +
    C.map(function (c) { var n = facet.filter(function (x) { return x.country === c[0]; }).length; return '<button class="rc' + (S.f.country === c[0] ? ' on' : '') + '" data-country="' + c[0] + '">' + fl(c[0]) + esc(c[2]) + ' <b>' + n + '</b></button>'; }).join('');
  var q = [];
  a.forEach(function (c) {
    var is = [];
    if (c.ph) is.push('WA placeholder');
    if (c.alt) is.push('Conflicto IG');
    if (!c.wa && !c.ig) is.push('Sin contacto');
    if (c.src === 'atlas') is.push('Complemento Atlas');
    if (is.length) q.push({ c: c, t: is.join(' · ') });
  });
  $('#queueList').innerHTML = q.slice(0, 10).map(function (x) { return '<button class="qi" data-open="' + x.c.id + '">' + ic('al') + '<div><b>' + esc(x.c.name) + '</b><small>' + esc(CM[x.c.country].short + ' · ' + x.t) + '</small></div>' + ic('cr', 'width:12px;height:12px') + '</button>'; }).join('') +
    (q.length > 10 ? '<button class="btn sm wide" id="qAll">Ver los ' + q.length + ' registros pendientes</button>' : '');
  var qa = $('#qAll'); if (qa) qa.onclick = function () { closePanel(); S.f = Object.assign(blank(), { contact: 'none' }); S.page = 1; render(true); toast('info', 'Filtro: sin contacto directo'); };
  dataPanel(); footState();
}
function renderFilters() {
  var sc = all().filter(function (c) { return S.f.country === 'all' || c.country === S.f.country; });
  var regs = []; sc.forEach(function (c) { if (c.region && regs.indexOf(c.region) < 0) regs.push(c.region); });
  regs.sort(function (a, b) { return a.localeCompare(b, 'es'); });
  if (S.f.region !== 'all' && regs.indexOf(S.f.region) < 0) S.f.region = 'all';
  $('#region').innerHTML = '<option value="all">Todas las regiones</option>' + regs.map(function (r) { return '<option value="' + esc(r) + '"' + (S.f.region === r ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('');
  var pres = {}; all().forEach(function (c) { pres[c.src] = 1; });
  var order = ['padelocal', 'padelgt', 'fdp', 'limapadel', 'padelmesh', 'gsearch', 'csv', 'atlas', 'manual'].filter(function (k) { return pres[k]; });
  if (S.f.src !== 'all' && !pres[S.f.src]) S.f.src = 'all';
  $('#src').innerHTML = '<option value="all">Todas las fuentes</option>' + order.map(function (k) { return '<option value="' + k + '"' + (S.f.src === k ? ' selected' : '') + '>' + SRC[k][0] + '</option>'; }).join('');
  $('#contact').value = S.f.contact;
  $('#presets').innerHTML = PRE.map(function (p) {
    var n = all().filter(function (c) { return pass(c, Object.assign(blank(), p.f)); }).length;
    var on = Object.keys(p.f).every(function (k) { return S.f[k] === p.f[k]; }) && !S.f.q && S.f.country === 'all' && S.f.region === 'all' && !S.f.ver && (p.f.contact || S.f.contact === 'all') && (p.f.src || S.f.src === 'all');
    return '<button class="ps ' + p.c + (on ? ' on' : '') + '" data-pre="' + p.id + '">' + ic(p.i) + '<span>' + esc(p.n) + '</span><b>' + n + '</b></button>';
  }).join('');
  $('#views').innerHTML = DB.views.length ? DB.views.map(function (v) { return '<div class="vi"><button data-view="' + v.id + '">' + ic('bm', 'width:12px;height:12px') + '<span>' + esc(v.name) + '</span></button><button class="ib d" data-vdel="' + v.id + '" aria-label="Eliminar vista">' + ic('x', 'width:10px;height:10px') + '</button></div>'; }).join('') : '<p class="emp">Guarda combinaciones de filtros para volver en un clic.</p>';
}
function rowHTML(c, i, q, an) {
  var cc = CM[c.country], sel = !!S.sel[c.id], m = manual();
  return '<tr data-id="' + c.id + '"' + (m ? ' draggable="true"' : '') + ' class="' + (an ? 'an ' : '') + (sel ? 'sel' : '') + '" style="--cc:' + cc.color + ';--d:' + Math.min(i * 7, 200) + 'ms">' +
    (m ? '<td class="wg" title="Arrastra para reordenar">' + ic('grip') + '</td>' : '') +
    '<td class="wc"><label class="cbx"><input type="checkbox" data-check="' + c.id + '"' + (sel ? ' checked' : '') + ' aria-label="Seleccionar"><span></span></label></td>' +
    '<td><button class="cn" data-open="' + c.id + '">' + hl(c.name, q) + vm(c) + '</button><div class="csub">' + ic('pin') + hl(c.city, q) + ' ' + chipSrc(c) + '</div></td>' +
    '<td><button class="cty" data-country="' + c.country + '">' + fl(c.country) + '<span>' + esc(cc.short) + '</span></button></td>' +
    '<td><button class="rl" data-region="' + esc(c.region) + '">' + hl(c.region, q) + '</button></td>' +
    '<td>' + (c.ig ? '<a class="lk ig" href="' + igU(c) + '" target="_blank" rel="noopener">' + ic('ig') + '<span>@' + hl(c.ig, q) + '</span></a>' : '<a class="lk se" href="' + igU(c) + '" target="_blank" rel="noopener">' + ic('ig') + '<span>Buscar</span>' + ic('ext') + '</a>') + '</td>' +
    '<td>' + (c.wa ? '<a class="lk wa" href="' + waU(c) + '" target="_blank" rel="noopener">' + ic('wa') + '<span>+' + esc(c.wa) + '</span></a>' : '<a class="lk se" href="' + waU(c) + '" target="_blank" rel="noopener">' + ic('wa') + '<span>Buscar</span>' + ic('ext') + '</a>') + '</td>' +
    '<td class="wm"><a class="ib mb" href="' + mpU(c) + '" target="_blank" rel="noopener" title="Google Maps">' + ic('pin') + '</a></td>' +
    '<td>' + chipR(c) + flags(c) + '</td>' +
    '<td class="wa"><button class="ib" data-edit="' + c.id + '" title="Editar">' + ic('pen', 'width:13px;height:13px') + '</button><button class="ib d" data-del="' + c.id + '" title="Eliminar">' + ic('tr', 'width:13px;height:13px') + '</button></td></tr>';
}
function cardHTML(c, i, q, an) {
  var cc = CM[c.country], sel = !!S.sel[c.id];
  return '<article class="card' + (an ? ' an' : '') + (sel ? ' sel' : '') + '" data-id="' + c.id + '" style="--cc:' + cc.color + ';--d:' + Math.min(i * 12, 240) + 'ms">' +
    '<div class="ctop"><span class="n">' + fl(c.country) + esc(cc.name) + '</span>' + chipR(c) + '</div>' +
    '<h3><button data-open="' + c.id + '">' + hl(c.name, q) + vm(c) + '</button></h3>' +
    '<div class="cloc">' + ic('pin') + hl(c.city, q) + ' · <button class="rl" data-region="' + esc(c.region) + '">' + hl(c.region, q) + '</button>' + flags(c) + '</div>' +
    (c.addr ? '<div class="caddr">' + esc(c.addr) + '</div>' : '') +
    '<div class="csrc">' + chipSrc(c) + '</div>' +
    '<div class="clinks">' +
    (c.ig ? '<a class="pl ig" href="' + igU(c) + '" target="_blank" rel="noopener">' + ic('ig') + '<span>@' + hl(c.ig, q) + '</span></a>' : '<a class="pl se" href="' + igU(c) + '" target="_blank" rel="noopener">' + ic('ig') + '<span>Buscar IG</span></a>') +
    (c.wa ? '<a class="pl wa" href="' + waU(c) + '" target="_blank" rel="noopener">' + ic('wa') + '<span>+' + esc(c.wa) + '</span></a>' : '<a class="pl se" href="' + waU(c) + '" target="_blank" rel="noopener">' + ic('wa') + '<span>Buscar WA</span></a>') +
    '<a class="pl map" href="' + mpU(c) + '" target="_blank" rel="noopener">' + ic('pin') + '<span>Maps</span></a></div>' +
    (c.note ? '<div class="cnote">' + ic('pen') + '<span>' + esc(c.note) + '</span></div>' : '') +
    '<div class="cfoot"><label class="cbx"><input type="checkbox" data-check="' + c.id + '"' + (sel ? ' checked' : '') + ' aria-label="Seleccionar"><span></span></label><small>' + (c.wa ? 'WA listo' : 'WA pendiente') + '</small><span class="sp"></span><button class="ib" data-edit="' + c.id + '">' + ic('pen', 'width:13px;height:13px') + '</button><button class="ib d" data-del="' + c.id + '">' + ic('tr', 'width:13px;height:13px') + '</button></div></article>';
}
function renderList(sl, an) {
  var q = S.f.q.trim(), cards = mqCards.matches || S.view === 'cards';
  $('#empty').hidden = sl.length > 0; $('#tw').hidden = cards || !sl.length; $('#cw').hidden = !cards || !sl.length;
  if (cards) { $('#cw').innerHTML = sl.map(function (c, i) { return cardHTML(c, i, q, an); }).join(''); return; }
  var th = function (k, l) { var on = S.sort.k === k; return '<th class="s' + (on ? ' on' : '') + (on && S.sort.d === -1 ? ' de' : '') + '" data-sort="' + k + '">' + l + '<svg class="ic si"><use href="#i-so"/></svg></th>'; };
  $('#tw').innerHTML = '<table><thead><tr>' + (manual() ? '<th class="wg"></th>' : '') +
    '<th class="wc"><label class="cbx"><input type="checkbox" id="ckAll" aria-label="Seleccionar página"><span></span></label></th>' +
    th('name', 'Club') + th('country', 'País') + th('region', 'Región') + '<th>Instagram</th><th>WhatsApp</th><th class="wm">Maps</th>' + th('ready', 'Estado') + '<th class="wa"></th></tr></thead><tbody>' +
    sl.map(function (c, i) { return rowHTML(c, i, q, an); }).join('') + '</tbody></table>';
  ckAll(sl);
}
function ckAll(sl) { var e = $('#ckAll'); if (!e) return; var n = sl.filter(function (c) { return S.sel[c.id]; }).length; e.checked = sl.length > 0 && n === sl.length; e.indeterminate = n > 0 && n < sl.length; }
function renderPager(list) {
  var n = list.length, mp = Math.max(1, Math.ceil(n / S.per));
  $('#pager').hidden = n === 0; if (!n) return;
  $('#pgInfo').innerHTML = '<b>' + ((S.page - 1) * S.per + 1) + '–' + Math.min(n, S.page * S.per) + '</b> de <b>' + n + '</b> · pág <b>' + S.page + '</b>/' + mp;
  $('#pgSel').value = String(S.per); $('#perTop').value = String(S.per);
  var nums = [];
  if (mp <= 7) { for (var i = 1; i <= mp; i++) nums.push(i); }
  else { nums.push(1); if (S.page > 3) nums.push('…'); for (var j = Math.max(2, S.page - 1); j <= Math.min(mp - 1, S.page + 1); j++) nums.push(j); if (S.page < mp - 2) nums.push('…'); nums.push(mp); }
  var h = '<button class="pgb" data-pg="1"' + (S.page === 1 ? ' disabled' : '') + ' aria-label="Primera">' + ic('cl') + '</button>' +
    '<button class="pgb" data-pg="' + (S.page - 1) + '"' + (S.page === 1 ? ' disabled' : '') + ' aria-label="Anterior">' + ic('cl', 'opacity:.5') + '</button>';
  nums.forEach(function (p) { h += p === '…' ? '<span class="pge">…</span>' : '<button class="pgb' + (p === S.page ? ' on' : '') + '" data-pg="' + p + '">' + p + '</button>'; });
  h += '<button class="pgb" data-pg="' + (S.page + 1) + '"' + (S.page === mp ? ' disabled' : '') + ' aria-label="Siguiente">' + ic('cr') + '</button>' +
    '<button class="pgb" data-pg="' + mp + '"' + (S.page === mp ? ' disabled' : '') + ' aria-label="Última">' + ic('cr', 'opacity:.5') + '</button>';
  $('#pgBtns').innerHTML = h;
}
function renderBulk() {
  var n = Object.keys(S.sel).length, tot = view().length;
  $('#bulk').hidden = !n;
  if (n) {
    var vis = view().filter(function (c) { return S.sel[c.id]; }).length;
    $('#bulkN').textContent = n + ' seleccionado' + (n > 1 ? 's' : '');
    $('#bulkH').textContent = vis < n ? '(' + (n - vis) + ' fuera de la vista)' : '';
    $('#bulkAll').hidden = n >= tot; $('#bulkAll').textContent = 'Seleccionar los ' + tot + ' filtrados';
  }
  $('#nSelBtn').disabled = !n; $('#nSel').textContent = n || '—';
}
function sync() {
  var q = $('#q'); if (document.activeElement !== q && q.value !== S.f.q) q.value = S.f.q;
  $('#qClear').hidden = !S.f.q;
  $('#tgVer').setAttribute('aria-pressed', S.f.ver);
  var sv = S.sort.k + ':' + S.sort.d, sel = $('#sort'), has = false;
  Array.prototype.forEach.call(sel.options, function (o) { if (o.value === sv && o.value !== 'custom') has = true; });
  sel.querySelector('option[value=custom]').hidden = has; sel.value = has ? sv : 'custom';
  $('#vTable').classList.toggle('on', S.view === 'table'); $('#vCards').classList.toggle('on', S.view === 'cards');
  $('#dens').style.color = DB.prefs.dens === 'compact' ? 'var(--ball)' : '';
  var nf = [S.f.country !== 'all', S.f.region !== 'all', S.f.src !== 'all', S.f.contact !== 'all', S.f.ver, !!S.f.q].filter(Boolean).length;
  $('#fBadge').hidden = !nf; $('#fBadge').textContent = nf;
  $('#nView').textContent = view().length; $('#nAll').textContent = all().length;
  $('#railBtn').classList.toggle('p', !document.body.classList.contains('norail') && !mqCards.matches);
  loadNote();
}
function render(an) {
  renderFilters();
  var list = view(), sl = slice(list);
  renderTop(); renderList(sl, !!an && !reduced); renderPager(list); renderBulk(); sync();
  $('#count').innerHTML = '<b>' + list.length + '</b> / ' + all().length;
}

/* ============ mutaciones ============ */
function removeClubs(ids) {
  var stash = []; ids.forEach(function (id) { var i = idxOf(id); if (i >= 0) stash.push({ c: DB.clubs[i], i: i }); });
  if (!stash.length) return;
  var oldOrder = DB.order.slice();
  stash.sort(function (a, b) { return b.i - a.i; }).forEach(function (it) { DB.clubs.splice(it.i, 1); delete S.sel[it.c.id]; if (S.drawer === it.c.id) closeDrawer(); });
  ensureOrder(); persist(); render();
  toast('danger', stash.length === 1 ? '«' + stash[0].c.name + '» eliminado' : stash.length + ' clubes eliminados', {
    label: 'Deshacer', fn: function () {
      stash.sort(function (a, b) { return a.i - b.i; }).forEach(function (it) { DB.clubs.splice(Math.min(it.i, DB.clubs.length), 0, it.c); });
      DB.order = oldOrder; ensureOrder(); persist(); render(); toast('success', 'Restaurado' + (stash.length > 1 ? 's' : ''));
    }
  });
}
function reorder(dragId, targetId, before) {
  if (dragId === targetId) return;
  ensureOrder();
  var a = DB.order, from = a.indexOf(dragId); if (from < 0) return;
  a.splice(from, 1);
  var ti = a.indexOf(targetId); if (ti < 0) { a.splice(from, 0, dragId); return; }
  a.splice(ti + (before ? 0 : 1), 0, dragId);
  persist(); render(); toast('success', 'Orden manual guardado');
}

/* ============ drawer ============ */
var lastFocus = null;
function tpl(c) { return 'Hola, equipo de ' + c.name + ' 👋 Les escribo desde Tienda de Pádel (Panamá 🇵🇦). Distribuimos palas, pelotas, grips y accesorios de pádel para clubes y academias en Latinoamérica, con precios especiales por volumen. Nos encantaría ser su proveedor en ' + c.city + '. ¿Con quién podemos conversar sobre catálogo y condiciones para clubes? ¡Gracias! 🎾'; }
function ficha(c) {
  return c.name + '\nPaís: ' + CM[c.country].name + '\nRegión: ' + c.region + '\nCiudad: ' + c.city + (c.addr ? '\nDirección: ' + c.addr : '') +
    '\nInstagram: ' + (c.ig ? 'https://www.instagram.com/' + c.ig + '/' : 'pendiente') + (c.alt ? '\nIG alternativo: https://www.instagram.com/' + c.alt + '/' : '') +
    '\nWhatsApp: ' + (c.wa ? '+' + c.wa : 'pendiente') + (c.ph ? ' (placeholder descartado +' + c.ph + ')' : '') +
    '\nMaps: ' + mpU(c) + '\nFuente: ' + srL(c) + (srU(c) ? ' · ' + srU(c) : '') + '\nVerificado: ' + (isV(c) ? 'Sí' : 'No') + (c.note ? '\nNota: ' + c.note : '');
}
function openDrawer(id) {
  var c = byId(id); if (!c) return;
  S.drawer = id; lastFocus = document.activeElement;
  var cc = CM[c.country], su = srU(c);
  $('#dbody').innerHTML = '<div class="band" style="background:linear-gradient(140deg,' + cc.color + '26,transparent 60%)">' +
    '<div class="dm"><span class="cm">' + fl(c.country) + esc(cc.name) + '</span><span class="cm">· ' + esc(c.region) + '</span>' + chipR(c) + '</div>' +
    '<h2>' + esc(c.name) + ' ' + vm(c) + '</h2><div class="dloc">' + ic('pin') + esc(c.city) + '</div>' +
    (c.addr ? '<div class="daddr">' + esc(c.addr) + '</div>' : '') + '<div class="dsrc">' + chipSrc(c) + (isV(c) ? '<span class="rd listo">Verificado ✓</span>' : '') + '</div></div>' +
    (c.ph ? '<div class="dsec">Alerta de datos</div><div class="wb">' + ic('al') + '<div><b>WhatsApp placeholder descartado.</b> El CSV traía <code>+' + esc(c.ph) + '</code>. Confirma el número real y guárdalo con Editar.</div></div>' : '') +
    (c.alt ? '<div class="wb">' + ic('al') + '<div><b>Conflicto de handles.</b> Excel <code>@' + esc(c.ig) + '</code> · CSV <code>@' + esc(c.alt) + '</code>.</div></div>' : '') +
    '<div class="dsec">Enlaces directos</div>' +
    '<a class="dl ig' + (c.ig ? '' : ' pend') + '" href="' + igU(c) + '" target="_blank" rel="noopener">' + ic('ig') + '<div><small>Instagram</small><b>' + (c.ig ? '@' + esc(c.ig) : 'Buscar perfil ↗') + '</b></div>' + ic('ext', 'width:12px;height:12px') + '</a>' +
    (c.alt ? '<a class="dl ig" href="https://www.instagram.com/' + esc(c.alt) + '/" target="_blank" rel="noopener">' + ic('ig') + '<div><small>IG alternativo (CSV)</small><b>@' + esc(c.alt) + '</b></div>' + ic('ext', 'width:12px;height:12px') + '</a>' : '') +
    '<a class="dl wa' + (c.wa ? '' : ' pend') + '" href="' + waU(c) + '" target="_blank" rel="noopener">' + ic('wa') + '<div><small>WhatsApp</small><b>' + (c.wa ? '+' + esc(c.wa) : 'Buscar número ↗') + '</b></div>' + ic('ext', 'width:12px;height:12px') + '</a>' +
    '<a class="dl map" href="' + mpU(c) + '" target="_blank" rel="noopener">' + ic('pin') + '<div><small>Ubicación</small><b>Abrir en Google Maps</b></div>' + ic('ext', 'width:12px;height:12px') + '</a>' +
    (su ? '<a class="dl src" href="' + su + '" target="_blank" rel="noopener">' + ic('gl') + '<div><small>Fuente</small><b>' + esc(srL(c)) + '</b></div>' + ic('ext', 'width:12px;height:12px') + '</a>' : '') +
    '<div class="dsec">Verificación</div><div class="swr"><div><b>Verificado por mí</b><small>Se guarda en data.json al activarlo.</small></div><label class="sw"><input type="checkbox" id="dVer"' + (isV(c) ? ' checked' : '') + '><i></i></label></div>' +
    '<div class="dsec">Nota interna <span id="nSaved">Guardado ✓</span></div><textarea id="dNote" placeholder="Contacto clave, nº de canchas, marcas que usan…">' + esc(c.note) + '</textarea>' +
    '<div class="dsec">Mensaje de prospección</div><textarea id="dTpl" readonly>' + esc(tpl(c)) + '</textarea>' +
    '<div class="tpa"><button class="btn sm" data-tc>' + ic('cp', 'width:12px;height:12px') + 'Copiar mensaje</button>' +
    (c.wa ? '<a class="btn sm" style="color:var(--wa);border-color:rgba(74,222,128,.4)" href="https://wa.me/' + c.wa + '?text=' + encodeURIComponent(tpl(c)) + '" target="_blank" rel="noopener">' + ic('se', 'width:12px;height:12px') + 'Enviar</a>' : '') + '</div>';
  $('#drawer').classList.add('on'); $('#dScrim').classList.add('on'); lock(); $('#dX').focus();
}
function closeDrawer() { if (!S.drawer) return; S.drawer = null; $('#drawer').classList.remove('on'); $('#dScrim').classList.remove('on'); lock(); if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); }

/* ============ panel ============ */
function openPanel() { $('#panel').classList.add('on'); $('#pScrim').classList.add('on'); lock(); $('#panelX').focus(); }
function closePanel() { $('#panel').classList.remove('on'); $('#pScrim').classList.remove('on'); lock(); }

/* ============ modal ============ */
var lastM = null;
function fillCountries() { $('#f-country').innerHTML = '<option value="" disabled>Selecciona país…</option>' + C.map(function (c) { return '<option value="' + c[0] + '">' + esc(c[1]) + '</option>'; }).join(''); }
function nIg(v) { v = v.trim(); var m = v.match(/instagram\.com\/([A-Za-z0-9._]{1,30})/i); return m ? m[1] : v.replace(/^@/, '').replace(/\/+$/, '').replace(/\s+/g, ''); }
function nWa(v, code) { var d = v.replace(/\D/g, ''); if (!d) return ''; if (code && d.indexOf(code) !== 0 && d.length <= 10) d = code + d; return d; }
function previews() {
  var ig = nIg($('#f-ig').value), k = $('#f-country').value, code = CM[k] ? CM[k].code : '', wa = nWa($('#f-wa').value, code);
  $('#pvIg').textContent = ig ? '→ instagram.com/' + ig : 'Vacío → enlace de búsqueda';
  $('#pvWa').textContent = wa ? '→ wa.me/' + wa : (code ? 'Prefijo sugerido +' + code : 'Vacío → enlace de búsqueda');
  $('#pvMaps').textContent = $('#f-maps').value.trim() ? '→ enlace personalizado' : '→ maps: "' + ($('#f-name').value.trim() || 'Club') + ', ' + ($('#f-city').value.trim() || 'Ciudad') + '"';
  $('#regions').innerHTML = (CM[k] ? CM[k].regions : []).map(function (r) { return '<option value="' + esc(r) + '">'; }).join('');
}
function clearErr() { $$('#form .err').forEach(function (e) { e.classList.remove('on'); e.textContent = ''; }); $$('#form .bad').forEach(function (e) { e.classList.remove('bad'); }); }
function fieldErr(inp, sel, msg) { inp.classList.add('bad'); var e = $(sel); e.textContent = msg; e.classList.add('on'); }
function openModal(mode, id) {
  S.edit = mode === 'edit' ? id : null; lastM = document.activeElement; clearErr(); fillCountries();
  var c = id ? byId(id) : null;
  $('#mTitle').innerHTML = ic(mode === 'edit' ? 'pen' : 'plus') + '<span>' + (mode === 'edit' ? 'Editar club' : 'Añadir club') + '</span>';
  $('#f-name').value = c ? c.name : ''; $('#f-country').value = c ? c.country : '';
  $('#f-region').value = c ? c.region : ''; $('#f-city').value = c ? c.city : ''; $('#f-addr').value = c ? c.addr : '';
  $('#f-ig').value = c && c.ig ? '@' + c.ig : ''; $('#f-wa').value = c && c.wa ? '+' + c.wa : '';
  $('#f-maps').value = c ? c.maps : ''; $('#f-note').value = c ? c.note : '';
  previews(); $('#modal').hidden = false; lock(); $('#f-name').focus();
}
function closeModal() { $('#modal').hidden = true; S.edit = null; lock(); if (lastM && document.contains(lastM)) lastM.focus(); }
function submitForm(e) {
  e.preventDefault(); clearErr();
  var name = $('#f-name').value.trim(), country = $('#f-country').value, city = $('#f-city').value.trim();
  var region = $('#f-region').value.trim() || '—', addr = $('#f-addr').value.trim();
  var ig = nIg($('#f-ig').value), code = CM[country] ? CM[country].code : '', wa = nWa($('#f-wa').value, code), maps = $('#f-maps').value.trim(), bad = null;
  if (name.length < 3) { fieldErr($('#f-name'), '#e-name', 'Mínimo 3 caracteres.'); bad = bad || $('#f-name'); }
  if (!country) { $('#f-country').classList.add('bad'); bad = bad || $('#f-country'); }
  if (!city) { fieldErr($('#f-city'), '#e-city', 'La ciudad es obligatoria.'); bad = bad || $('#f-city'); }
  if (ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig)) { fieldErr($('#f-ig'), '#e-ig', 'Handle inválido.'); bad = bad || $('#f-ig'); }
  if ($('#f-wa').value.trim() && (wa.length < 8 || wa.length > 15)) { fieldErr($('#f-wa'), '#e-wa', 'Incluye prefijo de país (8–15 dígitos).'); bad = bad || $('#f-wa'); }
  if ($('#f-wa').value.trim() && /(.)\1{5}/.test(wa)) { fieldErr($('#f-wa'), '#e-wa', 'Parece placeholder. Verifica el número real.'); bad = bad || $('#f-wa'); }
  if (maps && !/^https?:\/\//i.test(maps)) { fieldErr($('#f-maps'), '#e-maps', 'URL inválida o déjala vacía.'); bad = bad || $('#f-maps'); }
  if (bad) { bad.focus(); return; }
  var data = { name: name, country: country, region: region, city: city, addr: addr, ig: ig, wa: wa, maps: maps, note: $('#f-note').value.trim() }, id;
  if (S.edit) { id = S.edit; Object.assign(byId(id), data); toast('success', '«' + name + '» actualizado'); }
  else { id = 'u' + Date.now(); DB.clubs.push(Object.assign({ id: id, src: 'manual', csv: 0, ph: '', alt: '', verified: 0 }, data)); ensureOrder(); toast('success', '«' + name + '» añadido'); }
  persist(); closeModal(); render();
  var pos = view().findIndex(function (c) { return c.id === id; });
  if (pos >= 0) {
    S.page = Math.floor(pos / S.per) + 1; render();
    requestAnimationFrame(function () { var el = document.querySelector('[data-id="' + id + '"]'); if (el) { el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 1400); } });
  } else toast('info', 'Guardado fuera de la vista actual', { label: 'Ver ficha', fn: function () { resetFilters(); openDrawer(id); } });
}

/* ============ confirm / lock / trap ============ */
var cfFn = null, lastC = null;
function ask(t, fn) { cfFn = fn; lastC = document.activeElement; $('#cfText').textContent = t; $('#cf').hidden = false; lock(); $('#cfNo').focus(); }
function closeCf() { $('#cf').hidden = true; cfFn = null; lock(); if (lastC && document.contains(lastC)) lastC.focus(); }
function lock() { document.body.classList.toggle('lock', !!(S.drawer || $('#panel').classList.contains('on') || !$('#modal').hidden || !$('#cf').hidden || document.body.classList.contains('sheet'))); }
function trap(box, e) {
  if (e.key !== 'Tab') return;
  var f = Array.prototype.filter.call(box.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea'), function (el) { return el.offsetParent !== null; });
  if (!f.length) return;
  var a = f[0], b = f[f.length - 1];
  if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
  else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
}
function resetFilters() { S.f = blank(); $('#q').value = ''; S.page = 1; render(true); }
function closeSheet() { document.body.classList.remove('sheet'); $('#sideScrim').classList.remove('on'); lock(); }
function applyPreset(p) { S.f = Object.assign(blank(), p.f); $('#q').value = ''; S.page = 1; closeSheet(); render(true); toast('info', 'Vista «' + p.n + '» aplicada'); }
function goPage(p) {
  var mp = Math.max(1, Math.ceil(view().length / S.per));
  p = Math.min(Math.max(1, p), mp); if (p === S.page) return;
  S.page = p; render();
  var y = $('#results').getBoundingClientRect().top + window.scrollY - 110;
  window.scrollTo({ top: Math.max(0, y), behavior: reduced ? 'auto' : 'smooth' });
}

/* ============ toasts ============ */
function toast(t, msg, act) {
  var box = $('#toasts'); while (box.children.length >= 3) box.removeChild(box.firstChild);
  var el = document.createElement('div'); el.className = 'toast ' + t;
  el.innerHTML = ic({ success: 'ckc', info: 'in', warn: 'al', danger: 'tr' }[t] || 'in') + '<p>' + esc(msg) + '</p>' + (act ? '<button class="act">' + esc(act.label) + '</button>' : '') + '<button class="tx" aria-label="Cerrar">' + ic('x') + '</button><div class="pg"></div>';
  box.appendChild(el);
  var pg = el.querySelector('.pg'), start = Date.now(), left = 6000, tm;
  var kill = function () { clearTimeout(tm); el.classList.add('out'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260); };
  var arm = function (ms) { tm = setTimeout(kill, ms); }; arm(left);
  el.addEventListener('mouseenter', function () { clearTimeout(tm); left -= Date.now() - start; pg.style.animationPlayState = 'paused'; });
  el.addEventListener('mouseleave', function () { start = Date.now(); pg.style.animationPlayState = 'running'; arm(Math.max(left, 600)); });
  el.querySelector('.tx').onclick = kill;
  if (act) el.querySelector('.act').onclick = function () { act.fn(); kill(); };
}
function copyText(txt, msg) {
  var fb = function () { try { var t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); toast('success', msg); } catch (e) { toast('warn', 'No se pudo copiar'); } };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast('success', msg); }, fb); else fb();
}

/* ============ exportación XLSX / CSV (sin librerías) ============ */
var CRCT = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u) { var c = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) c = CRCT[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function u16(v) { var b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, v, true); return b; }
function u32(v) { var b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, v >>> 0, true); return b; }
function zip(files) {
  var enc = new TextEncoder(), parts = [], cent = [], off = 0;
  files.forEach(function (f) {
    var nm = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data), ll = 0;
    var loc = [u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(nm.length), u16(0), nm, data];
    loc.forEach(function (p) { parts.push(p); off += p.length; ll += p.length; });
    cent.push([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off - ll), nm]);
  });
  var cds = 0; cent.forEach(function (c) { c.forEach(function (p) { parts.push(p); cds += p.length; }); });
  [u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cds), u32(off), u16(0)].forEach(function (p) { parts.push(p); });
  return new Blob(parts, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
var xe = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[m]; }).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); };
function colN(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - m - 1) / 26; } return s; }
var NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', RS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships', PS = 'http://schemas.openxmlformats.org/package/2006/relationships';
var STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="' + NS + '"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF0A1220"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9F542"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>';
function sheetXml(rows, links, widths) {
  var rels = [], x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="' + NS + '" xmlns:r="' + RS + '">';
  if (widths) x += '<cols>' + widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>';
  x += '<sheetData>';
  rows.forEach(function (row, ri) {
    x += '<row r="' + (ri + 1) + '">';
    row.forEach(function (v, ci) {
      var ref = colN(ci) + (ri + 1), st = ri === 0 ? ' s="1"' : '';
      if (typeof v === 'number' && isFinite(v)) { x += '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>'; return; }
      var s = String(v == null ? '' : v); if (!s) return;
      x += '<c r="' + ref + '"' + st + ' t="inlineStr"><is><t xml:space="preserve">' + xe(s) + '</t></is></c>';
      if (ri > 0 && links.indexOf(ci) >= 0 && /^https?:\/\//.test(s)) rels.push({ ref: ref, u: s });
    });
    x += '</row>';
  });
  x += '</sheetData>';
  if (rows.length > 1) x += '<autoFilter ref="A1:' + colN(rows[0].length - 1) + rows.length + '"/>';
  if (rels.length) x += '<hyperlinks>' + rels.map(function (h, i) { return '<hyperlink ref="' + h.ref + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</hyperlinks>';
  x += '</worksheet>';
  var rx = rels.length ? '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + PS + '">' + rels.map(function (h, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="' + RS + '/hyperlink" Target="' + xe(h.u) + '" TargetMode="External"/>'; }).join('') + '</Relationships>' : '';
  return { xml: x, rels: rx };
}
function buildXlsx(sheets) {
  var files = [], ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
  sheets.forEach(function (s, i) { ct += '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; });
  files.push({ name: '[Content_Types].xml', data: ct + '</Types>' });
  files.push({ name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + PS + '"><Relationship Id="rId1" Type="' + RS + '/officeDocument" Target="xl/workbook.xml"/></Relationships>' });
  files.push({ name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="' + NS + '" xmlns:r="' + RS + '"><sheets>' + sheets.map(function (s, i) { return '<sheet name="' + xe(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>' });
  files.push({ name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + PS + '">' + sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="' + RS + '/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') + '<Relationship Id="rId' + (sheets.length + 1) + '" Type="' + RS + '/styles" Target="styles.xml"/></Relationships>' });
  files.push({ name: 'xl/styles.xml', data: STYLES });
  sheets.forEach(function (s, i) { var r = sheetXml(s.rows, s.links || [], s.widths); files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: r.xml }); if (r.rels) files.push({ name: 'xl/worksheets/_rels/sheet' + (i + 1) + '.xml.rels', data: r.rels }); });
  return zip(files);
}
function dl(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); }
function rowsFor(list) {
  var h = ['Club', 'País', 'Región', 'Ciudad', 'Dirección', 'Instagram', 'Instagram URL', 'IG alternativo', 'WhatsApp', 'WhatsApp URL', 'Google Maps', 'Fuente', 'URL fuente', 'Aporte CSV', 'Placeholder', 'Conflicto', 'Verificado', 'Notas'];
  return [h].concat(list.map(function (c) { return [c.name, CM[c.country].name, c.region, c.city, c.addr, c.ig ? '@' + c.ig : '', igU(c), c.alt ? '@' + c.alt : '', c.wa ? '+' + c.wa : '', waU(c), mpU(c), srL(c), srU(c), c.csv ? 'Sí' : '', c.ph ? '+' + c.ph : '', c.alt ? 'Handles en conflicto' : '', isV(c) ? 'Sí' : 'No', c.note]; }));
}
function resFor(list) {
  var h = ['País', 'Clubes', 'WA válidos', 'Con IG', 'Listos', 'Placeholders', 'Atlas', 'Verificados'];
  var r = C.map(function (cc) { var g = list.filter(function (c) { return c.country === cc[0]; }); return [cc[1], g.length, g.filter(function (c) { return c.wa; }).length, g.filter(function (c) { return c.ig; }).length, g.filter(function (c) { return c.wa && c.ig; }).length, g.filter(function (c) { return c.ph; }).length, g.filter(function (c) { return c.src === 'atlas'; }).length, g.filter(isV).length]; }).filter(function (x) { return x[1] > 0; });
  r.push(['TOTAL', list.length, list.filter(function (c) { return c.wa; }).length, list.filter(function (c) { return c.ig; }).length, list.filter(function (c) { return c.wa && c.ig; }).length, list.filter(function (c) { return c.ph; }).length, list.filter(function (c) { return c.src === 'atlas'; }).length, list.filter(isV).length]);
  return [h].concat(r);
}
function csvOf(list) { return '\uFEFF' + rowsFor(list).map(function (r) { return r.map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n'); }
function doExport(scope, fmt) {
  var list, label;
  if (scope === 'view') { list = view(); label = 'vista filtrada'; }
  else if (scope === 'sel') { list = all().filter(function (c) { return S.sel[c.id]; }); label = 'selección'; }
  else { list = all().slice().sort(function (a, b) { return (CO[a.country] - CO[b.country]) || a.name.localeCompare(b.name, 'es'); }); label = 'lista completa'; }
  if (!list.length) { toast('warn', 'No hay filas que exportar'); return; }
  var base = 'padel-atlas_' + scope + '_' + new Date().toISOString().slice(0, 10);
  if (fmt === 'csv') { dl(new Blob([csvOf(list)], { type: 'text/csv;charset=utf-8' }), base + '.csv'); toast('success', 'CSV · ' + list.length + ' clubes'); return; }
  try {
    dl(buildXlsx([
      { name: 'Clubes', rows: rowsFor(list), links: [6, 9, 10, 12], widths: [34, 17, 18, 26, 38, 22, 46, 20, 16, 44, 56, 12, 44, 10, 18, 22, 11, 46] },
      { name: 'Resumen', rows: resFor(list), widths: [18, 9, 11, 9, 8, 13, 8, 11] }
    ]), base + '.xlsx');
    toast('success', 'Excel · ' + list.length + ' clubes (' + label + ')');
  } catch (e) { dl(new Blob([csvOf(list)], { type: 'text/csv;charset=utf-8' }), base + '.csv'); toast('info', 'Excel no disponible: se descargó CSV'); }
}

/* ============ eventos ============ */
function wire() {
  var qt;
  $('#q').addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(function () { S.f.q = $('#q').value.trim(); S.page = 1; render(); }, 120); });
  $('#qClear').onclick = function () { S.f.q = ''; $('#q').value = ''; S.page = 1; render(); $('#q').focus(); };
  $('#brand').onclick = function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); };
  $('#addBtn').onclick = function () { openModal('add'); };
  $('#saveChip').onclick = saveFlow;
  $('#panelBtn').onclick = openPanel; $('#panelX').onclick = closePanel; $('#pScrim').onclick = closePanel;
  $('#footPanel').onclick = openPanel;
  $('#expBtn').onclick = function (e) { e.stopPropagation(); var m = $('#expMenu'); m.hidden = !m.hidden; $('#expBtn').setAttribute('aria-expanded', String(!m.hidden)); };
  $('#expMenu').onclick = function (e) {
    var b = e.target.closest('[data-exp]'); if (!b || b.disabled) return;
    $('#expMenu').hidden = true; $('#expBtn').setAttribute('aria-expanded', 'false');
    var k = b.dataset.exp;
    if (k === 'json') saveFlow(); else if (k === 'dljson') downloadJSON();
    else { var p = k.split('-'); doExport(p[0], p[1]); }
  };
  document.addEventListener('click', function (e) { if (!e.target.closest('.ew')) { $('#expMenu').hidden = true; $('#expBtn').setAttribute('aria-expanded', 'false'); } });
  var countryClick = function (e) { var b = e.target.closest('[data-country]'); if (b) { S.f.country = b.dataset.country; S.f.region = 'all'; S.page = 1; render(true); } };
  $('#rail').onclick = countryClick; $('#pDist').onclick = function (e) { countryClick(e); closePanel(); };
  $('#region').onchange = function () { S.f.region = this.value; S.page = 1; render(true); };
  $('#src').onchange = function () { S.f.src = this.value; S.page = 1; render(true); };
  $('#contact').onchange = function () { S.f.contact = this.value; S.page = 1; render(true); };
  $('#tgVer').onclick = function () { S.f.ver = !S.f.ver; S.page = 1; render(true); };
  $('#presets').onclick = function (e) {
    var b = e.target.closest('[data-pre]'); if (!b) return;
    var p = PRE.filter(function (x) { return x.id === b.dataset.pre; })[0]; if (!p) return;
    var on = Object.keys(p.f).every(function (k) { return S.f[k] === p.f[k]; });
    on ? resetFilters() : applyPreset(p);
  };
  $('#reset').onclick = resetFilters; $('#emptyX').onclick = resetFilters;
  $('#vsBtn').onclick = function () { $('#vsRow').hidden = false; $('#vName').focus(); };
  $('#vNo').onclick = function () { $('#vsRow').hidden = true; $('#vName').value = ''; };
  $('#vOk').onclick = function () {
    var n = $('#vName').value.trim(); if (!n) { $('#vName').focus(); return; }
    DB.views.push({ id: 'v' + Date.now(), name: n, f: Object.assign({}, S.f), sort: Object.assign({}, S.sort) });
    persist(); $('#vName').value = ''; $('#vsRow').hidden = true; renderFilters(); toast('success', 'Vista «' + n + '» guardada en data.json');
  };
  $('#vName').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('#vOk').click(); } if (e.key === 'Escape') { $('#vsRow').hidden = true; e.stopPropagation(); } });
  $('#views').onclick = function (e) {
    var d = e.target.closest('[data-vdel]');
    if (d) { DB.views = DB.views.filter(function (v) { return v.id !== d.dataset.vdel; }); persist(); renderFilters(); toast('info', 'Vista eliminada'); return; }
    var a = e.target.closest('[data-view]');
    if (a) { var v = DB.views.filter(function (x) { return x.id === a.dataset.view; })[0]; if (v) { S.f = Object.assign(blank(), v.f); S.sort = Object.assign({}, v.sort); $('#q').value = S.f.q; S.page = 1; closeSheet(); render(true); toast('info', 'Vista «' + v.name + '» aplicada'); } }
  };
  $('#sort').onchange = function () { if (this.value === 'custom') return; var p = this.value.split(':'); S.sort = { k: p[0], d: +p[1] }; S.page = 1; render(true); if (S.sort.k === 'manual') toast('info', 'Orden manual: arrastra las filas por el asa ⠿'); };
  var setPer = function (v) { v = +v; if (SIZES.indexOf(v) < 0) return; S.per = v; DB.prefs.pageSize = v; S.page = 1; persist(); render(true); toast('info', v + ' resultados por página'); };
  $('#perTop').onchange = function () { setPer(this.value); };
  $('#pgSel').onchange = function () { setPer(this.value); };
  $('#pgBtns').onclick = function (e) { var b = e.target.closest('[data-pg]'); if (b && !b.disabled) goPage(+b.dataset.pg); };
  $('#dens').onclick = function () { DB.prefs.dens = DB.prefs.dens === 'cozy' ? 'compact' : 'cozy'; applyPrefs(); persist(); sync(); };
  $('#vTable').onclick = function () { DB.prefs.view = 'table'; S.view = 'table'; persist(); render(true); };
  $('#vCards').onclick = function () { DB.prefs.view = 'cards'; S.view = 'cards'; persist(); render(true); };
  $('#railBtn').onclick = function () {
    if (mqCards.matches) { document.body.classList.add('sheet'); $('#sideScrim').classList.add('on'); lock(); }
    else { DB.prefs.rail = DB.prefs.rail ? 0 : 1; applyPrefs(); persist(); sync(); }
  };
  $('#sideClose').onclick = closeSheet; $('#sideScrim').onclick = closeSheet;
  $('#loadX').onclick = function () { DB.prefs.note = 0; persist(); $('#loadNote').hidden = true; };
  $('#loadAct').onclick = linkFlow;
  $('#linkBtn').onclick = linkFlow;
  $('#saveNowBtn').onclick = saveFlow;
  $('#dlJsonBtn').onclick = downloadJSON;
  $('#reloadBtn').onclick = function () { boot(true); };
  $('#seedBtn').onclick = function () { ask('Se reemplazarán todos los registros por la semilla original de 108 clubes. Tus cambios locales se perderán (data.json solo se actualiza si lo guardas). ¿Continuar?', function () { adopt(parseDB({ rows: SEED, prefs: DB.prefs }), 'seed'); S.page = 1; render(true); toast('warn', 'Semilla restaurada — guarda para escribirla en data.json'); }); };
  $('#filePick').onchange = function () {
    var f = this.files && this.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () { try { var p = parseDB(JSON.parse(String(r.result))); if (!p.clubs.length) throw 0; adopt(p, 'file'); render(true); toast('success', f.name + ' cargado · ' + p.clubs.length + ' clubes'); } catch (e) { toast('danger', 'El archivo no es un data.json válido'); } };
    r.readAsText(f); this.value = '';
  };
  $('#bulkNo').onclick = function () { S.sel = {}; render(); };
  $('#bulkDel').onclick = function () { removeClubs(Object.keys(S.sel)); };
  $('#bulkExp').onclick = function () { doExport('sel', 'xlsx'); };
  $('#bulkAll').onclick = function () { view().forEach(function (c) { S.sel[c.id] = 1; }); render(); toast('info', 'Seleccionados todos los filtrados'); };

  var res = $('#results');
  res.addEventListener('click', function (e) {
    var th = e.target.closest('th[data-sort]');
    if (th) { var k = th.dataset.sort; if (S.sort.k === k) S.sort.d *= -1; else S.sort = { k: k, d: 1 }; S.page = 1; render(); return; }
    if (e.target.closest('#ckAll')) return;
    var ed = e.target.closest('[data-edit]'); if (ed) { openModal('edit', ed.dataset.edit); return; }
    var de = e.target.closest('[data-del]'); if (de) { removeClubs([de.dataset.del]); return; }
    var ct = e.target.closest('.cty[data-country]'); if (ct) { S.f.country = ct.dataset.country; S.f.region = 'all'; S.page = 1; render(true); return; }
    var rg = e.target.closest('[data-region]'); if (rg) { S.f.region = rg.dataset.region; S.page = 1; render(true); return; }
    var op = e.target.closest('[data-open]'); if (op) { openDrawer(op.dataset.open); return; }
    if (e.target.closest('a,button,input,label,select')) return;
    var row = e.target.closest('[data-id]'); if (row) openDrawer(row.dataset.id);
  });
  res.addEventListener('change', function (e) {
    if (e.target.id === 'ckAll') { var sl = slice(view()); sl.forEach(function (c) { if (e.target.checked) S.sel[c.id] = 1; else delete S.sel[c.id]; }); render(); return; }
    var cb = e.target.closest('[data-check]');
    if (cb) { if (cb.checked) S.sel[cb.dataset.check] = 1; else delete S.sel[cb.dataset.check]; var r = cb.closest('[data-id]'); if (r) r.classList.toggle('sel', cb.checked); renderBulk(); ckAll(slice(view())); }
  });
  var dragId = null;
  res.addEventListener('dragstart', function (e) { var tr = e.target.closest('tr[data-id]'); if (!tr || !manual()) { e.preventDefault(); return; } dragId = tr.dataset.id; tr.classList.add('dragging'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); } catch (x) {} });
  res.addEventListener('dragover', function (e) {
    if (!dragId) return; var tr = e.target.closest('tr[data-id]'); if (!tr || tr.dataset.id === dragId) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    $$('#tw tr.dtop,#tw tr.dbot').forEach(function (r) { r.classList.remove('dtop', 'dbot'); });
    var rc = tr.getBoundingClientRect(); tr.classList.add(e.clientY < rc.top + rc.height / 2 ? 'dtop' : 'dbot');
  });
  res.addEventListener('drop', function (e) {
    if (!dragId) return; e.preventDefault();
    var tr = e.target.closest('tr[data-id]');
    $$('#tw tr.dtop,#tw tr.dbot').forEach(function (r) { r.classList.remove('dtop', 'dbot'); });
    if (tr && tr.dataset.id !== dragId) { var rc = tr.getBoundingClientRect(); reorder(dragId, tr.dataset.id, e.clientY < rc.top + rc.height / 2); }
    dragId = null;
  });
  res.addEventListener('dragend', function () { dragId = null; $$('#tw tr.dragging,#tw tr.dtop,#tw tr.dbot').forEach(function (r) { r.classList.remove('dragging', 'dtop', 'dbot'); }); });

  $('#dX').onclick = closeDrawer; $('#dScrim').onclick = closeDrawer;
  $('#drawer').addEventListener('keydown', function (e) { trap($('#drawer'), e); });
  $('#panel').addEventListener('keydown', function (e) { trap($('#panel'), e); });
  $('#panel').addEventListener('click', function (e) { var op = e.target.closest('[data-open]'); if (op) { closePanel(); openDrawer(op.dataset.open); } });
  $('#dbody').addEventListener('click', function (e) { if (e.target.closest('[data-tc]')) { var t = $('#dTpl'); if (t) copyText(t.value, 'Mensaje copiado'); } });
  $('#dbody').addEventListener('change', function (e) { if (e.target.id === 'dVer' && S.drawer) { byId(S.drawer).verified = e.target.checked ? 1 : 0; persist(); render(); toast('success', e.target.checked ? 'Verificado ✓' : 'Verificación retirada'); } });
  var nt;
  $('#dbody').addEventListener('input', function (e) {
    if (e.target.id !== 'dNote' || !S.drawer) return;
    var v = e.target.value, id = S.drawer; clearTimeout(nt);
    nt = setTimeout(function () { var c = byId(id); if (!c) return; c.note = v; persist(); render(); var s = $('#nSaved'); if (s) { s.classList.add('on'); setTimeout(function () { s.classList.remove('on'); }, 1400); } }, 420);
  });
  $('.df').addEventListener('click', function (e) {
    if (!S.drawer) return; var id = S.drawer;
    if (e.target.closest('[data-de]')) { closeDrawer(); openModal('edit', id); }
    else if (e.target.closest('[data-dc]')) { var c = byId(id); if (c) copyText(ficha(c), 'Ficha copiada'); }
    else if (e.target.closest('[data-dd]')) removeClubs([id]);
  });
  $('#form').addEventListener('submit', submitForm);
  $('#mNo').onclick = closeModal; $('#mX').onclick = closeModal;
  $('#modal').addEventListener('click', function (e) { if (e.target === $('#modal')) closeModal(); });
  $('#modal').addEventListener('keydown', function (e) { trap($('#modal'), e); });
  $('#f-country').addEventListener('change', previews);
  ['f-name', 'f-city', 'f-ig', 'f-wa', 'f-maps'].forEach(function (id) { $('#' + id).addEventListener('input', previews); });
  $('#f-ig').addEventListener('blur', function () { var v = nIg(this.value); this.value = v ? '@' + v : ''; previews(); });
  $('#f-wa').addEventListener('blur', function () { var k = $('#f-country').value, d = nWa(this.value, CM[k] ? CM[k].code : ''); this.value = d ? '+' + d : ''; previews(); });
  $('#cfOk').onclick = function () { var f = cfFn; closeCf(); if (f) f(); };
  $('#cfNo').onclick = closeCf;
  $('#cf').addEventListener('click', function (e) { if (e.target === $('#cf')) closeCf(); });
  $('#cf').addEventListener('keydown', function (e) { trap($('#cf'), e); });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveFlow(); return; }
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (e.key === '/' && !typing) { e.preventDefault(); $('#q').focus(); $('#q').select(); return; }
    if (!typing && !S.drawer && $('#modal').hidden && $('#cf').hidden && !$('#panel').classList.contains('on')) {
      if (e.key === 'ArrowRight') { goPage(S.page + 1); return; }
      if (e.key === 'ArrowLeft') { goPage(S.page - 1); return; }
    }
    if (e.key === 'Escape') {
      if (!$('#cf').hidden) { closeCf(); return; }
      if (!$('#modal').hidden) { closeModal(); return; }
      if (S.drawer) { closeDrawer(); return; }
      if ($('#panel').classList.contains('on')) { closePanel(); return; }
      if (!$('#expMenu').hidden) { $('#expMenu').hidden = true; return; }
      if (document.body.classList.contains('sheet')) { closeSheet(); return; }
      if (document.activeElement === $('#q') && S.f.q) { S.f.q = ''; $('#q').value = ''; S.page = 1; render(); }
    }
  });
  window.addEventListener('scroll', function () { $('#top').classList.toggle('sc', window.scrollY > 6); }, { passive: true });
  var onMQ = function () { closeSheet(); applyPrefs(); render(); };
  if (mqCards.addEventListener) mqCards.addEventListener('change', onMQ); else if (mqCards.addListener) mqCards.addListener(onMQ);
  window.addEventListener('pagehide', function () { if (handle && dirty) { clearTimeout(saveTimer); writeFile(false); } });
}

/* ============ arranque ============ */
async function boot(force) {
  var loaded = null, origin = 'seed';
  try {
    var r = await fetch('data.json', { cache: 'no-store' });
    if (r.ok) { var p = parseDB(await r.json()); if (p.clubs.length) { loaded = p; origin = 'file'; } }
  } catch (e) { /* file:// sin permisos de lectura */ }
  if (!loaded && lsOK) {
    try { var raw = localStorage.getItem(KEY); if (raw) { var q = parseDB(JSON.parse(raw)); if (q.clubs.length) { loaded = q; origin = 'cache'; } } } catch (e) {}
  }
  if (!loaded) loaded = parseDB({ rows: SEED });
  adopt(loaded, origin);
  S.page = 1; render(true);
  if (force) toast('info', origin === 'file' ? 'data.json recargado' : origin === 'cache' ? 'Respaldo local recargado' : 'Semilla recargada');
}
try {
  wire();
  boot(false);
} catch (err) {
  document.getElementById('tw').innerHTML = '<div style="padding:24px;color:#9FB0CC">No se pudo iniciar la vista interactiva. Recarga la página o revisa la consola.</div>';
}
})();
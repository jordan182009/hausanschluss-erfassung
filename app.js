// ---- IndexedDB Setup ----
const DB_NAME = 'hausanschluss_db';
const DB_VERSION = 1;
const STORE = 'eintraege';
let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE)) {
        const store = database.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('datum', 'datum', { unique: false });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function txStore(mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function dbGetAll() {
  return new Promise((resolve, reject) => {
    const req = txStore('readonly').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbPut(entry) {
  return new Promise((resolve, reject) => {
    const req = txStore('readwrite').put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function dbDelete(id) {
  return new Promise((resolve, reject) => {
    const req = txStore('readwrite').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---- App State ----
let entries = [];
let currentPhotos = []; // {name, dataUrl} for the form currently open
let currentGps = null;  // {lat, lng, accuracy}
let editingId = null;

// ---- DOM refs ----
const listEl = document.getElementById('list');
const searchInput = document.getElementById('searchInput');
const newBtn = document.getElementById('newBtn');
const exportBtn = document.getElementById('exportBtn');
const formView = document.getElementById('formView');
const closeFormBtn = document.getElementById('closeFormBtn');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');
const formTitle = document.getElementById('formTitle');
const fOrtsteil = document.getElementById('fOrtsteil');
const fOrtsteilCustomField = document.getElementById('fOrtsteilCustomField');
const fOrtsteilCustom = document.getElementById('fOrtsteilCustom');
const logoSwitchBtn = document.getElementById('logoSwitchBtn');
const chipLindenfels = document.getElementById('chipLindenfels');
const chipLautertal = document.getElementById('chipLautertal');
const gemeindeView = document.getElementById('gemeindeView');
const gemeindeCancelBtn = document.getElementById('gemeindeCancelBtn');
const modeSwitchBar = document.getElementById('modeSwitchBar');
const appTitle = document.getElementById('appTitle');
const leitungsartView = document.getElementById('leitungsartView');
const leitungsartCancelBtn = document.getElementById('leitungsartCancelBtn');
// ---- Auftrag Trinkwasserversorgung (nur Rohrbruch/Hausanschlussleitung/Lindenfels) ----
const wvaSection = document.getElementById('wvaSection');
const wvaGrund = document.getElementById('wvaGrund');
const wvaGemarkung = document.getElementById('wvaGemarkung');
const wvaFlur = document.getElementById('wvaFlur');
const wvaFlurstueck = document.getElementById('wvaFlurstueck');
const wvaNutzungWohn = document.getElementById('wvaNutzungWohn');
const wvaWohnungen = document.getElementById('wvaWohnungen');
const wvaNutzungMisch = document.getElementById('wvaNutzungMisch');
const wvaNutzungGewerbe = document.getElementById('wvaNutzungGewerbe');
const wvaGewerbeArt = document.getElementById('wvaGewerbeArt');
const wvaBauwasserAb = document.getElementById('wvaBauwasserAb');
const wvaBrauchDetails = document.getElementById('wvaBrauchDetails');
const wvaBrauchGarten = document.getElementById('wvaBrauchGarten');
const wvaBrauchToilette = document.getElementById('wvaBrauchToilette');
const wvaBrauchWaschmaschine = document.getElementById('wvaBrauchWaschmaschine');
const wvaBrauchSonstige = document.getElementById('wvaBrauchSonstige');
const wvaFliessdruck = document.getElementById('wvaFliessdruck');
const wvaSpitzendurchfluss = document.getElementById('wvaSpitzendurchfluss');
const wvaHoechsteEntnahme = document.getElementById('wvaHoechsteEntnahme');
const wvaVermerkInstallateur = document.getElementById('wvaVermerkInstallateur');
const wvaZaehlergroesse = document.getElementById('wvaZaehlergroesse');
const wvaAnschlussnennweite = document.getElementById('wvaAnschlussnennweite');
const wvaRohrmaterial = document.getElementById('wvaRohrmaterial');
const wvaVermerkWasserwerk = document.getElementById('wvaVermerkWasserwerk');
const wvaAnlageLageplan = document.getElementById('wvaAnlageLageplan');
const wvaAnlageGrundriss = document.getElementById('wvaAnlageGrundriss');
const wvaAnlageBetriebsbeschreibung = document.getElementById('wvaAnlageBetriebsbeschreibung');
const wvaAnlageBaulast = document.getElementById('wvaAnlageBaulast');
const wvaEigName = document.getElementById('wvaEigName');
const wvaEigAdresse = document.getElementById('wvaEigAdresse');
const wvaEigTelefon = document.getElementById('wvaEigTelefon');
const wvaEigEmail = document.getElementById('wvaEigEmail');
const wvaEigDatum = document.getElementById('wvaEigDatum');
const wvaEinverstaendnis = document.getElementById('wvaEinverstaendnis');
const wvaInstName = document.getElementById('wvaInstName');
const wvaInstAdresse = document.getElementById('wvaInstAdresse');
const wvaInstTelefon = document.getElementById('wvaInstTelefon');
const wvaInstEmail = document.getElementById('wvaInstEmail');
const wvaInstDatumUnterschrift = document.getElementById('wvaInstDatumUnterschrift');
const wvaAntragseingang = document.getElementById('wvaAntragseingang');
const wvaAbnahmeDatum = document.getElementById('wvaAbnahmeDatum');
const wvaInterneVermerk = document.getElementById('wvaInterneVermerk');
const wvaEmailBtn = document.getElementById('wvaEmailBtn');
const fBearbeiter = document.getElementById('fBearbeiter');
const fStrasse = document.getElementById('fStrasse');
const fKassenzeichen = document.getElementById('fKassenzeichen');
const fNotizen = document.getElementById('fNotizen');
const gpsBox = document.getElementById('gpsBox');
const gpsBtn = document.getElementById('gpsBtn');
const photoRow = document.getElementById('photoRow');
const fotoInput = document.getElementById('fotoInput');
const fTiefe = document.getElementById('fTiefe');
const messpunkteEl = document.getElementById('messpunkte');
const addMesspunktBtn = document.getElementById('addMesspunktBtn');
const kmlInput = document.getElementById('kmlInput');
const kmlStatus = document.getElementById('kmlStatus');
const showMapBtn = document.getElementById('showMapBtn');
const mapView = document.getElementById('mapView');
const mapTitle = document.getElementById('mapTitle');
const mapCloseBtn = document.getElementById('mapCloseBtn');
const openGoogleMapsBtn = document.getElementById('openGoogleMapsBtn');
const aufmassListEl = document.getElementById('aufmassList');
const addArtikelBtn = document.getElementById('addArtikelBtn');
const artikelPickerView = document.getElementById('artikelPickerView');
const artikelPickerCloseBtn = document.getElementById('artikelPickerCloseBtn');
const artikelSearchInput = document.getElementById('artikelSearchInput');
const artikelResults = document.getElementById('artikelResults');
const signatureCanvas = document.getElementById('signatureCanvas');
const signatureWrap = document.getElementById('signatureWrap');
const signatureClearBtn = document.getElementById('signatureClearBtn');
const printBtn = document.getElementById('printBtn');

let currentAufmass = [];       // [{nr, bez, dim, einheit, menge}]
let currentUnterschrift = null; // dataURL | null
let artikelDB = [];             // aus assets/artikel.json geladen

let currentMesspunkte = []; // [{bezug, mass}]
let currentKml = null;      // {name, content}
let currentSkizzen = [];    // [{name, dataUrl}] fertige, beschriftete Skizzen der offenen Karte

// ---- Skizzen-Editor Refs ----
const skizzeRow = document.getElementById('skizzeRow');
const addSkizzeBtn = document.getElementById('addSkizzeBtn');
const skizzeView = document.getElementById('skizzeView');
const skizzeCloseBtn = document.getElementById('skizzeCloseBtn');
const skizzeFotoInput = document.getElementById('skizzeFotoInput');
const skizzeModePen = document.getElementById('skizzeModePen');
const skizzeModeText = document.getElementById('skizzeModeText');
const skizzeUndoBtn = document.getElementById('skizzeUndoBtn');
const skizzeClearBtn = document.getElementById('skizzeClearBtn');
const skizzeColors = document.getElementById('skizzeColors');
const skizzeCanvasWrap = document.getElementById('skizzeCanvasWrap');
const skizzeBgCanvas = document.getElementById('skizzeBg');
const skizzeDrawCanvas = document.getElementById('skizzeDraw');
const skizzeSaveBtn = document.getElementById('skizzeSaveBtn');

let skMode = 'pen';
let skColor = '#e63946';
let skActions = [];      // [{type:'stroke', color, width, points:[{x,y}]}] | [{type:'text', color, x, y, text}]
let skBgImage = null;    // HTMLImageElement | null
let skDrawing = false;
let editingSkizzeIndex = null; // Index in currentSkizzen, oder null = neue Skizze

// ---- Gemeinde-Auswahl ----
// Ortsteile je Gemeinde. Lindenfels und Lautertal (Odenwald) haben getrennte Ortsteillisten,
// deshalb muss vor der Erfassung feststehen, für welche Gemeinde der Hausanschluss ist.
const ORTSTEILE = {
  'Lindenfels': ['Lindenfels (Kernstadt)', 'Winterkasten', 'Schlierbach', 'Kolmbach', 'Eulsbach', 'Seidenbuch', 'Glattbach', 'Winkel', 'Litzelröder'],
  'Lautertal': ['Reichenbach', 'Elmshausen', 'Gadernheim', 'Knoden', 'Lautern', 'Raidelbach']
};
let aktuelleGemeinde = localStorage.getItem('aktuelleGemeinde') || null; // zuletzt gewählte Gemeinde, für neue Einträge vorgeschlagen
let formGemeinde = null; // Gemeinde des gerade geöffneten Formulars (neu oder Bearbeitung)
let gemeindeChooserCallback = null;

function populateOrtsteilOptions(gemeinde) {
  const liste = ORTSTEILE[gemeinde] || [];
  fOrtsteil.innerHTML = '<option value="">– wählen –</option>'
    + liste.map(o => `<option>${escapeHtml(o)}</option>`).join('')
    + '<option value="__custom__">Sonstiges…</option>';
}

function updateLogoHighlight() {
  chipLindenfels.classList.toggle('gem-active', aktuelleGemeinde === 'Lindenfels');
  chipLindenfels.classList.toggle('gem-inactive', aktuelleGemeinde === 'Lautertal');
  chipLautertal.classList.toggle('gem-active', aktuelleGemeinde === 'Lautertal');
  chipLautertal.classList.toggle('gem-inactive', aktuelleGemeinde === 'Lindenfels');
}

function setAktuelleGemeinde(g) {
  aktuelleGemeinde = g;
  localStorage.setItem('aktuelleGemeinde', g);
  updateLogoHighlight();
}

function openGemeindeChooser(cb) {
  gemeindeChooserCallback = cb || null;
  gemeindeCancelBtn.style.display = aktuelleGemeinde ? 'inline-flex' : 'none';
  gemeindeView.classList.add('open');
  pushOverlayState();
}

function closeGemeindeChooser() {
  if (gemeindeView.classList.contains('open')) history.back();
}

logoSwitchBtn.addEventListener('click', () => openGemeindeChooser());
logoSwitchBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGemeindeChooser(); }
});
gemeindeCancelBtn.addEventListener('click', () => {
  gemeindeChooserCallback = null;
  closeGemeindeChooser();
});
document.querySelectorAll('.gemeinde-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const g = btn.dataset.gemeinde;
    setAktuelleGemeinde(g);
    const cb = gemeindeChooserCallback;
    gemeindeChooserCallback = null;
    if (cb) {
      // Ein Folge-Overlay (das Formular) wird direkt im Anschluss geöffnet und legt selbst
      // einen History-Eintrag an. Hier NICHT history.back() verwenden: das würde sich mit
      // dem gleich folgenden pushState() aus openForm() überschneiden (back() wirkt erst
      // asynchron) und das gerade geöffnete Formular sofort wieder schließen.
      gemeindeView.classList.remove('open');
      cb();
    } else {
      closeGemeindeChooser();
    }
  });
});

// ---- Erfassungs-Modus (Hausanschluss / Rohrbruch) ----
// Zwei eigenständige Erfassungsmodi mit identischer Formularstruktur, aber getrennten
// Listen. Der Modus wird pro Eintrag als "typ" gespeichert; Einträge ohne "typ" (vor
// Einführung dieses Features angelegt) gelten als 'hausanschluss'.
let currentModus = localStorage.getItem('aktuellerModus') || 'hausanschluss';

function entryTyp(e) {
  return e.typ || 'hausanschluss';
}

function updateModeUI() {
  const zielRohrbruch = currentModus === 'hausanschluss';
  modeSwitchBar.textContent = zielRohrbruch ? '🔧 Zu Rohrbruch-Erfassung wechseln' : '🚰 Zu Hausanschluss-Erfassung wechseln';
  modeSwitchBar.classList.toggle('to-rohrbruch', zielRohrbruch);
  modeSwitchBar.classList.toggle('to-hausanschluss', !zielRohrbruch);
  appTitle.textContent = currentModus === 'rohrbruch' ? 'Rohrbruch Erfassung' : 'Hausanschluss Erfassung';
  render(searchInput.value);
}

function switchModus() {
  currentModus = currentModus === 'hausanschluss' ? 'rohrbruch' : 'hausanschluss';
  localStorage.setItem('aktuellerModus', currentModus);
  updateModeUI();
}

modeSwitchBar.addEventListener('click', switchModus);
modeSwitchBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchModus(); }
});

// ---- Leitungsart (nur Rohrbruch): Hauptleitung oder Hausanschlussleitung ----
// Wird bei jeder neuen Rohrbruch-Meldung erneut abgefragt (nicht wie die Gemeinde
// persistiert, da sie sich von Einsatz zu Einsatz unterscheidet).
let formLeitungsart = null;
let leitungsartChooserCallback = null;

function openLeitungsartChooser(cb) {
  leitungsartChooserCallback = cb || null;
  leitungsartCancelBtn.style.display = formLeitungsart ? 'inline-flex' : 'none';
  leitungsartView.classList.add('open');
  pushOverlayState();
}

function closeLeitungsartChooser() {
  if (leitungsartView.classList.contains('open')) history.back();
}

leitungsartCancelBtn.addEventListener('click', () => {
  leitungsartChooserCallback = null;
  closeLeitungsartChooser();
});
document.querySelectorAll('.leitungsart-option').forEach(btn => {
  btn.addEventListener('click', () => {
    formLeitungsart = btn.dataset.leitungsart;
    const cb = leitungsartChooserCallback;
    leitungsartChooserCallback = null;
    if (cb) {
      // Siehe Hinweis bei der Gemeinde-Auswahl: hier NICHT history.back() verwenden,
      // da direkt danach das Formular geöffnet wird und selbst einen History-Eintrag anlegt.
      leitungsartView.classList.remove('open');
      cb();
    } else {
      closeLeitungsartChooser();
    }
  });
});

// ---- Auftrag Trinkwasserversorgung ----
// Zusatzformular (1:1 nach dem amtlichen Vordruck der Stadt Lindenfels), das nur
// eingeblendet wird, wenn im Rohrbruch-Modus "Hausanschlussleitung" gewählt wurde
// UND die Gemeinde Lindenfels ist (Lautertal hat ein eigenes Verfahren).
function getRadioValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}
function setRadioValue(name, value) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(r => { r.checked = (r.value === value); });
}

const WVA_TEXT_FIELDS = [
  [wvaGrund, 'grund'], [wvaGemarkung, 'gemarkung'], [wvaFlur, 'flur'], [wvaFlurstueck, 'flurstueck'],
  [wvaWohnungen, 'wohnungen'], [wvaGewerbeArt, 'gewerbeArt'], [wvaBauwasserAb, 'bauwasserAb'],
  [wvaBrauchSonstige, 'brauchSonstige'], [wvaFliessdruck, 'fliessdruck'], [wvaSpitzendurchfluss, 'spitzendurchfluss'],
  [wvaHoechsteEntnahme, 'hoechsteEntnahme'], [wvaVermerkInstallateur, 'vermerkInstallateur'],
  [wvaZaehlergroesse, 'zaehlergroesse'], [wvaAnschlussnennweite, 'anschlussnennweite'], [wvaRohrmaterial, 'rohrmaterial'],
  [wvaVermerkWasserwerk, 'vermerkWasserwerk'], [wvaEigName, 'eigName'], [wvaEigAdresse, 'eigAdresse'],
  [wvaEigTelefon, 'eigTelefon'], [wvaEigEmail, 'eigEmail'], [wvaEigDatum, 'eigDatum'],
  [wvaInstName, 'instName'], [wvaInstAdresse, 'instAdresse'], [wvaInstTelefon, 'instTelefon'],
  [wvaInstEmail, 'instEmail'], [wvaInstDatumUnterschrift, 'instDatumUnterschrift'],
  [wvaAntragseingang, 'antragseingang'], [wvaAbnahmeDatum, 'abnahmeDatum'], [wvaInterneVermerk, 'interneVermerk']
];
const WVA_CHECK_FIELDS = [
  [wvaNutzungWohn, 'nutzungWohn'], [wvaNutzungMisch, 'nutzungMisch'], [wvaNutzungGewerbe, 'nutzungGewerbe'],
  [wvaBrauchGarten, 'brauchGarten'], [wvaBrauchToilette, 'brauchToilette'], [wvaBrauchWaschmaschine, 'brauchWaschmaschine'],
  [wvaAnlageLageplan, 'anlageLageplan'], [wvaAnlageGrundriss, 'anlageGrundriss'],
  [wvaAnlageBetriebsbeschreibung, 'anlageBetriebsbeschreibung'], [wvaAnlageBaulast, 'anlageBaulast'],
  [wvaEinverstaendnis, 'einverstaendnis']
];

function wvaSollSichtbarSein() {
  return currentModus === 'rohrbruch' && formLeitungsart === 'Hausanschlussleitung' && formGemeinde === 'Lindenfels';
}

function updateWvaVisibility() {
  wvaSection.style.display = wvaSollSichtbarSein() ? 'block' : 'none';
}

function updateWvaSubfieldVisibility() {
  wvaWohnungen.style.display = wvaNutzungWohn.checked ? 'inline-block' : 'none';
  wvaGewerbeArt.style.display = wvaNutzungGewerbe.checked ? 'inline-block' : 'none';
  wvaBauwasserAb.style.display = getRadioValue('wvaBauwasser') === 'ja' ? 'inline-block' : 'none';
  const brauchVorhanden = getRadioValue('wvaBrauchwasser') === 'vorhanden';
  wvaBrauchDetails.style.display = brauchVorhanden ? 'flex' : 'none';
  wvaBrauchSonstige.style.display = brauchVorhanden ? 'block' : 'none';
}
[wvaNutzungWohn, wvaNutzungGewerbe].forEach(el => el.addEventListener('change', updateWvaSubfieldVisibility));
document.querySelectorAll('input[name="wvaBauwasser"], input[name="wvaBrauchwasser"]').forEach(r => {
  r.addEventListener('change', updateWvaSubfieldVisibility);
});

function resetWvaFields() {
  WVA_TEXT_FIELDS.forEach(([el]) => el.value = '');
  WVA_CHECK_FIELDS.forEach(([el]) => el.checked = false);
  ['wvaArt', 'wvaBauwasser', 'wvaBrauchwasser'].forEach(name => setRadioValue(name, ''));
  updateWvaSubfieldVisibility();
}

function gatherWva() {
  const w = {};
  WVA_TEXT_FIELDS.forEach(([el, key]) => w[key] = el.value.trim());
  WVA_CHECK_FIELDS.forEach(([el, key]) => w[key] = el.checked);
  w.art = getRadioValue('wvaArt');
  w.bauwasser = getRadioValue('wvaBauwasser');
  w.brauchwasser = getRadioValue('wvaBrauchwasser');
  return w;
}

function applyWva(w) {
  if (!w) return;
  WVA_TEXT_FIELDS.forEach(([el, key]) => el.value = w[key] || '');
  WVA_CHECK_FIELDS.forEach(([el, key]) => el.checked = !!w[key]);
  setRadioValue('wvaArt', w.art || '');
  setRadioValue('wvaBauwasser', w.bauwasser || '');
  setRadioValue('wvaBrauchwasser', w.brauchwasser || '');
  updateWvaSubfieldVisibility();
}

// Sinnvolle Vorbelegung für den typischen Fall "Rohrbruch an bestehender Hausanschlussleitung".
function applyWvaDefaultsForNewRohrbruch() {
  if (!wvaSollSichtbarSein()) return;
  setRadioValue('wvaArt', 'Erneuerung');
  wvaGrund.value = 'Rohrbruch';
  const heute = new Date().toISOString().slice(0, 10);
  wvaEigDatum.value = heute;
  wvaAntragseingang.value = heute;
}

// ---- Auftrag Trinkwasserversorgung per E-Mail (mailto) ----
// Reine Text-Zusammenfassung im Mailtext, da mailto-Links keine Anhänge (Fotos/PDF)
// unterstützen. Empfänger bleibt leer, der Mitarbeiter trägt ihn im Mail-Programm ein.
const WVA_ART_LABELS = {
  Herstellung: 'Herstellung (neuer Anschluss)', Erneuerung: 'Erneuerung',
  Aenderung: 'Änderung', Beseitigung: 'Beseitigung'
};

function buildWvaEmail() {
  const zeilen = [];
  const add = (label, value) => { if (value) zeilen.push(`${label}: ${value}`); };
  const ort = computeOrtDisplay();

  zeilen.push('AUFTRAG TRINKWASSERVERSORGUNG – STADT LINDENFELS');
  zeilen.push('(Auftrag nach der Wasserversorgungssatzung – WVS, Rohrbruch an der Hausanschlussleitung)');
  zeilen.push('');
  add('Ort', ort);
  add('Kassenzeichen', fKassenzeichen.value.trim());
  add('Erfasst von', fBearbeiter.value.trim());
  zeilen.push('');

  zeilen.push('Art des Auftrags: ' + (WVA_ART_LABELS[getRadioValue('wvaArt')] || '–'));
  add('Grund', wvaGrund.value.trim());
  zeilen.push('');

  zeilen.push('1. Baugrundstück');
  add('Straße, Haus-Nr.', fStrasse.value.trim());
  add('Gemarkung', wvaGemarkung.value.trim());
  add('Flur', wvaFlur.value.trim());
  add('Flurstück(e)', wvaFlurstueck.value.trim());
  zeilen.push('');

  zeilen.push('2. Bauvorhaben – Art und Nutzung');
  const nutzungen = [];
  if (wvaNutzungWohn.checked) nutzungen.push('Wohngebäude' + (wvaWohnungen.value.trim() ? ' mit ' + wvaWohnungen.value.trim() + ' Wohnung/en' : ''));
  if (wvaNutzungMisch.checked) nutzungen.push('Mischnutzung');
  if (wvaNutzungGewerbe.checked) nutzungen.push('Gewerbe' + (wvaGewerbeArt.value.trim() ? ' (' + wvaGewerbeArt.value.trim() + ')' : ''));
  zeilen.push(nutzungen.length ? nutzungen.join(', ') : '–');
  zeilen.push('');

  zeilen.push('3. Bauwasser benötigt?');
  const bw = getRadioValue('wvaBauwasser');
  zeilen.push(bw === 'ja' ? 'Ja, ab: ' + (wvaBauwasserAb.value || '–') : (bw === 'nein' ? 'Nein' : '–'));
  zeilen.push('');

  zeilen.push('4. Brauchwassernutzungsanlage');
  const brauch = getRadioValue('wvaBrauchwasser');
  if (brauch === 'vorhanden') {
    const verwendung = [];
    if (wvaBrauchGarten.checked) verwendung.push('Gartenbewässerung');
    if (wvaBrauchToilette.checked) verwendung.push('Toilettenspülung');
    if (wvaBrauchWaschmaschine.checked) verwendung.push('Waschmaschinen');
    if (wvaBrauchSonstige.value.trim()) verwendung.push(wvaBrauchSonstige.value.trim());
    zeilen.push('Vorhanden oder geplant' + (verwendung.length ? ' – ' + verwendung.join(', ') : ''));
  } else if (brauch === 'nicht_vorhanden') {
    zeilen.push('Nicht vorhanden/geplant');
  } else {
    zeilen.push('–');
  }
  zeilen.push('');

  zeilen.push('5. Fachtechnische Angaben zur Wasserversorgung');
  add('5.1 Fließdruck (bar)', wvaFliessdruck.value.trim());
  add('5.2 Spitzendurchfluss Vs (l/s)', wvaSpitzendurchfluss.value.trim());
  add('5.3 Höchste Entnahmestelle (m)', wvaHoechsteEntnahme.value.trim());
  add('Vermerk Installateur', wvaVermerkInstallateur.value.trim());
  add('5.4 Größe des Wasserzählers', wvaZaehlergroesse.value.trim());
  add('5.5 Anschlussnennweite', wvaAnschlussnennweite.value.trim());
  add('5.6 Rohrmaterial', wvaRohrmaterial.value.trim());
  add('Vermerk Wasserwerk', wvaVermerkWasserwerk.value.trim());
  zeilen.push('');

  zeilen.push('6. Anlagen zum Auftrag');
  const anlagen = [];
  if (wvaAnlageLageplan.checked) anlagen.push('Lageplan (Kataster) 1:500');
  if (wvaAnlageGrundriss.checked) anlagen.push('Grundriss 1:100');
  if (wvaAnlageBetriebsbeschreibung.checked) anlagen.push('Betriebsbeschreibung');
  if (wvaAnlageBaulast.checked) anlagen.push('Baulasterklärung/Grunddienstbarkeit');
  zeilen.push(anlagen.length ? anlagen.join(', ') : '–');
  zeilen.push('');

  zeilen.push('8. Grundstückseigentümer/in');
  add('Name, Vorname', wvaEigName.value.trim());
  add('Adresse', wvaEigAdresse.value.trim());
  add('Telefon', wvaEigTelefon.value.trim());
  add('Email', wvaEigEmail.value.trim());
  add('Datum', wvaEigDatum.value);
  zeilen.push('Einverständnis WVS eingesehen: ' + (wvaEinverstaendnis.checked ? 'Ja' : 'Nein'));
  zeilen.push('');

  zeilen.push('9. Wasserinstallateur');
  add('Name/Firma', wvaInstName.value.trim());
  add('Adresse', wvaInstAdresse.value.trim());
  add('Telefon', wvaInstTelefon.value.trim());
  add('Email', wvaInstEmail.value.trim());
  add('Datum/Unterschrift/Stempel', wvaInstDatumUnterschrift.value.trim());
  zeilen.push('');

  zeilen.push('10. Interne Vermerke');
  add('Antragseingang', wvaAntragseingang.value);
  add('Abnahme durch Wasserwerk am', wvaAbnahmeDatum.value);
  add('Vermerk', wvaInterneVermerk.value.trim());

  const subject = 'Auftrag Trinkwasserversorgung – Rohrbruch Hausanschlussleitung' + (ort ? ' – ' + ort : '');
  return { subject, body: zeilen.join('\n') };
}

wvaEmailBtn.addEventListener('click', () => {
  const { subject, body } = buildWvaEmail();
  window.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
});

// ---- Neuer Eintrag: Gemeinde- und (im Rohrbruch-Modus) Leitungsart-Abfrage vorschalten ----
function proceedToNewForm() {
  if (currentModus === 'rohrbruch') {
    openLeitungsartChooser(() => {
      openForm(null);
      applyWvaDefaultsForNewRohrbruch();
    });
  } else {
    formLeitungsart = null;
    openForm(null);
  }
}

// ---- Overlay-Navigation ----
// Formular, Karte, Skizzen-Editor und Artikel-Auswahl sind Vollbild-Overlays. Ohne
// eigenen Verlaufseintrag verlässt die Zurück-Geste/-Taste des Handys dabei die ganze
// App, statt nur das Overlay zu schließen ("komme nicht mehr zurück ins Programm").
// Deshalb legt jedes Öffnen einen history-Eintrag an; ein popstate (egal ob durch die
// Zurück-Taste oder einen Schließen-Button ausgelöst) schließt dann genau das oberste
// offene Overlay.
function pushOverlayState() {
  history.pushState({ hausanschlussOverlay: true }, '');
}

function hideTopOverlay() {
  const stack = [gemeindeView, leitungsartView, mapView, artikelPickerView, skizzeView, formView];
  for (const el of stack) {
    if (el.classList.contains('open')) {
      el.classList.remove('open');
      return true;
    }
  }
  return false;
}

window.addEventListener('popstate', hideTopOverlay);

// ---- Helpers ----
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE') + ' ' + d.toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'});
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ---- Rendering: Liste ----
function render(filter) {
  const term = (filter || '').trim().toLowerCase();
  const shown = entries
    .slice()
    .filter(e => entryTyp(e) === currentModus)
    .sort((a, b) => b.datum.localeCompare(a.datum))
    .filter(e => {
      if (!term) return true;
      return [e.ort, e.kassenzeichen, e.notizen, e.bearbeiter].join(' ').toLowerCase().includes(term);
    });

  if (shown.length === 0) {
    const hinweis = currentModus === 'rohrbruch'
      ? 'Noch keine Rohrbruch-Meldungen.<br>Tippe auf ＋ um einen neuen Rohrbruch-Einsatz zu erfassen.'
      : 'Noch keine Einträge.<br>Tippe auf ＋ um einen neuen Hausanschluss-Einsatz zu erfassen.';
    listEl.innerHTML = `<div class="empty">${hinweis}</div>`;
    return;
  }

  listEl.innerHTML = shown.map(e => `
    <div class="card" data-id="${e.id}">
      <h3>${escapeHtml(e.ort || '(ohne Ort)')}</h3>
      <div class="meta">${e.gemeinde ? '🏛️ ' + escapeHtml(e.gemeinde) + ' · ' : ''}${e.leitungsart ? '🔧 ' + escapeHtml(e.leitungsart) + ' · ' : ''}${fmtDate(e.datum)}${e.bearbeiter ? ' · 👤 ' + escapeHtml(e.bearbeiter) : ''}${e.kassenzeichen ? ' · Kassenzeichen: ' + escapeHtml(e.kassenzeichen) : ''}${e.gps ? ' · 📍 GPS erfasst' : ''}${e.tiefe ? ' · Tiefe ' + escapeHtml(e.tiefe) + ' m' : ''}${e.messpunkte && e.messpunkte.length ? ' · 📏 ' + e.messpunkte.length + ' Maßpunkt(e)' : ''}${e.kmlFile ? ' · 📄 KML' : ''}</div>
      ${e.notizen ? `<div class="notiz">${escapeHtml(e.notizen)}</div>` : ''}
      ${e.fotos && e.fotos.length ? `<div class="thumbrow">${e.fotos.map(f => `<img src="${f.dataUrl}">`).join('')}</div>` : ''}
      ${e.skizzen && e.skizzen.length ? `<div class="thumbrow">${e.skizzen.map(s => `<img src="${s.dataUrl}">`).join('')}</div>` : ''}
      ${(e.gps || e.kmlFile) ? `<button type="button" class="btn btn-secondary cardmap-btn" data-mapid="${e.id}">🗺️ Karte anzeigen</button>` : ''}
    </div>
  `).join('');

  listEl.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openForm(card.dataset.id));
  });
  listEl.querySelectorAll('.cardmap-btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const e = entries.find(x => x.id === btn.dataset.mapid);
      if (e) openMapView(e.gps, e.kmlFile ? e.kmlFile.content : null, e.ort || 'Karte');
    });
  });
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---- Formular ----
function renderMesspunkte() {
  messpunkteEl.innerHTML = currentMesspunkte.map((p, idx) => `
    <div class="row" data-idx="${idx}" style="align-items:flex-end;margin-bottom:8px;">
      <div class="field" style="margin-bottom:0;">
        <label style="font-weight:400;">Bezugspunkt</label>
        <input type="text" class="mp-bezug" data-idx="${idx}" placeholder="z. B. Hausecke, Zaunpfosten" value="${escapeAttr(p.bezug)}">
      </div>
      <div class="field" style="max-width:120px;margin-bottom:0;">
        <label style="font-weight:400;">Maß (m)</label>
        <input type="text" class="mp-mass" data-idx="${idx}" inputmode="decimal" placeholder="z. B. 3,45" value="${escapeAttr(p.mass)}">
      </div>
      <button type="button" class="btn btn-danger mp-rm" data-idx="${idx}" style="margin-bottom:0;">✕</button>
    </div>
  `).join('');

  messpunkteEl.querySelectorAll('.mp-bezug').forEach(inp => {
    inp.addEventListener('input', () => currentMesspunkte[Number(inp.dataset.idx)].bezug = inp.value);
  });
  messpunkteEl.querySelectorAll('.mp-mass').forEach(inp => {
    inp.addEventListener('input', () => currentMesspunkte[Number(inp.dataset.idx)].mass = inp.value);
  });
  messpunkteEl.querySelectorAll('.mp-rm').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMesspunkte.splice(Number(btn.dataset.idx), 1);
      renderMesspunkte();
    });
  });
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

function renderPhotoRow() {
  const addLabel = photoRow.querySelector('.add-photo');
  photoRow.querySelectorAll('.photo-thumb').forEach(el => el.remove());
  currentPhotos.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = 'photo-thumb';
    div.innerHTML = `<img src="${p.dataUrl}"><button class="rm" data-idx="${idx}">✕</button>`;
    photoRow.insertBefore(div, addLabel);
  });
  photoRow.querySelectorAll('.rm').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      currentPhotos.splice(Number(btn.dataset.idx), 1);
      renderPhotoRow();
    });
  });
}

function renderSkizzeRow() {
  skizzeRow.querySelectorAll('.photo-thumb').forEach(el => el.remove());
  currentSkizzen.forEach((s, idx) => {
    const div = document.createElement('div');
    div.className = 'photo-thumb';
    div.innerHTML = `<img src="${s.dataUrl}"><button class="rm" data-idx="${idx}">✕</button>`;
    div.querySelector('img').addEventListener('click', () => openSkizzeEditor(s.dataUrl, idx));
    skizzeRow.insertBefore(div, addSkizzeBtn);
  });
  skizzeRow.querySelectorAll('.rm').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      currentSkizzen.splice(Number(btn.dataset.idx), 1);
      renderSkizzeRow();
    });
  });
}

function renderAufmassList() {
  aufmassListEl.innerHTML = currentAufmass.map((a, idx) => `
    <div class="row" data-idx="${idx}" style="align-items:flex-end;margin-bottom:8px;">
      <div class="field" style="margin-bottom:0;">
        <label style="font-weight:400;">${escapeHtml(a.bez)}${a.dim ? ' – ' + escapeHtml(a.dim) : ''}</label>
        <div class="status">Art.-Nr. ${escapeHtml(a.nr)}${a.einheit ? ' · Einheit: ' + escapeHtml(a.einheit) : ''}</div>
      </div>
      <div class="field" style="max-width:90px;margin-bottom:0;">
        <label style="font-weight:400;">Menge</label>
        <input type="text" class="am-menge" data-idx="${idx}" inputmode="decimal" value="${escapeAttr(a.menge)}">
      </div>
      <button type="button" class="btn btn-danger am-rm" data-idx="${idx}" style="margin-bottom:0;">✕</button>
    </div>
  `).join('');

  aufmassListEl.querySelectorAll('.am-menge').forEach(inp => {
    inp.addEventListener('input', () => currentAufmass[Number(inp.dataset.idx)].menge = inp.value);
  });
  aufmassListEl.querySelectorAll('.am-rm').forEach(btn => {
    btn.addEventListener('click', () => {
      currentAufmass.splice(Number(btn.dataset.idx), 1);
      renderAufmassList();
    });
  });
}

function resetForm() {
  editingId = null;
  currentPhotos = [];
  currentGps = null;
  currentMesspunkte = [];
  currentKml = null;
  currentSkizzen = [];
  currentAufmass = [];
  currentUnterschrift = null;
  formGemeinde = aktuelleGemeinde;
  populateOrtsteilOptions(formGemeinde);
  fOrtsteil.value = '';
  fOrtsteilCustom.value = '';
  fOrtsteilCustomField.style.display = 'none';
  // Zuletzt verwendeten Bearbeiter-Namen vorschlagen, spart bei mehreren Einträgen
  // hintereinander das erneute Eintippen.
  fBearbeiter.value = localStorage.getItem('letzterBearbeiter') || '';
  fStrasse.value = '';
  fKassenzeichen.value = '';
  fNotizen.value = '';
  fTiefe.value = '';
  gpsBox.textContent = 'Noch kein Standort erfasst.';
  gpsBox.classList.remove('ok');
  kmlStatus.textContent = '';
  deleteBtn.style.display = 'none';
  formTitle.textContent = currentModus === 'rohrbruch' ? 'Neue Rohrbruch-Meldung' : 'Neuer Eintrag';
  resetWvaFields();
  updateWvaVisibility();
  renderPhotoRow();
  renderMesspunkte();
  renderSkizzeRow();
  renderAufmassList();
}

function openForm(id) {
  resetForm();
  if (id) {
    const e = entries.find(x => x.id === id);
    if (!e) return;
    editingId = id;
    formTitle.textContent = entryTyp(e) === 'rohrbruch' ? 'Rohrbruch-Meldung bearbeiten' : 'Eintrag bearbeiten';
    if (e.gemeinde && e.gemeinde !== formGemeinde) {
      formGemeinde = e.gemeinde;
      populateOrtsteilOptions(formGemeinde);
    }
    formLeitungsart = entryTyp(e) === 'rohrbruch' ? (e.leitungsart || null) : null;
    updateWvaVisibility();
    if (wvaSollSichtbarSein()) {
      applyWva(e.wva);
    }
    const bekannteOrtsteile = Array.from(fOrtsteil.options).map(o => o.value);
    if (e.ortsteil && bekannteOrtsteile.includes(e.ortsteil)) {
      fOrtsteil.value = e.ortsteil;
    } else if (e.ortsteil) {
      fOrtsteil.value = '__custom__';
      fOrtsteilCustom.value = e.ortsteil;
      fOrtsteilCustomField.style.display = 'block';
    } else if (e.ort && !e.strasse) {
      // Alter Eintrag ohne getrennte Felder: kompletten Text ins Straßenfeld übernehmen
      fStrasse.value = e.ort;
    }
    fStrasse.value = e.strasse || fStrasse.value;
    fBearbeiter.value = e.bearbeiter || '';
    fKassenzeichen.value = e.kassenzeichen || '';
    fNotizen.value = e.notizen || '';
    currentPhotos = (e.fotos || []).slice();
    currentGps = e.gps || null;
    currentMesspunkte = (e.messpunkte || []).slice();
    currentKml = e.kmlFile || null;
    fTiefe.value = e.tiefe || '';
    if (currentGps) {
      showGps(currentGps);
    }
    if (currentKml) {
      kmlStatus.textContent = `📄 KML importiert: ${currentKml.name}`;
    }
    currentSkizzen = (e.skizzen || []).slice();
    currentAufmass = (e.aufmass || []).slice();
    currentUnterschrift = e.unterschrift || null;
    deleteBtn.style.display = 'inline-flex';
    renderPhotoRow();
    renderMesspunkte();
    renderSkizzeRow();
    renderAufmassList();
  }
  formView.classList.add('open');
  pushOverlayState();
  requestAnimationFrame(redrawSignature);
}

function closeForm() {
  if (formView.classList.contains('open')) history.back();
}

// ---- Events ----
fOrtsteil.addEventListener('change', () => {
  fOrtsteilCustomField.style.display = (fOrtsteil.value === '__custom__') ? 'block' : 'none';
});

function currentOrtsteil() {
  return fOrtsteil.value === '__custom__' ? fOrtsteilCustom.value.trim() : fOrtsteil.value;
}
function computeOrtDisplay() {
  const ot = currentOrtsteil();
  const str = fStrasse.value.trim();
  if (ot && str) return `${str}, ${ot}`;
  return ot || str;
}

newBtn.addEventListener('click', () => {
  if (!aktuelleGemeinde) {
    openGemeindeChooser(proceedToNewForm);
  } else {
    proceedToNewForm();
  }
});
closeFormBtn.addEventListener('click', closeForm);

function showGps(gps) {
  const src = gps.source === 'kml' ? ' (aus KML-Datei)' : '';
  gpsBox.textContent = `📍 ${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}${gps.accuracy ? ' (±' + Math.round(gps.accuracy) + ' m)' : ''}${src}`;
  gpsBox.classList.add('ok');
}

gpsBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    gpsBox.textContent = 'GPS wird von diesem Gerät/Browser nicht unterstützt.';
    return;
  }
  gpsBox.textContent = 'Standort wird ermittelt…';
  gpsBox.classList.remove('ok');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      currentGps = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        source: 'gps'
      };
      showGps(currentGps);
    },
    (err) => {
      gpsBox.textContent = 'Standort konnte nicht ermittelt werden: ' + err.message;
    },
    { enableHighAccuracy: true, timeout: 15000 }
  );
});

addMesspunktBtn.addEventListener('click', () => {
  currentMesspunkte.push({ bezug: '', mass: '' });
  renderMesspunkte();
});

// ---- KML Import ----
// Extrahiert den ersten <Point><coordinates>lon,lat[,alt]</coordinates></Point>
// aus einer KML-Datei (z. B. Exportdatei eines Einmess-Dienstleisters).
function parseKmlFirstPoint(kmlText) {
  const xml = new DOMParser().parseFromString(kmlText, 'application/xml');
  if (xml.querySelector('parsererror')) return null;
  const coordEl = xml.querySelector('Point > coordinates') || xml.querySelector('coordinates');
  if (!coordEl) return null;
  const raw = coordEl.textContent.trim().split(/\s+/)[0]; // erster Punkt bei mehreren
  const parts = raw.split(',').map(Number);
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return { lng: parts[0], lat: parts[1] };
}

function parseCoordsText(text) {
  return text.trim().split(/\s+/).map(pair => {
    const parts = pair.split(',').map(Number);
    return [parts[1], parts[0]]; // Leaflet: [lat, lng] – KML: lon,lat[,alt]
  }).filter(p => !Number.isNaN(p[0]) && !Number.isNaN(p[1]));
}

// Beschriftet ein Layer dauerhaft (nicht erst bei Klick) mit dem Placemark-Namen.
function bindPermanentLabel(layer, name, direction) {
  layer.bindTooltip(name, { permanent: true, direction, className: 'kml-label', offset: direction === 'top' ? [0, -6] : [0, 0] });
}

// Baut aus einem <Placemark> alle Leaflet-Layer (Punkt/Linie/Fläche, auch aus MultiGeometry).
// getElementsByTagName statt querySelector, weil KML-Dateien meist einen Default-Namespace
// haben, den querySelector auf XML-Dokumenten sonst nicht zuverlässig matcht.
// Gibt neben den Layern auch die rohen Punktkoordinaten zurück (für die automatische
// Verbindungslinie, falls die KML nur Einzelpunkte ohne LineString enthält) sowie ein
// Flag, ob bereits eine echte Linie/Fläche vorhanden war.
function buildLeafletLayersFromPlacemark(placemarkEl) {
  const nameEl = placemarkEl.getElementsByTagName('name')[0];
  const name = nameEl ? nameEl.textContent.trim() : '';
  const layers = [];
  const points = [];
  let hasLineOrArea = false;

  Array.from(placemarkEl.getElementsByTagName('Point')).forEach(el => {
    const coordEl = el.getElementsByTagName('coordinates')[0];
    if (!coordEl) return;
    const pts = parseCoordsText(coordEl.textContent);
    if (pts[0]) {
      const marker = L.marker(pts[0]);
      if (name) bindPermanentLabel(marker, name, 'top');
      layers.push(marker);
      points.push(pts[0]);
    }
  });

  Array.from(placemarkEl.getElementsByTagName('LineString')).forEach(el => {
    const coordEl = el.getElementsByTagName('coordinates')[0];
    if (!coordEl) return;
    const pts = parseCoordsText(coordEl.textContent);
    if (pts.length) {
      const line = L.polyline(pts, { color: '#e63946', weight: 4 });
      if (name) bindPermanentLabel(line, name, 'center');
      layers.push(line);
      hasLineOrArea = true;
    }
  });

  Array.from(placemarkEl.getElementsByTagName('Polygon')).forEach(el => {
    const outer = el.getElementsByTagName('outerBoundaryIs')[0];
    const coordEl = (outer ? outer.getElementsByTagName('coordinates')[0] : el.getElementsByTagName('coordinates')[0]);
    if (!coordEl) return;
    const pts = parseCoordsText(coordEl.textContent);
    if (pts.length) {
      const poly = L.polygon(pts, { color: '#1d6fa5' });
      if (name) bindPermanentLabel(poly, name, 'center');
      layers.push(poly);
      hasLineOrArea = true;
    }
  });

  return { layers, points, hasLineOrArea };
}

function parseKmlGeometries(kmlText) {
  const xml = new DOMParser().parseFromString(kmlText, 'application/xml');
  if (xml.querySelector('parsererror')) return [];
  const placemarks = Array.from(xml.getElementsByTagName('Placemark'));
  let allLayers = [];
  let allPoints = [];
  let hasLineOrArea = false;
  placemarks.forEach(pm => {
    const built = buildLeafletLayersFromPlacemark(pm);
    allLayers = allLayers.concat(built.layers);
    allPoints = allPoints.concat(built.points);
    if (built.hasLineOrArea) hasLineOrArea = true;
  });

  // Viele Vermessungsgeräte exportieren nur einzelne, nummerierte Punkte (kein
  // LineString). In dem Fall verbinden wir sie in KML-Reihenfolge automatisch zu
  // einer Linie, damit der Leitungsverlauf auf der Karte sichtbar ist.
  if (!hasLineOrArea && allPoints.length >= 2) {
    allLayers.unshift(L.polyline(allPoints, { color: '#e63946', weight: 4, dashArray: '6 6' }));
  }

  return allLayers;
}

kmlInput.addEventListener('change', async () => {
  const file = kmlInput.files && kmlInput.files[0];
  kmlInput.value = '';
  if (!file) return;

  if (/\.kmz$/i.test(file.name)) {
    kmlStatus.textContent = 'KMZ (gezippt) wird nicht unterstützt – bitte als .kml exportieren.';
    return;
  }

  const text = await file.text();
  const point = parseKmlFirstPoint(text);
  currentKml = { name: file.name, content: text };

  if (point) {
    currentGps = { lat: point.lat, lng: point.lng, accuracy: null, source: 'kml' };
    showGps(currentGps);
    kmlStatus.textContent = `📄 KML importiert: ${file.name} – Standort übernommen.`;
  } else {
    kmlStatus.textContent = `📄 KML importiert: ${file.name} – kein Punkt gefunden, Datei wird trotzdem gespeichert.`;
  }
});

fotoInput.addEventListener('change', async () => {
  const files = Array.from(fotoInput.files || []);
  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    currentPhotos.push({ name: file.name, dataUrl });
  }
  fotoInput.value = '';
  renderPhotoRow();
});

saveBtn.addEventListener('click', async () => {
  const entry = {
    id: editingId || uid(),
    datum: editingId ? (entries.find(x => x.id === editingId)?.datum || new Date().toISOString()) : new Date().toISOString(),
    geaendert: new Date().toISOString(),
    typ: currentModus,
    ort: computeOrtDisplay(),
    gemeinde: formGemeinde,
    leitungsart: currentModus === 'rohrbruch' ? formLeitungsart : null,
    wva: wvaSollSichtbarSein() ? gatherWva() : null,
    ortsteil: currentOrtsteil(),
    strasse: fStrasse.value.trim(),
    bearbeiter: fBearbeiter.value.trim(),
    kassenzeichen: fKassenzeichen.value.trim(),
    notizen: fNotizen.value.trim(),
    fotos: currentPhotos,
    gps: currentGps,
    tiefe: fTiefe.value.trim(),
    messpunkte: currentMesspunkte.filter(p => p.bezug.trim() || p.mass.trim()),
    kmlFile: currentKml,
    skizzen: currentSkizzen,
    aufmass: currentAufmass,
    unterschrift: sigHasContent ? signatureCanvas.toDataURL('image/png') : null
  };
  if (entry.bearbeiter) localStorage.setItem('letzterBearbeiter', entry.bearbeiter);
  await dbPut(entry);
  entries = await dbGetAll();
  render(searchInput.value);
  closeForm();
});

deleteBtn.addEventListener('click', async () => {
  if (!editingId) return;
  if (!confirm('Diesen Eintrag wirklich löschen?')) return;
  await dbDelete(editingId);
  entries = await dbGetAll();
  render(searchInput.value);
  closeForm();
});

searchInput.addEventListener('input', () => render(searchInput.value));

exportBtn.addEventListener('click', () => {
  const data = JSON.stringify(entries, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hausanschluss_export_' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// ---- Karten-Ansicht ----
let leafletMap = null;
let mapLayerGroup = null;
let mapCurrentLatLng = null;

function ensureMap() {
  if (leafletMap) return leafletMap;
  leafletMap = L.map('mapContainer');
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap-Mitwirkende'
  }).addTo(leafletMap);
  mapLayerGroup = L.layerGroup().addTo(leafletMap);
  return leafletMap;
}

function openMapView(gps, kmlContent, title) {
  mapTitle.textContent = title || 'Karte';
  mapView.classList.add('open');
  pushOverlayState();
  const map = ensureMap();
  mapLayerGroup.clearLayers();
  mapCurrentLatLng = null;

  const bounds = [];

  if (gps) {
    mapLayerGroup.addLayer(L.marker([gps.lat, gps.lng]).bindPopup('Standort'));
    bounds.push([gps.lat, gps.lng]);
    mapCurrentLatLng = [gps.lat, gps.lng];
  }

  if (kmlContent) {
    const kmlLayers = parseKmlGeometries(kmlContent);
    kmlLayers.forEach(l => {
      mapLayerGroup.addLayer(l);
      if (l.getLatLng) {
        bounds.push(l.getLatLng());
      } else if (l.getBounds) {
        const b = l.getBounds();
        bounds.push(b.getNorthEast(), b.getSouthWest());
      }
    });
    if (!mapCurrentLatLng && kmlLayers.length && kmlLayers[0].getLatLng) {
      const ll = kmlLayers[0].getLatLng();
      mapCurrentLatLng = [ll.lat, ll.lng];
    }
  }

  requestAnimationFrame(() => {
    map.invalidateSize();
    if (bounds.length === 1) {
      map.setView(bounds[0], 18);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      // Kein Standort vorhanden – Region Lindenfels/Odenwald als Fallback
      map.setView([49.68, 8.78], 13);
    }
  });
}

function closeMapView() {
  if (mapView.classList.contains('open')) history.back();
}

mapCloseBtn.addEventListener('click', closeMapView);

openGoogleMapsBtn.addEventListener('click', () => {
  if (!mapCurrentLatLng) {
    alert('Kein Standort auf der Karte vorhanden.');
    return;
  }
  window.open(`https://www.google.com/maps?q=${mapCurrentLatLng[0]},${mapCurrentLatLng[1]}`, '_blank');
});

showMapBtn.addEventListener('click', () => {
  if (!currentGps && !currentKml) {
    alert('Kein Standort vorhanden. Bitte zuerst GPS erfassen oder eine KML-Datei importieren.');
    return;
  }
  openMapView(currentGps, currentKml ? currentKml.content : null, computeOrtDisplay() || 'Karte');
});

// ---- Artikel-Auswahl (Aufmaßblatt) ----
fetch('assets/artikel.json').then(r => r.json()).then(data => { artikelDB = data; }).catch(() => {});

function renderArtikelResults(term) {
  const words = term.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = (!words.length
    ? artikelDB.slice(0, 50)
    : artikelDB.filter(a => {
        const haystack = (a.bez + ' ' + (a.dim || '') + ' ' + a.nr).toLowerCase();
        return words.every(w => haystack.includes(w));
      }).slice(0, 50)
  );
  artikelResults.innerHTML = results.length ? results.map(a => `
    <div class="card" data-nr="${escapeAttr(a.nr)}">
      <h3>${escapeHtml(a.bez)}${a.dim ? ' – ' + escapeHtml(a.dim) : ''}</h3>
      <div class="meta">Art.-Nr. ${escapeHtml(a.nr)}${a.einheit ? ' · Einheit: ' + escapeHtml(a.einheit) : ''}</div>
    </div>
  `).join('') : '<div class="empty">Keine Treffer.</div>';

  artikelResults.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const art = artikelDB.find(a => a.nr === card.dataset.nr);
      if (art) {
        currentAufmass.push({ nr: art.nr, bez: art.bez, dim: art.dim || '', einheit: art.einheit, menge: '1' });
        renderAufmassList();
      }
      closeArtikelPicker();
    });
  });
}

function openArtikelPicker() {
  artikelSearchInput.value = '';
  renderArtikelResults('');
  artikelPickerView.classList.add('open');
  pushOverlayState();
  artikelSearchInput.focus();
}
function closeArtikelPicker() {
  if (artikelPickerView.classList.contains('open')) history.back();
}

addArtikelBtn.addEventListener('click', openArtikelPicker);
artikelPickerCloseBtn.addEventListener('click', closeArtikelPicker);
artikelSearchInput.addEventListener('input', () => renderArtikelResults(artikelSearchInput.value));

// ---- Unterschrift (Kunde) ----
const sigCtx = signatureCanvas.getContext('2d');
let sigDrawing = false;
let sigHasContent = false;

function redrawSignature() {
  const dpr = window.devicePixelRatio || 1;
  const w = signatureWrap.clientWidth;
  const h = signatureWrap.clientHeight;
  signatureCanvas.width = Math.max(1, Math.round(w * dpr));
  signatureCanvas.height = Math.max(1, Math.round(h * dpr));
  signatureCanvas.style.width = w + 'px';
  signatureCanvas.style.height = h + 'px';
  sigCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sigCtx.fillStyle = '#ffffff';
  sigCtx.fillRect(0, 0, w, h);

  if (currentUnterschrift) {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(w / img.width, h / img.height, 1);
      const dw = img.width * scale, dh = img.height * scale;
      sigCtx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      sigHasContent = true;
    };
    img.src = currentUnterschrift;
  } else {
    sigHasContent = false;
  }
}

signatureCanvas.addEventListener('pointerdown', (evt) => {
  sigDrawing = true;
  const pos = getPos(evt, signatureCanvas);
  sigCtx.beginPath();
  sigCtx.moveTo(pos.x, pos.y);
  signatureCanvas.setPointerCapture(evt.pointerId);
});
signatureCanvas.addEventListener('pointermove', (evt) => {
  if (!sigDrawing) return;
  const pos = getPos(evt, signatureCanvas);
  sigCtx.strokeStyle = '#1a1f24';
  sigCtx.lineWidth = 2.5;
  sigCtx.lineCap = 'round';
  sigCtx.lineJoin = 'round';
  sigCtx.lineTo(pos.x, pos.y);
  sigCtx.stroke();
  sigHasContent = true;
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(evtName => {
  signatureCanvas.addEventListener(evtName, () => { sigDrawing = false; });
});

signatureClearBtn.addEventListener('click', () => {
  currentUnterschrift = null;
  redrawSignature();
  sigHasContent = false;
});

window.addEventListener('resize', () => {
  if (formView.classList.contains('open')) redrawSignature();
});

// ---- Aufmaßblatt drucken ----
function buildAufmassRowsHtml() {
  if (!currentAufmass.length) return '<tr><td colspan="5" style="color:#888;">Kein Material erfasst.</td></tr>';
  return currentAufmass.map(a => `
    <tr>
      <td>${escapeHtml(a.nr)}</td>
      <td>${escapeHtml(a.bez)}</td>
      <td>${escapeHtml(a.dim || '')}</td>
      <td>${escapeHtml(a.einheit)}</td>
      <td>${escapeHtml(a.menge)}</td>
    </tr>
  `).join('');
}

function buildMesspunkteHtml() {
  const tiefe = fTiefe.value.trim();
  const punkte = currentMesspunkte.filter(p => p.bezug.trim() || p.mass.trim());
  if (!tiefe && !punkte.length) return '';
  const tiefeRow = tiefe ? `<div><strong>Tiefe:</strong> ${escapeHtml(tiefe)} m</div>` : '';
  const punkteTable = punkte.length ? `
    <table>
      <thead><tr><th>Bezugspunkt</th><th>Maß (m)</th></tr></thead>
      <tbody>${punkte.map(p => `<tr><td>${escapeHtml(p.bezug)}</td><td>${escapeHtml(p.mass)}</td></tr>`).join('')}</tbody>
    </table>` : '';
  return `
  <div class="img-section">
    <h2>Einmessung (Dimension)</h2>
    ${tiefeRow}
    ${punkteTable}
  </div>`;
}

function buildImageSectionHtml(titel, items) {
  if (!items || !items.length) return '';
  const figures = items.map(it => `
    <figure>
      <img src="${it.dataUrl}" alt="${escapeHtml(it.name || titel)}">
      <figcaption>${escapeHtml(it.name || '')}</figcaption>
    </figure>
  `).join('');
  return `
  <div class="img-section">
    <h2>${escapeHtml(titel)}</h2>
    <div class="img-grid">${figures}</div>
  </div>`;
}

printBtn.addEventListener('click', () => {
  const ort = computeOrtDisplay();
  const win = window.open('', '_blank');
  if (!win) { alert('Pop-up wurde blockiert. Bitte Pop-ups für diese Seite erlauben.'); return; }
  win.document.write(`<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8">
<base href="${location.href}">
<title>Aufmaßblatt</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1f24;padding:24px;}
  .print-header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #1d6fa5;padding-bottom:12px;margin-bottom:16px;}
  .print-header img{height:42px;}
  h1{font-size:20px;margin:0;}
  .meta-block{margin-bottom:14px;font-size:14px;line-height:1.6;}
  table{width:100%;border-collapse:collapse;margin-top:8px;}
  th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:13px;}
  thead{display:table-header-group;}
  tr{break-inside:avoid;page-break-inside:avoid;}
  .sig-block{margin-top:28px;break-inside:avoid;page-break-inside:avoid;}
  .sig-block img{max-height:100px;display:block;margin-bottom:4px;}
  .sig-line{border-top:1px solid #333;width:280px;padding-top:4px;font-size:12px;color:#555;margin-top:${currentUnterschrift ? '4' : '60'}px;}
  .img-section{margin-top:20px;break-inside:avoid;page-break-inside:avoid;}
  .img-section h2{font-size:15px;margin:0 0 8px;}
  .img-grid{display:flex;flex-wrap:wrap;gap:10px;}
  .img-grid figure{margin:0;width:160px;break-inside:avoid;page-break-inside:avoid;}
  .img-grid img{width:100%;height:auto;border:1px solid #ccc;display:block;}
  .img-grid figcaption{font-size:11px;color:#555;margin-top:2px;word-break:break-all;}
  .no-print{margin-top:20px;}
  @media print{.no-print{display:none;}}
</style>
</head>
<body>
  <div class="print-header">
    ${formGemeinde === 'Lautertal' ? '<img src="assets/logo-lautertal.png" alt="">' : '<img src="assets/logo-lindenfels.jpg" alt="">'}
    <img src="assets/logo-trinkwasser.png" alt="">
    <h1>Aufmaßblatt – ${currentModus === 'rohrbruch' ? 'Rohrbruch' : 'Hausanschluss'}</h1>
  </div>
  <div class="meta-block">
    <div><strong>Gemeinde:</strong> ${escapeHtml(formGemeinde || '–')}</div>
    <div><strong>Ort:</strong> ${escapeHtml(ort)}</div>
    <div><strong>Kassenzeichen:</strong> ${escapeHtml(fKassenzeichen.value.trim())}</div>
    <div><strong>Erfasst von:</strong> ${escapeHtml(fBearbeiter.value.trim())}</div>
    <div><strong>Datum:</strong> ${new Date().toLocaleDateString('de-DE')}</div>
  </div>
  <table>
    <thead><tr><th>Art.-Nr.</th><th>Bezeichnung</th><th>Dimension</th><th>Einheit</th><th>Menge</th></tr></thead>
    <tbody>${buildAufmassRowsHtml()}</tbody>
  </table>
  ${buildMesspunkteHtml()}
  ${buildImageSectionHtml('Fotos', currentPhotos)}
  ${buildImageSectionHtml('Skizzen', currentSkizzen)}
  <div class="sig-block">
    ${currentUnterschrift ? `<img src="${currentUnterschrift}" alt="Unterschrift">` : ''}
    <div class="sig-line">Unterschrift Kunde</div>
  </div>
  <button class="no-print" onclick="window.print()">Drucken / Als PDF speichern</button>
</body></html>`);
  win.document.close();
});

// ---- Skizzen-Editor ----
const skBgCtx = skizzeBgCanvas.getContext('2d');
const skDrawCtx = skizzeDrawCanvas.getContext('2d');

function fitCanvasToWrap(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const w = skizzeCanvasWrap.clientWidth;
  const h = skizzeCanvasWrap.clientHeight;
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

function drawBackground() {
  const { w, h } = fitCanvasToWrap(skizzeBgCanvas, skBgCtx);
  skBgCtx.fillStyle = '#ffffff';
  skBgCtx.fillRect(0, 0, w, h);
  if (skBgImage) {
    // "contain": Bild komplett sichtbar, mittig eingepasst
    const scale = Math.min(w / skBgImage.width, h / skBgImage.height);
    const dw = skBgImage.width * scale;
    const dh = skBgImage.height * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    skBgCtx.drawImage(skBgImage, dx, dy, dw, dh);
  }
}

function replayActions() {
  const { w, h } = fitCanvasToWrap(skizzeDrawCanvas, skDrawCtx);
  skDrawCtx.clearRect(0, 0, w, h);
  skActions.forEach(a => drawAction(a));
}

function drawAction(a) {
  if (a.type === 'stroke') {
    if (a.points.length < 1) return;
    skDrawCtx.strokeStyle = a.color;
    skDrawCtx.lineWidth = a.width;
    skDrawCtx.lineCap = 'round';
    skDrawCtx.lineJoin = 'round';
    skDrawCtx.beginPath();
    skDrawCtx.moveTo(a.points[0].x, a.points[0].y);
    for (let i = 1; i < a.points.length; i++) skDrawCtx.lineTo(a.points[i].x, a.points[i].y);
    skDrawCtx.stroke();
  } else if (a.type === 'text') {
    skDrawCtx.fillStyle = a.color;
    skDrawCtx.font = '600 22px -apple-system, Segoe UI, Roboto, sans-serif';
    skDrawCtx.textBaseline = 'top';
    skDrawCtx.fillText(a.text, a.x, a.y);
  }
}

function getPos(evt, canvas) {
  const rect = canvas.getBoundingClientRect();
  return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
}

function setSkMode(mode) {
  skMode = mode;
  skizzeModePen.classList.toggle('active', mode === 'pen');
  skizzeModeText.classList.toggle('active', mode === 'text');
}

function openSkizzeEditor(existingDataUrl, idx) {
  editingSkizzeIndex = (idx === undefined) ? null : idx;
  skActions = [];
  skBgImage = null;
  setSkMode('pen');
  skizzeView.classList.add('open');
  pushOverlayState();

  const afterLayout = () => {
    drawBackground();
    replayActions();
  };

  if (existingDataUrl) {
    const img = new Image();
    img.onload = () => { skBgImage = img; afterLayout(); };
    img.src = existingDataUrl;
  } else {
    requestAnimationFrame(afterLayout);
  }
}

function closeSkizzeEditor() {
  if (skizzeView.classList.contains('open')) history.back();
}

addSkizzeBtn.addEventListener('click', () => openSkizzeEditor(null, null));
skizzeCloseBtn.addEventListener('click', closeSkizzeEditor);

skizzeModePen.addEventListener('click', () => setSkMode('pen'));
skizzeModeText.addEventListener('click', () => setSkMode('text'));

skizzeColors.querySelectorAll('.colordot').forEach(dot => {
  dot.addEventListener('click', () => {
    skColor = dot.dataset.color;
    skizzeColors.querySelectorAll('.colordot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
  });
});

skizzeUndoBtn.addEventListener('click', () => {
  skActions.pop();
  replayActions();
});

skizzeClearBtn.addEventListener('click', () => {
  if (!confirm('Skizze komplett neu beginnen? Foto und Beschriftungen werden entfernt.')) return;
  skActions = [];
  skBgImage = null;
  drawBackground();
  replayActions();
});

skizzeFotoInput.addEventListener('change', async () => {
  const file = skizzeFotoInput.files && skizzeFotoInput.files[0];
  skizzeFotoInput.value = '';
  if (!file) return;
  const dataUrl = await fileToDataUrl(file);
  const img = new Image();
  img.onload = () => {
    skBgImage = img;
    drawBackground();
  };
  img.src = dataUrl;
});

// Zeichnen mit dem Stift
skizzeDrawCanvas.addEventListener('pointerdown', (evt) => {
  if (skMode !== 'pen') return;
  skDrawing = true;
  const pos = getPos(evt, skizzeDrawCanvas);
  skActions.push({ type: 'stroke', color: skColor, width: 4, points: [pos] });
  skizzeDrawCanvas.setPointerCapture(evt.pointerId);
});
skizzeDrawCanvas.addEventListener('pointermove', (evt) => {
  if (skMode !== 'pen' || !skDrawing) return;
  const pos = getPos(evt, skizzeDrawCanvas);
  const current = skActions[skActions.length - 1];
  current.points.push(pos);
  drawAction({ type: 'stroke', color: current.color, width: current.width, points: current.points.slice(-2) });
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(evtName => {
  skizzeDrawCanvas.addEventListener(evtName, () => { skDrawing = false; });
});

// Text-Beschriftung: Tippen platziert ein Eingabefeld an der Stelle
skizzeDrawCanvas.addEventListener('pointerdown', (evt) => {
  if (skMode !== 'text') return;
  const pos = getPos(evt, skizzeDrawCanvas);
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Text …';
  input.style.position = 'absolute';
  input.style.left = pos.x + 'px';
  input.style.top = pos.y + 'px';
  input.style.font = '600 16px sans-serif';
  input.style.padding = '4px 6px';
  input.style.border = `2px solid ${skColor}`;
  input.style.borderRadius = '4px';
  input.style.zIndex = '5';
  skizzeCanvasWrap.appendChild(input);
  input.focus();

  const commit = () => {
    const text = input.value.trim();
    input.remove();
    if (text) {
      skActions.push({ type: 'text', color: skColor, x: pos.x, y: pos.y, text });
      drawAction(skActions[skActions.length - 1]);
    }
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
  input.addEventListener('blur', commit, { once: true });
});

skizzeSaveBtn.addEventListener('click', () => {
  const merged = document.createElement('canvas');
  merged.width = skizzeBgCanvas.width;
  merged.height = skizzeBgCanvas.height;
  const mctx = merged.getContext('2d');
  mctx.drawImage(skizzeBgCanvas, 0, 0);
  mctx.drawImage(skizzeDrawCanvas, 0, 0);
  const dataUrl = merged.toDataURL('image/png');
  const item = { name: 'skizze_' + uid() + '.png', dataUrl };

  if (editingSkizzeIndex !== null && editingSkizzeIndex !== undefined) {
    currentSkizzen[editingSkizzeIndex] = item;
  } else {
    currentSkizzen.push(item);
  }
  renderSkizzeRow();
  closeSkizzeEditor();
});

window.addEventListener('resize', () => {
  if (skizzeView.classList.contains('open')) {
    drawBackground();
    replayActions();
  }
});

// ---- Init ----
(async function init() {
  db = await openDB();
  entries = await dbGetAll();
  updateModeUI();
  updateLogoHighlight();

  if ('serviceWorker' in navigator) {
    let swRefreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (swRefreshing) return;
      swRefreshing = true;
      window.location.reload();
    });
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }
})();

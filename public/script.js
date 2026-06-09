// ==================== KONFIGURASI ====================
// GANTI DENGAN URL DEPLOY APPS SCRIPT ANDA
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzv3v-tiTccrswwn1q7DqTaBtae4jYORh9Dogr6Y5k4ZsccWdwDdG-3_xs49E0bFTMc/exec';

// ==================== POLIGON WILAYAH ====================
const WILAYAH = {
    ngambon: {
        name: 'Kecamatan Ngambon',
        center: [-7.2853, 111.7198],
        polygons: [[[-7.2480,111.6880],[-7.2495,111.6960],[-7.2515,111.7040],[-7.2540,111.7110],[-7.2568,111.7175],[-7.2600,111.7240],[-7.2630,111.7305],[-7.2660,111.7368],[-7.2705,111.7420],[-7.2760,111.7460],[-7.2820,111.7478],[-7.2880,111.7465],[-7.2935,111.7430],[-7.2978,111.7378],[-7.3010,111.7310],[-7.3055,111.7240],[-7.3068,111.7163],[-7.3060,111.7083],[-7.3040,111.7005],[-7.3010,111.6935],[-7.2968,111.6875],[-7.2920,111.6828],[-7.2865,111.6793],[-7.2803,111.6775],[-7.2738,111.6778],[-7.2675,111.6793],[-7.2618,111.6813],[-7.2565,111.6833],[-7.2525,111.6850],[-7.2495,111.6862],[-7.2480,111.6880]]],
        villages: ['Ngambon', 'Bondol', 'Karangmangu', 'Nglampin', 'Sengon']
    },
    tambakrejo: {
        name: 'Kecamatan Tambakrejo',
        center: [-7.2645, 111.6198],
        polygons: [[[-7.2130,111.5840],[-7.2160,111.5930],[-7.2200,111.6025],[-7.2240,111.6115],[-7.2278,111.6200],[-7.2315,111.6285],[-7.2348,111.6365],[-7.2370,111.6460],[-7.2390,111.6560],[-7.2405,111.6660],[-7.2415,111.6760],[-7.2420,111.6870],[-7.2430,111.6940],[-7.2480,111.6880],[-7.2495,111.6862],[-7.2525,111.6850],[-7.2565,111.6833],[-7.2618,111.6813],[-7.2675,111.6793],[-7.2720,111.6760],[-7.2760,111.6720],[-7.2800,111.6670],[-7.2838,111.6600],[-7.2865,111.6515],[-7.2883,111.6420],[-7.2898,111.6325],[-7.2903,111.6225],[-7.2890,111.6130],[-7.2868,111.6042],[-7.2835,111.5968],[-7.2795,111.5910],[-7.2745,111.5868],[-7.2690,111.5838],[-7.2630,111.5822],[-7.2567,111.5818],[-7.2500,111.5822],[-7.2430,111.5825],[-7.2360,111.5823],[-7.2290,111.5820],[-7.2217,111.5825],[-7.2165,111.5832],[-7.2130,111.5840]]],
        villages: ['Tambakrejo','Sukorejo','Sendangrejo','Pengkol','Ngrancang','Napis','Mulyorejo','Malingmati','Kalisumber','Tanjung','Dolokgede','Gading','Gamongan','Jatimulyo','Jawik','Kacangan','Bakalan','Turi']
    }
};

const BATAS_WILAYAH = { latMin: -7.3090, latMax: -7.2100, lngMin: 111.5790, lngMax: 111.7520 };

// ==================== KATEGORI IKON ====================
const KATEGORI_ICON_MAP = {
    'rumah-tangga': { emoji: '🏠', color: '#f59e0b', bgColor: '#fef3c7' },
    'plastik': { emoji: '🪣', color: '#3b82f6', bgColor: '#eff6ff' },
    'bangunan': { emoji: '🏗️', color: '#8b5cf6', bgColor: '#f3e8ff' },
    'b3': { emoji: '⚠️', color: '#ef4444', bgColor: '#fef2f2' },
    'medis': { emoji: '🏥', color: '#ec4899', bgColor: '#fdf2f8' },
    'limbah-pabrik': { emoji: '🏭', color: '#64748b', bgColor: '#f1f5f9' },
    'lainnya': { emoji: '📦', color: '#10b981', bgColor: '#ecfdf5' }
};

function getStatusColor(status) {
    if (status === 'selesai') return '#10b981';
    if (status === 'proses') return '#3b82f6';
    return '#f59e0b';
}

function getKategoriMarkerIcon(kategori, status) {
    const meta = KATEGORI_ICON_MAP[kategori] || KATEGORI_ICON_MAP['lainnya'];
    const statusColor = getStatusColor(status);
    return L.divIcon({
        className: 'custom-marker-icon',
        html: `<div style="position:relative;width:44px;height:44px;"><div style="position:absolute;top:0;left:0;width:44px;height:44px;background:${statusColor}22;border:2.5px solid ${statusColor};border-radius:50%;box-shadow:0 2px 8px ${statusColor}66;"></div><div style="position:absolute;top:4px;left:4px;width:36px;height:36px;background:${meta.bgColor};border-radius:50%;display:flex;align-items:center;justify-content:center;"></div><span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:20px;line-height:1;z-index:2;">${meta.emoji}</span></div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22]
    });
}

function getKategoriText(kategori) {
    const texts = { 'rumah-tangga':'Sampah Rumah Tangga','plastik':'Sampah Plastik','bangunan':'Sampah Bangunan','b3':'Sampah B3','medis':'Sampah Medis','limbah-pabrik':'Limbah Pabrik','lainnya':'Lainnya' };
    return texts[kategori] || 'Lainnya';
}

function getVolumeText(volume) {
    if (!volume || volume === 'tidak diketahui') return 'Volume tidak diketahui';
    const texts = { 'kecil':'Kecil (≤ 1 pick up)','sedang':'Sedang (1-3 pick up)','besar':'Besar (≥ 3 pick up)' };
    return texts[volume] || volume;
}

function escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// ==================== GLOBAL VARIABLES ====================
let map, marker, selectedLat = null, selectedLng = null, currentLocationValid = false, currentKecamatan = null, allLaporan = [], wilayahPolygons = [], currentStep = 1;
let liveWatchId = null, liveCircle = null, liveMarkerEl = null, userLocationMarker = null, userLocationCircle = null, userLocationWatchId = null;
const scrollTopBtn = document.getElementById('scrollTopBtn'), navbar = document.getElementById('navbar'), navToggle = document.getElementById('navToggle'), navLinks = document.getElementById('navLinks');
const form = document.getElementById('formLaporan'), submitBtn = document.getElementById('submitBtn'), fotoInput = document.getElementById('foto'), deskripsiInput = document.getElementById('deskripsi'), charCount = document.getElementById('charCount');
const searchInput = document.getElementById('searchLaporan'), filterStatus = document.getElementById('filterStatus'), filterKecamatan = document.getElementById('filterKecamatan'), filterKategori = document.getElementById('filterKategori'), searchClear = document.getElementById('searchClear');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(() => { const loader = document.getElementById('loader'); if (loader) loader.classList.add('hide'); }, 1000);
    if (typeof AOS !== 'undefined') AOS.init({ duration: 1000, once: true, offset: 100 });
    if (window.innerWidth > 768) initCustomCursor();
    initParticles();
    initMap();
    await loadLaporan();
    setupEventListeners();
    setupScrollEffect();
    setupFormSteps();
    setupVolumeSelector();
    setInterval(() => loadLaporan(), 30000);
});

function initCustomCursor() {
    const cursorDot = document.getElementById('cursorDot'), cursorOutline = document.getElementById('cursorOutline');
    if (!cursorDot || !cursorOutline) return;
    document.addEventListener('mousemove', (e) => { cursorDot.style.transform = `translate(${e.clientX-3}px, ${e.clientY-3}px)`; cursorOutline.style.transform = `translate(${e.clientX-20}px, ${e.clientY-20}px)`; });
    document.querySelectorAll('a, button, .nav-link, .btn-primary, .btn-secondary, .volume-option, .step').forEach(el => {
        el.addEventListener('mouseenter', () => { cursorDot.classList.add('hover'); cursorOutline.classList.add('hover'); });
        el.addEventListener('mouseleave', () => { cursorDot.classList.remove('hover'); cursorOutline.classList.remove('hover'); });
    });
}

function initParticles() {
    const particlesContainer = document.getElementById('heroParticles');
    if (!particlesContainer) return;
    particlesContainer.innerHTML = '';
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `position:absolute;width:${Math.random()*4+2}px;height:${Math.random()*4+2}px;background:rgba(16,185,129,${Math.random()*0.3+0.1});border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*100}%;animation:float ${Math.random()*10+5}s ease-in-out infinite;animation-delay:${Math.random()*5}s;pointer-events:none;`;
        particlesContainer.appendChild(particle);
    }
}

// ==================== MAP FUNCTIONS ====================
function initMap() {
    const centerLat = (BATAS_WILAYAH.latMin + BATAS_WILAYAH.latMax) / 2, centerLng = (BATAS_WILAYAH.lngMin + BATAS_WILAYAH.lngMax) / 2;
    map = L.map('map').setView([centerLat, centerLng], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB | DLH Bojonegoro', subdomains: 'abcd', maxZoom: 19 }).addTo(map);
    drawWilayahPolygons();
    const customIcon = L.divIcon({ className: 'custom-div-icon', html: '<i class="fas fa-map-marker-alt" style="color: #10b981; font-size: 40px; text-shadow: 0 0 3px white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));"></i>', iconSize: [40, 40], popupAnchor: [0, -20] });
    marker = L.marker([centerLat, centerLng], { draggable: true, icon: customIcon }).addTo(map);
    marker.on('dragend', function(e) { const pos = e.target.getLatLng(); updateSelectedLocation(pos.lat, pos.lng); });
    map.on('click', function(e) { updateSelectedLocation(e.latlng.lat, e.latlng.lng); });
}

function drawWilayahPolygons() {
    const polygonStyle = { color: '#10b981', weight: 3, opacity: 0.9, fillColor: '#10b981', fillOpacity: 0.15, smoothFactor: 1 };
    WILAYAH.ngambon.polygons.forEach(polygonCoords => { const polygon = L.polygon(polygonCoords, polygonStyle).addTo(map); polygon.bindPopup(`<div style="text-align:center;padding:8px;"><strong style="color:#10b981;">🏘️ ${WILAYAH.ngambon.name}</strong><br><span style="font-size:12px;">Desa: ${WILAYAH.ngambon.villages.join(', ')}</span><br><span style="color:#10b981;font-size:11px;">✓ Wilayah layanan DLH</span></div>`); polygon.on('mouseover', function() { polygon.setStyle({ fillOpacity: 0.3 }); }); polygon.on('mouseout', function() { polygon.setStyle({ fillOpacity: 0.15 }); }); wilayahPolygons.push(polygon); });
    WILAYAH.tambakrejo.polygons.forEach(polygonCoords => { const polygon = L.polygon(polygonCoords, polygonStyle).addTo(map); polygon.bindPopup(`<div style="text-align:center;padding:8px;"><strong style="color:#10b981;">🏘️ ${WILAYAH.tambakrejo.name}</strong><br><span style="font-size:12px;">Desa: ${WILAYAH.tambakrejo.villages.join(', ')}</span><br><span style="color:#10b981;font-size:11px;">✓ Wilayah layanan DLH</span></div>`); polygon.on('mouseover', function() { polygon.setStyle({ fillOpacity: 0.3 }); }); polygon.on('mouseout', function() { polygon.setStyle({ fillOpacity: 0.15 }); }); wilayahPolygons.push(polygon); });
}

function isPointInPolygon(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length-1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1], xj = polygon[j][0], yj = polygon[j][1];
        const intersect = ((yi > lng) != (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function validateLocation(lat, lng) {
    if (lat < BATAS_WILAYAH.latMin || lat > BATAS_WILAYAH.latMax || lng < BATAS_WILAYAH.lngMin || lng > BATAS_WILAYAH.lngMax) return { valid: false, kecamatan: null };
    for (const polygon of WILAYAH.ngambon.polygons) if (isPointInPolygon(lat, lng, polygon)) return { valid: true, kecamatan: 'Kecamatan Ngambon' };
    for (const polygon of WILAYAH.tambakrejo.polygons) if (isPointInPolygon(lat, lng, polygon)) return { valid: true, kecamatan: 'Kecamatan Tambakrejo' };
    return { valid: false, kecamatan: null };
}

function updateSelectedLocation(lat, lng) {
    selectedLat = lat; selectedLng = lng; marker.setLatLng([lat, lng]);
    const validasi = validateLocation(lat, lng);
    currentLocationValid = validasi.valid; currentKecamatan = validasi.kecamatan;
    const lokasiInput = document.getElementById('lokasi'), validasiGroup = document.getElementById('validasiLokasiGroup'), locationStatus = document.getElementById('locationStatus');
    if (lokasiInput) lokasiInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    if (validasiGroup && locationStatus) {
        validasiGroup.style.display = 'block';
        if (validasi.valid) {
            locationStatus.className = 'location-status valid';
            locationStatus.innerHTML = `<i class="fas fa-check-circle"></i> ✅ Lokasi valid di ${validasi.kecamatan} - Dalam wilayah layanan DLH Bojonegoro`;
            let hiddenKecamatan = document.getElementById('kecamatanOtomatis');
            if (!hiddenKecamatan) { hiddenKecamatan = document.createElement('input'); hiddenKecamatan.type = 'hidden'; hiddenKecamatan.id = 'kecamatanOtomatis'; document.getElementById('formLaporan').appendChild(hiddenKecamatan); }
            hiddenKecamatan.value = validasi.kecamatan;
        } else {
            locationStatus.className = 'location-status invalid';
            locationStatus.innerHTML = `<i class="fas fa-times-circle"></i> ❌ Lokasi di luar wilayah layanan DLH! Hanya Kecamatan Ngambon & Tambakrejo yang dilayani.`;
            showNotification('Lokasi di luar wilayah layanan DLH!', 'error');
        }
    }
}

// ==================== GPS TRACKING ====================
function startLiveTracking() {
    if (!navigator.geolocation) { showNotification('Browser tidak mendukung geolokasi', 'error'); return; }
    const btn = document.getElementById('getLocationBtn');
    if (btn) { btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Mencari Sinyal GPS…'; btn.disabled = true; btn.classList.add('btn-tracking'); }
    if (liveWatchId !== null) navigator.geolocation.clearWatch(liveWatchId);
    const validasiGroup = document.getElementById('validasiLokasiGroup'), locationStatus = document.getElementById('locationStatus');
    if (validasiGroup) validasiGroup.style.display = 'block';
    if (locationStatus) { locationStatus.className = 'location-status loading'; locationStatus.innerHTML = '<i class="fas fa-satellite-dish fa-pulse"></i> <span id="gpsStatusText">Menghubungi satelit GPS… pastikan Anda berada di luar ruangan.</span>'; }
    let firstFix = true;
    liveWatchId = navigator.geolocation.watchPosition((pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude, accuracy = pos.coords.accuracy;
        updateSelectedLocation(lat, lng);
        if (firstFix) { map.flyTo([lat, lng], 16, { duration: 1.5 }); firstFix = false; } else { map.setView([lat, lng], map.getZoom()); }
        if (liveCircle) { liveCircle.setLatLng([lat, lng]); liveCircle.setRadius(accuracy); } else { liveCircle = L.circle([lat, lng], { radius: accuracy, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 2, dashArray: '6 4' }).addTo(map); }
        if (!liveMarkerEl) { const liveIcon = L.divIcon({ className: 'live-gps-icon', html: `<div class="gps-pulse-ring"></div><div class="gps-dot"><i class="fas fa-location-crosshairs"></i></div>`, iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -18] }); if (marker) marker.setIcon(liveIcon); liveMarkerEl = true; }
        if (btn) { btn.innerHTML = '<i class="fas fa-stop-circle"></i> Hentikan Tracking'; btn.disabled = false; btn.onclick = stopLiveTracking; }
    }, (error) => { stopLiveTracking(); let pesan = 'Gagal mendapatkan lokasi: '; if (error.code === error.PERMISSION_DENIED) pesan += 'Izin lokasi ditolak.'; else if (error.code === error.POSITION_UNAVAILABLE) pesan += 'Sinyal GPS tidak tersedia.'; else pesan += 'Waktu habis.'; showNotification(pesan, 'error'); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
}

function stopLiveTracking() {
    if (liveWatchId !== null) { navigator.geolocation.clearWatch(liveWatchId); liveWatchId = null; }
    if (liveCircle) { map.removeLayer(liveCircle); liveCircle = null; }
    liveMarkerEl = null;
    const defaultIcon = L.divIcon({ className: 'custom-div-icon', html: '<i class="fas fa-map-marker-alt" style="color: #10b981; font-size: 40px; text-shadow: 0 0 3px white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));"></i>', iconSize: [40, 40], popupAnchor: [0, -20] });
    if (marker) marker.setIcon(defaultIcon);
    const btn = document.getElementById('getLocationBtn');
    if (btn) { btn.innerHTML = '<i class="fas fa-location-dot"></i> Gunakan Lokasi Saya'; btn.disabled = false; btn.classList.remove('btn-tracking'); btn.onclick = startLiveTracking; }
    showNotification('Tracking GPS dihentikan.', 'sukses');
}

// ==================== FORM STEPS ====================
function setupFormSteps() {
    const steps = document.querySelectorAll('.step'), formSteps = document.querySelectorAll('.form-step'), progressFill = document.querySelector('.progress-fill');
    function updateProgress(step) { const totalSteps = formSteps.length; if (progressFill) progressFill.style.width = `${(step/totalSteps)*100}%`; steps.forEach((s,i)=>{ if(i+1<step){ s.classList.add('completed'); s.classList.remove('active'); } else if(i+1===step){ s.classList.add('active'); s.classList.remove('completed'); } else { s.classList.remove('active','completed'); } }); formSteps.forEach((fs,i)=>{ if(i+1===step) fs.classList.add('active'); else fs.classList.remove('active'); }); }
    document.querySelectorAll('.btn-next').forEach(btn=>{ btn.addEventListener('click',()=>{ const nextStep = parseInt(btn.dataset.next); if(validateStep(currentStep)){ if(currentStep===2 && typeof stopLiveTracking === 'function') stopLiveTracking(); currentStep = nextStep; updateProgress(currentStep); document.querySelector('.form-card').scrollIntoView({ behavior:'smooth', block:'start' }); } }); });
    document.querySelectorAll('.btn-prev').forEach(btn=>{ btn.addEventListener('click',()=>{ const prevStep = parseInt(btn.dataset.prev); if(currentStep===2 && typeof stopLiveTracking === 'function') stopLiveTracking(); currentStep = prevStep; updateProgress(currentStep); document.querySelector('.form-card').scrollIntoView({ behavior:'smooth', block:'start' }); }); });
    function validateStep(step) {
        if(step===1){ if(!fotoInput.files[0]){ showNotification('📸 Harap unggah foto dokumentasi sampah terlebih dahulu', 'error'); return false; } return true; }
        if(step===2){ if(!selectedLat || !selectedLng){ showNotification('📍 Harap pilih lokasi kejadian pada peta terlebih dahulu', 'error'); return false; } if(!currentLocationValid){ showNotification('❌ Lokasi di luar wilayah layanan DLH!', 'error'); return false; } return true; }
        return true;
    }
}

function setupVolumeSelector() {
    const volumeOptions = document.querySelectorAll('.volume-option'), volumeInput = document.getElementById('volume');
    volumeOptions.forEach(option => { option.addEventListener('click', () => { volumeOptions.forEach(opt => opt.classList.remove('active')); option.classList.add('active'); volumeInput.value = option.dataset.volume; }); });
}

function resetFormToStep1() {
    if (typeof stopLiveTracking === 'function') stopLiveTracking();
    if (form) form.reset();
    const photoPreview = document.getElementById('photoPreview'); if(photoPreview){ photoPreview.innerHTML = ''; photoPreview.style.display = 'none'; }
    const placeholder = document.querySelector('.photo-placeholder'); if(placeholder) placeholder.style.display = 'block';
    selectedLat = null; selectedLng = null; currentLocationValid = false; currentKecamatan = null;
    const lokasiInput = document.getElementById('lokasi'); if(lokasiInput) lokasiInput.value = '';
    const validasiGroup = document.getElementById('validasiLokasiGroup'); if(validasiGroup) validasiGroup.style.display = 'none';
    document.querySelectorAll('.volume-option').forEach(opt => opt.classList.remove('active'));
    const volumeInput = document.getElementById('volume'); if(volumeInput) volumeInput.value = '';
    const kategoriSelect = document.getElementById('kategori'); if(kategoriSelect) kategoriSelect.value = '';
    const namaInput = document.getElementById('nama'); if(namaInput) namaInput.value = '';
    const kontakInput = document.getElementById('kontak'); if(kontakInput) kontakInput.value = '';
    if(deskripsiInput) { deskripsiInput.value = ''; if(charCount) { charCount.textContent = '0'; charCount.style.color = '#64748b'; } }
    const centerLat = (BATAS_WILAYAH.latMin + BATAS_WILAYAH.latMax)/2, centerLng = (BATAS_WILAYAH.lngMin + BATAS_WILAYAH.lngMax)/2;
    if(marker) marker.setLatLng([centerLat, centerLng]); if(map) map.setView([centerLat, centerLng], 13);
    currentStep = 1;
    const steps = document.querySelectorAll('.step'), formSteps = document.querySelectorAll('.form-step'), progressFill = document.querySelector('.progress-fill');
    if(progressFill) progressFill.style.width = '25%';
    steps.forEach((step,index)=>{ if(index===0){ step.classList.add('active'); step.classList.remove('completed'); } else { step.classList.remove('active','completed'); } });
    formSteps.forEach((fs,index)=>{ if(index===0) fs.classList.add('active'); else fs.classList.remove('active'); });
    document.querySelector('.form-card').scrollIntoView({ behavior:'smooth', block:'start' });
}

// ==================== SUBMIT LAPORAN ====================
async function compressAndConvertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = new Image();
            img.onload = function() {
                let w = img.width, h = img.height, MAX = 1200;
                if (w > MAX || h > MAX) { if (w > h) { h = Math.round(h * MAX / w); w = MAX; } else { w = Math.round(w * MAX / h); h = MAX; } }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
            img.src = ev.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function submitLaporan(e) {
    e.preventDefault();
    const foto = fotoInput ? fotoInput.files[0] : null;
    if (!foto) { showNotification('Harap unggah foto dokumentasi sampah', 'error'); return; }
    if (!selectedLat || !selectedLng) { showNotification('Harap pilih lokasi kejadian terlebih dahulu', 'error'); return; }
    if (!currentLocationValid) { showNotification('❌ Lokasi di luar wilayah layanan DLH!', 'error'); return; }
    const deskripsi = deskripsiInput ? deskripsiInput.value : '';
    if (!deskripsi) { showNotification('Harap isi deskripsi sampah', 'error'); return; }
    if (deskripsi.length > 500) { showNotification('Deskripsi maksimal 500 karakter', 'error'); return; }
    const volume = document.getElementById('volume')?.value || 'tidak diketahui';
    const kategori = document.getElementById('kategori')?.value || 'lainnya';
    const nama = document.getElementById('nama')?.value || 'Anonim';
    const kontak = document.getElementById('kontak')?.value || '-';
    const lokasi = document.getElementById('lokasi')?.value || '';
    const timestamp = new Date().toISOString();
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim ke DLH...'; }
    try {
        const params = new URLSearchParams({ action: 'submit', timestamp: timestamp, foto: '', lokasi: lokasi, latitude: String(selectedLat), longitude: String(selectedLng), kecamatan: currentKecamatan || '', deskripsi: deskripsi, nama: nama, kontak: kontak, kategori: kategori, volume: volume, status: 'belum diproses', sumber: 'Web DLH Bojonegoro' });
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunggah foto...';
        const fotoBase64 = await compressAndConvertToBase64(foto);
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'upload_foto', timestamp: timestamp, foto: fotoBase64 }) });
        showNotification(`✅ Laporan berhasil dikirim ke DLH Bojonegoro dari ${currentKecamatan}!`, 'sukses');
        resetFormToStep1();
        setTimeout(() => loadLaporan(), 2000);
    } catch (error) { console.error(error); showNotification('Gagal mengirim laporan. Periksa koneksi internet.', 'error'); }
    finally { if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<span>Kirim Laporan</span><i class="fas fa-paper-plane"></i>'; } }
}

// ==================== LOAD LAPORAN ====================
async function loadLaporan() {
    const laporanDiv = document.getElementById('laporanList');
    if (laporanDiv) laporanDiv.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Memuat data laporan dari server DLH...</p></div>';
    try {
        const response = await fetch(`${SCRIPT_URL}?action=get`);
        const data = await response.json();
        if (data && data.data && data.data.length > 0) {
            allLaporan = data.data.reverse();
            updateStats();
            renderLaporan(allLaporan);
            updateMapMarkers(allLaporan);
        } else {
            if (laporanDiv) laporanDiv.innerHTML = '<div class="loading-state"><i class="fas fa-inbox" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i><p>Belum ada laporan. Jadilah yang pertama!</p></div>';
            document.getElementById('heroTotalLaporan').textContent = '0';
            document.getElementById('heroSelesai').textContent = '0';
            document.getElementById('heroProses').textContent = '0';
        }
    } catch (error) {
        console.error(error);
        if (laporanDiv) laporanDiv.innerHTML = '<div class="loading-state"><i class="fas fa-wifi" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i><p>Gagal memuat data. Periksa koneksi internet.</p></div>';
    }
}

function updateStats() {
    document.getElementById('heroTotalLaporan').textContent = allLaporan.length;
    document.getElementById('heroSelesai').textContent = allLaporan.filter(l => l.status === 'selesai').length;
    document.getElementById('heroProses').textContent = allLaporan.filter(l => l.status === 'proses').length;
}

function renderLaporan(laporan) {
    const laporanDiv = document.getElementById('laporanList');
    if (!laporanDiv) return;
    if (laporan.length === 0) { laporanDiv.innerHTML = '<div class="loading-state"><i class="fas fa-search" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i><p>Tidak ada laporan yang sesuai dengan filter</p></div>'; return; }
    laporanDiv.innerHTML = laporan.map((l, index) => {
        const statusClass = l.status === 'selesai' ? 'selesai' : (l.status === 'proses' ? 'proses' : 'belum');
        return `<div class="laporan-card" data-aos="fade-up" data-aos-delay="${Math.min(index*50,500)}"><div class="laporan-header"><div class="laporan-user"><i class="fas fa-user-circle"></i><strong>${escapeHtml(l.nama || 'Anonim')}</strong></div><span class="laporan-status status-${statusClass}">${l.status === 'belum diproses' ? '⏳ Menunggu Verifikasi' : (l.status === 'proses' ? '🔄 Sedang Diproses DLH' : '✅ Selesai')}</span></div><div class="laporan-body"><div class="laporan-lokasi"><i class="fas fa-map-marker-alt"></i><span>📍 ${escapeHtml(l.lokasi || 'Lokasi tidak tersedia')}</span></div><div>${l.kecamatan ? `<span class="laporan-badge"><i class="fas fa-building"></i> ${escapeHtml(l.kecamatan)}</span>` : ''}${l.kategori && l.kategori!=='lainnya' ? `<span class="laporan-badge">${KATEGORI_ICON_MAP[l.kategori]?.emoji || '📦'} ${getKategoriText(l.kategori)}</span>` : ''}${l.volume && l.volume!=='tidak diketahui' ? `<span class="laporan-badge"><i class="fas fa-truck"></i> ${getVolumeText(l.volume)}</span>` : ''}</div><div class="laporan-deskripsi">📝 ${escapeHtml(l.deskripsi || 'Tidak ada deskripsi')}</div>${l.foto ? `<div class="laporan-foto" onclick="window.openImageModal('${l.foto.replace(/'/g, "\\'")}')"><img src="${l.foto}" alt="Dokumentasi sampah" loading="lazy" onerror="this.style.display='none'"></div>` : ''}</div><div class="laporan-footer"><span><i class="far fa-calendar-alt"></i> ${l.timestamp ? new Date(l.timestamp).toLocaleDateString('id-ID') : '-'}</span><span><i class="far fa-clock"></i> ${l.timestamp ? new Date(l.timestamp).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '-'}</span><span><i class="fas fa-building"></i> DLH Bojonegoro</span></div></div>`;
    }).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();
}

window.openImageModal = function(imageSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;cursor:pointer;animation:fadeIn 0.3s ease;';
    modal.innerHTML = `<img src="${imageSrc}" style="max-width:90%;max-height:90%;object-fit:contain;border-radius:16px;"><button style="position:absolute;top:20px;right:20px;background:white;border:none;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:20px;"><i class="fas fa-times"></i></button>`;
    modal.onclick = () => modal.remove();
    const closeBtn = modal.querySelector('button');
    if (closeBtn) closeBtn.onclick = (e) => { e.stopPropagation(); modal.remove(); };
    document.body.appendChild(modal);
};

function filterLaporan() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = filterStatus ? filterStatus.value : 'all';
    const kecamatanFilter = filterKecamatan ? filterKecamatan.value : 'all';
    const kategoriFilter = filterKategori ? filterKategori.value : 'all';
    const filtered = allLaporan.filter(l => {
        return ((l.deskripsi || '').toLowerCase().includes(searchTerm) || (l.lokasi || '').toLowerCase().includes(searchTerm) || (l.nama || '').toLowerCase().includes(searchTerm)) &&
        (statusFilter === 'all' || l.status === statusFilter) && (kecamatanFilter === 'all' || (l.kecamatan || '').includes(kecamatanFilter)) && (kategoriFilter === 'all' || l.kategori === kategoriFilter);
    });
    renderLaporan(filtered);
}

// ==================== UPDATE MAP MARKERS ====================
function updateMapMarkers(laporan) {
    if (!map) return;
    map.eachLayer(layer => { if (layer instanceof L.Marker && layer !== marker && layer !== userLocationMarker) map.removeLayer(layer); if (layer instanceof L.Circle && layer !== userLocationCircle) map.removeLayer(layer); });
    if (wilayahPolygons.length === 0) drawWilayahPolygons();
    laporan.forEach(l => {
        if (!l.latitude || !l.longitude) return;
        const lat = parseFloat(l.latitude), lng = parseFloat(l.longitude), kategori = l.kategori || 'lainnya', status = l.status || 'belum diproses';
        L.marker([lat, lng], { icon: getKategoriMarkerIcon(kategori, status) }).addTo(map).bindPopup(`<div style="min-width:230px;padding:4px;font-family:inherit;"><div style="font-size:15px;font-weight:700;margin-bottom:6px;">${KATEGORI_ICON_MAP[kategori]?.emoji || '📦'} ${escapeHtml(getKategoriText(kategori))}</div><div style="margin-bottom:4px;"><i class="fas fa-user" style="color:#10b981;width:14px;"></i> <b>${escapeHtml(l.nama || 'Anonim')}</b></div>${l.kecamatan ? `<div style="margin-bottom:4px;"><i class="fas fa-map-pin" style="color:#10b981;width:14px;"></i> ${escapeHtml(l.kecamatan)}</div>` : ''}<div style="margin-bottom:6px;color:#475569;font-size:12px;">${escapeHtml((l.deskripsi || '').substring(0,90))}${(l.deskripsi||'').length>90?'…':''}</div><div style="margin-bottom:6px;color:${getStatusColor(status)};">${status==='belum diproses'?'⏳ Menunggu Verifikasi':(status==='proses'?'🔄 Sedang Diproses':'✅ Selesai')}</div><hr style="margin:6px 0;border-color:#e2e8f0;"><div style="font-size:11px;color:#94a3b8;"><i class="far fa-calendar-alt"></i> ${l.timestamp ? new Date(l.timestamp).toLocaleDateString('id-ID') : '—'}</div><a href="#daftar" style="display:block;margin-top:8px;color:#10b981;text-decoration:none;font-weight:600;font-size:12px;"><i class="fas fa-eye"></i> Lihat daftar laporan</a></div>`);
    });
    startUserLocationOnMap();
}

function startUserLocationOnMap() {
    if (!navigator.geolocation || !map) return;
    if (userLocationWatchId !== null) navigator.geolocation.clearWatch(userLocationWatchId);
    userLocationWatchId = navigator.geolocation.watchPosition((pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude, acc = pos.coords.accuracy;
        if (userLocationMarker) { userLocationMarker.setLatLng([lat, lng]); userLocationCircle.setLatLng([lat, lng]); userLocationCircle.setRadius(acc); }
        else {
            const pulseIcon = L.divIcon({ className: '', html: `<div style="position:relative;width:20px;height:20px;"><div style="position:absolute;inset:0;border-radius:50%;background:#3b82f633;border:2px solid #3b82f6;animation:userPulse 1.8s ease-out infinite;"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:10px;height:10px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 0 6px #3b82f6aa;"></div></div>`, iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -12] });
            userLocationMarker = L.marker([lat, lng], { icon: pulseIcon, zIndexOffset: 1000 }).addTo(map).bindPopup('<b><i class="fas fa-location-dot" style="color:#3b82f6"></i> Lokasi Anda</b><br><small>Real-time GPS</small>');
            userLocationCircle = L.circle([lat, lng], { radius: acc, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.07, weight: 1, dashArray: '4 4' }).addTo(map);
            if (!document.getElementById('userPulseStyle')) { const style = document.createElement('style'); style.id = 'userPulseStyle'; style.textContent = '@keyframes userPulse { 0% { transform:scale(1); opacity:.8; } 70% { transform:scale(2.8); opacity:0; } 100% { transform:scale(1); opacity:0; } }'; document.head.appendChild(style); }
        }
    }, () => {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    document.getElementById('getLocationBtn')?.addEventListener('click', startLiveTracking);
    fotoInput?.addEventListener('change', previewFoto);
    form?.addEventListener('submit', submitLaporan);
    deskripsiInput?.addEventListener('input', updateCharCount);
    searchInput?.addEventListener('input', filterLaporan);
    filterStatus?.addEventListener('change', filterLaporan);
    filterKecamatan?.addEventListener('change', filterLaporan);
    filterKategori?.addEventListener('change', filterLaporan);
    scrollTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    navToggle?.addEventListener('click', () => navLinks?.classList.toggle('active'));
    if (searchInput && searchClear) {
        searchInput.addEventListener('input', () => { searchClear.style.display = searchInput.value ? 'flex' : 'none'; });
        searchClear.addEventListener('click', () => { if(searchInput) searchInput.value = ''; filterLaporan(); searchClear.style.display = 'none'; });
    }
    document.querySelectorAll('.nav-link').forEach(link => { link.addEventListener('click', () => navLinks?.classList.remove('active')); });
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section'), scrollPos = window.scrollY + 100;
        sections.forEach(section => { const sectionTop = section.offsetTop, sectionBottom = sectionTop + section.offsetHeight, sectionId = section.getAttribute('id'); if(scrollPos >= sectionTop && scrollPos < sectionBottom && sectionId){ document.querySelectorAll('.nav-link').forEach(link => { link.classList.remove('active'); if(link.getAttribute('href') === `#${sectionId}`) link.classList.add('active'); }); } });
    });
}

function setupScrollEffect() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) scrollTopBtn?.classList.add('show'); else scrollTopBtn?.classList.remove('show');
        if (window.scrollY > 50) navbar?.classList.add('scrolled'); else navbar?.classList.remove('scrolled');
    });
}

function updateCharCount() { if(deskripsiInput && charCount){ charCount.textContent = deskripsiInput.value.length; charCount.style.color = deskripsiInput.value.length > 500 ? '#ef4444' : '#64748b'; } }

function previewFoto(e) { const file = e.target.files[0]; if(file){ if(file.size > 5*1024*1024){ showNotification('Ukuran foto maksimal 5MB','error'); if(fotoInput) fotoInput.value = ''; return; } const reader = new FileReader(); reader.onload = function(e){ const preview = document.getElementById('photoPreview'); if(preview){ preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`; preview.style.display = 'block'; const placeholder = document.querySelector('.photo-placeholder'); if(placeholder) placeholder.style.display = 'none'; } }; reader.readAsDataURL(file); } }

function showNotification(message, type) { const oldNotif = document.querySelector('.notifikasi'); if(oldNotif) oldNotif.remove(); const notif = document.createElement('div'); notif.className = `notifikasi ${type}`; notif.innerHTML = `<i class="fas ${type==='sukses'?'fa-check-circle':'fa-exclamation-circle'}"></i> ${escapeHtml(message)}`; document.body.appendChild(notif); setTimeout(() => { notif.style.animation = 'slideOut 0.3s ease'; setTimeout(() => notif.remove(), 300); }, 4000); }

// Add CSS animation for particles
const style = document.createElement('style');
style.textContent = `@keyframes float { 0%,100% { transform: translateY(0px) translateX(0px); } 25% { transform: translateY(-20px) translateX(10px); } 50% { transform: translateY(10px) translateX(-5px); } 75% { transform: translateY(-5px) translateX(15px); } }`;
document.head.appendChild(style);

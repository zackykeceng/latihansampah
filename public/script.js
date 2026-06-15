// Konfigurasi - GANTI DENGAN URL DEPLOY APPS SCRIPT ANDA
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyHybRNekPXZSR8Cf-q1JmrcbW216umM4xrbaiFuHnSuOWZhx2qhqWgqkoSHOKBQET6/exec';

// ==================== POLIGON WILAYAH ====================
const WILAYAH = {
    ngambon: {
        name: 'Kecamatan Ngambon',
        center: [-7.2853, 111.7198],
        polygons: [[
            [-7.2480, 111.6880], [-7.2495, 111.6960], [-7.2515, 111.7040],
            [-7.2540, 111.7110], [-7.2568, 111.7175], [-7.2600, 111.7240],
            [-7.2630, 111.7305], [-7.2660, 111.7368], [-7.2705, 111.7420],
            [-7.2760, 111.7460], [-7.2820, 111.7478], [-7.2880, 111.7465],
            [-7.2935, 111.7430], [-7.2978, 111.7378], [-7.3010, 111.7310],
            [-7.3055, 111.7240], [-7.3068, 111.7163], [-7.3060, 111.7083],
            [-7.3040, 111.7005], [-7.3010, 111.6935], [-7.2968, 111.6875],
            [-7.2920, 111.6828], [-7.2865, 111.6793], [-7.2803, 111.6775],
            [-7.2738, 111.6778], [-7.2675, 111.6793], [-7.2618, 111.6813],
            [-7.2565, 111.6833], [-7.2525, 111.6850], [-7.2495, 111.6862],
            [-7.2480, 111.6880]
        ]],
        villages: ['Ngambon', 'Bondol', 'Karangmangu', 'Nglampin', 'Sengon']
    },
    tambakrejo: {
        name: 'Kecamatan Tambakrejo',
        center: [-7.2645, 111.6198],
        polygons: [[
            [-7.2130, 111.5840], [-7.2160, 111.5930], [-7.2200, 111.6025],
            [-7.2240, 111.6115], [-7.2278, 111.6200], [-7.2315, 111.6285],
            [-7.2348, 111.6365], [-7.2370, 111.6460], [-7.2390, 111.6560],
            [-7.2405, 111.6660], [-7.2415, 111.6760], [-7.2420, 111.6870],
            [-7.2430, 111.6940], [-7.2480, 111.6880], [-7.2495, 111.6862],
            [-7.2525, 111.6850], [-7.2565, 111.6833], [-7.2618, 111.6813],
            [-7.2675, 111.6793], [-7.2720, 111.6760], [-7.2760, 111.6720],
            [-7.2800, 111.6670], [-7.2838, 111.6600], [-7.2865, 111.6515],
            [-7.2883, 111.6420], [-7.2898, 111.6325], [-7.2903, 111.6225],
            [-7.2890, 111.6130], [-7.2868, 111.6042], [-7.2835, 111.5968],
            [-7.2795, 111.5910], [-7.2745, 111.5868], [-7.2690, 111.5838],
            [-7.2630, 111.5822], [-7.2567, 111.5818], [-7.2500, 111.5822],
            [-7.2430, 111.5825], [-7.2360, 111.5823], [-7.2290, 111.5820],
            [-7.2217, 111.5825], [-7.2165, 111.5832], [-7.2130, 111.5840]
        ]],
        villages: ['Tambakrejo', 'Sukorejo', 'Sendangrejo', 'Pengkol', 'Ngrancang', 'Napis', 'Mulyorejo', 'Malingmati', 'Kalisumber', 'Tanjung', 'Dolokgede', 'Gading', 'Gamongan', 'Jatimulyo', 'Jawik', 'Kacangan', 'Bakalan', 'Turi']
    }
};

const BATAS_WILAYAH = { latMin: -7.3090, latMax: -7.2100, lngMin: 111.5790, lngMax: 111.7520 };

// ==================== GLOBAL VARIABLES ====================
let map, marker, selectedLat = null, selectedLng = null, currentLocationValid = false, currentKecamatan = null;
let allLaporan = [], wilayahPolygons = [], currentStep = 1, autoRefreshInterval = null;
let liveWatchId = null, liveCircle = null, liveMarkerEl = null, userLocationMarker = null, userLocationCircle = null, userLocationWatchId = null;

// DOM Elements
const scrollTopBtn = document.getElementById('scrollTopBtn');
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const form = document.getElementById('formLaporan');
const submitBtn = document.getElementById('submitBtn');
const fotoInput = document.getElementById('foto');
const deskripsiInput = document.getElementById('deskripsi');
const charCount = document.getElementById('charCount');
const searchInput = document.getElementById('searchLaporan');
const filterStatus = document.getElementById('filterStatus');
const filterKecamatan = document.getElementById('filterKecamatan');
const filterKategori = document.getElementById('filterKategori');
const searchClear = document.getElementById('searchClear');

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
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => loadLaporan(), 30000);
});

function initCustomCursor() {
    const cursorDot = document.getElementById('cursorDot');
    const cursorOutline = document.getElementById('cursorOutline');
    if (!cursorDot || !cursorOutline) return;
    document.addEventListener('mousemove', (e) => {
        cursorDot.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 3}px)`;
        cursorOutline.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
    });
    document.querySelectorAll('a, button, .nav-link, .btn-primary, .btn-secondary, .volume-option, .step').forEach(el => {
        el.addEventListener('mouseenter', () => { cursorDot.classList.add('hover'); cursorOutline.classList.add('hover'); });
        el.addEventListener('mouseleave', () => { cursorDot.classList.remove('hover'); cursorOutline.classList.remove('hover'); });
    });
}

function initParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `position:absolute; width:${Math.random() * 4 + 2}px; height:${Math.random() * 4 + 2}px; background:rgba(16,185,129,${Math.random() * 0.3 + 0.1}); border-radius:50%; left:${Math.random() * 100}%; top:${Math.random() * 100}%; animation:float ${Math.random() * 10 + 5}s ease-in-out infinite; animation-delay:${Math.random() * 5}s; pointer-events:none;`;
        container.appendChild(p);
    }
}

function initMap() {
    const centerLat = (BATAS_WILAYAH.latMin + BATAS_WILAYAH.latMax) / 2;
    const centerLng = (BATAS_WILAYAH.lngMin + BATAS_WILAYAH.lngMax) / 2;
    map = L.map('map').setView([centerLat, centerLng], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM & CartoDB | DLH Bojonegoro',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    drawWilayahPolygons();
    const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: '<i class="fas fa-map-marker-alt" style="color: #10b981; font-size: 40px; text-shadow: 0 0 3px white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));"></i>',
        iconSize: [40, 40],
        popupAnchor: [0, -20]
    });
    marker = L.marker([centerLat, centerLng], { draggable: true, icon: customIcon }).addTo(map);
    marker.on('dragend', (e) => updateSelectedLocation(e.target.getLatLng().lat, e.target.getLatLng().lng));
    map.on('click', (e) => updateSelectedLocation(e.latlng.lat, e.latlng.lng));
}

function drawWilayahPolygons() {
    const style = { color: '#10b981', weight: 3, opacity: 0.9, fillColor: '#10b981', fillOpacity: 0.15 };
    WILAYAH.ngambon.polygons.forEach(coords => {
        const p = L.polygon(coords, style).addTo(map);
        p.bindPopup(`<strong>🏘️ Kecamatan Ngambon</strong><br>Desa: ${WILAYAH.ngambon.villages.join(', ')}`);
        wilayahPolygons.push(p);
    });
    WILAYAH.tambakrejo.polygons.forEach(coords => {
        const p = L.polygon(coords, style).addTo(map);
        p.bindPopup(`<strong>🏘️ Kecamatan Tambakrejo</strong><br>Desa: ${WILAYAH.tambakrejo.villages.join(', ')}`);
        wilayahPolygons.push(p);
    });
}

function isPointInPolygon(lat, lng, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const intersect = ((yi > lng) != (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function validateLocation(lat, lng) {
    if (lat < BATAS_WILAYAH.latMin || lat > BATAS_WILAYAH.latMax || lng < BATAS_WILAYAH.lngMin || lng > BATAS_WILAYAH.lngMax)
        return { valid: false, kecamatan: null };
    for (const poly of WILAYAH.ngambon.polygons)
        if (isPointInPolygon(lat, lng, poly)) return { valid: true, kecamatan: 'Kecamatan Ngambon' };
    for (const poly of WILAYAH.tambakrejo.polygons)
        if (isPointInPolygon(lat, lng, poly)) return { valid: true, kecamatan: 'Kecamatan Tambakrejo' };
    return { valid: false, kecamatan: null };
}

function updateSelectedLocation(lat, lng) {
    selectedLat = lat;
    selectedLng = lng;
    marker.setLatLng([lat, lng]);
    const validasi = validateLocation(lat, lng);
    currentLocationValid = validasi.valid;
    currentKecamatan = validasi.kecamatan;
    const lokasiInput = document.getElementById('lokasi');
    if (lokasiInput) lokasiInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const validasiGroup = document.getElementById('validasiLokasiGroup');
    const locationStatus = document.getElementById('locationStatus');
    if (validasiGroup && locationStatus) {
        validasiGroup.style.display = 'block';
        if (validasi.valid) {
            locationStatus.className = 'location-status valid';
            locationStatus.innerHTML = `<i class="fas fa-check-circle"></i> ✅ Lokasi valid di ${validasi.kecamatan}`;
            let hidden = document.getElementById('kecamatanOtomatis');
            if (!hidden) {
                hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.id = 'kecamatanOtomatis';
                document.getElementById('formLaporan').appendChild(hidden);
            }
            hidden.value = validasi.kecamatan;
        } else {
            locationStatus.className = 'location-status invalid';
            locationStatus.innerHTML = `<i class="fas fa-times-circle"></i> ❌ Lokasi di luar wilayah layanan DLH!`;
        }
    }
}

function startLiveTracking() {
    if (!navigator.geolocation) { showNotification('Browser tidak mendukung geolokasi', 'error'); return; }
    const btn = document.getElementById('getLocationBtn');
    if (btn) { btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Mencari GPS...'; btn.disabled = true; }
    if (liveWatchId !== null) navigator.geolocation.clearWatch(liveWatchId);
    const locationStatus = document.getElementById('locationStatus');
    if (locationStatus) locationStatus.innerHTML = '<i class="fas fa-satellite-dish fa-pulse"></i> Menghubungi satelit GPS...';
    let firstFix = true;
    liveWatchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude, lng = pos.coords.longitude, acc = pos.coords.accuracy;
            updateSelectedLocation(lat, lng);
            if (firstFix) { map.flyTo([lat, lng], 16, { duration: 1.5 }); firstFix = false; }
            else map.setView([lat, lng], map.getZoom());
            if (liveCircle) { liveCircle.setLatLng([lat, lng]); liveCircle.setRadius(acc); }
            else liveCircle = L.circle([lat, lng], { radius: acc, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 2, dashArray: '6 4' }).addTo(map);
            if (!liveMarkerEl) {
                const liveIcon = L.divIcon({ className: 'live-gps-icon', html: `<div class="gps-pulse-ring"></div><div class="gps-dot"><i class="fas fa-location-crosshairs"></i></div>`, iconSize: [36, 36], iconAnchor: [18, 18] });
                if (marker) marker.setIcon(liveIcon);
                liveMarkerEl = true;
            }
            if (btn) { btn.innerHTML = '<i class="fas fa-stop-circle"></i> Hentikan Tracking'; btn.disabled = false; btn.onclick = stopLiveTracking; }
        },
        (error) => {
            stopLiveTracking();
            showNotification('Gagal mendapatkan lokasi', 'error');
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
}

function stopLiveTracking() {
    if (liveWatchId !== null) { navigator.geolocation.clearWatch(liveWatchId); liveWatchId = null; }
    if (liveCircle) { map.removeLayer(liveCircle); liveCircle = null; }
    liveMarkerEl = null;
    const defaultIcon = L.divIcon({
        className: 'custom-div-icon',
        html: '<i class="fas fa-map-marker-alt" style="color: #10b981; font-size: 40px;"></i>',
        iconSize: [40, 40],
        popupAnchor: [0, -20]
    });
    if (marker) marker.setIcon(defaultIcon);
    const btn = document.getElementById('getLocationBtn');
    if (btn) { btn.innerHTML = '<i class="fas fa-location-dot"></i> Gunakan Lokasi Saya'; btn.disabled = false; btn.onclick = startLiveTracking; }
}

function getCurrentLocation() { startLiveTracking(); }

function setupFormSteps() {
    const steps = document.querySelectorAll('.step');
    const formSteps = document.querySelectorAll('.form-step');
    const progressFill = document.querySelector('.progress-fill');
    function updateProgress(step) {
        const total = formSteps.length;
        if (progressFill) progressFill.style.width = `${(step / total) * 100}%`;
        steps.forEach((s, i) => {
            if (i + 1 < step) { s.classList.add('completed'); s.classList.remove('active'); }
            else if (i + 1 === step) { s.classList.add('active'); s.classList.remove('completed'); }
            else { s.classList.remove('active', 'completed'); }
        });
        formSteps.forEach((fs, i) => { if (i + 1 === step) fs.classList.add('active'); else fs.classList.remove('active'); });
    }
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            const next = parseInt(btn.dataset.next);
            if (validateStep(currentStep)) {
                if (currentStep === 2 && typeof stopLiveTracking === 'function') stopLiveTracking();
                currentStep = next;
                updateProgress(currentStep);
                document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            const prev = parseInt(btn.dataset.prev);
            if (currentStep === 2 && typeof stopLiveTracking === 'function') stopLiveTracking();
            currentStep = prev;
            updateProgress(currentStep);
            document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    function validateStep(step) {
        if (step === 1 && (!fotoInput?.files?.[0])) { showNotification('📸 Harap unggah foto dokumentasi', 'error'); return false; }
        if (step === 2 && (!selectedLat || !selectedLng)) { showNotification('📍 Harap pilih lokasi di peta', 'error'); return false; }
        if (step === 2 && !currentLocationValid) { showNotification('❌ Lokasi di luar wilayah layanan DLH!', 'error'); return false; }
        return true;
    }
}

function setupVolumeSelector() {
    const options = document.querySelectorAll('.volume-option');
    const volumeInput = document.getElementById('volume');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            if (volumeInput) volumeInput.value = opt.dataset.volume;
        });
    });
}

function resetFormToStep1() {
    if (typeof stopLiveTracking === 'function') stopLiveTracking();
    if (form) form.reset();
    const preview = document.getElementById('photoPreview');
    if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
    const placeholder = document.querySelector('.photo-placeholder');
    if (placeholder) placeholder.style.display = 'block';
    selectedLat = null; selectedLng = null; currentLocationValid = false; currentKecamatan = null;
    const lokasiInput = document.getElementById('lokasi');
    if (lokasiInput) lokasiInput.value = '';
    const validasiGroup = document.getElementById('validasiLokasiGroup');
    if (validasiGroup) validasiGroup.style.display = 'none';
    document.querySelectorAll('.volume-option').forEach(opt => opt.classList.remove('active'));
    const volumeInput = document.getElementById('volume');
    if (volumeInput) volumeInput.value = '';
    document.getElementById('kategori') ? document.getElementById('kategori').value = '' : null;
    document.getElementById('nama') ? document.getElementById('nama').value = '' : null;
    document.getElementById('kontak') ? document.getElementById('kontak').value = '' : null;
    if (deskripsiInput) { deskripsiInput.value = ''; if (charCount) { charCount.textContent = '0'; charCount.style.color = '#64748b'; } }
    const centerLat = (BATAS_WILAYAH.latMin + BATAS_WILAYAH.latMax) / 2;
    const centerLng = (BATAS_WILAYAH.lngMin + BATAS_WILAYAH.lngMax) / 2;
    if (marker) marker.setLatLng([centerLat, centerLng]);
    if (map) map.setView([centerLat, centerLng], 13);
    currentStep = 1;
    const steps = document.querySelectorAll('.step');
    const formSteps = document.querySelectorAll('.form-step');
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) progressFill.style.width = '25%';
    steps.forEach((s, i) => { if (i === 0) { s.classList.add('active'); s.classList.remove('completed'); } else { s.classList.remove('active', 'completed'); } });
    formSteps.forEach((fs, i) => { if (i === 0) fs.classList.add('active'); else fs.classList.remove('active'); });
    document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function compressAndConvertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const MAX = 1200;
                let w = img.width, h = img.height;
                if (w > MAX || h > MAX) {
                    if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                    else { w = Math.round(w * MAX / h); h = MAX; }
                }
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
    const foto = fotoInput?.files?.[0];
    if (!foto) { showNotification('Harap unggah foto dokumentasi', 'error'); return; }
    if (!selectedLat || !selectedLng) { showNotification('Harap pilih lokasi kejadian', 'error'); return; }
    if (!currentLocationValid) { showNotification('❌ Lokasi di luar wilayah layanan DLH!', 'error'); return; }
    if (!deskripsiInput?.value) { showNotification('Harap isi deskripsi sampah', 'error'); return; }
    if (deskripsiInput.value.length > 500) { showNotification('Deskripsi maksimal 500 karakter', 'error'); return; }

    const volume = document.getElementById('volume')?.value || 'tidak diketahui';
    const kategori = document.getElementById('kategori')?.value || 'lainnya';
    const nama = document.getElementById('nama')?.value || 'Anonim';
    const kontak = document.getElementById('kontak')?.value || '-';
    const lokasi = document.getElementById('lokasi')?.value || '';
    const timestamp = new Date().toISOString();

    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...'; }

    try {
        const fotoBase64 = await compressAndConvertToBase64(foto);
        
        const formData = new URLSearchParams();
        formData.append('action', 'submit');
        formData.append('timestamp', timestamp);
        formData.append('foto', fotoBase64);
        formData.append('lokasi', lokasi);
        formData.append('latitude', String(selectedLat));
        formData.append('longitude', String(selectedLng));
        formData.append('kecamatan', currentKecamatan || '');
        formData.append('deskripsi', deskripsiInput.value);
        formData.append('nama', nama);
        formData.append('kontak', kontak);
        formData.append('kategori', kategori);
        formData.append('volume', volume);
        formData.append('status', 'belum diproses');
        formData.append('sumber', 'Web DLH Bojonegoro');

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        const result = await response.json();
        console.log('Response:', result);

        if (result.success) {
            if (result.fotoUrl && result.fotoUrl !== '') {
                showNotification('✅ Laporan berhasil dikirim! Foto tersimpan di Google Drive.', 'sukses');
            } else {
                showNotification('⚠️ Laporan tersimpan tapi foto gagal diupload.', 'error');
            }
            resetFormToStep1();
            setTimeout(() => loadLaporan(), 2000);
        } else {
            showNotification(`❌ Gagal: ${result.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Gagal mengirim laporan. Periksa koneksi internet.', 'error');
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<span>Kirim Laporan</span><i class="fas fa-paper-plane"></i>'; }
    }
}

async function loadLaporan() {
    const laporanDiv = document.getElementById('laporanList');
    if (laporanDiv) laporanDiv.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Memuat data...</p></div>';
    try {
        const response = await fetch(`${SCRIPT_URL}?action=get`);
        const data = await response.json();
        if (data?.data?.length > 0) {
            allLaporan = data.data.reverse();
            updateStats();
            renderLaporan(allLaporan);
            updateMapMarkers(allLaporan);
        } else {
            if (laporanDiv) laporanDiv.innerHTML = '<div class="loading-state"><i class="fas fa-inbox" style="font-size:3rem;color:#94a3b8"></i><p>Belum ada laporan</p></div>';
        }
    } catch (error) {
        console.error('Error:', error);
        if (laporanDiv) laporanDiv.innerHTML = '<div class="loading-state"><i class="fas fa-wifi" style="font-size:3rem;color:#ef4444"></i><p>Gagal memuat data</p></div>';
    }
}

function updateStats() {
    const total = allLaporan.length;
    const selesai = allLaporan.filter(l => l.status === 'selesai').length;
    const proses = allLaporan.filter(l => l.status === 'proses').length;
    const heroTotal = document.getElementById('heroTotalLaporan');
    const heroSelesai = document.getElementById('heroSelesai');
    const heroProses = document.getElementById('heroProses');
    if (heroTotal) heroTotal.textContent = total;
    if (heroSelesai) heroSelesai.textContent = selesai;
    if (heroProses) heroProses.textContent = proses;
}

function getDriveImgUrl(input) {
    if (!input) return '';
    if (input.includes('lh3.googleusercontent.com')) return input;
    let fileId = '';
    const patterns = [/[?&]id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/, /\/file\/d\/([a-zA-Z0-9_-]+)/];
    for (const re of patterns) {
        const match = input.match(re);
        if (match) { fileId = match[1]; break; }
    }
    if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    return input;
}

function renderLaporan(laporan) {
    const laporanDiv = document.getElementById('laporanList');
    if (!laporanDiv) return;
    if (laporan.length === 0) {
        laporanDiv.innerHTML = '<div class="loading-state"><i class="fas fa-search" style="font-size:3rem;color:#94a3b8"></i><p>Tidak ada laporan</p></div>';
        return;
    }
    laporanDiv.innerHTML = laporan.map((item, idx) => {
        const statusClass = item.status === 'selesai' ? 'selesai' : (item.status === 'proses' ? 'proses' : 'belum');
        const fotoUrl = item.foto ? getDriveImgUrl(item.foto) : '';
        return `
        <div class="laporan-card" data-aos="fade-up" data-aos-delay="${Math.min(idx * 50, 500)}">
            <div class="laporan-header">
                <div class="laporan-user"><i class="fas fa-user-circle"></i><strong>${escapeHtml(item.nama || 'Anonim')}</strong></div>
                <span class="laporan-status status-${statusClass}">${item.status === 'belum diproses' ? '⏳ Menunggu' : (item.status === 'proses' ? '🔄 Diproses' : '✅ Selesai')}</span>
            </div>
            <div class="laporan-body">
                <div class="laporan-lokasi"><i class="fas fa-map-marker-alt"></i><span>📍 ${escapeHtml(item.lokasi || 'Tidak tersedia')}</span></div>
                <div>${item.kecamatan ? `<span class="laporan-badge"><i class="fas fa-building"></i> ${escapeHtml(item.kecamatan)}</span>` : ''}</div>
                <div class="laporan-deskripsi">📝 ${escapeHtml(item.deskripsi || 'Tidak ada deskripsi')}</div>
                ${fotoUrl ? `<div class="laporan-foto" onclick="window.openImageModal('${fotoUrl.replace(/'/g, "\\'")}')"><img src="${fotoUrl}" alt="Dokumentasi" loading="lazy" onerror="this.style.display='none'"></div>` : ''}
            </div>
            <div class="laporan-footer">
                <span><i class="far fa-calendar-alt"></i> ${item.timestamp ? new Date(item.timestamp).toLocaleDateString('id-ID') : '-'}</span>
                <span><i class="fas fa-building"></i> DLH Bojonegoro</span>
            </div>
        </div>`;
    }).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();
}

window.openImageModal = function(src) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;cursor:pointer';
    modal.innerHTML = `<img src="${src}" style="max-width:90%;max-height:90%;object-fit:contain;border-radius:16px;"><button style="position:absolute;top:20px;right:20px;background:white;border:none;width:40px;height:40px;border-radius:50%;cursor:pointer"><i class="fas fa-times"></i></button>`;
    modal.onclick = () => modal.remove();
    modal.querySelector('button').onclick = (e) => { e.stopPropagation(); modal.remove(); };
    document.body.appendChild(modal);
};

function filterLaporan() {
    const search = searchInput?.value.toLowerCase() || '';
    const status = filterStatus?.value || 'all';
    const kecamatan = filterKecamatan?.value || 'all';
    const kategori = filterKategori?.value || 'all';
    const filtered = allLaporan.filter(l => {
        const matchSearch = (l.deskripsi || '').toLowerCase().includes(search) || (l.lokasi || '').toLowerCase().includes(search) || (l.nama || '').toLowerCase().includes(search);
        const matchStatus = status === 'all' || l.status === status;
        const matchKecamatan = kecamatan === 'all' || (l.kecamatan || '').includes(kecamatan);
        const matchKategori = kategori === 'all' || l.kategori === kategori;
        return matchSearch && matchStatus && matchKecamatan && matchKategori;
    });
    renderLaporan(filtered);
}

function getKategoriIcon(k) {
    const icons = { 'rumah-tangga': '🏠', 'plastik': '🪣', 'bangunan': '🏗️', 'b3': '⚠️', 'medis': '🏥', 'limbah-pabrik': '🏭' };
    return icons[k] || '📦';
}

function getKategoriText(k) {
    const texts = { 'rumah-tangga': 'Sampah Rumah Tangga', 'plastik': 'Sampah Plastik', 'bangunan': 'Sampah Bangunan', 'b3': 'Sampah B3', 'medis': 'Sampah Medis', 'limbah-pabrik': 'Limbah Pabrik' };
    return texts[k] || 'Lainnya';
}

function getVolumeText(v) {
    const texts = { 'kecil': 'Volume Kecil (≤ 1 pick up)', 'sedang': 'Volume Sedang (1-3 pick up)', 'besar': 'Volume Besar (≥ 3 pick up)' };
    return texts[v] || v;
}

function getStatusColor(status) {
    if (status === 'selesai') return '#10b981';
    if (status === 'proses') return '#3b82f6';
    return '#f59e0b';
}

function updateMapMarkers(laporan) {
    if (!map) return;
    map.eachLayer(layer => {
        if (layer instanceof L.Marker && layer !== marker && layer !== userLocationMarker) map.removeLayer(layer);
        if (layer instanceof L.Circle && layer !== userLocationCircle) map.removeLayer(layer);
    });
    if (wilayahPolygons.length === 0) drawWilayahPolygons();
    
    laporan.forEach(l => {
        if (!l.latitude || !l.longitude) return;
        const lat = parseFloat(l.latitude);
        const lng = parseFloat(l.longitude);
        const meta = { 'rumah-tangga': '🏠', 'plastik': '🪣', 'bangunan': '🏗️', 'b3': '⚠️', 'medis': '🏥', 'limbah-pabrik': '🏭' };
        const icon = L.divIcon({
            html: `<div style="width:38px;height:38px;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;inset:0;border-radius:50%;background:${getStatusColor(l.status)}22;border:2.5px solid ${getStatusColor(l.status)}"></div><span style="font-size:18px;">${meta[l.kategori] || '📦'}</span></div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
            popupAnchor: [0, -22]
        });
        L.marker([lat, lng], { icon }).addTo(map).bindPopup(`
            <div style="min-width:200px">
                <strong>${getKategoriText(l.kategori)}</strong><br>
                <i class="fas fa-user"></i> ${escapeHtml(l.nama || 'Anonim')}<br>
                ${l.kecamatan ? `<i class="fas fa-map-pin"></i> ${escapeHtml(l.kecamatan)}<br>` : ''}
                <small>${escapeHtml((l.deskripsi || '').substring(0, 80))}...</small><br>
                <span style="color:${getStatusColor(l.status)}">${l.status === 'belum diproses' ? '⏳ Menunggu' : (l.status === 'proses' ? '🔄 Diproses' : '✅ Selesai')}</span>
            </div>
        `);
    });
}

function setupEventListeners() {
    document.getElementById('getLocationBtn')?.addEventListener('click', getCurrentLocation);
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
        searchInput.addEventListener('input', () => searchClear.style.display = searchInput.value ? 'flex' : 'none');
        searchClear.addEventListener('click', () => { if (searchInput) searchInput.value = ''; filterLaporan(); searchClear.style.display = 'none'; });
    }
    document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => navLinks?.classList.remove('active')));
    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY + 100;
        document.querySelectorAll('section').forEach(section => {
            const id = section.getAttribute('id');
            if (id && scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) link.classList.add('active');
                });
            }
        });
    });
}

function setupScrollEffect() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) scrollTopBtn?.classList.add('show');
        else scrollTopBtn?.classList.remove('show');
        if (window.scrollY > 50) navbar?.classList.add('scrolled');
        else navbar?.classList.remove('scrolled');
    });
}

function updateCharCount() {
    if (deskripsiInput && charCount) {
        charCount.textContent = deskripsiInput.value.length;
        charCount.style.color = deskripsiInput.value.length > 500 ? '#ef4444' : '#64748b';
    }
}

function previewFoto(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showNotification('Ukuran foto maksimal 5MB', 'error');
            if (fotoInput) fotoInput.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const preview = document.getElementById('photoPreview');
            if (preview) {
                preview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
                preview.style.display = 'block';
                const placeholder = document.querySelector('.photo-placeholder');
                if (placeholder) placeholder.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }
}

function showNotification(message, type) {
    const old = document.querySelector('.notifikasi');
    if (old) old.remove();
    const notif = document.createElement('div');
    notif.className = `notifikasi ${type}`;
    notif.innerHTML = `<i class="fas ${type === 'sukses' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${escapeHtml(message)}`;
    document.body.appendChild(notif);
    setTimeout(() => { notif.style.animation = 'slideOut 0.3s ease'; setTimeout(() => notif.remove(), 300); }, 4000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

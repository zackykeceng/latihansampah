// Konfigurasi Google Sheets (GANTI DENGAN URL DEPLOY APPS SCRIPT ANDA)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGdQxw6x9za1H2VmfuEen52neRf-7M7urYjoGKe2TbjAzhwyFtcz0w3zILYNCnU92j/exec';

// ==================== POLIGON WILAYAH KECAMATAN ====================
// Koordinat berdasarkan batas administrasi resmi (BPS/OSM) Kab. Bojonegoro
const WILAYAH = {
    ngambon: {
        name: 'Kecamatan Ngambon',
        center: [-7.2853, 111.7198],
        polygons: [
            [
                [-7.2480, 111.6880],
                [-7.2495, 111.6960],
                [-7.2515, 111.7040],
                [-7.2540, 111.7110],
                [-7.2568, 111.7175],
                [-7.2600, 111.7240],
                [-7.2630, 111.7305],
                [-7.2660, 111.7368],
                [-7.2705, 111.7420],
                [-7.2760, 111.7460],
                [-7.2820, 111.7478],
                [-7.2880, 111.7465],
                [-7.2935, 111.7430],
                [-7.2978, 111.7378],
                [-7.3010, 111.7310],
                [-7.3055, 111.7240],
                [-7.3068, 111.7163],
                [-7.3060, 111.7083],
                [-7.3040, 111.7005],
                [-7.3010, 111.6935],
                [-7.2968, 111.6875],
                [-7.2920, 111.6828],
                [-7.2865, 111.6793],
                [-7.2803, 111.6775],
                [-7.2738, 111.6778],
                [-7.2675, 111.6793],
                [-7.2618, 111.6813],
                [-7.2565, 111.6833],
                [-7.2525, 111.6850],
                [-7.2495, 111.6862],
                [-7.2480, 111.6880]
            ]
        ],
        villages: ['Ngambon', 'Bondol', 'Karangmangu', 'Nglampin', 'Sengon']
    },
    tambakrejo: {
        name: 'Kecamatan Tambakrejo',
        center: [-7.2645, 111.6198],
        polygons: [
            [
                [-7.2130, 111.5840],
                [-7.2160, 111.5930],
                [-7.2200, 111.6025],
                [-7.2240, 111.6115],
                [-7.2278, 111.6200],
                [-7.2315, 111.6285],
                [-7.2348, 111.6365],
                [-7.2370, 111.6460],
                [-7.2390, 111.6560],
                [-7.2405, 111.6660],
                [-7.2415, 111.6760],
                [-7.2420, 111.6870],
                [-7.2430, 111.6940],
                [-7.2480, 111.6880],
                [-7.2495, 111.6862],
                [-7.2525, 111.6850],
                [-7.2565, 111.6833],
                [-7.2618, 111.6813],
                [-7.2675, 111.6793],
                [-7.2720, 111.6760],
                [-7.2760, 111.6720],
                [-7.2800, 111.6670],
                [-7.2838, 111.6600],
                [-7.2865, 111.6515],
                [-7.2883, 111.6420],
                [-7.2898, 111.6325],
                [-7.2903, 111.6225],
                [-7.2890, 111.6130],
                [-7.2868, 111.6042],
                [-7.2835, 111.5968],
                [-7.2795, 111.5910],
                [-7.2745, 111.5868],
                [-7.2690, 111.5838],
                [-7.2630, 111.5822],
                [-7.2567, 111.5818],
                [-7.2500, 111.5822],
                [-7.2430, 111.5825],
                [-7.2360, 111.5823],
                [-7.2290, 111.5820],
                [-7.2217, 111.5825],
                [-7.2165, 111.5832],
                [-7.2130, 111.5840]
            ]
        ],
        villages: [
            'Tambakrejo', 'Sukorejo', 'Sendangrejo', 'Pengkol', 'Ngrancang',
            'Napis', 'Mulyorejo', 'Malingmati', 'Kalisumber', 'Tanjung',
            'Dolokgede', 'Gading', 'Gamongan', 'Jatimulyo', 'Jawik',
            'Kacangan', 'Bakalan', 'Turi'
        ]
    }
};

// Batas kotak (bounding box)
const BATAS_WILAYAH = {
    latMin: -7.3090,
    latMax: -7.2100,
    lngMin: 111.5790,
    lngMax: 111.7520
};

// ==================== GLOBAL VARIABLES ====================
let map;
let marker;
let selectedLat = null;
let selectedLng = null;
let currentLocationValid = false;
let currentKecamatan = null;
let allLaporan = [];
let wilayahPolygons = [];
let currentStep = 1;
let autoRefreshInterval = null;

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
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hide');
    }, 1000);
    
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100,
            easing: 'ease-out-cubic'
        });
    }
    
    if (window.innerWidth > 768) {
        initCustomCursor();
    }
    
    initParticles();
    initMap();
    await loadLaporan();
    setupEventListeners();
    setupScrollEffect();
    setupFormSteps();
    setupVolumeSelector();
    
    autoRefreshInterval = setInterval(() => {
        loadLaporan();
    }, 30000);
});

// ==================== CUSTOM CURSOR ====================
function initCustomCursor() {
    const cursorDot = document.getElementById('cursorDot');
    const cursorOutline = document.getElementById('cursorOutline');
    
    if (!cursorDot || !cursorOutline) return;
    
    document.addEventListener('mousemove', (e) => {
        cursorDot.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 3}px)`;
        cursorOutline.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
    });
    
    document.querySelectorAll('a, button, .nav-link, .btn-primary, .btn-secondary, .volume-option, .step').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorDot.classList.add('hover');
            cursorOutline.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursorDot.classList.remove('hover');
            cursorOutline.classList.remove('hover');
        });
    });
}

// ==================== PARTICLES ====================
function initParticles() {
    const particlesContainer = document.getElementById('heroParticles');
    if (!particlesContainer) return;
    
    particlesContainer.innerHTML = '';
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(16, 185, 129, ${Math.random() * 0.3 + 0.1});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 10 + 5}s ease-in-out infinite;
            animation-delay: ${Math.random() * 5}s;
            pointer-events: none;
        `;
        particlesContainer.appendChild(particle);
    }
}

// ==================== MAP INITIALIZATION ====================
function initMap() {
    const centerLat = (BATAS_WILAYAH.latMin + BATAS_WILAYAH.latMax) / 2;
    const centerLng = (BATAS_WILAYAH.lngMin + BATAS_WILAYAH.lngMax) / 2;
    
    map = L.map('map').setView([centerLat, centerLng], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> & CartoDB | DLH Bojonegoro',
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
    marker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        updateSelectedLocation(pos.lat, pos.lng);
    });
    
    map.on('click', function(e) {
        updateSelectedLocation(e.latlng.lat, e.latlng.lng);
    });
}

function drawWilayahPolygons() {
    const polygonStyle = {
        color: '#10b981',
        weight: 3,
        opacity: 0.9,
        fillColor: '#10b981',
        fillOpacity: 0.15,
        smoothFactor: 1,
        className: 'area-polygon'
    };
    
    WILAYAH.ngambon.polygons.forEach(polygonCoords => {
        const polygon = L.polygon(polygonCoords, polygonStyle).addTo(map);
        polygon.bindPopup(`
            <div style="text-align: center; padding: 8px;">
                <strong style="color: #10b981;">🏘️ ${WILAYAH.ngambon.name}</strong><br>
                <span style="font-size: 12px;">Desa: ${WILAYAH.ngambon.villages.join(', ')}</span><br>
                <span style="color: #10b981; font-size: 11px;">✓ Wilayah layanan DLH</span>
            </div>
        `);
        polygon.on('mouseover', function() { polygon.setStyle({ fillOpacity: 0.3 }); });
        polygon.on('mouseout', function() { polygon.setStyle({ fillOpacity: 0.15 }); });
        wilayahPolygons.push(polygon);
    });
    
    WILAYAH.tambakrejo.polygons.forEach(polygonCoords => {
        const polygon = L.polygon(polygonCoords, polygonStyle).addTo(map);
        polygon.bindPopup(`
            <div style="text-align: center; padding: 8px;">
                <strong style="color: #10b981;">🏘️ ${WILAYAH.tambakrejo.name}</strong><br>
                <span style="font-size: 12px;">Desa: ${WILAYAH.tambakrejo.villages.join(', ')}</span><br>
                <span style="color: #10b981; font-size: 11px;">✓ Wilayah layanan DLH</span>
            </div>
        `);
        polygon.on('mouseover', function() { polygon.setStyle({ fillOpacity: 0.3 }); });
        polygon.on('mouseout', function() { polygon.setStyle({ fillOpacity: 0.15 }); });
        wilayahPolygons.push(polygon);
    });
    
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = `
            <div style="background: white; padding: 12px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-size: 12px; min-width: 170px;">
                <strong style="display: block; margin-bottom: 8px; color: #0f172a;">🗺️ Wilayah Layanan DLH</strong>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                    <div style="width: 20px; height: 20px; background: #10b981; opacity: 0.3; border: 2px solid #10b981; border-radius: 4px;"></div>
                    <span>Kec. Ngambon & Tambakrejo</span>
                </div>
                <hr style="margin: 8px 0; border-color: #e2e8f0;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-trash-alt" style="color: #f59e0b;"></i>
                    <span>Titik laporan sampah</span>
                </div>
            </div>
        `;
        return div;
    };
    legend.addTo(map);
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
    if (lat < BATAS_WILAYAH.latMin || lat > BATAS_WILAYAH.latMax ||
        lng < BATAS_WILAYAH.lngMin || lng > BATAS_WILAYAH.lngMax) {
        return { valid: false, kecamatan: null };
    }
    
    for (const polygon of WILAYAH.ngambon.polygons) {
        if (isPointInPolygon(lat, lng, polygon)) {
            return { valid: true, kecamatan: 'Kecamatan Ngambon' };
        }
    }
    
    for (const polygon of WILAYAH.tambakrejo.polygons) {
        if (isPointInPolygon(lat, lng, polygon)) {
            return { valid: true, kecamatan: 'Kecamatan Tambakrejo' };
        }
    }
    
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
    const validasiGroup = document.getElementById('validasiLokasiGroup');
    const locationStatus = document.getElementById('locationStatus');
    
    if (lokasiInput) {
        lokasiInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
    
    if (validasiGroup && locationStatus) {
        validasiGroup.style.display = 'block';
        
        if (validasi.valid) {
            locationStatus.className = 'location-status valid';
            locationStatus.innerHTML = `<i class="fas fa-check-circle"></i> ✅ Lokasi valid di ${validasi.kecamatan} - Dalam wilayah layanan DLH Bojonegoro`;
            showNotification(`Lokasi terverifikasi di ${validasi.kecamatan}`, 'sukses');
            
            let hiddenKecamatan = document.getElementById('kecamatanOtomatis');
            if (!hiddenKecamatan) {
                hiddenKecamatan = document.createElement('input');
                hiddenKecamatan.type = 'hidden';
                hiddenKecamatan.id = 'kecamatanOtomatis';
                document.getElementById('formLaporan').appendChild(hiddenKecamatan);
            }
            hiddenKecamatan.value = validasi.kecamatan;
        } else {
            locationStatus.className = 'location-status invalid';
            locationStatus.innerHTML = `<i class="fas fa-times-circle"></i> ❌ Lokasi di luar wilayah layanan DLH! Hanya Kecamatan Ngambon & Tambakrejo yang dilayani.`;
            showNotification('Lokasi di luar wilayah layanan DLH!', 'error');
        }
    }
}

// ==================== LIVE GPS TRACKING ====================
let liveWatchId = null;
let liveCircle = null;
let liveMarkerEl = null;

function startLiveTracking() {
    if (!navigator.geolocation) {
        showNotification('Browser tidak mendukung geolokasi', 'error');
        return;
    }

    const btn = document.getElementById('getLocationBtn');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Mencari Sinyal GPS…';
        btn.disabled = true;
        btn.classList.add('btn-tracking');
    }

    if (liveWatchId !== null) {
        navigator.geolocation.clearWatch(liveWatchId);
        liveWatchId = null;
    }

    const validasiGroup = document.getElementById('validasiLokasiGroup');
    const locationStatus = document.getElementById('locationStatus');
    if (validasiGroup) validasiGroup.style.display = 'block';
    if (locationStatus) {
        locationStatus.className = 'location-status loading';
        locationStatus.innerHTML = '<i class="fas fa-satellite-dish fa-pulse"></i> <span id="gpsStatusText">Menghubungi satelit GPS… pastikan Anda berada di luar ruangan.</span>';
    }

    let firstFix = true;

    liveWatchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;

            updateSelectedLocation(lat, lng);

            if (firstFix) {
                map.flyTo([lat, lng], 16, { duration: 1.5 });
                firstFix = false;
            } else {
                map.setView([lat, lng], map.getZoom());
            }

            if (liveCircle) {
                liveCircle.setLatLng([lat, lng]);
                liveCircle.setRadius(accuracy);
            } else {
                liveCircle = L.circle([lat, lng], {
                    radius: accuracy,
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.08,
                    weight: 2,
                    dashArray: '6 4',
                    className: 'accuracy-circle'
                }).addTo(map);
            }

            if (!liveMarkerEl) {
                const liveIcon = L.divIcon({
                    className: 'live-gps-icon',
                    html: `<div class="gps-pulse-ring"></div><div class="gps-dot"><i class="fas fa-location-crosshairs"></i></div>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18],
                    popupAnchor: [0, -18]
                });
                if (marker) marker.setIcon(liveIcon);
                liveMarkerEl = true;
            }

            const qualityLabel = accuracy <= 10 ? '🟢 Presisi Tinggi' :
                                 accuracy <= 30 ? '🟡 Presisi Baik' :
                                 accuracy <= 80 ? '🟠 Presisi Sedang' : '🔴 Presisi Rendah';
            
            if (locationStatus && currentLocationValid) {
                locationStatus.className = 'location-status valid gps-live';
                locationStatus.innerHTML = `<i class="fas fa-satellite-dish"></i> <span id="gpsStatusText">📡 <b>LIVE</b> · ${currentKecamatan} · Akurasi ±${Math.round(accuracy)} m &nbsp;${qualityLabel}</span> <button class="btn-stop-gps" onclick="stopLiveTracking()" title="Hentikan tracking"><i class="fas fa-stop-circle"></i></button>`;
            } else if (locationStatus) {
                locationStatus.className = 'location-status invalid gps-live';
                locationStatus.innerHTML = `<i class="fas fa-triangle-exclamation"></i> <span id="gpsStatusText">❌ Di luar wilayah layanan · Akurasi ±${Math.round(accuracy)} m</span> <button class="btn-stop-gps" onclick="stopLiveTracking()" title="Hentikan tracking"><i class="fas fa-stop-circle"></i></button>`;
            }

            if (btn) {
                btn.innerHTML = '<i class="fas fa-stop-circle"></i> Hentikan Tracking';
                btn.disabled = false;
                btn.onclick = stopLiveTracking;
            }
        },
        (error) => {
            stopLiveTracking();
            let pesan = 'Gagal mendapatkan lokasi: ';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    pesan += 'Izin lokasi ditolak. Aktifkan di pengaturan browser.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    pesan += 'Sinyal GPS tidak tersedia. Pindah ke lokasi terbuka.';
                    break;
                case error.TIMEOUT:
                    pesan += 'Waktu habis. Coba lagi.';
                    break;
                default:
                    pesan += 'Terjadi kesalahan.';
            }
            showNotification(pesan, 'error');
            if (locationStatus) {
                locationStatus.className = 'location-status invalid';
                locationStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${pesan}`;
            }
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 15000
        }
    );
}

function stopLiveTracking() {
    if (liveWatchId !== null) {
        navigator.geolocation.clearWatch(liveWatchId);
        liveWatchId = null;
    }
    if (liveCircle) {
        map.removeLayer(liveCircle);
        liveCircle = null;
    }
    liveMarkerEl = null;

    const defaultIcon = L.divIcon({
        className: 'custom-div-icon',
        html: '<i class="fas fa-map-marker-alt" style="color: #10b981; font-size: 40px; text-shadow: 0 0 3px white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));"></i>',
        iconSize: [40, 40],
        popupAnchor: [0, -20]
    });
    if (marker) marker.setIcon(defaultIcon);

    const btn = document.getElementById('getLocationBtn');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-location-dot"></i> Gunakan Lokasi Saya';
        btn.disabled = false;
        btn.classList.remove('btn-tracking');
        btn.onclick = startLiveTracking;
    }
    showNotification('Tracking GPS dihentikan. Lokasi terakhir tersimpan.', 'sukses');
}

function getCurrentLocation() {
    startLiveTracking();
}

// ==================== FORM STEPS ====================
function setupFormSteps() {
    const steps = document.querySelectorAll('.step');
    const formSteps = document.querySelectorAll('.form-step');
    const progressFill = document.querySelector('.progress-fill');
    
    function updateProgress(step) {
        const totalSteps = formSteps.length;
        const progress = (step / totalSteps) * 100;
        if (progressFill) progressFill.style.width = `${progress}%`;
        
        steps.forEach((s, i) => {
            if (i + 1 < step) {
                s.classList.add('completed');
                s.classList.remove('active');
            } else if (i + 1 === step) {
                s.classList.add('active');
                s.classList.remove('completed');
            } else {
                s.classList.remove('active', 'completed');
            }
        });
        
        formSteps.forEach((fs, i) => {
            if (i + 1 === step) {
                fs.classList.add('active');
            } else {
                fs.classList.remove('active');
            }
        });
    }
    
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            const nextStep = parseInt(btn.dataset.next);
            if (validateStep(currentStep)) {
                if (currentStep === 2 && typeof stopLiveTracking === 'function') {
                    stopLiveTracking();
                }
                currentStep = nextStep;
                updateProgress(currentStep);
                const formCard = document.querySelector('.form-card');
                if (formCard) {
                    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
    
    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            const prevStep = parseInt(btn.dataset.prev);
            if (currentStep === 2 && typeof stopLiveTracking === 'function') {
                stopLiveTracking();
            }
            currentStep = prevStep;
            updateProgress(currentStep);
            const formCard = document.querySelector('.form-card');
            if (formCard) {
                formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    function validateStep(step) {
        if (step === 1) {
            if (!fotoInput || !fotoInput.files || !fotoInput.files[0]) {
                showNotification('📸 Harap unggah foto dokumentasi sampah terlebih dahulu', 'error');
                const photoUpload = document.querySelector('.photo-upload');
                if (photoUpload) {
                    photoUpload.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    photoUpload.style.borderColor = '#ef4444';
                    setTimeout(() => {
                        photoUpload.style.borderColor = '';
                    }, 2000);
                }
                return false;
            }
            return true;
        }
        
        if (step === 2) {
            if (!selectedLat || !selectedLng) {
                showNotification('📍 Harap pilih lokasi kejadian pada peta terlebih dahulu', 'error');
                const mapContainer = document.getElementById('map');
                if (mapContainer) {
                    mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    mapContainer.style.border = '2px solid #ef4444';
                    setTimeout(() => {
                        mapContainer.style.border = '';
                    }, 2000);
                }
                return false;
            }
            if (!currentLocationValid) {
                showNotification('❌ Lokasi di luar wilayah layanan DLH! Hanya Kecamatan Ngambon & Tambakrejo yang dilayani.', 'error');
                const mapContainer = document.getElementById('map');
                if (mapContainer) {
                    mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return false;
            }
            return true;
        }
        
        return true;
    }
}

function setupVolumeSelector() {
    const volumeOptions = document.querySelectorAll('.volume-option');
    const volumeInput = document.getElementById('volume');
    
    volumeOptions.forEach(option => {
        option.addEventListener('click', () => {
            volumeOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            if (volumeInput) volumeInput.value = option.dataset.volume;
        });
    });
}

// ==================== RESET FORM ====================
function resetFormToStep1() {
    if (typeof stopLiveTracking === 'function') stopLiveTracking();
    if (form) form.reset();
    
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) {
        photoPreview.innerHTML = '';
        photoPreview.style.display = 'none';
    }
    const placeholder = document.querySelector('.photo-placeholder');
    if (placeholder) placeholder.style.display = 'block';
    
    selectedLat = null;
    selectedLng = null;
    currentLocationValid = false;
    currentKecamatan = null;
    
    const lokasiInput = document.getElementById('lokasi');
    if (lokasiInput) lokasiInput.value = '';
    
    const validasiGroup = document.getElementById('validasiLokasiGroup');
    if (validasiGroup) validasiGroup.style.display = 'none';
    
    const volumeOptions = document.querySelectorAll('.volume-option');
    volumeOptions.forEach(opt => opt.classList.remove('active'));
    const volumeInput = document.getElementById('volume');
    if (volumeInput) volumeInput.value = '';
    
    const kategoriSelect = document.getElementById('kategori');
    if (kategoriSelect) kategoriSelect.value = '';
    
    const namaInput = document.getElementById('nama');
    if (namaInput) namaInput.value = '';
    const kontakInput = document.getElementById('kontak');
    if (kontakInput) kontakInput.value = '';
    
    if (deskripsiInput) {
        deskripsiInput.value = '';
        if (charCount) {
            charCount.textContent = '0';
            charCount.style.color = '#64748b';
        }
    }
    
    const centerLat = (BATAS_WILAYAH.latMin + BATAS_WILAYAH.latMax) / 2;
    const centerLng = (BATAS_WILAYAH.lngMin + BATAS_WILAYAH.lngMax) / 2;
    if (marker) marker.setLatLng([centerLat, centerLng]);
    if (map) map.setView([centerLat, centerLng], 13);
    
    currentStep = 1;
    
    const steps = document.querySelectorAll('.step');
    const formSteps = document.querySelectorAll('.form-step');
    const progressFill = document.querySelector('.progress-fill');
    
    if (progressFill) progressFill.style.width = '25%';
    
    steps.forEach((step, index) => {
        if (index === 0) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    formSteps.forEach((fs, index) => {
        if (index === 0) {
            fs.classList.add('active');
        } else {
            fs.classList.remove('active');
        }
    });
    
    const formCard = document.querySelector('.form-card');
    if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==================== SUBMIT LAPORAN (VERSI CORS - OPSI 2) ====================
async function submitLaporan(e) {
    e.preventDefault();

    const foto = fotoInput ? fotoInput.files[0] : null;
    
    // Validasi foto
    if (!foto) {
        showNotification('📸 Harap unggah foto dokumentasi sampah terlebih dahulu', 'error');
        const photoUpload = document.querySelector('.photo-upload');
        if (photoUpload) {
            photoUpload.scrollIntoView({ behavior: 'smooth', block: 'center' });
            photoUpload.style.borderColor = '#ef4444';
            setTimeout(() => {
                photoUpload.style.borderColor = '';
            }, 2000);
        }
        return;
    }
    
    // Validasi lokasi
    if (!selectedLat || !selectedLng) {
        showNotification('📍 Harap pilih lokasi kejadian pada peta terlebih dahulu', 'error');
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            mapContainer.style.border = '2px solid #ef4444';
            setTimeout(() => {
                mapContainer.style.border = '';
            }, 2000);
        }
        return;
    }
    
    if (!currentLocationValid) {
        showNotification('❌ Lokasi di luar wilayah layanan DLH! Hanya Kecamatan Ngambon & Tambakrejo yang dilayani.', 'error');
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    const deskripsi = deskripsiInput ? deskripsiInput.value : '';
    if (!deskripsi) {
        showNotification('📝 Harap isi deskripsi sampah', 'error');
        return;
    }
    
    if (deskripsi.length > 500) {
        showNotification('Deskripsi maksimal 500 karakter', 'error');
        return;
    }

    const volume = document.getElementById('volume')?.value || 'tidak diketahui';
    const kategori = document.getElementById('kategori')?.value || 'lainnya';
    const nama = document.getElementById('nama')?.value || 'Anonim';
    const kontak = document.getElementById('kontak')?.value || '-';
    const lokasi = document.getElementById('lokasi')?.value || '';
    const timestamp = new Date().toISOString();

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim ke DLH...';
    }

    try {
        showNotification('📤 Mengompres foto...', 'sukses');
        const fotoBase64 = await compressAndConvertToBase64(foto);
        
        // Buat data lengkap dalam 1 request
        const requestData = {
            action: 'submit',
            timestamp: timestamp,
            nama: nama,
            kontak: kontak,
            kecamatan: currentKecamatan || '',
            lokasi: lokasi,
            latitude: String(selectedLat),
            longitude: String(selectedLng),
            deskripsi: deskripsi,
            kategori: kategori,
            volume: volume,
            foto: fotoBase64,
            status: 'belum diproses',
            sumber: 'Web DLH Bojonegoro'
        };

        // Kirim dengan mode cors (Apps Script sudah support CORS)
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ Laporan berhasil dikirim ke DLH Bojonegoro dari ${currentKecamatan}!`, 'sukses');
            resetFormToStep1();
            setTimeout(() => loadLaporan(), 2000);
        } else {
            showNotification('Gagal: ' + (result.error || 'Terjadi kesalahan'), 'error');
        }

    } catch (error) {
        console.error('Error:', error);
        showNotification('Gagal mengirim laporan. Periksa koneksi internet.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Kirim Laporan</span><i class="fas fa-paper-plane"></i>';
        }
    }
}

// Kompres foto ke max 1200px JPEG 80%
function compressAndConvertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = new Image();
            img.onload = function() {
                const MAX = 1200;
                let w = img.width, h = img.height;
                if (w > MAX || h > MAX) {
                    if (w > h) {
                        h = Math.round(h * MAX / w);
                        w = MAX;
                    } else {
                        w = Math.round(w * MAX / h);
                        h = MAX;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
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

// ==================== LOAD LAPORAN ====================
async function loadLaporan() {
    const laporanDiv = document.getElementById('laporanList');
    if (laporanDiv) {
        laporanDiv.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Memuat data laporan dari server DLH...</p></div>';
    }
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=get`);
        const data = await response.json();
        
        if (data && data.data && data.data.length > 0) {
            allLaporan = data.data.reverse();
            updateStats();
            renderLaporan(allLaporan);
            updateMapMarkers(allLaporan);
        } else {
            if (laporanDiv) {
                laporanDiv.innerHTML = '<div class="loading-state"><i class="fas fa-inbox" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i><p>Belum ada laporan. Jadilah yang pertama!</p></div>';
            }
            const heroTotal = document.getElementById('heroTotalLaporan');
            const heroSelesai = document.getElementById('heroSelesai');
            const heroProses = document.getElementById('heroProses');
            if (heroTotal) heroTotal.textContent = '0';
            if (heroSelesai) heroSelesai.textContent = '0';
            if (heroProses) heroProses.textContent = '0';
        }
    } catch (error) {
        console.error('Error loading laporan:', error);
        if (laporanDiv) {
            laporanDiv.innerHTML = '<div class="loading-state"><i class="fas fa-wifi" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i><p>Gagal memuat data. Periksa koneksi internet.</p></div>';
        }
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

function renderLaporan(laporan) {
    const laporanDiv = document.getElementById('laporanList');
    
    if (!laporanDiv) return;
    
    if (laporan.length === 0) {
        laporanDiv.innerHTML = '<div class="loading-state"><i class="fas fa-search" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i><p>Tidak ada laporan yang sesuai dengan filter</p></div>';
        return;
    }
    
    laporanDiv.innerHTML = laporan.map((laporan, index) => {
        const statusClass = laporan.status === 'selesai' ? 'selesai' : (laporan.status === 'proses' ? 'proses' : 'belum');
        return `
        <div class="laporan-card" data-aos="fade-up" data-aos-delay="${Math.min(index * 50, 500)}">
            <div class="laporan-header">
                <div class="laporan-user">
                    <i class="fas fa-user-circle"></i>
                    <strong>${escapeHtml(laporan.nama || 'Anonim')}</strong>
                </div>
                <span class="laporan-status status-${statusClass}">
                    ${laporan.status === 'belum diproses' ? '⏳ Menunggu Verifikasi' : (laporan.status === 'proses' ? '🔄 Sedang Diproses DLH' : '✅ Selesai')}
                </span>
            </div>
            <div class="laporan-body">
                <div class="laporan-lokasi">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>📍 ${escapeHtml(laporan.lokasi || 'Lokasi tidak tersedia')}</span>
                </div>
                <div>
                    ${laporan.kecamatan ? `<span class="laporan-badge"><i class="fas fa-building"></i> ${escapeHtml(laporan.kecamatan)}</span>` : ''}
                    ${laporan.kategori && laporan.kategori !== 'lainnya' ? `<span class="laporan-badge">${getKategoriIcon(laporan.kategori)} ${getKategoriText(laporan.kategori)}</span>` : ''}
                    ${laporan.volume && laporan.volume !== 'tidak diketahui' ? `<span class="laporan-badge"><i class="fas fa-truck"></i> ${getVolumeText(laporan.volume)}</span>` : ''}
                </div>
                <div class="laporan-deskripsi">
                    📝 ${escapeHtml(laporan.deskripsi || 'Tidak ada deskripsi')}
                </div>
                ${laporan.foto ? `
                    <div class="laporan-foto" onclick="window.openImageModal('${laporan.foto.replace(/'/g, "\\'")}')">
                        <img src="${laporan.foto}" alt="Dokumentasi sampah" loading="lazy" onerror="this.style.display='none'">
                    </div>
                ` : ''}
            </div>
            <div class="laporan-footer">
                <span><i class="far fa-calendar-alt"></i> ${laporan.timestamp ? new Date(laporan.timestamp).toLocaleDateString('id-ID') : 'Tanggal tidak tersedia'}</span>
                <span><i class="far fa-clock"></i> ${laporan.timestamp ? new Date(laporan.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                <span><i class="fas fa-building"></i> DLH Bojonegoro</span>
            </div>
        </div>
    `}).join('');
    
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

window.openImageModal = function(imageSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        animation: fadeIn 0.3s ease;
    `;
    modal.innerHTML = `
        <img src="${imageSrc}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 16px;">
        <button style="position: absolute; top: 20px; right: 20px; background: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 20px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    modal.onclick = () => modal.remove();
    const closeBtn = modal.querySelector('button');
    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            modal.remove();
        };
    }
    document.body.appendChild(modal);
};

function filterLaporan() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = filterStatus ? filterStatus.value : 'all';
    const kecamatanFilter = filterKecamatan ? filterKecamatan.value : 'all';
    const kategoriFilter = filterKategori ? filterKategori.value : 'all';
    
    const filtered = allLaporan.filter(laporan => {
        const matchSearch = (laporan.deskripsi || '').toLowerCase().includes(searchTerm) ||
                           (laporan.lokasi || '').toLowerCase().includes(searchTerm) ||
                           (laporan.nama || '').toLowerCase().includes(searchTerm);
        const matchStatus = statusFilter === 'all' || laporan.status === statusFilter;
        const matchKecamatan = kecamatanFilter === 'all' || (laporan.kecamatan || '').includes(kecamatanFilter);
        const matchKategori = kategoriFilter === 'all' || laporan.kategori === kategoriFilter;
        
        return matchSearch && matchStatus && matchKecamatan && matchKategori;
    });
    
    renderLaporan(filtered);
}

// ==================== MAP MARKERS ====================
const KATEGORI_ICON_MAP = {
    'rumah-tangga': { emoji: '🏠', color: '#f59e0b', fa: 'fa-house' },
    'plastik': { emoji: '🪣', color: '#3b82f6', fa: 'fa-bottle-water' },
    'bangunan': { emoji: '🏗️', color: '#8b5cf6', fa: 'fa-helmet-safety' },
    'b3': { emoji: '⚠️', color: '#ef4444', fa: 'fa-biohazard' },
    'medis': { emoji: '🏥', color: '#ec4899', fa: 'fa-kit-medical' },
    'limbah-pabrik': { emoji: '🏭', color: '#64748b', fa: 'fa-industry' },
    'lainnya': { emoji: '📦', color: '#10b981', fa: 'fa-box' },
};

function getKategoriMarkerIcon(kategori, status) {
    const meta = KATEGORI_ICON_MAP[kategori] || KATEGORI_ICON_MAP['lainnya'];
    const statusColor = getStatusColor(status);
    return L.divIcon({
        className: '',
        html: `<div style="position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;inset:0;border-radius:50%;background:${statusColor}22;border:2.5px solid ${statusColor};box-shadow:0 2px 8px ${statusColor}55;"></div><span style="font-size:18px;line-height:1;position:relative;z-index:1;">${meta.emoji}</span></div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -22],
    });
}

let userLocationMarker = null;
let userLocationCircle = null;
let userLocationWatchId = null;

function startUserLocationOnMap() {
    if (!navigator.geolocation || !map) return;

    if (!document.getElementById('btnLokasiSayaPeta')) {
        const btn = document.createElement('button');
        btn.id = 'btnLokasiSayaPeta';
        btn.title = 'Tampilkan lokasi saya di peta';
        btn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
        btn.style.cssText = `position:absolute; bottom:90px; right:10px; z-index:800; width:36px; height:36px; border-radius:8px; background:#fff; border:2px solid #cbd5e1; color:#10b981; font-size:16px; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.15); display:flex; align-items:center; justify-content:center; transition:background .2s, color .2s;`;
        btn.onmouseenter = () => { btn.style.background = '#10b981'; btn.style.color = '#fff'; };
        btn.onmouseleave = () => { btn.style.background = '#fff'; btn.style.color = '#10b981'; };
        btn.onclick = () => {
            if (userLocationMarker) {
                map.flyTo(userLocationMarker.getLatLng(), 16, { duration: 1.2 });
            } else {
                showNotification('Mengaktifkan lokasi real-time…', 'sukses');
            }
        };

        const mapEl = document.getElementById('petaSebaran') || document.getElementById('map');
        if (mapEl) mapEl.style.position = 'relative';
        if (mapEl) mapEl.appendChild(btn);
    }

    if (userLocationWatchId !== null) {
        navigator.geolocation.clearWatch(userLocationWatchId);
    }

    userLocationWatchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const acc = pos.coords.accuracy;

            if (userLocationMarker) {
                userLocationMarker.setLatLng([lat, lng]);
                userLocationCircle.setLatLng([lat, lng]);
                userLocationCircle.setRadius(acc);
            } else {
                const pulseIcon = L.divIcon({
                    className: '',
                    html: `<div style="position:relative;width:20px;height:20px;"><div style="position:absolute;inset:0;border-radius:50%;background:#3b82f633;border:2px solid #3b82f6;animation:userPulse 1.8s ease-out infinite;"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:10px;height:10px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 0 6px #3b82f6aa;"></div></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                    popupAnchor: [0, -12],
                });

                userLocationMarker = L.marker([lat, lng], { icon: pulseIcon, zIndexOffset: 1000 })
                    .addTo(map)
                    .bindPopup('<b><i class="fas fa-location-dot" style="color:#3b82f6"></i> Lokasi Anda</b><br><small>Real-time GPS</small>');

                userLocationCircle = L.circle([lat, lng], {
                    radius: acc,
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.07,
                    weight: 1,
                    dashArray: '4 4',
                }).addTo(map);

                if (!document.getElementById('userPulseStyle')) {
                    const style = document.createElement('style');
                    style.id = 'userPulseStyle';
                    style.textContent = `@keyframes userPulse { 0% { transform: scale(1); opacity: .8; } 70% { transform: scale(2.8); opacity: 0; } 100% { transform: scale(1); opacity: 0; } }`;
                    document.head.appendChild(style);
                }
            }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
}

function updateMapMarkers(laporan) {
    if (!map) return;
    
    map.eachLayer(layer => {
        if (layer instanceof L.Marker && layer !== marker && layer !== userLocationMarker) {
            map.removeLayer(layer);
        }
        if (layer instanceof L.Circle && layer !== userLocationCircle) {
            map.removeLayer(layer);
        }
    });
    
    if (wilayahPolygons.length === 0) {
        drawWilayahPolygons();
    }
    
    laporan.forEach(l => {
        if (!l.latitude || !l.longitude) return;
        const lat = parseFloat(l.latitude);
        const lng = parseFloat(l.longitude);
        const statusLabel = l.status === 'belum diproses'
            ? `<span style="color:#f59e0b">⏳ Menunggu Verifikasi</span>`
            : l.status === 'proses'
            ? `<span style="color:#3b82f6">🔄 Sedang Diproses</span>`
            : `<span style="color:#10b981">✅ Selesai</span>`;

        L.marker([lat, lng], { icon: getKategoriMarkerIcon(l.kategori, l.status) })
            .addTo(map)
            .bindPopup(`
                <div style="min-width:230px;padding:4px;font-family:inherit;">
                    <div style="font-size:15px;font-weight:700;margin-bottom:6px;">
                        ${getKategoriIcon(l.kategori)} ${escapeHtml(getKategoriText(l.kategori))}
                    </div>
                    <div style="margin-bottom:4px;">
                        <i class="fas fa-user" style="color:#10b981;width:14px;"></i>
                        <b>${escapeHtml(l.nama || 'Anonim')}</b>
                    </div>
                    ${l.kecamatan ? `<div style="margin-bottom:4px;"><i class="fas fa-map-pin" style="color:#10b981;width:14px;"></i> ${escapeHtml(l.kecamatan)}</div>` : ''}
                    <div style="margin-bottom:6px;color:#475569;font-size:12px;">${escapeHtml((l.deskripsi || '').substring(0, 90))}${(l.deskripsi || '').length > 90 ? '…' : ''}</div>
                    <div style="margin-bottom:6px;">${statusLabel}</div>
                    <hr style="margin:6px 0;border-color:#e2e8f0;">
                    <div style="font-size:11px;color:#94a3b8;"><i class="far fa-calendar-alt"></i> ${l.timestamp ? new Date(l.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                    <a href="#daftar" style="display:block;margin-top:8px;color:#10b981;text-decoration:none;font-weight:600;font-size:12px;"><i class="fas fa-eye"></i> Lihat daftar laporan</a>
                </div>
            `);
    });

    startUserLocationOnMap();
}

function getStatusColor(status) {
    switch (status) {
        case 'selesai': return '#10b981';
        case 'proses': return '#3b82f6';
        default: return '#f59e0b';
    }
}

function getKategoriIcon(kategori) {
    const icons = {
        'rumah-tangga': '🏠',
        'plastik': '🪣',
        'bangunan': '🏗️',
        'b3': '⚠️',
        'medis': '🏥',
        'limbah-pabrik': '🏭'
    };
    return icons[kategori] || '📦';
}

function getKategoriText(kategori) {
    const texts = {
        'rumah-tangga': 'Sampah Rumah Tangga',
        'plastik': 'Sampah Plastik',
        'bangunan': 'Sampah Bangunan',
        'b3': 'Sampah B3',
        'medis': 'Sampah Medis',
        'limbah-pabrik': 'Limbah Pabrik'
    };
    return texts[kategori] || 'Lainnya';
}

function getVolumeText(volume) {
    const texts = {
        'kecil': 'Volume Kecil (≤ 1 pick up)',
        'sedang': 'Volume Sedang (1-3 pick up)',
        'besar': 'Volume Besar (≥ 3 pick up)'
    };
    return texts[volume] || volume;
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    const getLocationBtn = document.getElementById('getLocationBtn');
    if (getLocationBtn) getLocationBtn.addEventListener('click', getCurrentLocation);
    
    if (fotoInput) fotoInput.addEventListener('change', previewFoto);
    if (form) form.addEventListener('submit', submitLaporan);
    if (deskripsiInput) deskripsiInput.addEventListener('input', updateCharCount);
    if (searchInput) searchInput.addEventListener('input', filterLaporan);
    if (filterStatus) filterStatus.addEventListener('change', filterLaporan);
    if (filterKecamatan) filterKecamatan.addEventListener('change', filterLaporan);
    if (filterKategori) filterKategori.addEventListener('change', filterLaporan);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    if (navToggle) navToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
    
    if (searchInput && searchClear) {
        searchInput.addEventListener('input', () => {
            if (searchClear) searchClear.style.display = searchInput.value ? 'flex' : 'none';
        });
        searchClear.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            filterLaporan();
            if (searchClear) searchClear.style.display = 'none';
        });
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks) navLinks.classList.remove('active');
        });
    });
    
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionBottom && sectionId) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            if (typeof initCustomCursor === 'function') initCustomCursor();
        }
    });
}

function setupScrollEffect() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            if (scrollTopBtn) scrollTopBtn.classList.add('show');
        } else {
            if (scrollTopBtn) scrollTopBtn.classList.remove('show');
        }
        
        if (window.scrollY > 50) {
            if (navbar) navbar.classList.add('scrolled');
        } else {
            if (navbar) navbar.classList.remove('scrolled');
        }
    });
}

function updateCharCount() {
    if (deskripsiInput && charCount) {
        const count = deskripsiInput.value.length;
        charCount.textContent = count;
        charCount.style.color = count > 500 ? '#ef4444' : '#64748b';
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
        reader.onload = function(e) {
            const preview = document.getElementById('photoPreview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                preview.style.display = 'block';
                const placeholder = document.querySelector('.photo-placeholder');
                if (placeholder) placeholder.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }
}

function showNotification(message, type) {
    const oldNotif = document.querySelector('.notifikasi');
    if (oldNotif) oldNotif.remove();
    
    const notif = document.createElement('div');
    notif.className = `notifikasi ${type}`;
    notif.innerHTML = `<i class="fas ${type === 'sukses' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${escapeHtml(message)}`;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

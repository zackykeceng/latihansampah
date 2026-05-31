// Konfigurasi Google Sheets (GANTI DENGAN URL DEPLOY APPS SCRIPT ANDA)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNuMWcwD4itLwsQJmCpdrS9gnfBZzr3B8lA8lphS3Crx2A9VfzfSWBxMPNZ-Dd97ky/exec';

// ==================== POLIGON WILAYAH KECAMATAN ====================
const WILAYAH = {
    ngambon: {
        name: 'Kecamatan Ngambon',
        center: [-7.2832, 111.7251],
        polygons: [
            [
                [-7.2650, 111.7050],
                [-7.2670, 111.7130],
                [-7.2700, 111.7190],
                [-7.2740, 111.7250],
                [-7.2790, 111.7300],
                [-7.2850, 111.7320],
                [-7.2910, 111.7290],
                [-7.2960, 111.7230],
                [-7.2980, 111.7160],
                [-7.2950, 111.7090],
                [-7.2890, 111.7040],
                [-7.2820, 111.7010],
                [-7.2750, 111.7020],
                [-7.2700, 111.7040],
                [-7.2650, 111.7050]
            ]
        ],
        villages: ['Ngambon', 'Bondol', 'Karangmangu', 'Nglampin', 'Sengon']
    },
    tambakrejo: {
        name: 'Kecamatan Tambakrejo',
        center: [-7.2707, 111.6214],
        polygons: [
            [
                [-7.2500, 111.6000],
                [-7.2530, 111.6070],
                [-7.2570, 111.6130],
                [-7.2620, 111.6180],
                [-7.2680, 111.6230],
                [-7.2740, 111.6260],
                [-7.2810, 111.6240],
                [-7.2860, 111.6180],
                [-7.2890, 111.6110],
                [-7.2870, 111.6040],
                [-7.2820, 111.5980],
                [-7.2750, 111.5950],
                [-7.2670, 111.5960],
                [-7.2600, 111.5990],
                [-7.2540, 111.6000],
                [-7.2500, 111.6000]
            ]
        ],
        villages: ['Tambakrejo', 'Sukorejo', 'Sendangrejo', 'Pengkol', 'Ngrancang', 'Napis', 'Mulyorejo', 'Malingmati', 'Kalisumber', 'Tanjung', 'Dolokgede', 'Gading', 'Gamongan', 'Jatimulyo', 'Jawik', 'Kacangan', 'Bakalan', 'Pelem']
    }
};

const BATAS_WILAYAH = {
    latMin: -7.3000,
    latMax: -7.2400,
    lngMin: 111.5850,
    lngMax: 111.7450
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
    // Hide loader after 1 second
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hide');
    }, 1000);
    
    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100,
            easing: 'ease-out-cubic'
        });
    }
    
    // Initialize custom cursor (only for desktop)
    if (window.innerWidth > 768) {
        initCustomCursor();
    }
    
    // Initialize particles
    initParticles();
    
    // Initialize map
    initMap();
    
    // Load data
    await loadLaporan();
    
    // Setup event listeners
    setupEventListeners();
    setupScrollEffect();
    setupFormSteps();
    setupVolumeSelector();
    
    // Auto refresh every 30 seconds
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
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
    
    // Clear existing particles
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
    
    // Draw Ngambon
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
    
    // Draw Tambakrejo
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
    
    // Add legend
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
            
            // Update hidden kecamatan field
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

function getCurrentLocation() {
    if (!navigator.geolocation) {
        showNotification('Browser tidak mendukung geolokasi', 'error');
        return;
    }
    
    showNotification('Mendapatkan lokasi Anda...', 'sukses');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            updateSelectedLocation(lat, lng);
            map.setView([lat, lng], 15);
            showNotification('Lokasi berhasil didapatkan', 'sukses');
        },
        (error) => {
            let pesan = 'Gagal mendapatkan lokasi: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    pesan += 'Izin lokasi ditolak. Silakan aktifkan di pengaturan browser.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    pesan += 'Lokasi tidak tersedia. Coba gunakan peta untuk memilih lokasi.';
                    break;
                case error.TIMEOUT:
                    pesan += 'Waktu habis. Coba lagi.';
                    break;
                default:
                    pesan += 'Terjadi kesalahan.';
            }
            showNotification(pesan, 'error');
        }
    );
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
                currentStep = nextStep;
                updateProgress(currentStep);
                // Scroll ke atas form
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
            currentStep = prevStep;
            updateProgress(currentStep);
            // Scroll ke atas form
            const formCard = document.querySelector('.form-card');
            if (formCard) {
                formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    function validateStep(step) {
        // Step 1: Validasi foto
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
        
        // Step 2: Validasi lokasi
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

// ==================== RESET FORM TO STEP 1 ====================
function resetFormToStep1() {
    // Reset form
    if (form) form.reset();
    
    // Reset photo preview
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) {
        photoPreview.innerHTML = '';
        photoPreview.style.display = 'none';
    }
    const placeholder = document.querySelector('.photo-placeholder');
    if (placeholder) placeholder.style.display = 'block';
    
    // Reset lokasi
    selectedLat = null;
    selectedLng = null;
    currentLocationValid = false;
    currentKecamatan = null;
    
    const lokasiInput = document.getElementById('lokasi');
    if (lokasiInput) lokasiInput.value = '';
    
    const validasiGroup = document.getElementById('validasiLokasiGroup');
    if (validasiGroup) validasiGroup.style.display = 'none';
    
    // Reset volume selector
    const volumeOptions = document.querySelectorAll('.volume-option');
    volumeOptions.forEach(opt => opt.classList.remove('active'));
    const volumeInput = document.getElementById('volume');
    if (volumeInput) volumeInput.value = '';
    
    // Reset kategori select
    const kategoriSelect = document.getElementById('kategori');
    if (kategoriSelect) kategoriSelect.value = '';
    
    // Reset nama dan kontak
    const namaInput = document.getElementById('nama');
    if (namaInput) namaInput.value = '';
    const kontakInput = document.getElementById('kontak');
    if (kontakInput) kontakInput.value = '';
    
    // Reset deskripsi dan char counter
    if (deskripsiInput) {
        deskripsiInput.value = '';
        if (charCount) {
            charCount.textContent = '0';
            charCount.style.color = '#64748b';
        }
    }
    
    // Reset map marker ke posisi tengah
    const centerLat = (BATAS_WILAYAH.latMin + BATAS_WILAYAH.latMax) / 2;
    const centerLng = (BATAS_WILAYAH.lngMin + BATAS_WILAYAH.lngMax) / 2;
    if (marker) marker.setLatLng([centerLat, centerLng]);
    if (map) map.setView([centerLat, centerLng], 13);
    
    // Reset ke step 1
    currentStep = 1;
    
    // Update progress bar dan steps
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
    
    // Scroll ke atas form
    const formCard = document.querySelector('.form-card');
    if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==================== SUBMIT LAPORAN ====================
async function submitLaporan(e) {
    e.preventDefault();
    
    const foto = fotoInput ? fotoInput.files[0] : null;
    if (!foto) {
        showNotification('Harap unggah foto dokumentasi sampah', 'error');
        return;
    }
    
    if (!selectedLat || !selectedLng) {
        showNotification('Harap pilih lokasi kejadian terlebih dahulu', 'error');
        return;
    }
    
    if (!currentLocationValid) {
        showNotification('❌ Lokasi di luar wilayah layanan DLH!', 'error');
        return;
    }
    
    const deskripsi = deskripsiInput ? deskripsiInput.value : '';
    if (!deskripsi) {
        showNotification('Harap isi deskripsi sampah', 'error');
        return;
    }
    
    if (deskripsi.length > 500) {
        showNotification('Deskripsi maksimal 500 karakter', 'error');
        return;
    }
    
    const fotoBase64 = await convertToBase64(foto);
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
        const params = new URLSearchParams({
            action: 'submit',
            timestamp: timestamp,
            foto: fotoBase64,
            lokasi: lokasi,
            latitude: String(selectedLat),
            longitude: String(selectedLng),
            kecamatan: currentKecamatan || '',
            deskripsi: deskripsi,
            nama: nama,
            kontak: kontak,
            kategori: kategori,
            volume: volume,
            status: 'belum diproses',
            sumber: 'Web DLH Bojonegoro'
        });

        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        
        showNotification(`✅ Laporan berhasil dikirim ke DLH Bojonegoro dari ${currentKecamatan}!`, 'sukses');
        
        // Reset form ke step 1
        resetFormToStep1();
        
        setTimeout(() => loadLaporan(), 1000);
        
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

function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
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
    
    // Reinitialize AOS for new elements
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

// Image modal function
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

function updateMapMarkers(laporan) {
    if (!map) return;
    
    // Remove all markers except the main draggable marker
    map.eachLayer(layer => {
        if (layer instanceof L.Marker && layer !== marker) {
            map.removeLayer(layer);
        }
    });
    
    // Redraw polygons if needed
    if (wilayahPolygons.length === 0) {
        drawWilayahPolygons();
    }
    
    laporan.forEach(laporan => {
        if (laporan.latitude && laporan.longitude) {
            const statusColor = getStatusColor(laporan.status);
            const statusIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<i class="fas fa-trash-alt" style="color: ${statusColor}; font-size: 28px; text-shadow: 0 0 3px white; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));"></i>`,
                iconSize: [28, 28],
                popupAnchor: [0, -14]
            });
            
            L.marker([parseFloat(laporan.latitude), parseFloat(laporan.longitude)], { icon: statusIcon })
                .addTo(map)
                .bindPopup(`
                    <div style="min-width: 220px; padding: 4px;">
                        <b><i class="fas fa-user"></i> ${escapeHtml(laporan.nama || 'Anonim')}</b><br>
                        ${laporan.kecamatan ? `<b><i class="fas fa-building"></i> ${laporan.kecamatan}</b><br>` : ''}
                        <i class="fas fa-align-left"></i> ${escapeHtml((laporan.deskripsi || '').substring(0, 100))}${(laporan.deskripsi || '').length > 100 ? '...' : ''}<br>
                        <span style="color: ${statusColor};"><i class="fas fa-info-circle"></i> Status: ${laporan.status === 'belum diproses' ? 'Menunggu Verifikasi' : (laporan.status === 'proses' ? 'Sedang Diproses' : 'Selesai')}</span>
                        <hr style="margin: 8px 0;">
                        <a href="#daftar" style="color: #10b981; text-decoration: none; font-weight: 500;"><i class="fas fa-eye"></i> Lihat detail laporan</a>
                    </div>
                `);
        }
    });
}

function getStatusColor(status) {
    switch(status) {
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
    
    // Search clear button
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
    
    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks) navLinks.classList.remove('active');
        });
    });
    
    // Active link on scroll
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
    
    // Handle window resize for cursor
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
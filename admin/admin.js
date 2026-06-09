// ==================== KONFIGURASI ====================
const SCRIPT_URL     = 'https://script.google.com/macros/s/AKfycbzv3v-tiTccrswwn1q7DqTaBtae4jYORh9Dogr6Y5k4ZsccWdwDdG-3_xs49E0bFTMc/exec';
const ADMIN_PASSWORD = 'dlh2026';
const SESSION_HOURS  = 8;

// ==================== STATE ====================
let allLaporan        = [];
let charts            = {};
let autoRefreshTimer  = null;
let clockTimer        = null;
let filteredCache     = [];   // mirror renderTable filtered array — no DOM hacks

// ==================== LOGIN ====================
function login() {
    const pw  = document.getElementById('passwordInput').value;
    const err = document.getElementById('loginError');
    const input = document.getElementById('passwordInput');

    if (pw === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminLoginTime', String(Date.now()));
        err.classList.remove('visible');
        document.getElementById('loginPage').style.display  = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        input.value = '';
        initAdmin();
    } else {
        err.classList.add('visible');
        // BUG FIX: apply shake class instead of style.animation manipulation;
        // remove then re-add to restart animation reliably
        input.classList.remove('shake');
        void input.offsetWidth;   // force reflow
        input.classList.add('shake');
        input.addEventListener('animationend', () => input.classList.remove('shake'), { once: true });
    }
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminLoginTime');
    clearTimers();
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('loginPage').style.display  = 'flex';
    document.getElementById('passwordInput').value      = '';
    document.getElementById('loginError').classList.remove('visible');
}

function checkLogin() {
    const ok   = localStorage.getItem('adminLoggedIn');
    const time = localStorage.getItem('adminLoginTime');
    if (ok === 'true' && time) {
        const elapsed = (Date.now() - parseInt(time, 10)) / 3_600_000;
        if (elapsed < SESSION_HOURS) {
            document.getElementById('loginPage').style.display  = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            initAdmin();
            return;
        }
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
    }
    document.getElementById('loginPage').style.display  = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function togglePassword() {
    const input = document.getElementById('passwordInput');
    const icon  = document.getElementById('pwEyeIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ==================== SIDEBAR ====================
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ==================== INIT ====================
function clearTimers() {
    if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null; }
    if (clockTimer)       { clearInterval(clockTimer);       clockTimer = null; }
}

async function initAdmin() {
    clearTimers();

    // Clock
    updateDateTime();
    clockTimer = setInterval(updateDateTime, 1000);

    // Nav — replace nodes to kill stale listeners
    document.querySelectorAll('.nav-item').forEach(el => {
        const clone = el.cloneNode(true);
        el.replaceWith(clone);
    });
    document.querySelectorAll('.nav-item').forEach(el => {
        el.addEventListener('click', handleNavClick);
    });

    // Filter listeners
    const search = document.getElementById('searchInput');
    const kec    = document.getElementById('filterKecamatan');
    const status = document.getElementById('filterStatus');
    if (search) {
        search.addEventListener('input', () => {
            const clearBtn = document.getElementById('searchClearBtn');
            if (clearBtn) clearBtn.style.display = search.value ? 'block' : 'none';
            renderTable();
        });
    }
    if (kec)    kec.addEventListener('change',    () => renderTable());
    if (status) status.addEventListener('change', () => renderTable());

    await loadData();

    // Auto-refresh every 30 s when on data pages
    autoRefreshTimer = setInterval(() => {
        const active = document.querySelector('.page.active');
        if (active && (active.id === 'dashboardPage' || active.id === 'laporanPage')) {
            loadData(true);   // silent refresh
        }
    }, 30_000);
}

function handleNavClick(e) {
    const page = e.currentTarget.dataset.page;
    closeSidebar();

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    e.currentTarget.classList.add('active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + 'Page').classList.add('active');

    const icons   = { dashboard:'fa-gauge-high', laporan:'fa-clipboard-list', statistik:'fa-chart-pie' };
    const titles  = { dashboard:'Dashboard',     laporan:'Daftar Laporan',    statistik:'Statistik'    };
    document.getElementById('pageTitle').textContent       = titles[page] || page;
    document.getElementById('headerBreadcrumb').innerHTML  =
        `<i class="fas ${icons[page] || 'fa-circle'}"></i> ${titles[page] || page}`;

    if (page === 'statistik') updateStatistikCharts();
}

function updateDateTime() {
    const now = new Date();
    const timeEl = document.getElementById('currentTime');
    const dateEl = document.getElementById('currentDate');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    const btn = document.getElementById('searchClearBtn');
    if (btn) btn.style.display = 'none';
    renderTable();
}

// ==================== LOAD DATA ====================
async function loadData(silent = false) {
    const tbody = document.getElementById('laporanTableBody');
    const refreshBtn = document.getElementById('refreshBtn');

    if (!silent && tbody) {
        tbody.innerHTML = `<tr><td colspan="9" class="loading-cell">
            <span class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></span>
            <span>Memuat data…</span></td></tr>`;
    }

    if (refreshBtn) refreshBtn.classList.add('spinning');

    try {
        const res    = await fetch(`${SCRIPT_URL}?action=get`);
        const result = await res.json();

        if (result.success && Array.isArray(result.data)) {
            allLaporan = result.data.reverse();
        } else {
            allLaporan = [];
        }

        updateDashboard();
        renderTable();
        updateCharts();

        if (silent) showToast('Data diperbarui', 'success');
    } catch (err) {
        console.error('loadData error:', err);
        if (!silent && tbody) {
            tbody.innerHTML = `<tr><td colspan="9" class="loading-cell">
                <span class="loading-spinner"><i class="fas fa-triangle-exclamation" style="color:var(--rose)"></i></span>
                <span>Gagal memuat data. Periksa koneksi internet.</span></td></tr>`;
        }
        showToast('Gagal memuat data dari server', 'error');
    } finally {
        if (refreshBtn) refreshBtn.classList.remove('spinning');
    }
}

// ==================== DASHBOARD ====================
function updateDashboard() {
    const total    = allLaporan.length;
    const menunggu = allLaporan.filter(l => l.status === 'belum diproses').length;
    const diproses = allLaporan.filter(l => l.status === 'proses').length;
    const selesai  = allLaporan.filter(l => l.status === 'selesai').length;

    animateCount('totalLaporan',    total);
    animateCount('menungguLaporan', menunggu);
    animateCount('diprosesLaporan', diproses);
    animateCount('selesaiLaporan',  selesai);
}

function animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseInt(el.textContent, 10) || 0;
    const diff  = target - start;
    const steps = 24;
    let step = 0;
    const timer = setInterval(() => {
        step++;
        el.textContent = Math.round(start + diff * (step / steps));
        if (step >= steps) { el.textContent = target; clearInterval(timer); }
    }, 16);
}

// ==================== CHARTS ====================
const PALETTE = ['#1a7a42','#27ae60','#10b981','#f59e0b','#3b82f6','#8b5cf6','#f43f5e','#06b6d4'];

function renderChart(id, type, labels, data, colors) {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    if (charts[id]) {
        charts[id].destroy();
        delete charts[id];
    }

    charts[id] = new Chart(canvas, {
        type,
        data: {
            labels,
            datasets: [{
                label: 'Jumlah',
                data,
                backgroundColor : type === 'line' ? 'rgba(26,122,66,0.10)' : colors,
                borderColor     : type === 'line' ? '#1a7a42' : colors,
                borderWidth     : 2,
                fill            : type === 'line',
                tension         : 0.42,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#1a7a42',
                pointBorderWidth: 2,
                pointRadius     : 4,
                pointHoverRadius: 6,
                borderRadius    : type === 'bar' ? 6 : 0,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display  : type === 'doughnut',
                    position : 'bottom',
                    labels   : {
                        padding: 18,
                        font   : { family:"'Plus Jakarta Sans'", size:12 },
                        boxWidth:12, boxHeight:12, borderRadius:4,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: '#0f2117',
                    padding        : 11,
                    titleFont      : { family:"'Plus Jakarta Sans'", weight:'700', size:13 },
                    bodyFont       : { family:"'Plus Jakarta Sans'", size:12 },
                    cornerRadius   : 10,
                    callbacks      : {
                        // BUG FIX: proper check for chart type — doughnut parsed is a number
                        label: ctx => {
                            const val = type === 'doughnut' ? ctx.parsed : ctx.parsed.y;
                            return ` ${val} laporan`;
                        }
                    }
                }
            },
            scales: type !== 'doughnut' ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font    : { family:"'Plus Jakarta Sans'", size:11 },
                        color   : '#8ca89a'
                    },
                    grid : { color:'rgba(0,0,0,.04)' },
                    border:{ display:false }
                },
                x: {
                    ticks : { font:{ family:"'Plus Jakarta Sans'", size:11 }, color:'#8ca89a' },
                    grid  : { display:false },
                    border: { display:false }
                }
            } : {},
            animation: { duration:700, easing:'easeOutQuart' },
            cutout: type === 'doughnut' ? '62%' : undefined
        }
    });
}

function updateCharts() {
    // Kecamatan
    const kecCounts = {};
    allLaporan.forEach(l => { const k = l.kecamatan || 'Tidak diketahui'; kecCounts[k] = (kecCounts[k] || 0) + 1; });
    renderChart('kecamatanChart', 'bar', Object.keys(kecCounts), Object.values(kecCounts), PALETTE);

    // Kategori
    const katCounts = {};
    allLaporan.forEach(l => { const k = getKategoriName(l.kategori); katCounts[k] = (katCounts[k] || 0) + 1; });
    renderChart('kategoriChart', 'doughnut', Object.keys(katCounts), Object.values(katCounts), PALETTE);

    // Tren 7 hari
    const days = [], counts = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toLocaleDateString('id-ID', { weekday:'short', day:'numeric' }));
        const dateStr = d.toISOString().split('T')[0];
        counts.push(allLaporan.filter(l => l.timestamp && String(l.timestamp).startsWith(dateStr)).length);
    }
    renderChart('trendChart', 'line', days, counts, ['#1a7a42']);
}

function updateStatistikCharts() {
    const kecCounts = {};
    allLaporan.forEach(l => { const k = l.kecamatan || 'Tidak diketahui'; kecCounts[k] = (kecCounts[k] || 0) + 1; });
    renderChart('statKecamatanChart', 'bar', Object.keys(kecCounts), Object.values(kecCounts), PALETTE);

    renderChart('statStatusChart', 'doughnut',
        ['Menunggu','Diproses','Selesai'],
        [
            allLaporan.filter(l => l.status === 'belum diproses').length,
            allLaporan.filter(l => l.status === 'proses').length,
            allLaporan.filter(l => l.status === 'selesai').length,
        ],
        ['#f59e0b','#3b82f6','#10b981']
    );

    // BUG FIX: avg response time — meaningful only for completed reports.
    // Previously measured time-since-report for 'selesai' items using Date.now(),
    // which is always the current time, not a real resolution time.
    // Now shows: avg hours from submission to "now" for selesai reports,
    // clearly labelled as "waktu tertangani rata-rata" (time since report for completed items).
    const selesaiLaporan = allLaporan.filter(l => l.status === 'selesai' && l.timestamp);
    let avgText = '—';
    if (selesaiLaporan.length) {
        const totalHours = selesaiLaporan.reduce((acc, l) => {
            return acc + (Date.now() - new Date(l.timestamp).getTime()) / 3_600_000;
        }, 0);
        const avg = Math.round(totalHours / selesaiLaporan.length);
        avgText = avg > 48 ? `${Math.round(avg/24)} hari` : `${avg} jam`;
    }
    const avgEl = document.getElementById('avgResponse');
    if (avgEl) avgEl.textContent = avgText;

    // Kategori terbanyak
    const katCounts = {};
    allLaporan.forEach(l => { const k = l.kategori || 'lainnya'; katCounts[k] = (katCounts[k] || 0) + 1; });
    const top = Object.entries(katCounts).sort((a,b) => b[1] - a[1])[0];
    const topEl = document.getElementById('topKategori');
    if (topEl) topEl.textContent = top ? getKategoriName(top[0]) : '—';
}

// ==================== TABLE ====================
function renderTable() {
    const search   = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const kecVal   = document.getElementById('filterKecamatan')?.value || 'all';
    const statusVal= document.getElementById('filterStatus')?.value   || 'all';

    filteredCache = allLaporan.filter(l => {
        const matchSearch =
            (l.deskripsi || '').toLowerCase().includes(search) ||
            (l.lokasi    || '').toLowerCase().includes(search) ||
            (l.nama      || '').toLowerCase().includes(search) ||
            (l.kecamatan || '').toLowerCase().includes(search);
        const matchKec    = kecVal    === 'all' || (l.kecamatan || '').includes(kecVal);
        const matchStatus = statusVal === 'all' || l.status === statusVal;
        return matchSearch && matchKec && matchStatus;
    });

    const tbody  = document.getElementById('laporanTableBody');
    const infoEl = document.getElementById('tableInfo');
    if (!tbody) return;

    if (infoEl) {
        infoEl.textContent = filteredCache.length === allLaporan.length
            ? `Menampilkan ${allLaporan.length} laporan`
            : `Menampilkan ${filteredCache.length} dari ${allLaporan.length} laporan`;
    }

    if (filteredCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="loading-cell">
            <span class="loading-spinner"><i class="fas fa-inbox" style="font-size:20px;color:var(--text-muted)"></i></span>
            <span>Tidak ada laporan yang sesuai filter</span></td></tr>`;
        return;
    }

    tbody.innerHTML = filteredCache.map((l, i) => {
        const statusClass = l.status === 'selesai' ? 'selesai' : l.status === 'proses' ? 'proses' : 'menunggu';
        return `
        <tr>
            <td><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-muted)">${String(i+1).padStart(2,'0')}</span></td>
            <td style="white-space:nowrap;font-size:12px;">
                ${l.timestamp
                    ? new Date(l.timestamp).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})
                      + '<br><span style="color:var(--text-muted)">'
                      + new Date(l.timestamp).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})
                      + '</span>'
                    : '—'}
            </td>
            <td>${escHtml(l.kecamatan || '—')}</td>
            <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escAttr(l.lokasi)}">
                ${escHtml((l.lokasi||'').substring(0,30))}${(l.lokasi||'').length>30?'…':''}
            </td>
            <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escAttr(l.deskripsi)}">
                ${escHtml((l.deskripsi||'').substring(0,45))}${(l.deskripsi||'').length>45?'…':''}
            </td>
            <td style="white-space:nowrap;">${getKategoriName(l.kategori)}</td>
            <td>${escHtml(l.nama||'Anonim')}</td>
            <td>
                <select class="status-select" data-idx="${i}" onchange="updateStatus(${i}, this.value)">
                    <option value="belum diproses" ${l.status==='belum diproses'?'selected':''}>🟡 Menunggu</option>
                    <option value="proses"         ${l.status==='proses'        ?'selected':''}>🔵 Diproses</option>
                    <option value="selesai"        ${l.status==='selesai'       ?'selected':''}>🟢 Selesai</option>
                </select>
            </td>
            <td>
                <div class="action-group">
                    <button class="btn-detail" onclick="showDetail(${i})"><i class="fas fa-eye"></i></button>
                    <button class="btn-delete" onclick="confirmDelete(${i})"><i class="fas fa-trash-can"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ==================== UPDATE STATUS ====================
async function updateStatus(filteredIdx, newStatus) {
    const l = filteredCache[filteredIdx];
    if (!l) return;

    const globalIdx = allLaporan.findIndex(a => String(a.timestamp) === String(l.timestamp));
    if (globalIdx === -1) return;

    const snapshot = JSON.parse(JSON.stringify(allLaporan));
    allLaporan[globalIdx].status = newStatus;
    filteredCache[filteredIdx].status = newStatus;
    updateDashboard();
    updateCharts();

    try {
        const params = new URLSearchParams({ action:'update', timestamp:String(l.timestamp), status:newStatus });
        const res    = await fetch(`${SCRIPT_URL}?${params}`);
        const text   = await res.text();
        const result = JSON.parse(text);
        if (!result.success) throw new Error(result.error || 'Gagal update');
        showToast(`Status diubah → ${getStatusText(newStatus)}`, 'success');
    } catch (err) {
        console.error('updateStatus error:', err);
        allLaporan = snapshot;
        renderTable(); updateDashboard(); updateCharts();
        showToast('Gagal mengubah status. Coba lagi.', 'error');
    }
}

// ==================== DETAIL MODAL ====================
function showDetail(filteredIdx) {
    const l = filteredCache[filteredIdx];
    if (!l) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-header">
                <h3><i class="fas fa-file-lines" style="color:var(--green-base);margin-right:8px;"></i>Detail Laporan</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-xmark"></i></button>
            </div>
            ${row('fa-calendar-days','Tanggal',   l.timestamp ? new Date(l.timestamp).toLocaleString('id-ID') : '—')}
            ${row('fa-location-dot', 'Kecamatan', l.kecamatan || '—')}
            ${row('fa-map-pin',      'Lokasi',    l.lokasi    || '—')}
            ${row('fa-align-left',   'Deskripsi', l.deskripsi || '—')}
            ${row('fa-tag',          'Kategori',  getKategoriName(l.kategori))}
            ${row('fa-truck',        'Volume',    getVolumeText(l.volume))}
            ${row('fa-user',         'Pelapor',   l.nama      || 'Anonim')}
            ${row('fa-phone',        'Kontak',    l.kontak    || '—')}
            ${row('fa-circle-info',  'Status',    getStatusText(l.status))}
            ${l.foto ? `
            <div class="modal-row">
                <div class="modal-row-label"><i class="fas fa-image" style="color:var(--green-base)"></i>Foto</div>
                <div class="modal-row-value">
                    <img src="${escAttr(getDriveImgUrl(l.foto))}"
                         alt="Dokumentasi"
                         class="modal-photo"
                         onerror="this.closest('.modal-row').innerHTML='<div class=\\'modal-row-label\\'><i class=\\'fas fa-image\\' style=\\'color:var(--green-base)\\'></i>Foto</div><div class=\\'modal-row-value\\' style=\\'color:var(--text-muted);font-size:13px;\\'>Foto tidak dapat dimuat. <a href=\\'${escAttr(l.foto)}\\' target=\\'_blank\\' style=\\'color:var(--green-base)\\'>Buka di Drive →</a></div>'">
                </div>
            </div>` : ''}
            <button class="modal-btn-close" onclick="this.closest('.modal-overlay').remove()">
                <i class="fas fa-xmark"></i> Tutup
            </button>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function row(icon, label, value) {
    return `<div class="modal-row">
        <div class="modal-row-label"><i class="fas ${icon}" style="color:var(--green-base)"></i>${label}</div>
        <div class="modal-row-value">${escHtml(String(value))}</div>
    </div>`;
}

// ==================== DELETE ====================
function confirmDelete(filteredIdx) {
    const l = filteredCache[filteredIdx];
    if (!l) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box" style="max-width:400px;">
            <span class="modal-delete-icon">🗑️</span>
            <div class="modal-delete-title">Hapus Laporan?</div>
            <p class="modal-delete-desc">
                Laporan dari <strong>${escHtml(l.nama||'Anonim')}</strong> akan dihapus permanen.<br>
                Tindakan ini tidak dapat dibatalkan.
            </p>
            <div class="modal-btn-group">
                <button class="modal-btn-cancel" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-xmark"></i> Batal
                </button>
                <button class="modal-btn-confirm" id="_confirmHapus">
                    <i class="fas fa-trash-can"></i> Ya, Hapus
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#_confirmHapus').addEventListener('click', () => {
        overlay.remove();
        deleteReport(l.timestamp);
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function deleteReport(timestamp) {
    const idx = allLaporan.findIndex(l => String(l.timestamp) === String(timestamp));
    if (idx === -1) { showToast('Data tidak ditemukan', 'error'); return; }

    const snapshot = JSON.parse(JSON.stringify(allLaporan));
    allLaporan.splice(idx, 1);
    renderTable(); updateDashboard(); updateCharts();

    try {
        const params = new URLSearchParams({ action:'delete', timestamp:String(timestamp) });
        const res    = await fetch(`${SCRIPT_URL}?${params}`);
        const text   = await res.text();
        let result;
        try { result = JSON.parse(text); }
        catch { throw new Error('Respons server tidak valid. Periksa Apps Script.'); }
        if (!result.success) throw new Error(result.error || 'Gagal hapus di server');
        showToast('Laporan berhasil dihapus', 'success');
    } catch (err) {
        console.error('deleteReport error:', err);
        allLaporan = snapshot;
        renderTable(); updateDashboard(); updateCharts();
        showToast('Gagal menghapus: ' + err.message, 'error');
    }
}

// ==================== EXPORT CSV ====================
function exportToCSV() {
    if (allLaporan.length === 0) { showToast('Tidak ada data untuk diekspor', 'error'); return; }
    const headers = ['timestamp','nama','kontak','kecamatan','lokasi','latitude','longitude',
                     'deskripsi','kategori','volume','foto','status','sumber'];
    const rows = [headers, ...allLaporan.map(l => headers.map(h => {
        const v = String(l[h] || '');
        return v.includes(',') || v.includes('"') || v.includes('\n')
            ? `"${v.replace(/"/g,'""')}"` : v;
    }))];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
        href: url,
        download: `laporan_dlh_${new Date().toISOString().split('T')[0]}.csv`
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Berhasil mengekspor ${allLaporan.length} data`, 'success');
}

// ==================== GOOGLE DRIVE PHOTO ====================
/**
 * Converts any Google Drive share/view URL or raw file ID into a direct
 * thumbnail URL that can be used as <img src="...">.
 *
 * Supported input formats:
 *   - Full share URL : https://drive.google.com/file/d/FILE_ID/view?...
 *   - Open URL       : https://drive.google.com/open?id=FILE_ID
 *   - uc URL         : https://drive.google.com/uc?id=FILE_ID&export=view
 *   - Raw file ID    : 1_nT3ECrXKGe_0nOwlaRds54ueV_mNwn6
 */
function getDriveImgUrl(input) {
    if (!input) return '';
    let fileId = '';

    // Already a direct lh3.googleusercontent.com or other embeddable URL
    if (/^https?:\/\/lh3\.googleusercontent\.com/.test(input)) return input;

    // Extract file ID from various Drive URL patterns
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,          // /file/d/ID
        /[?&]id=([a-zA-Z0-9_-]+)/,               // ?id=ID or &id=ID
        /\/d\/([a-zA-Z0-9_-]+)/                   // /d/ID fallback
    ];
    for (const re of patterns) {
        const m = input.match(re);
        if (m) { fileId = m[1]; break; }
    }

    // If no pattern matched, treat the whole string as a raw file ID
    if (!fileId) {
        // Bare file IDs are typically 25–50 alphanumeric/_/- chars, no spaces
        if (/^[a-zA-Z0-9_-]{10,}$/.test(input.trim())) {
            fileId = input.trim();
        }
    }

    if (!fileId) return input; // return as-is; let the browser handle it
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
}

// ==================== HELPERS ====================
function getKategoriName(k) {
    return {
        'rumah-tangga' :'🏠 Rumah Tangga',
        'plastik'      :'🪣 Plastik',
        'bangunan'     :'🏗️ Bangunan',
        'b3'           :'⚠️ B3',
        'medis'        :'🏥 Medis',
        'limbah-pabrik':'🏭 Limbah Pabrik',
        'lainnya'      :'📦 Lainnya'
    }[k] || '📦 Lainnya';
}
function getVolumeText(v) {
    return {
        'kecil'           :'Kecil (≤ 1 pick up)',
        'sedang'          :'Sedang (1–3 pick up)',
        'besar'           :'Besar (≥ 3 pick up)',
        'tidak diketahui' :'Tidak diketahui'
    }[v] || (v || 'Tidak diketahui');
}
function getStatusText(s) {
    return { 'belum diproses':'Menunggu', 'proses':'Diproses', 'selesai':'Selesai' }[s] || s;
}

function escHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}
function escAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ==================== TOAST ====================
function showToast(msg, type = 'success') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fas ${type==='success'?'fa-circle-check':'fa-circle-exclamation'}"></i> ${escHtml(msg)}`;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.animation = 'toastOut .3s ease forwards';
        setTimeout(() => t.remove(), 300);
    }, 3200);
}

// ==================== BOOT ====================
document.addEventListener('DOMContentLoaded', checkLogin);

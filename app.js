// ===================================================================================
//  CBT Pro - PURE JAVASCRIPT & LOCALSTORAGE (Final Corrected Version)
//  This is the single source of truth for all application logic.
// ===================================================================================

// === ICONS (Inline SVGs for zero dependencies) ===
const Icons = {
    dashboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    bank: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    test: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline><path d="m9 14-1 1 1 1"></path><path d="m15 14 1 1-1 1"></path><path d="m12 11-1 7"></path></svg>`,
    results: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>`,
    check: `<svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
};

// ===================================================================================
//  MODULE 1: DATABASE (localStorage Wrapper)
// ===================================================================================
const DB = {
    init() {
        if (!localStorage.getItem('cbt_pro_database')) {
            const defaultData = {
                users: [
                    { id: 1, username: "admin", password: "admin123", role: "admin", nama: "Administrator" },
                    { id: 2, username: "siswa", password: "siswa123", role: "student", nama: "Budi Santoso" }
                ],
                questionBank: [
                    { id: 'q1', subject: "Pengetahuan Umum", text: "Ibukota negara Indonesia adalah...", options: ["Bandung", "Surabaya", "Jakarta", "Medan"], correct: 2 },
                    { id: 'q2', subject: "Matematika", text: "Berapakah hasil dari 15 + 25 * 2?", options: ["80", "65", "50", "100"], correct: 1 },
                    { id: 'q3', subject: "Sains", text: "Planet manakah yang dikenal sebagai Planet Merah?", options: ["Venus", "Mars", "Jupiter", "Saturnus"], correct: 1 },
                    { id: 'q4', subject: "Sejarah", text: "Siapakah presiden pertama Republik Indonesia?", options: ["Soeharto", "B.J. Habibie", "Abdurrahman Wahid", "Soekarno"], correct: 3 },
                ],
                tests: [],
                sessions: []
            };
            this.save(defaultData);
            console.log("Initial database created.");
        }
    },
    get() { return JSON.parse(localStorage.getItem('cbt_pro_database')); },
    save(data) { localStorage.setItem('cbt_pro_database', JSON.stringify(data)); }
};

// ===================================================================================
//  MODULE 2: AUTHENTICATION
// ===================================================================================
const Auth = {
    login(username, password) {
        const user = DB.get().users.find(u => u.username === username && u.password === password);
        if (user) {
            sessionStorage.setItem('loggedInUser', JSON.stringify(user));
            return user;
        }
        return null;
    },
    logout() {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    },
    getCurrentUser() {
        const user = sessionStorage.getItem('loggedInUser');
        return user ? JSON.parse(user) : null;
    },
    protectPage(roles = []) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            window.location.href = 'index.html';
            return;
        }
        if (roles.length > 0 && !roles.includes(currentUser.role)) {
            alert('Anda tidak memiliki akses ke halaman ini.');
            window.location.href = 'admin.html';
        }
    }
};

// ===================================================================================
//  MODULE 3: SESSION TRACKER
// ===================================================================================
const Tracker = {
    _sessionData: null,
    _startTime: 0,
    _lastMove: 0,
    _boundMouseMoveHandler: null,

    start(testId, userId) {
        this._startTime = Date.now();
        this._sessionData = {
            sessionId: `sess_${this._startTime}`,
            testId,
            userId,
            status: 'ongoing',
            startTime: new Date(this._startTime).toISOString(),
            finishTime: null,
            finalScore: null,
            answerHistory: {},
            eventTimeline: [{ time: 0, type: "TEST_START" }],
            performanceMetrics: { timePerQuestion: {}, focusLossCount: 0 },
            cursorTrack: []
        };
        this.addEventListeners();
        console.log("Tracker started for session:", this._sessionData.sessionId);
    },

    logEvent(type, data = {}) {
        if (!this._sessionData) return;
        const time = Math.floor((Date.now() - this._startTime) / 1000);
        this._sessionData.eventTimeline.push({ time, type, data });
    },

    logQuestionView(questionIndex, timeOnQuestion) {
        if (!this._sessionData) return;
        const metrics = this._sessionData.performanceMetrics;
        metrics.timePerQuestion[questionIndex] = (metrics.timePerQuestion[questionIndex] || 0) + timeOnQuestion;
        this.logEvent("VIEW_QUESTION", { questionIndex });
    },

    logAnswerChange(questionId, questionIndex, answerIndex) {
        if (!this._sessionData) return;
        if (!this._sessionData.answerHistory[questionId]) {
            this._sessionData.answerHistory[questionId] = [];
        }
        this._sessionData.answerHistory[questionId].push({
            selectedOption: answerIndex,
            timestamp: new Date().toISOString()
        });
        this.logEvent("ANSWER_CHANGE", { questionIndex, answerIndex });
    },

    handleMouseMove(e) {
        const now = Date.now();
        if (now - this._lastMove > 200) { // Throttle mouse move logging to every 200ms
            this._lastMove = now;
            const time = now - this._startTime;
            this._sessionData.cursorTrack.push([time, e.clientX, e.clientY]);
        }
    },

    addEventListeners() {
        this._boundMouseMoveHandler = this.handleMouseMove.bind(this);
        window.addEventListener('mousemove', this._boundMouseMoveHandler);
        window.addEventListener('blur', () => { this.logEvent("FOCUS_LOST"); if(this._sessionData) this._sessionData.performanceMetrics.focusLossCount++; });
        window.addEventListener('focus', () => this.logEvent("FOCUS_GAINED"));
        ['copy', 'paste', 'cut'].forEach(evt => document.addEventListener(evt, e => {
            e.preventDefault();
            this.logEvent(`ATTEMPT_${evt.toUpperCase()}`);
            showToast('Aksi tidak diizinkan!', 'danger');
        }));
    },

    stop() {
        this.logEvent("TEST_FINISH");
        this._sessionData.status = 'completed';
        this._sessionData.finishTime = new Date().toISOString();
        window.removeEventListener('mousemove', this._boundMouseMoveHandler);
        const finalData = { ...this._sessionData };
        this._sessionData = null; // Reset for next session
        return finalData;
    }
};

// ===================================================================================
//  MODULE 4: UI HELPERS & GLOBAL FUNCTIONS
// ===================================================================================
function showToast(message, type = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function openTab(evt, tabName) {
    document.querySelectorAll(".tab-content").forEach(tc => tc.style.display = "none");
    document.querySelectorAll(".tab-link").forEach(tl => tl.classList.remove("active"));
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

function deleteQuestion(qId) {
    if (confirm('Anda yakin ingin menghapus soal ini? Ini akan menghapusnya dari semua ujian yang ada.')) {
        const db = DB.get();
        db.questionBank = db.questionBank.filter(q => q.id !== qId);
        db.tests.forEach(t => {
            t.questionIds = t.questionIds.filter(id => id !== qId);
        });
        DB.save(db);
        Views.renderQuestionBank();
        showToast('Soal berhasil dihapus.', 'success');
    }
}

function deleteTest(tId) {
    if (confirm('Anda yakin ingin menghapus ujian ini?')) {
        const db = DB.get();
        db.tests = db.tests.filter(t => t.id !== tId);
        DB.save(db);
        Views.renderTestManagement();
        showToast('Ujian berhasil dihapus.', 'success');
    }
}

function promptToken(tId) {
    const test = DB.get().tests.find(t => t.id === tId);
    if (!test) {
        showToast('Ujian tidak ditemukan.', 'danger');
        return;
    }
    const modal = document.getElementById('token-modal');
    document.getElementById('token-modal-title').textContent = `Mulai Ujian: "${test.title}"`;
    modal.classList.add('show');
    const form = document.getElementById('token-form');
    const tokenInputEl = form.querySelector('#test-token');
    tokenInputEl.value = ''; // Clear previous input

    // Resetting form listeners by replacing the node is a simple way to avoid multiple submissions.
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', e => {
        e.preventDefault();
        const tokenInput = newForm.querySelector('#test-token').value;
        if (tokenInput === test.token) {
            window.location.href = `ujian.html?testid=${tId}`;
        } else {
            showToast('Token yang dimasukkan salah!', 'danger');
            newForm.querySelector('#test-token').value = '';
        }
    });

    newForm.querySelector('#cancel-token-btn').addEventListener('click', () => {
        modal.classList.remove('show');
    });
}

function showSessionDetail(sessionId) {
    Views.renderSessionDetail(sessionId);
}

// ===================================================================================
//  MODULE 5: VIEW RENDERERS
// ===================================================================================
const Views = {
    _container: null,
    setContainer(containerElement) { this._container = containerElement; },

    renderAdminDashboard() {
        const db = DB.get();
        this._container.innerHTML = `
            <div class="content-header"><h1>Dashboard</h1></div>
            <div class="stats-container">
                <div class="stat-card"><div class="icon blue">${Icons.users}</div><div class="info"><h3>${db.users.length}</h3><p>Total Pengguna</p></div></div>
                <div class="stat-card"><div class="icon green">${Icons.bank}</div><div class="info"><h3>${db.questionBank.length}</h3><p>Soal di Bank</p></div></div>
                <div class="stat-card"><div class="icon orange">${Icons.test}</div><div class="info"><h3>${db.tests.length}</h3><p>Ujian Dibuat</p></div></div>
            </div>`;
    },

    renderSessionDetail(sessionId) {
        const db = DB.get();
        const session = db.sessions.find(s => s.sessionId === sessionId);

        if (!session) {
            this._container.innerHTML = `<div class="content-header"><h1>Error</h1></div><div class="card"><p>Sesi ujian tidak ditemukan. Mungkin telah dihapus atau ID tidak valid.</p><button class="btn btn-secondary" id="back-btn">Kembali ke Hasil</button></div>`;
            document.getElementById('back-btn').addEventListener('click', () => this.renderResults());
            return;
        }

        const user = db.users.find(u => u.id === session.userId) || { nama: 'Pengguna Dihapus' };
        const test = db.tests.find(t => t.id === session.testId) || { title: 'Ujian Dihapus' };

        const focusLossCount = session.performanceMetrics?.focusLossCount || 0;
        const score = session.finalScore ?? "N/A";

        this._container.innerHTML = `
            <div class="content-header">
                <h1>Analisis Sesi: ${user.nama}</h1>
                <button class="btn btn-secondary" id="back-btn">Kembali ke Hasil</button>
            </div>
            <div class="card">
                <p><strong>Ujian:</strong> ${test.title} | <strong>Skor Akhir:</strong> ${score} | <strong>Pindah Tab:</strong> ${focusLossCount} kali</p>
            </div>
            <div class="tabs" style="margin-top:20px;">
                <button class="tab-link active" onclick="openTab(event, 'Timeline')">Timeline Kejadian</button>
                <button class="tab-link" onclick="openTab(event, 'Answers')">Analisis Jawaban</button>
                <button class="tab-link" onclick="openTab(event, 'Cursor')">Replay Kursor</button>
            </div>
            <div id="Timeline" class="tab-content card"></div>
            <div id="Answers" class="tab-content card" style="display:none"></div>
            <div id="Cursor" class="tab-content card" style="display:none"></div>`;

        document.getElementById('back-btn').addEventListener('click', () => this.renderResults());

        this.renderTimelineTab(session);
        this.renderAnswersTab(session, db);
        this.renderCursorTab(session);
        document.querySelector('.tab-link').click(); // Activate the first tab
    },

    formatTimelineEvent(event) {
        const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
        let desc;
        switch (event.type) {
            case 'TEST_START': desc = 'Ujian dimulai.'; break;
            case 'VIEW_QUESTION': desc = `Melihat soal #${event.data.questionIndex + 1}.`; break;
            case 'ANSWER_CHANGE': desc = `Menjawab soal #${event.data.questionIndex + 1} dengan pilihan ${String.fromCharCode(65 + event.data.answerIndex)}.`; break;
            case 'FOCUS_LOST': desc = '<span class="status-danger">PERINGATAN: Keluar dari halaman ujian.</span>'; break;
            case 'FOCUS_GAINED': desc = '<span class="status-ok">Kembali ke halaman ujian.</span>'; break;
            case 'TEST_FINISH': desc = 'Ujian diselesaikan.'; break;
            default: desc = `Kejadian: ${event.type}`; break;
        }
        return `<li><strong>[${formatTime(event.time)}]</strong> ${desc}</li>`;
    },

    renderTimelineTab(session) {
        const timelineHtml = (session.eventTimeline || [])
            .map(e => this.formatTimelineEvent(e))
            .join('');
        document.getElementById('Timeline').innerHTML = `
            <h3>Timeline Kejadian</h3>
            <ul style="list-style-type:none;padding-left:0;">${timelineHtml}</ul>`;
    },
    
    renderStudentHistory() {
        const user = Auth.getCurrentUser();
        const db = DB.get();
        const mySessions = db.sessions.filter(s => s.userId === user.id);

        const tableBody = mySessions.length > 0 ? mySessions.map(s => {
            const test = db.tests.find(t => t.id === s.testId) || { title: 'Ujian Dihapus' };
            const finishTime = s.finishTime ? new Date(s.finishTime).toLocaleString('id-ID') : 'N/A';
            return `<tr>
                        <td>${test.title}</td>
                        <td>${s.finalScore ?? 'N/A'}</td>
                        <td>${finishTime}</td>
                    </tr>`;
        }).join('') : '<tr><td colspan="3" style="text-align:center;">Anda belum mengerjakan ujian apapun.</td></tr>';

        this._container.innerHTML = `
            <div class="content-header"><h1>Riwayat Ujian Saya</h1></div>
            <div class="card">
                <table>
                    <thead><tr><th>Ujian</th><th>Skor</th><th>Waktu Selesai</th></tr></thead>
                    <tbody>${tableBody}</tbody>
                </table>
            </div>`;
    }
};

// ===================================================================================
//  ROUTER & PAGE INITIALIZERS
// ===================================================================================
document.addEventListener('DOMContentLoaded', () => {
    DB.init();
    const pageId = document.body.id;

    // --- LOGIN PAGE ---
    if (pageId === 'page-login') {
        document.getElementById('login-form').addEventListener('submit', e => {
            e.preventDefault();
            const username = e.target.username.value;
            const password = e.target.password.value;
            if (Auth.login(username, password)) {
                window.location.href = 'admin.html';
            } else {
                showToast('Username atau password salah!', 'danger');
            }
        });
        return;
    }

    // --- MAIN DASHBOARD PAGE (ADMIN & STUDENT) ---
    if (pageId === 'page-dashboard') {
        Auth.protectPage();
        const user = Auth.getCurrentUser();
        const mainContentArea = document.getElementById('main-content-area');
        Views.setContainer(mainContentArea);
        document.getElementById('user-display').textContent = user.nama;
        document.getElementById('logout-btn').addEventListener('click', Auth.logout);

        // --- FULL VIEW IMPLEMENTATIONS (Moved here for better organization) ---
        Views.renderQuestionBank = function() {
            const db = DB.get();
            this._container.innerHTML = `
                <div class="content-header"><h1>Bank Soal</h1></div>
                <div class="card">
                    <h2>Tambah Soal Baru</h2>
                    <form id="add-question-form">
                        <div class="form-group"><label for="q-subject">Mata Pelajaran</label><input type="text" id="q-subject" required></div>
                        <div class="form-group"><label for="q-text">Teks Pertanyaan</label><textarea id="q-text" required></textarea></div>
                        <div class="form-group">
                            <label>Pilihan Jawaban (tandai yang benar)</label>
                            <div id="q-options-container">
                                <div style="display:flex;align-items:center;margin-bottom:5px;"><input type="radio" name="correct-option" value="0" checked style="width:auto;margin-right:10px;"><input type="text" placeholder="Pilihan A" class="option-text" required></div>
                                <div style="display:flex;align-items:center;margin-bottom:5px;"><input type="radio" name="correct-option" value="1" style="width:auto;margin-right:10px;"><input type="text" placeholder="Pilihan B" class="option-text" required></div>
                            </div>
                            <button type="button" id="add-option-btn" class="btn btn-secondary btn-sm" style="margin-top:10px;">Tambah Pilihan</button>
                        </div>
                        <button type="submit" class="btn btn-primary">Simpan Soal</button>
                    </form>
                </div>
                <div class="card" style="margin-top:20px;">
                    <h2>Daftar Soal</h2>
                    <table>
                        <thead><tr><th>ID</th><th>Mata Pelajaran</th><th>Pertanyaan</th><th>Aksi</th></tr></thead>
                        <tbody>${db.questionBank.map(q => `<tr><td>${q.id}</td><td>${q.subject}</td><td>${q.text.substring(0, 50)}...</td><td class="actions"><button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q.id}')">Hapus</button></td></tr>`).join('')}</tbody>
                    </table>
                </div>`;
            document.getElementById('add-option-btn').addEventListener('click', () => {
                const container = document.getElementById('q-options-container');
                const index = container.querySelectorAll('.option-text').length;
                container.insertAdjacentHTML('beforeend', `<div style="display:flex;align-items:center;margin-bottom:5px;"><input type="radio" name="correct-option" value="${index}" style="width:auto;margin-right:10px;"><input type="text" placeholder="Pilihan ${String.fromCharCode(65 + index)}" class="option-text" required></div>`);
            });
            document.getElementById('add-question-form').addEventListener('submit', e => {
                e.preventDefault();
                const newQuestion = { id: `q${Date.now()}`, subject: e.target['q-subject'].value, text: e.target['q-text'].value, options: [...document.querySelectorAll('.option-text')].map(i => i.value), correct: parseInt(document.querySelector('input[name="correct-option"]:checked').value) };
                const cdb = DB.get(); cdb.questionBank.push(newQuestion); DB.save(cdb); this.renderQuestionBank(); showToast('Soal berhasil disimpan.', 'success');
            });
        };
        
        Views.renderTestManagement = function() {
            const db = DB.get();
            this._container.innerHTML = `
                <div class="content-header"><h1>Manajemen Ujian</h1></div>
                <div class="card">
                    <h2>Buat Ujian Baru</h2>
                    <form id="add-test-form">
                        <div class="form-group"><label for="t-title">Judul Ujian</label><input type="text" id="t-title" required></div>
                        <div class="form-group"><label for="t-duration">Durasi (menit)</label><input type="number" id="t-duration" required></div>
                        <div class="form-group"><label for="t-token">Token</label><input type="text" id="t-token" required></div>
                        <div class="form-group">
                            <label>Pilih Soal</label>
                            <div id="test-questions-container" style="max-height:200px;overflow-y:auto;border:1px solid #ddd;padding:10px;">
                                ${db.questionBank.length > 0 ? db.questionBank.map(q => `<div><input type="checkbox" name="questions" value="${q.id}"> ${q.text.substring(0, 70)}... (${q.subject})</div>`).join('') : '<p>Belum ada soal di bank soal.</p>'}
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" ${db.questionBank.length === 0 ? 'disabled' : ''}>Simpan Ujian</button>
                    </form>
                </div>
                <div class="card" style="margin-top:20px;">
                    <h2>Daftar Ujian</h2>
                    <table>
                        <thead><tr><th>ID</th><th>Judul</th><th>Jumlah Soal</th><th>Token</th><th>Aksi</th></tr></thead>
                        <tbody>${db.tests.map(t => `<tr><td>${t.id}</td><td>${t.title}</td><td>${t.questionIds.length}</td><td>${t.token}</td><td class="actions"><button class="btn btn-danger btn-sm" onclick="deleteTest('${t.id}')">Hapus</button></td></tr>`).join('')}</tbody>
                    </table>
                </div>`;
            document.getElementById('add-test-form').addEventListener('submit', e => {
                e.preventDefault();
                const questionIds = [...document.querySelectorAll('input[name="questions"]:checked')].map(i => i.value);
                if (questionIds.length === 0) { showToast('Pilih setidaknya satu soal!', 'danger'); return; }
                const newTest = { id: `test_${Date.now()}`, title: e.target['t-title'].value, duration: parseInt(e.target['t-duration'].value), token: e.target['t-token'].value, questionIds: questionIds };
                const cdb = DB.get(); cdb.tests.push(newTest); DB.save(cdb); this.renderTestManagement(); showToast('Ujian berhasil dibuat.', 'success');
            });
        };
        
        Views.renderResults = function() {
            const db = DB.get();
            this._container.innerHTML = `
                <div class="content-header"><h1>Hasil Ujian</h1></div>
                <div class="card">
                    <h2>Semua Sesi Ujian</h2>
                    <table>
                        <thead><tr><th>Siswa</th><th>Ujian</th><th>Skor</th><th>Aksi</th></tr></thead>
                        <tbody>
                            ${db.sessions.map(s => {
                                const user = db.users.find(usr => usr.id === s.userId) || { nama: 'N/A' };
                                const test = db.tests.find(ts => ts.id === s.testId) || { title: 'Ujian Dihapus' };
                                return `<tr>
                                    <td>${user.nama}</td>
                                    <td>${test.title}</td>
                                    <td>${s.finalScore ?? 'N/A'}</td>
                                    <td><button class="btn btn-primary btn-sm" onclick="showSessionDetail('${s.sessionId}')">Lihat Detail</button></td>
                                </tr>`
                            }).join('') || '<tr><td colspan="4" style="text-align:center;">Belum ada sesi ujian yang selesai.</td></tr>'}
                        </tbody>
                    </table>
                </div>`;
        };

        Views.renderStudentDashboard = function() {
            const db = DB.get();
            this._container.innerHTML = `
                <div class="content-header"><h1>Daftar Ujian Tersedia</h1></div>
                <div class="card">
                    <table>
                        <thead><tr><th>Judul Ujian</th><th>Jumlah Soal</th><th>Durasi</th><th>Aksi</th></tr></thead>
                        <tbody>
                            ${db.tests.map(t => `<tr>
                                                    <td>${t.title}</td>
                                                    <td>${t.questionIds.length}</td>
                                                    <td>${t.duration} menit</td>
                                                    <td><button class="btn btn-primary kerjakan-btn" data-testid="${t.id}">Kerjakan</button></td>
                                                </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;">Belum ada ujian yang tersedia.</td></tr>'}
                        </tbody>
                    </table>
                </div>`;
        };
        
        Views.renderAnswersTab = function(session, db) {
            const test = db.tests.find(t => t.id === session.testId);
            let tableHTML = `<h3>Analisis Jawaban</h3><table><thead><tr><th>No. Soal</th><th>Jawaban Akhir</th><th>Riwayat Jawaban</th></tr></thead><tbody>`;
            if (test) {
                test.questionIds.forEach((qId, i) => {
                    const history = (session.answerHistory || {})[qId];
                    const question = db.questionBank.find(q => q.id === qId);
                    if (!question) return;
                    if (history && history.length > 0) {
                        const finalAnswer = history[history.length - 1].selectedOption;
                        const historyStr = history.map(h => String.fromCharCode(65 + h.selectedOption)).join(' → ');
                        const correctness = finalAnswer === question.correct ? '<span class="status-ok">Benar</span>' : '<span class="status-danger">Salah</span>';
                        tableHTML += `<tr><td>${i + 1}</td><td>${String.fromCharCode(65 + finalAnswer)} (${correctness})</td><td>${historyStr}</td></tr>`;
                    } else {
                        tableHTML += `<tr><td>${i + 1}</td><td>Tidak Dijawab</td><td>-</td></tr>`;
                    }
                });
            }
            tableHTML += '</tbody></table>'; document.getElementById('Answers').innerHTML = tableHTML;
        };

        Views.renderCursorTab = function(session) {
            document.getElementById('Cursor').innerHTML = `
                <h3>Heatmap & Replay Kursor</h3>
                <div id="replay-container" style="position:relative;width:100%;max-width:800px;height:500px;border:1px solid #ccc;margin:auto;background-color:#fff;overflow:hidden;">
                    <canvas id="cursor-canvas" width="800" height="500"></canvas>
                    <div id="replay-cursor" style="position:absolute;width:15px;height:15px;border-radius:50%;background:rgba(41,98,255,0.7);border:2px solid white;box-shadow:0 0 5px blue;display:none;transform:translate(-50%, -50%);"></div>
                </div><br>
                <progress id="replay-progress" value="0" max="100" style="width:100%;max-width:800px;"></progress><br>
                <button id="play-replay-btn" class="btn btn-primary" style="margin-top:10px;">Putar Ulang</button>`;
            
            const canvas = document.getElementById('cursor-canvas');
            const ctx = canvas.getContext('2d');
            const cursorTrack = session.cursorTrack || [];
            
            cursorTrack.forEach(([_, x, y]) => {
                ctx.fillStyle = 'rgba(255,0,0,0.05)';
                ctx.beginPath();
                ctx.arc(x - canvas.getBoundingClientRect().left, y - canvas.getBoundingClientRect().top, 15, 0, 2 * Math.PI);
                ctx.fill();
            });

            document.getElementById('play-replay-btn').addEventListener('click', e => {
                const btn = e.target;
                if (btn.disabled || cursorTrack.length === 0) return;
                btn.disabled = true;
                const cursor = document.getElementById('replay-cursor');
                const progress = document.getElementById('replay-progress');
                const containerRect = canvas.getBoundingClientRect();
                cursor.style.display = 'block';
                let i = 0;
                function animate() {
                    if (i >= cursorTrack.length) {
                        cursor.style.display = 'none';
                        btn.disabled = false;
                        return;
                    }
                    const [t, x, y] = cursorTrack[i];
                    cursor.style.left = `${x - containerRect.left}px`;
                    cursor.style.top = `${y - containerRect.top}px`;
                    progress.value = (i / (cursorTrack.length - 1)) * 100;
                    const timeToNext = (i + 1 < cursorTrack.length) ? cursorTrack[i + 1][0] - t : 100;
                    i++;
                    setTimeout(animate, timeToNext > 500 ? 500 : timeToNext);
                };
                animate();
            });
        };

        const navConfig = {
            admin: [
                { name: 'Dashboard', view: Views.renderAdminDashboard.bind(Views), icon: Icons.dashboard },
                { name: 'Bank Soal', view: Views.renderQuestionBank.bind(Views), icon: Icons.bank },
                { name: 'Manajemen Ujian', view: Views.renderTestManagement.bind(Views), icon: Icons.test },
                { name: 'Hasil Ujian', view: Views.renderResults.bind(Views), icon: Icons.results }
            ],
            student: [
                { name: 'Daftar Ujian', view: Views.renderStudentDashboard.bind(Views), icon: Icons.test },
                { name: 'Riwayat Ujian', view: Views.renderStudentHistory.bind(Views), icon: Icons.results }
            ]
        };
        
        // --- Setup Navigation & Event Delegation ---
        const sidebarNav = document.getElementById('sidebar-nav');
        sidebarNav.innerHTML = navConfig[user.role].map((item, i) => `<li class="${i === 0 ? 'active' : ''}" data-view-name="${item.name}"><a>${item.icon} ${item.name}</a></li>`).join('');
        navConfig[user.role][0].view();

        sidebarNav.addEventListener('click', e => {
            const li = e.target.closest('li');
            if (li && !li.classList.contains('active')) {
                document.querySelector('#sidebar-nav li.active').classList.remove('active');
                li.classList.add('active');
                const viewFn = navConfig[user.role].find(item => item.name === li.dataset.viewName).view;
                viewFn();
            }
        });
        
        // --- ADDED: EVENT LISTENER FOR DYNAMIC CONTENT ---
        mainContentArea.addEventListener('click', e => {
            const kerjakanButton = e.target.closest('.kerjakan-btn');
            if (kerjakanButton) {
                const testId = kerjakanButton.dataset.testid;
                promptToken(testId);
            }
        });

        return;
    }

    // --- UJIAN (TEST TAKING) PAGE ---
    if (pageId === 'page-ujian') {
        Auth.protectPage(['student']);
        const TestEngine = {
            state: { test: null, questions: [], answers: [], currentQuestionIndex: 0, timeLeft: 0, timerInterval: null, timeOnCurrentQuestionStart: 0 },
            init() {
                const testId = new URLSearchParams(window.location.search).get('testid');
                const db = DB.get(); this.state.test = db.tests.find(t => t.id === testId);
                if (!this.state.test || this.state.test.questionIds.length === 0) { showToast("Ujian tidak valid atau tidak memiliki soal!", 'danger'); setTimeout(() => window.location.href = 'admin.html', 2000); return; }
                this.state.questions = this.state.test.questionIds.map(id => db.questionBank.find(q => q.id === id)).filter(Boolean);
                if (this.state.questions.length !== this.state.test.questionIds.length) { showToast("Beberapa soal untuk ujian ini tidak ditemukan.", 'danger'); setTimeout(() => window.location.href = 'admin.html', 2000); return; }
                this.state.answers = new Array(this.state.questions.length).fill(null);
                this.state.timeLeft = this.state.test.duration * 60;
                Tracker.start(testId, Auth.getCurrentUser().id);
                document.getElementById('test-title').textContent = this.state.test.title;
                document.getElementById('student-name').textContent = `Siswa: ${Auth.getCurrentUser().nama}`;
                this.state.timeOnCurrentQuestionStart = Date.now();
                Tracker.logEvent("VIEW_QUESTION", { questionIndex: 0 });
                this.renderQuestion(); this.renderNav(); this.startTimer(); this.addEventListeners();
            },
            renderQuestion() { const q = this.state.questions[this.state.currentQuestionIndex]; document.getElementById('question-number').textContent = this.state.currentQuestionIndex + 1; document.getElementById('question-text').textContent = q.text; document.getElementById('answer-options').innerHTML = q.options.map((opt, i) => `<div class="option ${this.state.answers[this.state.currentQuestionIndex] === i ? 'selected' : ''}" data-option-index="${i}"><input type="radio" id="opt${i}" name="answer" value="${i}" ${this.state.answers[this.state.currentQuestionIndex] === i ? 'checked' : ''}><label for="opt${i}">${String.fromCharCode(65 + i)}. ${opt}</label>${Icons.check}</div>`).join(''); document.querySelectorAll('.option').forEach(o => o.addEventListener('click', () => this.selectAnswer(parseInt(o.dataset.optionIndex)))); },
            selectAnswer(answerIndex) { this.state.answers[this.state.currentQuestionIndex] = answerIndex; Tracker.logAnswerChange(this.state.questions[this.state.currentQuestionIndex].id, this.state.currentQuestionIndex, answerIndex); this.renderQuestion(); this.renderNav(); },
            renderNav() { document.getElementById('question-grid').innerHTML = this.state.questions.map((_, i) => `<button class="q-nav-btn ${i === this.state.currentQuestionIndex ? 'current' : ''} ${this.state.answers[i] !== null ? 'answered' : ''}" data-index="${i}">${i + 1}</button>`).join(''); document.querySelectorAll('.q-nav-btn').forEach(b => b.addEventListener('click', () => this.goToQuestion(parseInt(b.dataset.index)))); document.getElementById('btn-prev').disabled = this.state.currentQuestionIndex === 0; document.getElementById('btn-next').disabled = this.state.currentQuestionIndex === this.state.questions.length - 1; },
            goToQuestion(index) { const timeSpent = (Date.now() - this.state.timeOnCurrentQuestionStart) / 1000; Tracker.logQuestionView(this.state.currentQuestionIndex, timeSpent); this.state.currentQuestionIndex = index; this.state.timeOnCurrentQuestionStart = Date.now(); this.renderQuestion(); this.renderNav(); },
            startTimer() { this.state.timerInterval = setInterval(() => { this.state.timeLeft--; const m = Math.floor(this.state.timeLeft / 60); const s = this.state.timeLeft % 60; const timerEl = document.getElementById('timer'); timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; timerEl.classList.toggle('warning', this.state.timeLeft < 300 && this.state.timeLeft >= 60); timerEl.classList.toggle('danger', this.state.timeLeft < 60); if (this.state.timeLeft <= 0) this.finishTest(); }, 1000); },
            finishTest() {
                clearInterval(this.state.timerInterval);
                const timeSpentOnLast = (Date.now() - this.state.timeOnCurrentQuestionStart) / 1000;
                Tracker.logQuestionView(this.state.currentQuestionIndex, timeSpentOnLast);
                const finalSessionData = Tracker.stop();
                const score = this.state.answers.reduce((acc, ans, i) => acc + (ans === this.state.questions[i].correct ? 1 : 0), 0);
                finalSessionData.finalScore = ((score / this.state.questions.length) * 100).toFixed(2);
                const db = DB.get(); db.sessions.push(finalSessionData); DB.save(db);
                window.location.href = `hasil.html?sessionid=${finalSessionData.sessionId}`;
            },
            addEventListeners() {
                document.getElementById('btn-next').addEventListener('click', () => { if (this.state.currentQuestionIndex < this.state.questions.length - 1) this.goToQuestion(this.state.currentQuestionIndex + 1); });
                document.getElementById('btn-prev').addEventListener('click', () => { if (this.state.currentQuestionIndex > 0) this.goToQuestion(this.state.currentQuestionIndex - 1); });
                document.getElementById('btn-finish').addEventListener('click', () => document.getElementById('finish-modal').classList.add('show'));
                document.getElementById('confirm-finish-btn').addEventListener('click', () => this.finishTest());
                document.getElementById('cancel-finish-btn').addEventListener('click', () => document.getElementById('finish-modal').classList.remove('show'));
                window.addEventListener('contextmenu', e => e.preventDefault());
            }
        };
        TestEngine.init();
        return;
    }

    // --- HASIL (RESULTS) PAGE ---
    if (pageId === 'page-hasil') {
        Auth.protectPage();
        const sessionId = new URLSearchParams(window.location.search).get('sessionid');
        const db = DB.get();
        const session = db.sessions.find(s => s.sessionId === sessionId);
        if (!session) { alert("Sesi tidak ditemukan!"); window.location.href = 'admin.html'; return; }

        const test = db.tests.find(t => t.id === session.testId) || { title: 'Ujian Dihapus' };
        const user = db.users.find(u => u.id === session.userId);
        const score = session.finalScore ?? "N/A";
        const focusCount = session.performanceMetrics?.focusLossCount || 0;
        
        document.getElementById('result-container').innerHTML = `
            <h1>Ujian Selesai!</h1>
            <p>Terima kasih, ${user.nama}, telah menyelesaikan ujian.</p>
            <hr style="margin:20px 0;">
            <h2>${test.title}</h2>
            <h3>Nilai Akhir Anda:</h3>
            <h1 style="font-size:48px;color:var(--primary-blue);">${score}</h1>
            ${focusCount > 0 ? `<p style="color:var(--danger);margin-top:15px;">Terdeteksi ${focusCount} kali aktivitas mencurigakan (pindah tab).</p>` : ''}
            <a href="admin.html" class="btn btn-primary" style="margin-top:30px;">Kembali ke Dashboard</a>`;
    }
});

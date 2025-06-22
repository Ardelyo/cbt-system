// ===================================================================================
//  CBT SYSTEM - PURE JAVASCRIPT & LOCALSTORAGE
//  This is the single source of truth for all application logic.
// ===================================================================================

// === MODULE 1: DATABASE (localStorage Wrapper) ===
const DB = {
    init() {
        if (!localStorage.getItem('cbt_database')) {
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
            console.log("Initial database created in localStorage.");
        }
    },
    get() { return JSON.parse(localStorage.getItem('cbt_database')); },
    save(data) { localStorage.setItem('cbt_database', JSON.stringify(data)); }
};

// === MODULE 2: AUTHENTICATION (sessionStorage for current user) ===
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
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        if (roles.length > 0 && !roles.includes(user.role)) {
            alert('Anda tidak memiliki akses ke halaman ini.');
            window.location.href = 'index.html';
        }
    }
};

// === GLOBAL HELPER FUNCTIONS (callable via onclick) ===
// Placed at the top level to be accessible from dynamically generated HTML
function deleteQuestion(questionId) {
    if (confirm('Anda yakin ingin menghapus soal ini? Ini akan menghapusnya dari semua ujian juga.')) {
        const db = DB.get();
        db.questionBank = db.questionBank.filter(q => q.id !== questionId);
        db.tests.forEach(test => {
            test.questionIds = test.questionIds.filter(id => id !== questionId);
        });
        DB.save(db);
        Views.renderQuestionBank(); // Re-render the view
    }
}

function deleteTest(testId) {
    if (confirm('Anda yakin ingin menghapus ujian ini? Riwayat sesi tidak akan terhapus.')) {
        const db = DB.get();
        db.tests = db.tests.filter(t => t.id !== testId);
        DB.save(db);
        Views.renderTestManagement(); // Re-render the view
    }
}

function promptToken(testId) {
    const db = DB.get();
    const test = db.tests.find(t => t.id === testId);
    const modal = document.getElementById('token-modal');
    document.getElementById('token-modal-title').textContent = `Untuk memulai "${test.title}"`;
    modal.classList.add('show');
    
    const form = document.getElementById('token-form');
    // Clone and replace to remove old event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputToken = document.getElementById('test-token').value;
        if (inputToken === test.token) {
            window.location.href = `ujian.html?testid=${testId}`;
        } else {
            alert('Token salah!');
        }
    });
    document.getElementById('cancel-token-btn').addEventListener('click', () => modal.classList.remove('show'));
}

// === MODULE 3: VIEW RENDERERS ===
// This object holds all functions that render content into the main area
const Views = {
    _container: null,
    setContainer(container) { this._container = container; },
    
    renderAdminDashboard() {
        const db = DB.get();
        this._container.innerHTML = `
            <div class="content-header"><h1>Dashboard Admin</h1></div>
            <div class="card">
                <h2>Statistik Sistem</h2>
                <p>Total Pengguna: ${db.users.length}</p>
                <p>Total Soal di Bank: ${db.questionBank.length}</p>
                <p>Total Ujian Dibuat: ${db.tests.length}</p>
                <p>Total Sesi Ujian Selesai: ${db.sessions.length}</p>
            </div>
        `;
    },

    renderQuestionBank() {
        const db = DB.get();
        this._container.innerHTML = `
            <div class="content-header"><h1>Bank Soal</h1></div>
            <div class="card">
                <h2>Tambah Soal Baru</h2>
                <form id="add-question-form">
                    <div class="form-group"><label for="q-subject">Mata Pelajaran</label><input type="text" id="q-subject" required></div>
                    <div class="form-group"><label for="q-text">Teks Pertanyaan</label><textarea id="q-text" required></textarea></div>
                    <div class="form-group"><label>Pilihan Jawaban (tandai yang benar)</label>
                        <div id="q-options-container">
                            <div style="display: flex; align-items: center; margin-bottom: 5px;"><input type="radio" name="correct-option" value="0" checked style="width: auto; margin-right: 10px;"><input type="text" placeholder="Pilihan A" class="option-text" required></div>
                            <div style="display: flex; align-items: center; margin-bottom: 5px;"><input type="radio" name="correct-option" value="1" style="width: auto; margin-right: 10px;"><input type="text" placeholder="Pilihan B" class="option-text" required></div>
                        </div>
                        <button type="button" id="add-option-btn" class="btn btn-secondary btn-sm" style="margin-top: 10px;">Tambah Pilihan</button>
                    </div>
                    <button type="submit" class="btn btn-primary">Simpan Soal</button>
                </form>
            </div>
            <div class="card" style="margin-top: 20px;">
                <h2>Daftar Soal</h2>
                <table id="questions-table">
                    <thead><tr><th>ID</th><th>Mata Pelajaran</th><th>Pertanyaan</th><th>Aksi</th></tr></thead>
                    <tbody>${db.questionBank.map(q => `
                        <tr>
                            <td>${q.id}</td><td>${q.subject}</td><td>${q.text.substring(0, 50)}...</td>
                            <td class="actions"><button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q.id}')">Hapus</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;

        // Attach event listeners AFTER content is rendered
        document.getElementById('add-option-btn').addEventListener('click', () => {
            const container = document.getElementById('q-options-container');
            const index = container.children.length;
            container.insertAdjacentHTML('beforeend', `<div style="display: flex; align-items: center; margin-bottom: 5px;"><input type="radio" name="correct-option" value="${index}" style="width: auto; margin-right: 10px;"><input type="text" placeholder="Pilihan ${String.fromCharCode(65 + index)}" class="option-text" required></div>`);
        });
        
        document.getElementById('add-question-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const newQuestion = { 
                id: `q${Date.now()}`,
                subject: e.target['q-subject'].value, 
                text: e.target['q-text'].value,
                options: [...document.querySelectorAll('.option-text')].map(input => input.value), 
                correct: parseInt(document.querySelector('input[name="correct-option"]:checked').value)
            };
            const currentDb = DB.get();
            currentDb.questionBank.push(newQuestion);
            DB.save(currentDb);
            this.renderQuestionBank(); // Re-render view
        });
    },

    renderTestManagement() {
        const db = DB.get();
        this._container.innerHTML = `
            <div class="content-header"><h1>Manajemen Ujian</h1></div>
            <div class="card">
                <h2>Buat Ujian Baru</h2>
                <form id="add-test-form">
                    <div class="form-group"><label for="t-title">Judul Ujian</label><input type="text" id="t-title" required></div>
                    <div class="form-group"><label for="t-duration">Durasi (menit)</label><input type="number" id="t-duration" required></div>
                    <div class="form-group"><label for="t-token">Token</label><input type="text" id="t-token" required></div>
                    <div class="form-group"><label>Pilih Soal</label><div id="test-questions-container" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">
                        ${db.questionBank.length > 0 ? db.questionBank.map(q => `<div><input type="checkbox" name="questions" value="${q.id}"> ${q.text.substring(0, 70)}... (${q.subject})</div>`).join('') : '<p>Belum ada soal di bank soal.</p>'}
                    </div></div>
                    <button type="submit" class="btn btn-primary">Simpan Ujian</button>
                </form>
            </div>
            <div class="card" style="margin-top: 20px;">
                <h2>Daftar Ujian</h2>
                <table id="tests-table">
                    <thead><tr><th>ID</th><th>Judul</th><th>Jumlah Soal</th><th>Token</th><th>Aksi</th></tr></thead>
                    <tbody>${db.tests.map(t => `
                        <tr>
                            <td>${t.id}</td><td>${t.title}</td><td>${t.questionIds.length}</td><td>${t.token}</td>
                            <td class="actions"><button class="btn btn-danger btn-sm" onclick="deleteTest('${t.id}')">Hapus</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;

        document.getElementById('add-test-form').addEventListener('submit', e => {
            e.preventDefault();
            const questionIds = [...document.querySelectorAll('input[name="questions"]:checked')].map(input => input.value);
            if (questionIds.length === 0) { alert('Pilih setidaknya satu soal!'); return; }
            const newTest = { 
                id: `test_${Date.now()}`, 
                title: e.target['t-title'].value, 
                duration: parseInt(e.target['t-duration'].value), 
                token: e.target['t-token'].value, 
                questionIds 
            };
            const currentDb = DB.get();
            currentDb.tests.push(newTest);
            DB.save(currentDb);
            this.renderTestManagement();
        });
    },
    
    renderResults() {
        const db = DB.get();
        this._container.innerHTML = `
            <div class="content-header"><h1>Hasil Ujian</h1></div>
            <div class="card"><h2>Semua Sesi Ujian</h2>
            <table><thead><tr><th>Siswa</th><th>Ujian</th><th>Skor</th><th>Waktu Selesai</th><th>Log Kecurangan</th></tr></thead>
            <tbody>${db.sessions.map(s => {
                const user = db.users.find(u => u.id === s.userId) || { nama: 'N/A' };
                const test = db.tests.find(t => t.id === s.testId) || { title: 'Ujian Dihapus' };
                return `
                <tr>
                    <td>${user.nama}</td><td>${test.title}</td><td>${s.score}</td>
                    <td>${new Date(s.completedAt).toLocaleString('id-ID')}</td>
                    <td>${s.cheatingLogs.length > 0 ? `<span class="status-danger">${s.cheatingLogs.length} kali</span>` : '<span class="status-ok">Tidak ada</span>'}</td>
                </tr>`}).join('')}
            </tbody></table></div>`;
    },

    renderStudentDashboard() {
        const db = DB.get();
        this._container.innerHTML = `
            <div class="content-header"><h1>Daftar Ujian Tersedia</h1></div>
            <div class="card">
                <table><thead><tr><th>Judul Ujian</th><th>Jumlah Soal</th><th>Durasi</th><th>Aksi</th></tr></thead>
                <tbody>${db.tests.map(t => `
                    <tr>
                        <td>${t.title}</td><td>${t.questionIds.length}</td><td>${t.duration} menit</td>
                        <td><button class="btn btn-primary" onclick="promptToken('${t.id}')">Kerjakan</button></td>
                    </tr>`).join('')}
                </tbody></table>
            </div>`;
    },

    renderStudentHistory() {
        const user = Auth.getCurrentUser();
        const db = DB.get();
        const mySessions = db.sessions.filter(s => s.userId === user.id);
        this._container.innerHTML = `
            <div class="content-header"><h1>Riwayat Ujian Saya</h1></div>
            <div class="card">
            <table><thead><tr><th>Ujian</th><th>Skor</th><th>Waktu Selesai</th></tr></thead><tbody>
                ${mySessions.length > 0 ? mySessions.map(s => {
                    const test = db.tests.find(t => t.id === s.testId) || { title: 'Ujian Dihapus' };
                    return `<tr><td>${test.title}</td><td>${s.score}</td><td>${new Date(s.completedAt).toLocaleString('id-ID')}</td></tr>`
                }).join('') : '<tr><td colspan="3">Anda belum mengerjakan ujian apapun.</td></tr>'}
            </tbody></table></div>`;
    }
};

// === ROUTER & PAGE INITIALIZERS ===
document.addEventListener('DOMContentLoaded', () => {
    DB.init();
    const pageId = document.body.id;

    switch (pageId) {
        case 'page-login':
            document.getElementById('login-form').addEventListener('submit', (e) => {
                e.preventDefault();
                if (Auth.login(e.target.username.value, e.target.password.value)) {
                    window.location.href = 'admin.html';
                } else {
                    alert('Username atau password salah!');
                }
            });
            break;

        case 'page-dashboard':
            Auth.protectPage();
            const user = Auth.getCurrentUser();
            Views.setContainer(document.getElementById('main-content-area'));
            document.getElementById('user-display').textContent = `Masuk sebagai: ${user.nama}`;
            document.getElementById('logout-btn').addEventListener('click', Auth.logout);

            const navConfig = {
                admin: [
                    { name: 'Dashboard', view: Views.renderAdminDashboard.bind(Views) },
                    { name: 'Bank Soal', view: Views.renderQuestionBank.bind(Views) },
                    { name: 'Manajemen Ujian', view: Views.renderTestManagement.bind(Views) },
                    { name: 'Hasil Ujian', view: Views.renderResults.bind(Views) }
                ],
                student: [
                    { name: 'Daftar Ujian', view: Views.renderStudentDashboard.bind(Views) },
                    { name: 'Riwayat Ujian', view: Views.renderStudentHistory.bind(Views) }
                ]
            };
            const sidebarNav = document.getElementById('sidebar-nav');
            sidebarNav.innerHTML = navConfig[user.role].map((item, index) => `<li class="${index === 0 ? 'active' : ''}" data-view-name="${item.name}"><a>${item.name}</a></li>`).join('');
            
            navConfig[user.role][0].view(); // Render initial view

            sidebarNav.addEventListener('click', e => {
                const li = e.target.closest('li');
                if (li) {
                    document.querySelector('#sidebar-nav li.active').classList.remove('active');
                    li.classList.add('active');
                    navConfig[user.role].find(item => item.name === li.dataset.viewName).view();
                }
            });
            break;

        case 'page-ujian':
            Auth.protectPage(['student']);
            // The rest of this logic is complex and self-contained
            const state = {
                test: null, questions: [], answers: [], currentQuestionIndex: 0,
                timeLeft: 0, timerInterval: null, cheatingLogs: []
            };

            const urlParams = new URLSearchParams(window.location.search);
            const testId = urlParams.get('testid');
            const db = DB.get();
            state.test = db.tests.find(t => t.id === testId);
            if (!state.test) { alert("Ujian tidak ditemukan!"); window.location.href = 'admin.html'; return; }
            state.questions = state.test.questionIds.map(id => db.questionBank.find(q => q.id === id)).filter(Boolean);
            state.answers = new Array(state.questions.length).fill(null);
            state.timeLeft = state.test.duration * 60;
            
            const userUjian = Auth.getCurrentUser();
            document.getElementById('test-title').textContent = state.test.title;
            document.getElementById('student-name').textContent = `Siswa: ${userUjian.nama}`;

            const renderUjianQuestion = () => {
                const q = state.questions[state.currentQuestionIndex];
                document.getElementById('question-number').textContent = state.currentQuestionIndex + 1;
                document.getElementById('question-text').textContent = q.text;
                document.getElementById('answer-options').innerHTML = q.options.map((opt, i) =>
                    `<div class="option"><input type="radio" id="opt${i}" name="answer" value="${i}" ${state.answers[state.currentQuestionIndex] === i ? 'checked' : ''}><label for="opt${i}">${String.fromCharCode(65 + i)}. ${opt}</label></div>`
                ).join('');
                document.querySelectorAll('input[name="answer"]').forEach(r => r.addEventListener('change', () => { state.answers[state.currentQuestionIndex] = parseInt(r.value); renderUjianNav(); }));
            };
            const renderUjianNav = () => {
                document.getElementById('question-grid').innerHTML = state.questions.map((_, i) => `<button class="q-nav-btn ${i === state.currentQuestionIndex ? 'current' : ''} ${state.answers[i] !== null ? 'answered' : ''}" data-index="${i}">${i + 1}</button>`).join('');
                document.querySelectorAll('.q-nav-btn').forEach(b => b.addEventListener('click', () => { state.currentQuestionIndex = parseInt(b.dataset.index); renderUjianQuestion(); renderUjianNav(); }));
                document.getElementById('btn-prev').disabled = state.currentQuestionIndex === 0;
                document.getElementById('btn-next').disabled = state.currentQuestionIndex === state.questions.length - 1;
            };
            const finishTest = () => {
                clearInterval(state.timerInterval);
                const score = state.answers.reduce((acc, ans, i) => acc + (ans === state.questions[i].correct ? 1 : 0), 0);
                const finalScore = (score / state.questions.length) * 100;
                const db = DB.get();
                const newSession = { sessionId: `sess_${Date.now()}`, testId: state.test.id, userId: userUjian.id, answers: state.answers, score: finalScore.toFixed(2), status: "completed", cheatingLogs: state.cheatingLogs, completedAt: new Date().toISOString() };
                db.sessions.push(newSession);
                DB.save(db);
                window.location.href = `hasil.html?sessionid=${newSession.sessionId}`;
            };
            
            // Initial render
            renderUjianQuestion();
            renderUjianNav();
            
            // Start Timer
            state.timerInterval = setInterval(() => {
                state.timeLeft--;
                const m = Math.floor(state.timeLeft / 60);
                const s = state.timeLeft % 60;
                document.getElementById('timer').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                if (state.timeLeft <= 0) finishTest();
            }, 1000);

            // Event Listeners
            document.getElementById('btn-next').addEventListener('click', () => { if(state.currentQuestionIndex < state.questions.length - 1) { state.currentQuestionIndex++; renderUjianQuestion(); renderUjianNav(); }});
            document.getElementById('btn-prev').addEventListener('click', () => { if(state.currentQuestionIndex > 0) { state.currentQuestionIndex--; renderUjianQuestion(); renderUjianNav(); }});
            document.getElementById('btn-finish').addEventListener('click', () => document.getElementById('finish-modal').classList.add('show'));
            document.getElementById('confirm-finish-btn').addEventListener('click', finishTest);
            document.getElementById('cancel-finish-btn').addEventListener('click', () => document.getElementById('finish-modal').classList.remove('show'));
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    state.cheatingLogs.push({ timestamp: new Date().toISOString(), event: 'Pindah Tab' });
                    document.getElementById('cheat-warning-modal').classList.add('show');
                }
            });
            document.getElementById('ack-warning-btn').addEventListener('click', () => document.getElementById('cheat-warning-modal').classList.remove('show'));
            window.addEventListener('contextmenu', e => e.preventDefault());
            break;
            
        case 'page-hasil':
            Auth.protectPage();
            const resultUrlParams = new URLSearchParams(window.location.search);
            const sessionId = resultUrlParams.get('sessionid');
            const resultDb = DB.get();
            const session = resultDb.sessions.find(s => s.sessionId === sessionId);
            const test = resultDb.tests.find(t => t.id === session.testId);
            const resultUser = resultDb.users.find(u => u.id === session.userId);
            
            document.getElementById('result-container').innerHTML = `
                <h1>Ujian Selesai!</h1><p>Terima kasih, ${resultUser.nama}, telah menyelesaikan ujian.</p><hr style="margin: 20px 0;">
                <h2>${test.title}</h2><h3>Nilai Akhir Anda:</h3><h1 style="font-size: 48px; color: var(--primary-blue);">${session.score}</h1>
                ${session.cheatingLogs.length > 0 ? `<p style="color: var(--danger); margin-top: 15px;">Terdeteksi ${session.cheatingLogs.length} kali aktivitas mencurigakan.</p>` : ''}
                <a href="admin.html" class="btn btn-primary" style="margin-top: 30px;">Kembali ke Dashboard</a>`;
            break;
    }
});

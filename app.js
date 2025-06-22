// app.js

// === DATABASE MODULE (using localStorage) ===
const DB = {
    // Initializes the database with default data if it doesn't exist.
    init() {
        if (!localStorage.getItem('cbt_database')) {
            console.log("Creating initial database...");
            const defaultData = {
                users: [
                    { id: 1, username: "admin", password: "admin123", role: "admin", nama: "Administrator" },
                    { id: 2, username: "siswa", password: "siswa123", role: "student", nama: "Budi Santoso" }
                ],
                questionBank: [
                    { id: 'q1', subject: "Pengetahuan Umum", text: "Ibukota negara Indonesia adalah...", options: ["Bandung", "Surabaya", "Jakarta", "Medan"], correct: 2 },
                    { id: 'q2', subject: "Matematika", text: "Berapakah hasil dari 15 + 25 x 2?", options: ["80", "65", "50", "100"], correct: 1 },
                    { id: 'q3', subject: "Pengetahuan Umum", text: "Siapakah presiden pertama Republik Indonesia?", options: ["Soeharto", "B.J. Habibie", "Abdurrahman Wahid", "Soekarno"], correct: 3 },
                ],
                tests: [],
                sessions: []
            };
            this.save(defaultData);
        }
    },
    // Retrieves the entire database object from localStorage.
    get() {
        return JSON.parse(localStorage.getItem('cbt_database'));
    },
    // Saves the entire database object to localStorage.
    save(data) {
        localStorage.setItem('cbt_database', JSON.stringify(data));
    }
};

// === AUTHENTICATION MODULE (using sessionStorage for logged-in user) ===
const Auth = {
    // Logs a user in by checking credentials and setting session storage.
    login(username, password) {
        const db = DB.get();
        const user = db.users.find(u => u.username === username && u.password === password);
        if (user) {
            sessionStorage.setItem('loggedInUser', JSON.stringify(user));
            return user;
        }
        return null;
    },
    // Logs a user out by clearing session storage.
    logout() {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    },
    // Retrieves the currently logged-in user's data.
    getCurrentUser() {
        return JSON.parse(sessionStorage.getItem('loggedInUser'));
    },
    // Protects a page by redirecting if no user is logged in.
    protectPage() {
        if (!this.getCurrentUser()) {
            window.location.href = 'index.html';
        }
    }
};

// === ROUTER (Determines which page-specific function to run) ===
document.addEventListener('DOMContentLoaded', () => {
    DB.init(); // Always make sure DB exists

    const path = window.location.pathname.split('/').pop();

    if (path === 'index.html' || path === '') {
        initLoginPage();
    } else if (path === 'admin.html') {
        initAdminPage();
    } else if (path === 'ujian.html') {
        initUjianPage();
    } else if (path === 'hasil.html') {
        initHasilPage();
    }
});


// === PAGE INITIALIZATION FUNCTIONS ===

function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        const user = Auth.login(username, password);
        if (user) {
            window.location.href = 'admin.html'; // Both admin and student go to the main dashboard
        } else {
            alert('Username atau password salah!');
        }
    });
}

function initAdminPage() {
    Auth.protectPage();
    const user = Auth.getCurrentUser();
    const mainContent = document.getElementById('main-content-area');
    const sidebarNav = document.getElementById('sidebar-nav');
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');

    userDisplay.textContent = `Masuk sebagai: ${user.nama}`;
    logoutBtn.addEventListener('click', Auth.logout);

    // Dynamic Sidebar and Content Rendering
    const views = {
        admin: [
            { name: 'Dashboard', render: renderAdminDashboard },
            { name: 'Bank Soal', render: renderQuestionBank },
            { name: 'Manajemen Ujian', render: renderTestManagement },
            { name: 'Hasil Ujian', render: renderResults }
        ],
        student: [
            { name: 'Daftar Ujian', render: renderStudentDashboard },
            { name:g: 'Riwayat Ujian', render: renderStudentHistory }
        ]
    };

    const userViews = views[user.role];

    sidebarNav.innerHTML = userViews.map((view, index) =>
        `<li class="${index === 0 ? 'active' : ''}" data-view="${view.name}"><a>${view.name}</a></li>`
    ).join('');

    // Initial view
    userViews[0].render(mainContent);

    sidebarNav.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (li) {
            document.querySelector('#sidebar-nav li.active').classList.remove('active');
            li.classList.add('active');
            const viewName = li.dataset.view;
            const view = userViews.find(v => v.name === viewName);
            view.render(mainContent);
        }
    });
}

function initUjianPage() {
    Auth.protectPage();
    const user = Auth.getCurrentUser();
    
    // UI Elements
    const testTitleEl = document.getElementById('test-title');
    const studentNameEl = document.getElementById('student-name');
    const timerEl = document.getElementById('timer');
    const questionNumberEl = document.getElementById('question-number');
    const questionTextEl = document.getElementById('question-text');
    const answerOptionsEl = document.getElementById('answer-options');
    const questionGridEl = document.getElementById('question-grid');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnFlag = document.getElementById('btn-flag');
    const btnFinish = document.getElementById('btn-finish');
    const finishModal = document.getElementById('finish-modal');
    const cheatWarningModal = document.getElementById('cheat-warning-modal');

    // State
    let test, questions, answers, currentQuestionIndex = 0, timeLeft, timerInterval, cheatingLogs = [];

    // Functions
    function loadTest() {
        const urlParams = new URLSearchParams(window.location.search);
        const testId = urlParams.get('testid');
        const db = DB.get();
        test = db.tests.find(t => t.id === testId);
        questions = test.questionIds.map(id => db.questionBank.find(q => q.id === id));
        answers = new Array(questions.length).fill(null);
        timeLeft = test.duration * 60;
        
        testTitleEl.textContent = test.title;
        studentNameEl.textContent = `Siswa: ${user.nama}`;
        
        renderQuestion(currentQuestionIndex);
        renderNavigation();
        startTimer();
    }
    
    function renderQuestion(index) {
        const question = questions[index];
        questionNumberEl.textContent = index + 1;
        questionTextEl.textContent = question.text;
        answerOptionsEl.innerHTML = question.options.map((opt, i) => `
            <div class="option">
                <input type="radio" id="opt${i}" name="answer" value="${i}" ${answers[index] === i ? 'checked' : ''}>
                <label for="opt${i}">${String.fromCharCode(65 + i)}. ${opt}</label>
            </div>
        `).join('');
        
        document.querySelectorAll('input[name="answer"]').forEach(radio => {
            radio.addEventListener('change', () => { answers[index] = parseInt(radio.value); renderNavigation(); });
        });
        updateControlButtons();
    }
    
    function renderNavigation() {
        questionGridEl.innerHTML = questions.map((_, i) => `
            <button class="q-nav-btn ${i === currentQuestionIndex ? 'current' : ''} ${answers[i] !== null ? 'answered' : ''}" data-index="${i}">${i + 1}</button>
        `).join('');
        document.querySelectorAll('.q-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => { currentQuestionIndex = parseInt(btn.dataset.index); renderQuestion(currentQuestionIndex); renderNavigation(); });
        });
    }

    function updateControlButtons() {
        btnPrev.disabled = currentQuestionIndex === 0;
        btnNext.disabled = currentQuestionIndex === questions.length - 1;
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            if (timeLeft <= 0) finishTest();
        }, 1000);
    }
    
    function finishTest() {
        clearInterval(timerInterval);
        let score = 0;
        answers.forEach((ans, i) => {
            if (ans === questions[i].correct) score++;
        });
        const finalScore = (score / questions.length) * 100;
        
        const db = DB.get();
        const newSession = {
            sessionId: `sess_${Date.now()}`,
            testId: test.id,
            userId: user.id,
            answers,
            score: finalScore.toFixed(2),
            status: "completed",
            cheatingLogs,
            completedAt: new Date().toISOString()
        };
        db.sessions.push(newSession);
        DB.save(db);
        
        window.location.href = `hasil.html?sessionid=${newSession.sessionId}`;
    }

    // Event Listeners
    btnNext.addEventListener('click', () => { if(currentQuestionIndex < questions.length - 1) { currentQuestionIndex++; renderQuestion(currentQuestionIndex); renderNavigation(); }});
    btnPrev.addEventListener('click', () => { if(currentQuestionIndex > 0) { currentQuestionIndex--; renderQuestion(currentQuestionIndex); renderNavigation(); }});
    btnFinish.addEventListener('click', () => finishModal.classList.add('show'));
    document.getElementById('confirm-finish-btn').addEventListener('click', finishTest);
    document.getElementById('cancel-finish-btn').addEventListener('click', () => finishModal.classList.remove('show'));

    // Cheating detection
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cheatingLogs.push({ timestamp: new Date().toISOString(), event: 'Pindah Tab' });
            cheatWarningModal.classList.add('show');
        }
    });
    document.getElementById('ack-warning-btn').addEventListener('click', () => cheatWarningModal.classList.remove('show'));
    window.addEventListener('contextmenu', e => e.preventDefault());

    loadTest();
}

function initHasilPage() {
    Auth.protectPage();
    const user = Auth.getCurrentUser();
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionid');
    const db = DB.get();
    const session = db.sessions.find(s => s.sessionId === sessionId);
    const test = db.tests.find(t => t.id === session.testId);
    
    const resultContainer = document.getElementById('result-container');
    resultContainer.innerHTML = `
        <h1>Ujian Selesai!</h1>
        <p>Terima kasih, ${user.nama}, telah menyelesaikan ujian.</p>
        <hr style="margin: 20px 0;">
        <h2>${test.title}</h2>
        <h3>Nilai Akhir Anda:</h3>
        <h1 style="font-size: 48px; color: var(--primary-blue);">${session.score}</h1>
        ${session.cheatingLogs.length > 0 ? `<p style="color: var(--danger); margin-top: 15px;">Terdeteksi ${session.cheatingLogs.length} kali aktivitas mencurigakan.</p>` : ''}
        <a href="admin.html" class="btn btn-primary" style="margin-top: 30px;">Kembali ke Dashboard</a>
    `;
}

// === ADMIN/STUDENT VIEW RENDERER FUNCTIONS ===
// These functions generate HTML and inject it into the main content area.

function renderAdminDashboard(container) {
    const db = DB.get();
    container.innerHTML = `
        <div class="content-header"><h1>Dashboard Admin</h1></div>
        <div class="card">
            <h2>Statistik Sistem</h2>
            <p>Total Pengguna: ${db.users.length}</p>
            <p>Total Soal di Bank: ${db.questionBank.length}</p>
            <p>Total Ujian Dibuat: ${db.tests.length}</p>
            <p>Total Sesi Ujian Selesai: ${db.sessions.length}</p>
        </div>
    `;
}

function renderQuestionBank(container) {
    const db = DB.get();
    container.innerHTML = `
        <div class="content-header"><h1>Bank Soal</h1></div>
        <div class="card">
            <h2>Tambah Soal Baru</h2>
            <form id="add-question-form">
                <div class="form-group"><label for="q-subject">Mata Pelajaran</label><input type="text" id="q-subject" required></div>
                <div class="form-group"><label for="q-text">Teks Pertanyaan</label><textarea id="q-text" required></textarea></div>
                <div class="form-group"><label>Pilihan Jawaban (tandai yang benar)</label>
                    <div id="q-options-container">
                        <div class="option-input"><input type="radio" name="correct-option" value="0" checked><input type="text" placeholder="Pilihan A" class="option-text"></div>
                        <div class="option-input"><input type="radio" name="correct-option" value="1"><input type="text" placeholder="Pilihan B" class="option-text"></div>
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
                <tbody></tbody>
            </table>
        </div>
    `;

    const qTableBody = container.querySelector('#questions-table tbody');
    qTableBody.innerHTML = db.questionBank.map(q => `
        <tr>
            <td>${q.id}</td>
            <td>${q.subject}</td>
            <td>${q.text.substring(0, 50)}...</td>
            <td class="actions"><button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q.id}')">Hapus</button></td>
        </tr>
    `).join('');

    // Event listeners for question form
    document.getElementById('add-option-btn').addEventListener('click', () => {
        const container = document.getElementById('q-options-container');
        const index = container.children.length;
        container.insertAdjacentHTML('beforeend', `
            <div class="option-input"><input type="radio" name="correct-option" value="${index}"><input type="text" placeholder="Pilihan ${String.fromCharCode(65 + index)}" class="option-text"></div>
        `);
    });
    
    document.getElementById('add-question-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const subject = e.target['q-subject'].value;
        const text = e.target['q-text'].value;
        const options = [...document.querySelectorAll('.option-text')].map(input => input.value);
        const correct = parseInt(document.querySelector('input[name="correct-option"]:checked').value);
        
        const newQuestion = { id: `q${Date.now()}`, subject, text, options, correct };
        const currentDb = DB.get();
        currentDb.questionBank.push(newQuestion);
        DB.save(currentDb);
        renderQuestionBank(container); // Re-render view
    });
}

function deleteQuestion(questionId) {
    if (confirm('Anda yakin ingin menghapus soal ini?')) {
        const db = DB.get();
        db.questionBank = db.questionBank.filter(q => q.id !== questionId);
        // Also remove from any tests
        db.tests.forEach(test => {
            test.questionIds = test.questionIds.filter(id => id !== questionId);
        });
        DB.save(db);
        renderQuestionBank(document.getElementById('main-content-area'));
    }
}

function renderTestManagement(container) {
    const db = DB.get();
    container.innerHTML = `
        <div class="content-header"><h1>Manajemen Ujian</h1></div>
        <div class="card">
            <h2>Buat Ujian Baru</h2>
            <form id="add-test-form">
                <div class="form-group"><label for="t-title">Judul Ujian</label><input type="text" id="t-title" required></div>
                <div class="form-group"><label for="t-duration">Durasi (menit)</label><input type="number" id="t-duration" required></div>
                <div class="form-group"><label for="t-token">Token</label><input type="text" id="t-token" required></div>
                <div class="form-group">
                    <label>Pilih Soal (dari Bank Soal)</label>
                    <div id="test-questions-container" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">
                        ${db.questionBank.map(q => `<div><input type="checkbox" name="questions" value="${q.id}"> ${q.text.substring(0, 70)}... (${q.subject})</div>`).join('')}
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">Simpan Ujian</button>
            </form>
        </div>
        <div class="card" style="margin-top: 20px;">
            <h2>Daftar Ujian</h2>
            <table id="tests-table">
                <thead><tr><th>ID</th><th>Judul</th><th>Jumlah Soal</th><th>Token</th><th>Aksi</th></tr></thead>
                <tbody>
                    ${db.tests.map(t => `
                        <tr>
                            <td>${t.id}</td>
                            <td>${t.title}</td>
                            <td>${t.questionIds.length}</td>
                            <td>${t.token}</td>
                            <td class="actions"><button class="btn btn-danger btn-sm" onclick="deleteTest('${t.id}')">Hapus</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('add-test-form').addEventListener('submit', e => {
        e.preventDefault();
        const title = e.target['t-title'].value;
        const duration = parseInt(e.target['t-duration'].value);
        const token = e.target['t-token'].value;
        const questionIds = [...document.querySelectorAll('input[name="questions"]:checked')].map(input => input.value);
        
        if (questionIds.length === 0) {
            alert('Pilih setidaknya satu soal!');
            return;
        }

        const newTest = { id: `test_${Date.now()}`, title, duration, token, questionIds };
        const currentDb = DB.get();
        currentDb.tests.push(newTest);
        DB.save(currentDb);
        renderTestManagement(container);
    });
}

function deleteTest(testId) {
     if (confirm('Anda yakin ingin menghapus ujian ini? Sesi yang terkait tidak akan dihapus.')) {
        const db = DB.get();
        db.tests = db.tests.filter(t => t.id !== testId);
        DB.save(db);
        renderTestManagement(document.getElementById('main-content-area'));
    }
}

function renderResults(container) {
    const db = DB.get();
    container.innerHTML = `
        <div class="content-header"><h1>Hasil Ujian</h1></div>
        <div class="card">
            <h2>Semua Sesi Ujian</h2>
            <table>
                <thead><tr><th>Siswa</th><th>Ujian</th><th>Skor</th><th>Waktu Selesai</th><th>Log Kecurangan</th></tr></thead>
                <tbody>
                    ${db.sessions.map(s => {
                        const user = db.users.find(u => u.id === s.userId);
                        const test = db.tests.find(t => t.id === s.testId);
                        return `
                        <tr>
                            <td>${user ? user.nama : 'N/A'}</td>
                            <td>${test ? test.title : 'Ujian Dihapus'}</td>
                            <td>${s.score}</td>
                            <td>${new Date(s.completedAt).toLocaleString('id-ID')}</td>
                            <td>${s.cheatingLogs.length > 0 ? `<span class="status-danger">${s.cheatingLogs.length} kali</span>` : '<span class="status-ok">Tidak ada</span>'}</td>
                        </tr>
                        `}).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderStudentDashboard(container) {
    const db = DB.get();
    container.innerHTML = `
        <div class="content-header"><h1>Daftar Ujian Tersedia</h1></div>
        <div class="card">
            <table>
                <thead><tr><th>Judul Ujian</th><th>Jumlah Soal</th><th>Durasi</th><th>Aksi</th></tr></thead>
                <tbody>
                    ${db.tests.map(t => `
                        <tr>
                            <td>${t.title}</td>
                            <td>${t.questionIds.length}</td>
                            <td>${t.duration} menit</td>
                            <td><button class="btn btn-primary" onclick="promptToken('${t.id}')">Kerjakan</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function promptToken(testId) {
    const db = DB.get();
    const test = db.tests.find(t => t.id === testId);
    const modal = document.getElementById('token-modal');
    document.getElementById('token-modal-title').textContent = `Untuk memulai ujian "${test.title}"`;
    modal.classList.add('show');
    
    const form = document.getElementById('token-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        const inputToken = document.getElementById('test-token').value;
        if (inputToken === test.token) {
            window.location.href = `ujian.html?testid=${testId}`;
        } else {
            alert('Token salah!');
        }
    };
    document.getElementById('cancel-token-btn').onclick = () => modal.classList.remove('show');
}

function renderStudentHistory(container) {
    const user = Auth.getCurrentUser();
    const db = DB.get();
    const mySessions = db.sessions.filter(s => s.userId === user.id);

    container.innerHTML = `
        <div class="content-header"><h1>Riwayat Ujian Saya</h1></div>
        <div class="card">
             <table>
                <thead><tr><th>Ujian</th><th>Skor</th><th>Waktu Selesai</th></tr></thead>
                <tbody>
                    ${mySessions.length > 0 ? mySessions.map(s => {
                        const test = db.tests.find(t => t.id === s.testId);
                        return `
                        <tr>
                            <td>${test ? test.title : 'Ujian Dihapus'}</td>
                            <td>${s.score}</td>
                            <td>${new Date(s.completedAt).toLocaleString('id-ID')}</td>
                        </tr>
                        `}).join('') : '<tr><td colspan="3">Anda belum mengerjakan ujian apapun.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

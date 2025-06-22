// app.js

document.addEventListener('DOMContentLoaded', () => {
    // === ROUTING LOGIC ===
    // This simple logic determines which page-specific function to run.
    if (document.body.classList.contains('login-page')) {
        initLoginPage();
    } else if (document.body.classList.contains('test-page')) {
        initTestPage();
    } else if (document.body.classList.contains('admin-page')) {
        initAdminPage();
    }
});


// === LOGIN PAGE LOGIC ===
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        // Simple validation
        if (username.toLowerCase().includes('admin')) {
            // Simulate admin login
             window.location.href = 'admin.html';
        } else if (username) {
            // Simulate student login
            window.location.href = 'ujian.html';
        } else {
            alert('Username tidak boleh kosong!');
        }
    });
}


// === ADMIN PAGE LOGIC ===
function initAdminPage() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Simulate logout
            window.location.href = 'login.html';
        });
    }
}


// === UJIAN/TEST PAGE LOGIC ===
function initTestPage() {
    // --- MOCK DATA ---
    const mockSoal = [
        { id: 1, pertanyaan: "Ibukota negara Indonesia adalah...", pilihan: ["Bandung", "Surabaya", "Jakarta", "Medan"], jawaban_benar: "C" },
        { id: 2, pertanyaan: "Berapakah hasil dari 15 + 25 x 2?", pilihan: ["80", "65", "50", "100"], jawaban_benar: "B" },
        { id: 3, pertanyaan: "Siapakah presiden pertama Republik Indonesia?", pilihan: ["Soeharto", "B.J. Habibie", "Abdurrahman Wahid", "Soekarno"], jawaban_benar: "D" },
        { id: 4, pertanyaan: "Lagu kebangsaan Indonesia adalah...", pilihan: ["Indonesia Pusaka", "Garuda Pancasila", "Indonesia Raya", "Bagimu Negeri"], jawaban_benar: "C" },
        { id: 5, pertanyaan: "Planet terdekat dengan Matahari adalah...", pilihan: ["Venus", "Mars", "Merkurius", "Bumi"], jawaban_benar: "C" },
        { id: 6, pertanyaan: "Rumus kimia untuk air adalah...", pilihan: ["H2O2", "CO2", "O2", "H2O"], jawaban_benar: "D" },
        { id: 7, pertanyaan: "Gunung tertinggi di dunia adalah...", pilihan: ["Gunung K2", "Gunung Everest", "Gunung Kilimanjaro", "Gunung Jaya Wijaya"], jawaban_benar: "B" },
        { id: 8, pertanyaan: "Valensi dari Oksigen (O) adalah...", pilihan: ["1", "2", "3", "4"], jawaban_benar: "B" },
        { id: 9, pertanyaan: "Benua terluas di dunia adalah...", pilihan: ["Afrika", "Eropa", "Amerika", "Asia"], jawaban_benar: "D" },
        { id: 10, pertanyaan: "Perangkat keras komputer yang berfungsi sebagai otak komputer disebut...", pilihan: ["RAM", "Hard Disk", "CPU", "Motherboard"], jawaban_benar: "C" },
    ];
    const DURASI_UJIAN_MENIT = 30;

    // --- STATE VARIABLES ---
    let currentQuestionIndex = 0;
    let jawabanSiswa = new Array(mockSoal.length).fill(null);
    let timeLeft = DURASI_UJIAN_MENIT * 60;
    let timerInterval;
    let cheatCounter = 0;

    // --- DOM ELEMENTS ---
    const questionNumberEl = document.getElementById('question-number');
    const questionTextEl = document.getElementById('question-text');
    const answerOptionsEl = document.getElementById('answer-options');
    const questionGridEl = document.getElementById('question-grid');
    
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnFlag = document.getElementById('btn-flag');
    const btnFinish = document.getElementById('btn-finish');

    const finishModal = document.getElementById('finish-modal');
    const confirmFinishBtn = document.getElementById('confirm-finish-btn');
    const cancelFinishBtn = document.getElementById('cancel-finish-btn');
    
    const cheatWarningModal = document.getElementById('cheat-warning-modal');
    const ackWarningBtn = document.getElementById('ack-warning-btn');

    // --- CORE FUNCTIONS ---
    function renderQuestion(index) {
        currentQuestionIndex = index;
        const soal = mockSoal[index];
        questionNumberEl.textContent = soal.id;
        questionTextEl.innerHTML = `<p>${soal.pertanyaan}</p>`;
        answerOptionsEl.innerHTML = '';

        Object.entries(soal.pilihan).forEach(([key, value], i) => {
            const optionChar = String.fromCharCode(65 + i); // A, B, C, D
            const isChecked = jawabanSiswa[index]?.jawaban === optionChar;
            
            answerOptionsEl.innerHTML += `
                <div class="option">
                    <input type="radio" id="opt${optionChar}" name="answer" value="${optionChar}" ${isChecked ? 'checked' : ''}>
                    <label for="opt${optionChar}">${optionChar}. ${value}</label>
                </div>
            `;
        });
        
        // Add event listener to new radio buttons
        document.querySelectorAll('input[name="answer"]').forEach(radio => {
            radio.addEventListener('change', saveAnswer);
        });

        updateNavigation();
        updateControlButtons();
    }

    function renderNavigation() {
        questionGridEl.innerHTML = '';
        mockSoal.forEach((soal, index) => {
            const btn = document.createElement('button');
            btn.className = 'q-nav-btn';
            btn.textContent = soal.id;
            btn.dataset.index = index;

            if (index === currentQuestionIndex) {
                btn.classList.add('current');
            }
            if (jawabanSiswa[index]?.jawaban) {
                btn.classList.add('answered');
            }
            if (jawabanSiswa[index]?.ragu) {
                btn.classList.add('flagged');
            }

            btn.addEventListener('click', () => {
                renderQuestion(index);
            });
            questionGridEl.appendChild(btn);
        });
    }

    function saveAnswer(e) {
        const selectedAnswer = e.target.value;
        if (!jawabanSiswa[currentQuestionIndex]) {
            jawabanSiswa[currentQuestionIndex] = {};
        }
        jawabanSiswa[currentQuestionIndex].jawaban = selectedAnswer;
        console.log('Jawaban disimpan:', jawabanSiswa);
        updateNavigation();
    }

    function updateControlButtons() {
        btnPrev.disabled = currentQuestionIndex === 0;
        btnNext.disabled = currentQuestionIndex === mockSoal.length - 1;
    }

    function startTimer() {
        const timerEl = document.getElementById('timer');
        timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                alert("Waktu habis! Ujian akan diselesaikan secara otomatis.");
                finishTest();
            }
        }, 1000);
    }
    
    function finishTest() {
        clearInterval(timerInterval);
        let skor = 0;
        jawabanSiswa.forEach((jawaban, index) => {
            if (jawaban && jawaban.jawaban === mockSoal[index].jawaban_benar) {
                skor++;
            }
        });
        const nilaiAkhir = (skor / mockSoal.length) * 100;
        
        document.body.innerHTML = `
            <div class="login-container" style="text-align: center;">
                <h1>Ujian Selesai!</h1>
                <p>Terima kasih telah menyelesaikan ujian.</p>
                <h2>Nilai Anda: ${nilaiAkhir.toFixed(2)}</h2>
                <a href="login.html" class="btn btn-primary" style="margin-top: 20px;">Kembali ke Halaman Login</a>
            </div>
        `;
    }

    // --- CHEATING DETECTION ---
    function handleVisibilityChange() {
        if (document.hidden) {
            cheatCounter++;
            console.warn(`PERINGATAN: Pengguna meninggalkan tab. Pelanggaran ke-${cheatCounter}`);
            cheatWarningModal.classList.add('show');
            // In a real app, send this event to the server
            // fetch('/api/log-cheating', { method: 'POST', body: JSON.stringify({ type: 'tab_switch' }) });
        }
    }


    // --- INITIALIZATION ---
    renderQuestion(0);
    renderNavigation();
    startTimer();

    // --- EVENT LISTENERS ---
    btnNext.addEventListener('click', () => {
        if (currentQuestionIndex < mockSoal.length - 1) {
            renderQuestion(currentQuestionIndex + 1);
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            renderQuestion(currentQuestionIndex - 1);
        }
    });

    btnFlag.addEventListener('click', () => {
        if (!jawabanSiswa[currentQuestionIndex]) {
            jawabanSiswa[currentQuestionIndex] = {};
        }
        jawabanSiswa[currentQuestionIndex].ragu = !jawabanSiswa[currentQuestionIndex].ragu;
        updateNavigation();
    });

    btnFinish.addEventListener('click', () => {
        finishModal.classList.add('show');
    });

    cancelFinishBtn.addEventListener('click', () => {
        finishModal.classList.remove('show');
    });

    confirmFinishBtn.addEventListener('click', () => {
        finishModal.classList.remove('show');
        finishTest();
    });
    
    ackWarningBtn.addEventListener('click', () => {
        cheatWarningModal.classList.remove('show');
    });

    // Add cheating detection listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Prevent context menu (right-click)
    window.addEventListener('contextmenu', e => e.preventDefault());
}

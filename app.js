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

// === MODULE 1: DATABASE ===
const DB = {
    init() {
        if (!localStorage.getItem('cbt_pro_database')) {
            const defaultData = {
                users: [{ id: 1, username: "admin", password: "admin123", role: "admin", nama: "Administrator" },{ id: 2, username: "siswa", password: "siswa123", role: "student", nama: "Budi Santoso" }],
                questionBank: [{ id: 'q1', subject: "Pengetahuan Umum", text: "Ibukota negara Indonesia adalah...", options: ["Bandung", "Surabaya", "Jakarta", "Medan"], correct: 2 },{ id: 'q2', subject: "Matematika", text: "Berapakah hasil dari 15 + 25 * 2?", options: ["80", "65", "50", "100"], correct: 1 },{ id: 'q3', subject: "Sains", text: "Planet manakah yang dikenal sebagai Planet Merah?", options: ["Venus", "Mars", "Jupiter", "Saturnus"], correct: 1 },{ id: 'q4', subject: "Sejarah", text: "Siapakah presiden pertama Republik Indonesia?", options: ["Soeharto", "B.J. Habibie", "Abdurrahman Wahid", "Soekarno"], correct: 3 },],
                tests: [], sessions: []
            };
            this.save(defaultData); console.log("Initial database created.");
        }
    },
    get() { return JSON.parse(localStorage.getItem('cbt_pro_database')); },
    save(data) { localStorage.setItem('cbt_pro_database', JSON.stringify(data)); }
};

// === MODULE 2: AUTHENTICATION ===
const Auth = {
    login(u,p) { const user = DB.get().users.find(usr => usr.username === u && usr.password === p); if(user){sessionStorage.setItem('loggedInUser', JSON.stringify(user)); return user;} return null; },
    logout() { sessionStorage.removeItem('loggedInUser'); window.location.href = 'index.html'; },
    getCurrentUser() { const u = sessionStorage.getItem('loggedInUser'); return u ? JSON.parse(u) : null; },
    protectPage(roles=[]) { const u = this.getCurrentUser(); if(!u){window.location.href='index.html'; return;} if(roles.length > 0 && !roles.includes(u.role)){alert('Anda tidak memiliki akses.'); window.location.href='admin.html';} }
};

// === MODULE 3: SESSION TRACKER ===
const Tracker = {
    _sessionData: null, _startTime: 0, _lastMove: 0,
    start(testId, userId) {
        this._startTime = Date.now();
        this._sessionData = { sessionId: `sess_${this._startTime}`, testId, userId, status: 'ongoing', startTime: new Date(this._startTime).toISOString(), answerHistory: {}, eventTimeline: [{ time: 0, type: "TEST_START" }], performanceMetrics: { timePerQuestion: {}, focusLossCount: 0 }, cursorTrack: [] };
        this.addEventListeners();
        console.log("Tracker started for session:", this._sessionData.sessionId);
    },
    logEvent(type, data = {}) { const time = Math.floor((Date.now() - this._startTime) / 1000); this._sessionData.eventTimeline.push({ time, type, data }); },
    logQuestionView(questionIndex, timeOnPrevQuestion) { if(questionIndex > 0) { const prevQIndex = questionIndex - 1; this._sessionData.performanceMetrics.timePerQuestion[prevQIndex] = (this._sessionData.performanceMetrics.timePerQuestion[prevQIndex] || 0) + timeOnPrevQuestion; } this.logEvent("VIEW_QUESTION", { questionIndex }); },
    logAnswerChange(questionId, questionIndex, answerIndex) { if (!this._sessionData.answerHistory[questionId]) { this._sessionData.answerHistory[questionId] = []; } this._sessionData.answerHistory[questionId].push({ selectedOption: answerIndex, timestamp: new Date().toISOString() }); this.logEvent("ANSWER_CHANGE", { questionIndex, answerIndex }); },
    handleMouseMove(e) { const now = Date.now(); if (now - this._lastMove > 200) { this._lastMove = now; const time = now - this._startTime; this._sessionData.cursorTrack.push([time, e.clientX, e.clientY]); } },
    addEventListeners() {
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('blur', () => { this.logEvent("FOCUS_LOST"); this._sessionData.performanceMetrics.focusLossCount++; });
        window.addEventListener('focus', () => this.logEvent("FOCUS_GAINED"));
        ['copy', 'paste', 'cut'].forEach(evt => document.addEventListener(evt, e => { e.preventDefault(); this.logEvent(`ATTEMPT_${evt.toUpperCase()}`); showToast('Aksi tidak diizinkan!','danger'); }));
    },
    stop(finalTimeOnQuestion) { this.logEvent("VIEW_QUESTION", {questionIndex: finalTimeOnQuestion.index}, finalTimeOnQuestion.time); this.logEvent("TEST_FINISH"); this._sessionData.status = 'completed'; this._sessionData.finishTime = new Date().toISOString(); window.removeEventListener('mousemove', this.handleMouseMove); return this._sessionData; }
};

// === MODULE 4: UI HELPERS & GLOBAL FUNCTIONS ===
function showToast(message, type = '') { const c = document.getElementById('toast-container'); if(!c) return; const t = document.createElement('div'); t.className=`toast ${type}`; t.textContent=message; c.appendChild(t); setTimeout(()=>t.classList.add('show'),10); setTimeout(()=>{t.classList.remove('show'); setTimeout(()=>t.remove(),500);},3000); }
function openTab(evt, tabName) { document.querySelectorAll(".tab-content").forEach(tc => tc.style.display = "none"); document.querySelectorAll(".tab-link").forEach(tl => tl.classList.remove("active")); document.getElementById(tabName).style.display = "block"; evt.currentTarget.classList.add("active"); }
function deleteQuestion(qId) { if(confirm('Hapus soal ini?')){const db=DB.get(); db.questionBank=db.questionBank.filter(q=>q.id!==qId);db.tests.forEach(t=>{t.questionIds=t.questionIds.filter(id=>id!==qId);}); DB.save(db); Views.renderQuestionBank(); showToast('Soal berhasil dihapus.', 'success');}}
function deleteTest(tId) { if(confirm('Hapus ujian ini?')){const db=DB.get(); db.tests=db.tests.filter(t=>t.id!==tId); DB.save(db); Views.renderTestManagement(); showToast('Ujian berhasil dihapus.', 'success');}}
function promptToken(tId) { const test=DB.get().tests.find(t=>t.id===tId); const modal=document.getElementById('token-modal'); document.getElementById('token-modal-title').textContent=`Untuk memulai "${test.title}"`; modal.classList.add('show'); const f=document.getElementById('token-form'); const nF=f.cloneNode(true); f.parentNode.replaceChild(nF,f); nF.addEventListener('submit',e=>{e.preventDefault();if(nF.querySelector('#test-token').value===test.token){window.location.href=`ujian.html?testid=${tId}`;}else{alert('Token salah!');}}); nF.querySelector('#cancel-token-btn').addEventListener('click',()=>modal.classList.remove('show'));}
function showSessionDetail(sessionId) { Views.renderSessionDetail(sessionId); }

// === MODULE 5: VIEW RENDERERS ===
const Views = {
    _container: null, setContainer(c){this._container=c;},
    renderAdminDashboard() {const db=DB.get();this._container.innerHTML=`<div class="content-header"><h1>Dashboard</h1></div><div class="stats-container"><div class="stat-card"><div class="icon blue">${Icons.users}</div><div class="info"><h3>${db.users.length}</h3><p>Total Pengguna</p></div></div><div class="stat-card"><div class="icon green">${Icons.bank}</div><div class="info"><h3>${db.questionBank.length}</h3><p>Soal di Bank</p></div></div><div class="stat-card"><div class="icon orange">${Icons.test}</div><div class="info"><h3>${db.tests.length}</h3><p>Ujian Dibuat</p></div></div></div>`;},
    renderQuestionBank() { const db=DB.get();this._container.innerHTML=`<div class="content-header"><h1>Bank Soal</h1></div><div class="card"><h2>Tambah Soal Baru</h2><form id="add-question-form"><div class="form-group"><label for="q-subject">Mata Pelajaran</label><input type="text" id="q-subject" required></div><div class="form-group"><label for="q-text">Teks Pertanyaan</label><textarea id="q-text" required></textarea></div><div class="form-group"><label>Pilihan Jawaban (tandai yang benar)</label><div id="q-options-container"><div style="display:flex;align-items:center;margin-bottom:5px;"><input type="radio" name="correct-option" value="0" checked style="width:auto;margin-right:10px;"><input type="text" placeholder="Pilihan A" class="option-text" required></div><div style="display:flex;align-items:center;margin-bottom:5px;"><input type="radio" name="correct-option" value="1" style="width:auto;margin-right:10px;"><input type="text" placeholder="Pilihan B" class="option-text" required></div></div><button type="button" id="add-option-btn" class="btn btn-secondary btn-sm" style="margin-top:10px;">Tambah Pilihan</button></div><button type="submit" class="btn btn-primary">Simpan Soal</button></form></div><div class="card" style="margin-top:20px;"><h2>Daftar Soal</h2><table><thead><tr><th>ID</th><th>Mata Pelajaran</th><th>Pertanyaan</th><th>Aksi</th></tr></thead><tbody>${db.questionBank.map(q=>`<tr><td>${q.id}</td><td>${q.subject}</td><td>${q.text.substring(0,50)}...</td><td class="actions"><button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q.id}')">Hapus</button></td></tr>`).join('')}</tbody></table></div>`;document.getElementById('add-option-btn').addEventListener('click',()=>{const c=document.getElementById('q-options-container');const i=c.children.length;c.insertAdjacentHTML('beforeend',`<div style="display:flex;align-items:center;margin-bottom:5px;"><input type="radio" name="correct-option" value="${i}" style="width:auto;margin-right:10px;"><input type="text" placeholder="Pilihan ${String.fromCharCode(65+i)}" class="option-text" required></div>`);});document.getElementById('add-question-form').addEventListener('submit',e=>{e.preventDefault();const nQ={id:`q${Date.now()}`,subject:e.target['q-subject'].value,text:e.target['q-text'].value,options:[...document.querySelectorAll('.option-text')].map(i=>i.value),correct:parseInt(document.querySelector('input[name="correct-option"]:checked').value)};const cdb=DB.get();cdb.questionBank.push(nQ);DB.save(cdb);this.renderQuestionBank();showToast('Soal berhasil disimpan.','success');});},
    renderTestManagement() { const db=DB.get();this._container.innerHTML=`<div class="content-header"><h1>Manajemen Ujian</h1></div><div class="card"><h2>Buat Ujian Baru</h2><form id="add-test-form"><div class="form-group"><label for="t-title">Judul Ujian</label><input type="text" id="t-title" required></div><div class="form-group"><label for="t-duration">Durasi (menit)</label><input type="number" id="t-duration" required></div><div class="form-group"><label for="t-token">Token</label><input type="text" id="t-token" required></div><div class="form-group"><label>Pilih Soal</label><div id="test-questions-container" style="max-height:200px;overflow-y:auto;border:1px solid #ddd;padding:10px;">${db.questionBank.length>0?db.questionBank.map(q=>`<div><input type="checkbox" name="questions" value="${q.id}"> ${q.text.substring(0,70)}... (${q.subject})</div>`).join(''):'<p>Belum ada soal di bank soal.</p>'}</div></div><button type="submit" class="btn btn-primary" ${db.questionBank.length===0?'disabled':''}>Simpan Ujian</button></form></div><div class="card" style="margin-top:20px;"><h2>Daftar Ujian</h2><table><thead><tr><th>ID</th><th>Judul</th><th>Jumlah Soal</th><th>Token</th><th>Aksi</th></tr></thead><tbody>${db.tests.map(t=>`<tr><td>${t.id}</td><td>${t.title}</td><td>${t.questionIds.length}</td><td>${t.token}</td><td class="actions"><button class="btn btn-danger btn-sm" onclick="deleteTest('${t.id}')">Hapus</button></td></tr>`).join('')}</tbody></table></div>`;document.getElementById('add-test-form').addEventListener('submit',e=>{e.preventDefault();const qIds=[...document.querySelectorAll('input[name="questions"]:checked')].map(i=>i.value);if(qIds.length===0){alert('Pilih setidaknya satu soal!');return;}const nT={id:`test_${Date.now()}`,title:e.target['t-title'].value,duration:parseInt(e.target['t-duration'].value),token:e.target['t-token'].value,questionIds:qIds};const cdb=DB.get();cdb.tests.push(nT);DB.save(cdb);this.renderTestManagement();showToast('Ujian berhasil dibuat.','success');});},
    renderResults() { const db=DB.get();this._container.innerHTML=`<div class="content-header"><h1>Hasil Ujian</h1></div><div class="card"><h2>Semua Sesi Ujian</h2><table><thead><tr><th>Siswa</th><th>Ujian</th><th>Skor</th><th>Aksi</th></tr></thead><tbody>${db.sessions.map(s=>{const u=db.users.find(usr=>usr.id===s.userId)||{nama:'N/A'};const t=db.tests.find(ts=>ts.id===s.testId)||{title:'Ujian Dihapus'};return`<tr><td>${u.nama}</td><td>${t.title}</td><td>${s.finalScore || 'N/A'}</td><td><button class="btn btn-primary btn-sm" onclick="showSessionDetail('${s.sessionId}')">Lihat Detail</button></td></tr>`}).join('')||'<tr><td colspan="4" style="text-align:center;">Belum ada sesi ujian yang selesai.</td></tr>'}</tbody></table></div>`;},
    renderSessionDetail(sessionId) {
        const db = DB.get(); const session = db.sessions.find(s => s.sessionId === sessionId); const user = db.users.find(u => u.id === session.userId); const test = db.tests.find(t => t.id === session.testId);
        // DEFENSIVE CHECK for old data structure
        const focusLossCount = session.performanceMetrics?.focusLossCount || 0;
        const score = session.finalScore || session.score || "N/A";
        this._container.innerHTML = `<div class="content-header"><h1>Analisis Sesi: ${user.nama}</h1><button class="btn btn-secondary" id="back-btn">Kembali ke Hasil</button></div><div class="card"><p><strong>Ujian:</strong> ${test.title} | <strong>Skor Akhir:</strong> ${score} | <strong>Pindah Tab:</strong> ${focusLossCount} kali</p></div><div class="tabs" style="margin-top:20px;"><button class="tab-link active" onclick="openTab(event, 'Timeline')">Timeline Kejadian</button><button class="tab-link" onclick="openTab(event, 'Answers')">Analisis Jawaban</button><button class="tab-link" onclick="openTab(event, 'Cursor')">Replay Kursor</button></div><div id="Timeline" class="tab-content card"></div><div id="Answers" class="tab-content card" style="display:none"></div><div id="Cursor" class="tab-content card" style="display:none"></div>`;
        document.getElementById('back-btn').addEventListener('click',()=>this.renderResults());
        this.renderTimelineTab(session, db); this.renderAnswersTab(session, db); this.renderCursorTab(session); document.querySelector('.tab-link').click();
    },
    formatTimelineEvent(event,testId){const formatTime=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;let desc;switch(event.type){case'TEST_START':desc='Ujian dimulai.';break;case'VIEW_QUESTION':desc=`Melihat soal #${event.data.questionIndex+1}.`;break;case'ANSWER_CHANGE':desc=`Menjawab soal #${event.data.questionIndex+1} dengan pilihan ${String.fromCharCode(65+event.data.answerIndex)}.`;break;case'FOCUS_LOST':desc='<span class="status-danger">PERINGATAN: Keluar dari halaman ujian.</span>';break;case'FOCUS_GAINED':desc='<span class="status-ok">Kembali ke halaman ujian.</span>';break;case'TEST_FINISH':desc='Ujian diselesaikan.';break;default:desc=`Kejadian: ${event.type}`;break;}return `<li><strong>[${formatTime(event.time)}]</strong> ${desc}</li>`;},
    renderTimelineTab(session,db){document.getElementById('Timeline').innerHTML=`<h3>Timeline Kejadian</h3><ul style="list-style-type:none;padding-left:0;">${(session.eventTimeline||[]).map(e=>this.formatTimelineEvent(e,session.testId)).join('')}</ul>`;},
    renderAnswersTab(session,db){const test=db.tests.find(t=>t.id===session.testId);let tableHTML=`<h3>Analisis Jawaban</h3><table><thead><tr><th>No. Soal</th><th>Jawaban Akhir</th><th>Riwayat Jawaban</th></tr></thead><tbody>`;test.questionIds.forEach((qId,i)=>{const history=(session.answerHistory||{})[qId];const question=db.questionBank.find(q=>q.id===qId);if(!question)return;let historyStr='-';if(history){const finalAnswer=history[history.length-1].selectedOption;historyStr=history.map(h=>String.fromCharCode(65+h.selectedOption)).join(' → ');tableHTML+=`<tr><td>${i+1}</td><td>${String.fromCharCode(65+finalAnswer)} (${finalAnswer===question.correct?'<span class="status-ok">Benar</span>':'<span class="status-danger">Salah</span>'})</td><td>${historyStr}</td></tr>`;}else{tableHTML+=`<tr><td>${i+1}</td><td>Tidak Dijawab</td><td>-</td></tr>`;}});tableHTML+='</tbody></table>';document.getElementById('Answers').innerHTML=tableHTML;},
    renderCursorTab(session){document.getElementById('Cursor').innerHTML=`<h3>Heatmap & Replay Kursor</h3><div id="replay-container" style="position:relative;width:800px;height:500px;border:1px solid #ccc;margin:auto;background-color:#fff;overflow:hidden;"><canvas id="cursor-canvas" width="800" height="500"></canvas><div id="replay-cursor" style="position:absolute;width:15px;height:15px;border-radius:50%;background:rgba(41,98,255,0.7);border:2px solid white;box-shadow:0 0 5px blue;display:none;transform:translate(-50%, -50%);"></div></div><br><progress id="replay-progress" value="0" max="100" style="width:800px;"></progress><br><button id="play-replay-btn" class="btn btn-primary" style="margin-top:10px;">Putar Ulang</button>`;const canvas=document.getElementById('cursor-canvas');const ctx=canvas.getContext('2d');(session.cursorTrack||[]).forEach(([_,x,y])=>{ctx.fillStyle='rgba(255,0,0,0.05)';ctx.beginPath();ctx.arc(x-canvas.offsetLeft,y-canvas.offsetTop,15,0,2*Math.PI);ctx.fill();});document.getElementById('play-replay-btn').addEventListener('click',e=>{e.target.disabled=true;const cursor=document.getElementById('replay-cursor');cursor.style.display='block';const progress=document.getElementById('replay-progress');let i=0;function animate(){if(i>=(session.cursorTrack||[]).length){cursor.style.display='none';e.target.disabled=false;return;}const[t,x,y]=session.cursorTrack[i];cursor.style.left=`${x-canvas.offsetLeft}px`;cursor.style.top=`${y-canvas.offsetTop}px`;progress.value=(i/session.cursorTrack.length)*100;const timeToNext=(i+1<session.cursorTrack.length)?session.cursorTrack[i+1][0]-t:100;i++;setTimeout(animate,timeToNext>500?500:timeToNext);};animate();});},
    renderStudentDashboard(){const db=DB.get();this._container.innerHTML=`<div class="content-header"><h1>Daftar Ujian Tersedia</h1></div><div class="card"><table><thead><tr><th>Judul Ujian</th><th>Jumlah Soal</th><th>Durasi</th><th>Aksi</th></tr></thead><tbody>${db.tests.map(t=>`<tr><td>${t.title}</td><td>${t.questionIds.length}</td><td>${t.duration} menit</td><td><button class="btn btn-primary" onclick="promptToken('${t.id}')">Kerjakan</button></td></tr>`).join('')||'<tr><td colspan="4" style="text-align:center;">Belum ada ujian yang tersedia.</td></tr>'}</tbody></table></div>`;},
    renderStudentHistory(){const user=Auth.getCurrentUser();const db=DB.get();const mySessions=db.sessions.filter(s=>s.userId===user.id);this._container.innerHTML=`<div class="content-header"><h1>Riwayat Ujian Saya</h1></div><div class="card"><table><thead><tr><th>Ujian</th><th>Skor</th><th>Waktu Selesai</th></tr></thead><tbody>${mySessions.length>0?mySessions.map(s=>{const test=db.tests.find(t=>t.id===s.testId)||{title:'Ujian Dihapus'};return`<tr><td>${test.title}</td><td>${s.finalScore||s.score||'N/A'}</td><td>${new Date(s.completedAt).toLocaleString('id-ID')}</td></tr>`}).join(''):'<tr><td colspan="3" style="text-align:center;">Anda belum mengerjakan ujian apapun.</td></tr>'}</tbody></table></div>`;}
};

// === ROUTER & PAGE INITIALIZERS ===
document.addEventListener('DOMContentLoaded', () => {
    DB.init();
    const pageId = document.body.id;

    switch (pageId) {
        case 'page-login': document.getElementById('login-form').addEventListener('submit',e=>{e.preventDefault();if(Auth.login(e.target.username.value,e.target.password.value)){window.location.href='admin.html';}else{alert('Username atau password salah!');}}); break;
        case 'page-dashboard':
            Auth.protectPage(); const user=Auth.getCurrentUser(); Views.setContainer(document.getElementById('main-content-area')); document.getElementById('user-display').textContent=user.nama; document.getElementById('logout-btn').addEventListener('click',Auth.logout);
            const navConfig={admin:[{name:'Dashboard',view:Views.renderAdminDashboard.bind(Views),icon:Icons.dashboard},{name:'Bank Soal',view:Views.renderQuestionBank.bind(Views),icon:Icons.bank},{name:'Manajemen Ujian',view:Views.renderTestManagement.bind(Views),icon:Icons.test},{name:'Hasil Ujian',view:Views.renderResults.bind(Views),icon:Icons.results}],student:[{name:'Daftar Ujian',view:Views.renderStudentDashboard.bind(Views),icon:Icons.test},{name:'Riwayat Ujian',view:Views.renderStudentHistory.bind(Views),icon:Icons.results}]};
            const sidebarNav=document.getElementById('sidebar-nav'); sidebarNav.innerHTML=navConfig[user.role].map((item,i)=>`<li class="${i===0?'active':''}" data-view-name="${item.name}"><a>${item.icon} ${item.name}</a></li>`).join(''); navConfig[user.role][0].view();
            sidebarNav.addEventListener('click',e=>{const li=e.target.closest('li');if(li){document.querySelector('#sidebar-nav li.active').classList.remove('active');li.classList.add('active');navConfig[user.role].find(item=>item.name===li.dataset.viewName).view();}});
            break;
        case 'page-ujian':
            Auth.protectPage(['student']);
            const TestEngine = {
                state: { test: null, questions: [], answers: [], currentQuestionIndex: 0, timeLeft: 0, timerInterval: null, timeOnCurrentQuestionStart: 0 },
                init() {
                    const testId = new URLSearchParams(window.location.search).get('testid');
                    const db = DB.get(); this.state.test = db.tests.find(t => t.id === testId);
                    if (!this.state.test || this.state.test.questionIds.length === 0) { alert("Ujian tidak valid atau tidak memiliki soal!"); window.location.href = 'admin.html'; return; }
                    this.state.questions = this.state.test.questionIds.map(id => db.questionBank.find(q => q.id === id)).filter(Boolean);
                    if(this.state.questions.length !== this.state.test.questionIds.length){ alert("Beberapa soal untuk ujian ini tidak ditemukan di bank soal."); window.location.href='admin.html'; return;}
                    this.state.answers = new Array(this.state.questions.length).fill(null);
                    this.state.timeLeft = this.state.test.duration * 60;
                    Tracker.start(testId, Auth.getCurrentUser().id);
                    document.getElementById('test-title').textContent = this.state.test.title;
                    document.getElementById('student-name').textContent = `Siswa: ${Auth.getCurrentUser().nama}`;
                    this.state.timeOnCurrentQuestionStart = Date.now();
                    Tracker.logEvent("VIEW_QUESTION", { questionIndex: 0 });
                    this.renderQuestion(); this.renderNav(); this.startTimer(); this.addEventListeners();
                },
                renderQuestion() { const q = this.state.questions[this.state.currentQuestionIndex]; document.getElementById('question-number').textContent = this.state.currentQuestionIndex + 1; document.getElementById('question-text').textContent = q.text; document.getElementById('answer-options').innerHTML = q.options.map((opt, i) => `<div class="option" data-option-index="${i}"><input type="radio" id="opt${i}" name="answer" value="${i}" ${this.state.answers[this.state.currentQuestionIndex] === i ? 'checked' : ''}><label for="opt${i}">${String.fromCharCode(65 + i)}. ${opt}</label>${Icons.check}</div>`).join(''); document.querySelectorAll('.option').forEach(o => { if (this.state.answers[this.state.currentQuestionIndex] === parseInt(o.dataset.optionIndex)) o.classList.add('selected'); o.addEventListener('click', () => this.selectAnswer(parseInt(o.dataset.optionIndex))); }); },
                selectAnswer(answerIndex) { this.state.answers[this.state.currentQuestionIndex] = answerIndex; Tracker.logAnswerChange(this.state.questions[this.state.currentQuestionIndex].id, this.state.currentQuestionIndex, answerIndex); this.renderQuestion(); this.renderNav(); },
                renderNav() { document.getElementById('question-grid').innerHTML = this.state.questions.map((_, i) => `<button class="q-nav-btn ${i === this.state.currentQuestionIndex ? 'current' : ''} ${this.state.answers[i] !== null ? 'answered' : ''}" data-index="${i}">${i + 1}</button>`).join(''); document.querySelectorAll('.q-nav-btn').forEach(b => b.addEventListener('click', () => this.goToQuestion(parseInt(b.dataset.index)))); document.getElementById('btn-prev').disabled = this.state.currentQuestionIndex === 0; document.getElementById('btn-next').disabled = this.state.currentQuestionIndex === this.state.questions.length - 1; },
                goToQuestion(index) { const timeSpent = (Date.now() - this.state.timeOnCurrentQuestionStart) / 1000; Tracker.logQuestionView(this.state.currentQuestionIndex, timeSpent); this.state.currentQuestionIndex = index; this.state.timeOnCurrentQuestionStart = Date.now(); this.renderQuestion(); this.renderNav(); },
                startTimer() { this.state.timerInterval = setInterval(() => { this.state.timeLeft--; const m = Math.floor(this.state.timeLeft / 60); const s = this.state.timeLeft % 60; const timerEl = document.getElementById('timer'); timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; timerEl.classList.toggle('warning', this.state.timeLeft < 300 && this.state.timeLeft >= 60); timerEl.classList.toggle('danger', this.state.timeLeft < 60); if (this.state.timeLeft <= 0) this.finishTest(); }, 1000); },
                finishTest() {
                    clearInterval(this.state.timerInterval);
                    const timeSpentOnLast = { index: this.state.currentQuestionIndex, time: (Date.now() - this.state.timeOnCurrentQuestionStart) / 1000 };
                    const finalSessionData = Tracker.stop(timeSpentOnLast);
                    const score = this.state.answers.reduce((acc, ans, i) => acc + (ans === this.state.questions[i].correct ? 1 : 0), 0);
                    finalSessionData.finalScore = ((score / this.state.questions.length) * 100).toFixed(2);
                    const db = DB.get(); db.sessions.push(finalSessionData); DB.save(db);
                    window.location.href = `hasil.html?sessionid=${finalSessionData.sessionId}`;
                },
                addEventListeners() {
                    document.getElementById('btn-next').addEventListener('click', () => { if(this.state.currentQuestionIndex < this.state.questions.length - 1) this.goToQuestion(this.state.currentQuestionIndex + 1); });
                    document.getElementById('btn-prev').addEventListener('click', () => { if(this.state.currentQuestionIndex > 0) this.goToQuestion(this.state.currentQuestionIndex - 1); });
                    document.getElementById('btn-finish').addEventListener('click', () => document.getElementById('finish-modal').classList.add('show'));
                    document.getElementById('confirm-finish-btn').addEventListener('click', () => this.finishTest());
                    document.getElementById('cancel-finish-btn').addEventListener('click', () => document.getElementById('finish-modal').classList.remove('show'));
                    document.getElementById('ack-warning-btn').addEventListener('click', () => document.getElementById('cheat-warning-modal').classList.remove('show'));
                    window.addEventListener('contextmenu', e => e.preventDefault());
                }
            };
            TestEngine.init();
            break;
        case 'page-hasil':
            Auth.protectPage(); const resUrl=new URLSearchParams(window.location.search);const sId=resUrl.get('sessionid');const resDb=DB.get();const sess=resDb.sessions.find(s=>s.sessionId===sId);if(!sess){alert("Sesi tidak ditemukan!");window.location.href='admin.html';return;}const test=resDb.tests.find(t=>t.id===sess.testId)||{title:'Ujian Dihapus'};const resUser=resDb.users.find(u=>u.id===sess.userId);const score=sess.finalScore||sess.score||"N/A";const focusCount=(sess.performanceMetrics?.focusLossCount||0);document.getElementById('result-container').innerHTML=`<h1>Ujian Selesai!</h1><p>Terima kasih, ${resUser.nama}, telah menyelesaikan ujian.</p><hr style="margin:20px 0;"><h2>${test.title}</h2><h3>Nilai Akhir Anda:</h3><h1 style="font-size:48px;color:var(--primary-blue);">${score}</h1>${focusCount > 0 ? `<p style="color:var(--danger);margin-top:15px;">Terdeteksi ${focusCount} kali aktivitas mencurigakan.</p>` : ''}<a href="admin.html" class="btn btn-primary" style="margin-top:30px;">Kembali ke Dashboard</a>`;
            break;
    }
});

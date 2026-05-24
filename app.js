/* ====================================================================
   GLASSMORPHIC ENGLISH LEARNING APP - CONTROLLER LOGIC
   ==================================================================== */

// --- 1. QUIZ LESSON DATA ---
const LESSONS_DATA = {
    1: {
        id: 1,
        title: "Basics & Greetings",
        desc: "Learn core English vocabulary and formal/informal greetings.",
        icon: "👋",
        questions: [
            {
                type: "choice",
                prompt: "Which of the following is a polite response to <span class='accent-text'>'How do you do?'</span>?",
                choices: [
                    "I am doing a sandwich.",
                    "How do you do?",
                    "Goodbye, my friend.",
                    "Yes, please."
                ],
                correct: 1, // index 1 is "How do you do?" (formal response matches question)
                speech: "How do you do? How do you do?"
            },
            {
                type: "choice",
                prompt: "What is the most appropriate greeting for a formal business meeting at <span class='accent-text'>10:00 AM</span>?",
                choices: [
                    "Good night",
                    "Good afternoon",
                    "Good morning",
                    "Hey there!"
                ],
                correct: 2, // "Good morning"
                speech: "Good morning."
            },
            {
                type: "choice",
                prompt: "Translate the parting greeting: <span class='accent-text'>'Have a nice weekend!'</span>",
                choices: [
                    "Have fun on Saturday and Sunday!",
                    "Please go to sleep.",
                    "Let's work tomorrow.",
                    "Eat a lot of fruits."
                ],
                correct: 0, // "Have fun on Saturday and Sunday!"
                speech: "Have a nice weekend!"
            }
        ]
    },
    2: {
        id: 2,
        title: "Daily Routines",
        desc: "Practice grammar and verb conjugations in the Simple Present tense.",
        icon: "⏰",
        questions: [
            {
                type: "fill",
                prompt: "Complete the sentence with the correct verb form for routine action:",
                sentence: "She usually [BLANK] up at 6:30 AM.",
                options: ["wake", "wakes", "waking", "woke"],
                correct: "wakes",
                speech: "She usually wakes up at six thirty A. M."
            },
            {
                type: "fill",
                prompt: "Choose the correct negative conjugation for a habit:",
                sentence: "They [BLANK] watch television in the morning.",
                options: ["does not", "doesn't", "don't", "no"],
                correct: "don't",
                speech: "They don't watch television in the morning."
            },
            {
                type: "fill",
                prompt: "Formulate the correct question structure:",
                sentence: "[BLANK] he play football on Sundays?",
                options: ["Do", "Does", "Is", "Has"],
                correct: "Does",
                speech: "Does he play football on Sundays?"
            }
        ]
    },
    3: {
        id: 3,
        title: "At the Restaurant",
        desc: "Build complete sentences to order food and request the bill.",
        icon: "🍽️",
        questions: [
            {
                type: "unscramble",
                prompt: "Arrange the words to make a polite food request:",
                words: ["like", "would", "to", "I", "order", "tea"],
                correct: "I would like to order tea",
                speech: "I would like to order tea."
            },
            {
                type: "unscramble",
                prompt: "Arrange the words to ask for the payment slip:",
                words: ["please", "bill", "we", "can", "the", "have"],
                correct: "can we have the bill please",
                speech: "Can we have the bill, please?"
            },
            {
                type: "unscramble",
                prompt: "Arrange the words to book a table:",
                words: ["need", "we", "for", "a", "table", "two"],
                correct: "we need a table for two",
                speech: "We need a table for two."
            }
        ]
    }
};

// --- 2. GLOBAL APP STATE ---
let dbUrl = localStorage.getItem("supabase_url") || "https://qbeamkqeldkxxjifqyss.supabase.co";
let dbKey = localStorage.getItem("supabase_key") || "";
let supabase = null;

let profiles = [];
let currentUser = null;
let currentProgress = {}; // Keyed by lesson_id

let activeLesson = null;
let activeQuestionIndex = 0;
let wrongAnswersInLessonCount = 0;
let activeSelectedChoice = null; // For Multiple Choice
let activeFilledWord = ""; // For Fill in Blank
let activeTrayWords = []; // For Sentence Unscramble

// --- 3. SPEECH SYNTHESIS ENGINE ---
function speak(text) {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.95;
        
        // Find a premium natural voice if available
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en') && voice.name.includes('Google')) ||
                             voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) utterance.voice = englishVoice;
        
        window.speechSynthesis.speak(utterance);
    }
}

// --- 4. WEB AUDIO SYNTHESIZED SOUND EFFECTS ---
const AudioEngine = {
    ctx: null,
    
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    
    playCorrect() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.type = 'triangle';
        osc2.type = 'sine';
        
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5
        
        osc2.frequency.setValueAtTime(1046.50, now + 0.2); // C6
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc1.start(now);
        osc2.start(now + 0.2);
        osc1.stop(now + 0.65);
        osc2.stop(now + 0.65);
    },
    
    playIncorrect() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.4);
    }
};

// --- 5. INITIALIZATION & NAVIGATION ---
document.addEventListener("DOMContentLoaded", () => {
    // Fill credentials if cached
    document.getElementById("db-url-input").value = dbUrl;
    document.getElementById("db-key-input").value = dbKey;
    
    if (dbUrl && dbKey) {
        initSupabase();
    } else {
        showScreen("screen-config");
    }
    
    // Wire UI events
    document.getElementById("config-form").addEventListener("submit", handleConfigSubmit);
    document.getElementById("btn-logout").addEventListener("click", handleLogout);
    document.getElementById("btn-back-dashboard").addEventListener("click", () => {
        window.speechSynthesis.cancel();
        showScreen("screen-dashboard");
        renderDashboard();
    });
    
    document.getElementById("btn-check").addEventListener("click", handleCheckButtonClick);
    document.getElementById("btn-success-continue").addEventListener("click", () => {
        showScreen("screen-dashboard");
        renderDashboard();
    });
    
    // Chrome voice loading event hook
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {};
    }
});

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
}

// --- 6. SUPABASE SYSTEM SYNC ---
function initSupabase() {
    try {
        // The UMD bundle exposes: window.supabase = { createClient: fn }
        // Some CDN builds also nest it: window.supabase.supabase.createClient
        let clientFactory = null;

        if (window.supabase && typeof window.supabase.createClient === 'function') {
            clientFactory = window.supabase.createClient;
        } else if (window.supabase && window.supabase.supabase && typeof window.supabase.supabase.createClient === 'function') {
            clientFactory = window.supabase.supabase.createClient;
        }

        if (!clientFactory) {
            console.error("Supabase script CDN did not load correctly. window.supabase =", window.supabase);
            alert("Supabase library failed to load. Please check your internet connection and refresh the page.");
            showScreen("screen-config");
            return;
        }
        
        supabase = clientFactory(dbUrl, dbKey);
        
        // Cache credentials
        localStorage.setItem("supabase_url", dbUrl);
        localStorage.setItem("supabase_key", dbKey);
        
        loadProfiles();
    } catch (err) {
        console.error("Supabase config error: ", err);
        alert("Connection failed: " + err.message + "\n\nPlease verify your Supabase URL and Anon Key.");
        showScreen("screen-config");
    }
}

function handleConfigSubmit(e) {
    e.preventDefault();
    dbUrl = document.getElementById("db-url-input").value.trim();
    dbKey = document.getElementById("db-key-input").value.trim();
    
    if (!dbUrl || !dbKey) {
        alert("Please enter both the Supabase URL and the Anon Key.");
        return;
    }
    
    initSupabase();
}

function handleLogout() {
    localStorage.removeItem("supabase_key");
    dbKey = "";
    document.getElementById("db-key-input").value = "";
    currentUser = null;
    profiles = [];
    showScreen("screen-config");
}

async function loadProfiles() {
    try {
        showScreen("screen-profiles");
        const listContainer = document.getElementById("profiles-list");
        listContainer.innerHTML = `<div style="grid-column: span 2; text-align: center; color: var(--text-secondary);">Connecting to database...</div>`;
        
        // 1. Fetch profiles
        let { data, error } = await supabase.from("profiles").select("*").order("name");
        
        if (error) throw error;
        
        // 2. If table is empty, auto-seed defaults!
        if (!data || data.length === 0) {
            console.log("Empty database detected. Seeding Emma & Alex...");
            const defaultProfiles = [
                { name: "Emma", avatar_url: "👩‍🎓", xp: 0 },
                { name: "Alex", avatar_url: "👨‍💻", xp: 0 }
            ];
            
            const insertResult = await supabase.from("profiles").insert(defaultProfiles).select();
            if (insertResult.error) throw insertResult.error;
            data = insertResult.data;
        }
        
        profiles = data;
        renderProfilesGrid();
    } catch (err) {
        console.error("Fetch profiles failed: ", err);
        alert("Database connection failed. Please ensure you have:\n\n1. Run the schema.sql script in the Supabase SQL Editor\n2. Entered the correct Supabase URL and Anon Key\n\nError: " + err.message);
        showScreen("screen-config");
    }
}

function renderProfilesGrid() {
    const listContainer = document.getElementById("profiles-list");
    listContainer.innerHTML = "";
    
    profiles.forEach(profile => {
        const card = document.createElement("div");
        card.className = "profile-card glass-card glass-card-interactive";
        card.innerHTML = `
            <div class="profile-avatar">${profile.avatar_url || '👤'}</div>
            <div class="profile-name">${profile.name}</div>
            <div class="profile-xp">${profile.xp} XP</div>
        `;
        card.addEventListener("click", () => selectProfile(profile));
        listContainer.appendChild(card);
    });
}

async function selectProfile(profile) {
    currentUser = profile;
    
    // Render UI structures
    document.getElementById("user-avatar-sm").innerText = profile.avatar_url || '👤';
    document.getElementById("user-name-sm").innerText = profile.name;
    document.getElementById("header-xp-val").innerText = profile.xp;
    
    // Show spinner and load progress
    showScreen("screen-dashboard");
    const container = document.getElementById("lessons-container");
    container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Loading dynamic curriculum...</div>`;
    
    await syncUserProgress();
    renderDashboard();
}

async function syncUserProgress() {
    try {
        const { data, error } = await supabase
            .from("lesson_progress")
            .select("*")
            .eq("profile_id", currentUser.id);
            
        if (error) throw error;
        
        currentProgress = {};
        if (data) {
            data.forEach(p => {
                currentProgress[p.lesson_id] = p;
            });
        }
    } catch (err) {
        console.error("Progress sync failed: ", err);
    }
}

// --- 7. DASHBOARD CURRICULUM RENDERING ---
function renderDashboard() {
    // Recalculate total XP from active user profile sync
    document.getElementById("header-xp-val").innerText = currentUser.xp;
    
    const container = document.getElementById("lessons-container");
    container.innerHTML = "";
    
    const lessonIds = [1, 2, 3];
    
    lessonIds.forEach(id => {
        const data = LESSONS_DATA[id];
        const progress = currentProgress[id];
        const completed = progress ? progress.completed : false;
        const score = progress ? progress.score : 0;
        
        // Progression lock: Lesson N requires Lesson N-1 to be completed
        let locked = false;
        if (id > 1) {
            const prevProgress = currentProgress[id - 1];
            if (!prevProgress || !prevProgress.completed) {
                locked = true;
            }
        }
        
        const card = document.createElement("div");
        card.className = `lesson-card glass-card glass-card-interactive ${locked ? 'locked' : 'active-card'}`;
        
        // Circular progress computation SVG
        const radius = 20;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (score / 100) * circumference;
        
        let progressElement = `
            <div class="progress-ring-container">
                <svg class="progress-ring" width="50" height="50">
                    <circle class="progress-ring__circle-bg" stroke="rgba(255,255,255,0.05)" stroke-width="4" fill="transparent" r="${radius}" cx="25" cy="25"/>
                    <circle class="progress-ring__circle" stroke="${completed ? '#00e676' : 'var(--neon-blue)'}" stroke-width="4" stroke-linecap="round" fill="transparent" r="${radius}" cx="25" cy="25"
                        style="stroke-dasharray: ${circumference} ${circumference}; stroke-dashoffset: ${offset};"/>
                </svg>
                <div class="progress-pct">${score}%</div>
            </div>
        `;
        
        if (locked) {
            progressElement = `
                <div class="lock-overlay">🔒</div>
            `;
        }
        
        card.innerHTML = `
            <div class="lesson-icon-box">${data.icon}</div>
            <div class="lesson-info">
                <div class="lesson-num">Lesson ${id}</div>
                <div class="lesson-title">${data.title}</div>
                <div class="lesson-desc">${data.desc}</div>
            </div>
            ${progressElement}
        `;
        
        if (!locked) {
            card.addEventListener("click", () => startLesson(data));
        }
        
        container.appendChild(card);
    });
}

// --- 8. LESSON STATE ENGINE ---
function startLesson(lesson) {
    activeLesson = lesson;
    activeQuestionIndex = 0;
    wrongAnswersInLessonCount = 0;
    
    // Title header
    document.getElementById("lesson-arena-title").innerText = lesson.title;
    
    showScreen("screen-arena");
    loadQuestion();
}

function loadQuestion() {
    const q = activeLesson.questions[activeQuestionIndex];
    
    // Update progress bar
    const progressPercent = (activeQuestionIndex / activeLesson.questions.length) * 100;
    document.getElementById("bar-fill").style.width = `${progressPercent}%`;
    
    // Reset selection states
    activeSelectedChoice = null;
    activeFilledWord = "";
    activeTrayWords = [];
    
    // Hide result overlay
    document.getElementById("result-banner").className = "result-banner";
    
    // Sound synthesis trigger: Auto-read the prompt or core elements
    if (q.speech) {
        setTimeout(() => speak(q.speech), 500);
    }
    
    // Dynamic speak button
    const speakerBtn = document.getElementById("btn-speak");
    speakerBtn.onclick = () => speak(q.speech);
    
    // Render question prompt
    const arenaCard = document.getElementById("arena-content-card");
    arenaCard.innerHTML = `
        <div class="question-prompt">${q.prompt}</div>
        <div class="interactive-area" id="quiz-interaction-container"></div>
    `;
    
    // Toggle check button state
    setCheckButtonState("disabled", "Check Answer");
    
    const container = document.getElementById("quiz-interaction-container");
    
    // Instantiate specific sub-engine
    if (q.type === "choice") {
        renderChoiceEngine(q, container);
    } else if (q.type === "fill") {
        renderFillEngine(q, container);
    } else if (q.type === "unscramble") {
        renderUnscrambleEngine(q, container);
    }
}

function setCheckButtonState(state, text) {
    const btn = document.getElementById("btn-check");
    btn.className = "btn-check " + state;
    btn.innerText = text;
}

// --- ENGINE 1: MULTIPLE CHOICE RENDER ---
function renderChoiceEngine(q, container) {
    const grid = document.createElement("div");
    grid.className = "choices-grid";
    
    q.choices.forEach((choice, idx) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn glass-card";
        btn.innerHTML = `
            <div class="choice-marker">${String.fromCharCode(65 + idx)}</div>
            <div class="choice-text">${choice}</div>
        `;
        
        btn.addEventListener("click", () => {
            // Cancel previous selection
            document.querySelectorAll(".choice-btn").forEach(b => b.classList.remove("selected"));
            
            btn.classList.add("selected");
            activeSelectedChoice = idx;
            setCheckButtonState("ready", "Check Answer");
            speak(choice);
        });
        
        grid.appendChild(btn);
    });
    
    container.appendChild(grid);
}

// --- ENGINE 2: FILL IN THE BLANKS RENDER ---
function renderFillEngine(q, container) {
    const questionText = document.createElement("div");
    questionText.className = "fill-blank-sentence";
    
    const parts = q.sentence.split("[BLANK]");
    questionText.innerHTML = `${parts[0]}<span class="blank-slot" id="target-blank-slot">...</span>${parts[1]}`;
    container.appendChild(questionText);
    
    const chipWrapper = document.createElement("div");
    chipWrapper.className = "fill-options";
    
    q.options.forEach(opt => {
        const chip = document.createElement("div");
        chip.className = "option-chip glass-card";
        chip.innerText = opt;
        
        chip.addEventListener("click", () => {
            document.querySelectorAll(".option-chip").forEach(c => c.classList.remove("selected"));
            chip.classList.add("selected");
            
            activeFilledWord = opt;
            const slot = document.getElementById("target-blank-slot");
            slot.innerText = opt;
            slot.classList.add("filled");
            
            setCheckButtonState("ready", "Check Answer");
            speak(opt);
        });
        
        chipWrapper.appendChild(chip);
    });
    
    container.appendChild(chipWrapper);
}

// --- ENGINE 3: SENTENCE UNSCRAMBLE RENDER ---
function renderUnscrambleEngine(q, container) {
    const workDiv = document.createElement("div");
    workDiv.className = "unscramble-workspace";
    
    const tray = document.createElement("div");
    tray.className = "unscramble-tray";
    tray.id = "words-active-tray";
    tray.innerHTML = `<div class="tray-placeholder">Tap words below to build the sentence...</div>`;
    workDiv.appendChild(tray);
    
    const pool = document.createElement("div");
    pool.className = "unscramble-pool";
    pool.id = "words-shuffled-pool";
    
    // Shuffling vocabulary chips
    const shuffled = [...q.words].sort(() => 0.5 - Math.random());
    
    shuffled.forEach((word, index) => {
        const chip = document.createElement("div");
        chip.className = "word-chip glass-card";
        chip.innerText = word;
        chip.dataset.wordId = `${word}-${index}`;
        
        chip.addEventListener("click", () => {
            moveWordToTray(word, chip.dataset.wordId);
        });
        
        pool.appendChild(chip);
    });
    
    workDiv.appendChild(pool);
    container.appendChild(workDiv);
}

function moveWordToTray(word, chipId) {
    const origChip = document.querySelector(`[data-word-id='${chipId}']`);
    if (!origChip) return;
    
    origChip.style.display = "none";
    
    activeTrayWords.push({ id: chipId, text: word });
    speak(word);
    
    renderTray();
    setCheckButtonState(activeTrayWords.length > 0 ? "ready" : "disabled", "Check Answer");
}

function moveWordToPool(chipId) {
    const origChip = document.querySelector(`[data-word-id='${chipId}']`);
    if (origChip) origChip.style.display = "block";
    
    activeTrayWords = activeTrayWords.filter(w => w.id !== chipId);
    
    renderTray();
    setCheckButtonState(activeTrayWords.length > 0 ? "ready" : "disabled", "Check Answer");
}

function renderTray() {
    const tray = document.getElementById("words-active-tray");
    tray.innerHTML = "";
    
    if (activeTrayWords.length === 0) {
        tray.innerHTML = `<div class="tray-placeholder">Tap words below to build the sentence...</div>`;
        return;
    }
    
    activeTrayWords.forEach(w => {
        const chip = document.createElement("div");
        chip.className = "word-chip glass-card in-tray";
        chip.innerText = w.text;
        chip.addEventListener("click", () => moveWordToPool(w.id));
        tray.appendChild(chip);
    });
}

// --- 9. ANSWER CORRECTION ENGINE ---
function handleCheckButtonClick() {
    const btn = document.getElementById("btn-check");
    
    // Ready -> Evaluate
    if (btn.classList.contains("ready")) {
        evaluateAnswer();
    } 
    // Correct / Incorrect -> Next Question
    else if (btn.classList.contains("correct-state") || btn.classList.contains("incorrect-state")) {
        advanceQuestion();
    }
}

function evaluateAnswer() {
    const q = activeLesson.questions[activeQuestionIndex];
    let isCorrect = false;
    let explanationText = "";
    
    const arenaCard = document.getElementById("arena-content-card");
    
    if (q.type === "choice") {
        isCorrect = (activeSelectedChoice === q.correct);
        explanationText = isCorrect ? "Fantastic job!" : `Incorrect. The right greeting is: "${q.choices[q.correct]}"`;
    } else if (q.type === "fill") {
        isCorrect = (activeFilledWord.toLowerCase() === q.correct.toLowerCase());
        explanationText = isCorrect ? "Splendid choice!" : `Incorrect. Proper conjugation is: "${q.correct}"`;
    } else if (q.type === "unscramble") {
        const formedSentence = activeTrayWords.map(w => w.text).join(" ").toLowerCase();
        isCorrect = (formedSentence === q.correct.toLowerCase());
        explanationText = isCorrect ? "Perfect sentence ordering!" : `Incorrect. Standard order: "${q.correct}"`;
    }
    
    const banner = document.getElementById("result-banner");
    const bannerIcon = document.getElementById("result-icon");
    const bannerTitle = document.getElementById("result-banner-title");
    const bannerDesc = document.getElementById("result-banner-desc");
    
    if (isCorrect) {
        AudioEngine.playCorrect();
        arenaCard.classList.add("bounce-ani");
        
        banner.className = "result-banner correct";
        bannerIcon.innerText = "✨";
        bannerTitle.innerText = "Excellent!";
        bannerDesc.innerText = explanationText;
        
        setCheckButtonState("correct-state", "Continue");
        
        // Auto-read full speech text for reinforcement
        speak("Correct! " + q.speech);
    } else {
        AudioEngine.playIncorrect();
        arenaCard.classList.add("shake-ani");
        wrongAnswersInLessonCount++;
        
        banner.className = "result-banner incorrect";
        bannerIcon.innerText = "❌";
        bannerTitle.innerText = "Keep practicing!";
        bannerDesc.innerText = explanationText;
        
        setCheckButtonState("incorrect-state", "Continue");
        
        speak("Let's review this.");
    }
}

function advanceQuestion() {
    // Remove anims
    const arenaCard = document.getElementById("arena-content-card");
    arenaCard.classList.remove("bounce-ani", "shake-ani");
    
    activeQuestionIndex++;
    
    if (activeQuestionIndex < activeLesson.questions.length) {
        loadQuestion();
    } else {
        completeLesson();
    }
}

// --- 10. SUCCESS CELEBRATION & DB WRITER ---
async function completeLesson() {
    showScreen("screen-success");
    
    const totalQ = activeLesson.questions.length;
    const correctQ = totalQ - Math.min(totalQ, wrongAnswersInLessonCount);
    const accuracy = Math.round((correctQ / totalQ) * 100);
    
    // Standard completion gains: 30 base XP + accuracy points
    const xpReward = 30 + Math.round(accuracy * 0.2);
    
    document.getElementById("success-lesson-name").innerText = activeLesson.title;
    document.getElementById("success-xp-earned").innerText = `+${xpReward}`;
    document.getElementById("success-accuracy").innerText = `${accuracy}%`;
    
    // Launch Confetti Canvas Animation
    triggerConfetti();
    
    // Synchronize to Supabase database
    try {
        const newScore = Math.max(accuracy, currentProgress[activeLesson.id] ? currentProgress[activeLesson.id].score : 0);
        
        // 1. Log progress row
        const { error: progressErr } = await supabase
            .from("lesson_progress")
            .upsert({
                profile_id: currentUser.id,
                lesson_id: activeLesson.id,
                completed: true,
                score: newScore,
                xp_earned: xpReward,
                updated_at: new Date().toISOString()
            }, {
                onConflict: "profile_id,lesson_id"
            });
            
        if (progressErr) throw progressErr;
        
        // 2. Accumulate XP onto User profile
        // Refetch latest XP first to prevent concurrency overwrites
        const { data: userProfile, error: profileErr } = await supabase
            .from("profiles")
            .select("xp")
            .eq("id", currentUser.id)
            .single();
            
        if (profileErr) throw profileErr;
        
        const freshXP = (userProfile.xp || 0) + xpReward;
        
        const { error: updateXpErr } = await supabase
            .from("profiles")
            .update({ xp: freshXP })
            .eq("id", currentUser.id);
            
        if (updateXpErr) throw updateXpErr;
        
        // Locally save state
        currentUser.xp = freshXP;
        await syncUserProgress();
        
    } catch (err) {
        console.error("Failed to commit final score to Supabase cloud:", err);
    }
}

// --- 11. CONFETTI CANVAS SYSTEM ---
function triggerConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    const ctx = canvas.getContext("2d");
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let particles = [];
    const colors = ["#00f2fe", "#bd00ff", "#ff007f", "#39ff14", "#ffeb3b"];
    
    for (let i = 0; i < 110; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height + 20,
            xVel: (Math.random() - 0.5) * 12,
            yVel: -Math.random() * 15 - 10,
            radius: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            opacity: 1
        });
    }
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let active = false;
        
        particles.forEach(p => {
            if (p.opacity <= 0) return;
            
            p.x += p.xVel;
            p.y += p.yVel;
            p.yVel += 0.35; // Gravity
            p.xVel *= 0.98; // Air resistance
            p.rotation += p.rotationSpeed;
            
            // Fade out when falling off top arc
            if (p.yVel > 0) {
                p.opacity -= 0.015;
            }
            
            if (p.opacity > 0) {
                active = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                
                // Draw rectangles/ribbons
                ctx.fillRect(-p.radius, -p.radius / 2, p.radius * 2, p.radius);
                ctx.restore();
            }
        });
        
        if (active) {
            requestAnimationFrame(draw);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    draw();
}

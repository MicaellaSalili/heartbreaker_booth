// Global error handler for debugging
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    console.error('Error message:', e.message);
    console.error('Error line:', e.lineno);
    console.error('Error file:', e.filename);
});

console.log("Battle.js loaded - starting initialization");

// Move player variables to top level for global access
let currentPlayer = 1;
let p1Score = 0;
let p2Score = 0;
let isRecording = false;
let countdown = 20; // Updated to 20 seconds
let timerInterval;

const p1Name = localStorage.getItem('p1Name') || "Player 1";
const p1Section = localStorage.getItem('p1Section') || "";
const p1Email = localStorage.getItem('p1Email') || "";
const p2Name = localStorage.getItem('p2Name') || "Player 2";
const p2Section = localStorage.getItem('p2Section') || "";
const p2Email = localStorage.getItem('p2Email') || "";

console.log("Player data initialized:", {
    p1Name, p1Section, p1Email,
    p2Name, p2Section, p2Email
});

// Unified save and navigation function to prevent race conditions
async function saveAndNavigate(targetUrl) {
    console.log("saveAndNavigate called with targetUrl:", targetUrl);
    
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not loaded!");
        alert("Firebase is not initialized. Please refresh the page and try again.");
        return;
    }
    
    if (typeof db === 'undefined') {
        console.error("Firestore database is not initialized!");
        alert("Database is not initialized. Please refresh the page and try again.");
        return;
    }
    
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    const matchLabel = `${p1Name} & ${p2Name}`;
    
    const players = [
        {
            name: p1Name,
            score: Number(p1Score),
            section: p1Section,
            email: p1Email,
            status: p1Score >= 100 ? "WIN" : "LOSE",
            match: matchLabel
        },
        {
            name: p2Name,
            score: Number(p2Score),
            section: p2Section,
            email: p2Email,
            status: p2Score >= 100 ? "WIN" : "LOSE",
            match: matchLabel
        }
    ];

    console.log("Players data to save:", players);

    // Disable buttons to prevent double-clicking
    const photoBtn = document.getElementById('go-photobooth-btn');
    const homeBtn = document.getElementById('back-home-btn');
    if (photoBtn) {
        photoBtn.disabled = true;
        console.log("Photo button disabled");
    }
    if (homeBtn) {
        homeBtn.disabled = true;
        console.log("Home button disabled");
    }

    try {
        console.log("Starting Firebase save operations...");
        
        // Use Promise.all to ensure BOTH players are saved before moving on
        const savePromises = players.map((p, index) => {
            console.log(`Saving player ${index + 1}:`, p);
            return db.collection("leaderboard").add({
                ...p,
                timestamp: timestamp
            });
        });
        
        const results = await Promise.all(savePromises);
        
        console.log("All Firebase save operations completed:", results);
        console.log("Both entries saved successfully!");
        
        // ONLY redirect once the database confirms success
        window.location.href = targetUrl;
    } catch (err) {
        console.error("Firebase update failed:", err);
        alert(`Failed to save data: ${err.message}. Please try again.`);
        if (photoBtn) photoBtn.disabled = false;
        if (homeBtn) homeBtn.disabled = false;
    }
}

// Backward compatibility function for existing HTML buttons
function goToPhotobooth() {
    console.log("=== goToPhotobooth() CALLED ====");
    console.log("Player 1 Name:", p1Name, "Score:", p1Score);
    console.log("Player 2 Name:", p2Name, "Score:", p2Score);
    console.log("About to call saveAndNavigate");
    saveAndNavigate('photo.html');
}


// --- Variable declarations at the top ---
// --- Active Side Lighting ---
function setActivePlayer(playerNumber) {
    const p1Zone = document.getElementById('p1-zone');
    const p2Zone = document.getElementById('p2-zone');
    if (!p1Zone || !p2Zone) return;
    if (playerNumber === 1) {
        p1Zone.classList.add('active-blue');
        p2Zone.classList.remove('active-yellow');
        p2Zone.style.opacity = "0.2";
        p1Zone.style.opacity = "1.0";
    } else {
        p2Zone.classList.add('active-yellow');
        p1Zone.classList.remove('active-blue');
        p1Zone.style.opacity = "0.2";
        p2Zone.style.opacity = "1.0";
    }
}

// On load, default to Player 1 active
window.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded - initializing battle page");
    console.log("Player names from localStorage:", {p1Name, p2Name});
    setActivePlayer(1);
    
    // Make goToPhotobooth available globally for debugging
    window.goToPhotobooth = goToPhotobooth;
    console.log("goToPhotobooth function attached to window");
});

// Button references
const p1Btn = document.getElementById('start-p1-btn');
const p2Btn = document.getElementById('start-p2-btn');
const timerDisplay = document.getElementById('timer-display');

// Set player names in UI
if (document.getElementById('p1-name-display')) {
    document.getElementById('p1-name-display').innerText = p1Name;
}
if (document.getElementById('p2-name-display')) {
    document.getElementById('p2-name-display').innerText = p2Name;
}

// Initial button states
if (p1Btn && p2Btn) {
    p1Btn.disabled = false;
    p2Btn.disabled = true;
}

// Listen for BPM updates from serial.js
document.addEventListener('bpmUpdate', (e) => {
    const bpm = e.detail;

    // 1. Always update the live graph
    updateGraph(bpm);

    // 2. Only update player scores and BPM display if timer is running
    if (isRecording) {
        if (currentPlayer === 1) {
            document.getElementById('p1-bpm').innerText = bpm;
            p1Score = bpm;
        } else {
            document.getElementById('p2-bpm').innerText = bpm;
            p2Score = bpm;
        }
    }
});

// Graph update helper
function updateGraph(bpm) {
    graphData.push(bpm);
    graphData.shift();
    pulseChart.update();
}

document.getElementById('connect-btn').onclick = async () => {
    await connectSerial();
    document.getElementById('connect-btn').style.display = 'none';
    document.getElementById('battle-ui').style.display = 'flex';
    // Show both player buttons
    if (p1Btn && p2Btn) {
        p1Btn.style.display = 'inline-block';
        p2Btn.style.display = 'inline-block';
    }
};

function startTurn(playerNum) {
    currentPlayer = playerNum;
    isRecording = true;
    setActivePlayer(playerNum);
    // Disable both buttons during recording
    if (p1Btn && p2Btn) {
        p1Btn.disabled = true;
        p2Btn.disabled = true;
    }
    let timeLeft = countdown;
    timerDisplay.innerText = timeLeft + "s";
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft + "s";
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endTurn();
        }
    }, 1000);
}

function endTurn() {
    console.log("endTurn() called for player:", currentPlayer);
    
    isRecording = false;
    clearInterval(timerInterval);

    if (currentPlayer === 1) {
        console.log("Player 1 turn ending");
        // Handle Player 1 completion
        p1Score = typeof currentBPM !== 'undefined' ? currentBPM : p1Score;
        console.log("Player 1 final score:", p1Score);
        document.getElementById('p1-result').innerText = p1Score;

        // UI updates to prepare for Player 2
        alert("Player 1 Finished! Transfer the sensor to Player 2.");
        if (p2Btn) p2Btn.disabled = false;
        if (p1Btn) p1Btn.disabled = true;
    } else {
        console.log("Player 2 turn ending");
        // Handle Player 2 completion
        p2Score = typeof currentBPM !== 'undefined' ? currentBPM : p2Score;
        console.log("Player 2 final score:", p2Score);
        document.getElementById('p2-result').innerText = p2Score;

        console.log("About to call determineWinner()");
        // CRITICAL: Call winner logic immediately after Player 2's 20s
        try {
            determineWinner();
        } catch (error) {
            console.error("Error in determineWinner():", error);
        }
    }
}

async function determineWinner() {
    console.log("determineWinner() called!");
    console.log("Player scores - p1Score:", p1Score, "p2Score:", p2Score);
    
    // Cooperative logic: Both players try to reach 100 BPM or more
    let p1Reached = p1Score >= 100;
    let p2Reached = p2Score >= 100;
    let resultText = "";
    let canAccessPhotobooth = false;
    if (p1Reached && p2Reached) {
        resultText = `Both players reached 100 BPM!`;
        canAccessPhotobooth = true;
    } else if (p1Reached) {
        resultText = `${p1Name} reached 100 BPM!`;
        canAccessPhotobooth = true;
    } else if (p2Reached) {
        resultText = `${p2Name} reached 100 BPM!`;
        canAccessPhotobooth = true;
    } else {
        resultText = `Neither player reached 100 BPM.`;
    }

    console.log("Result text:", resultText);
    console.log("Can access photobooth:", canAccessPhotobooth);

    // Show cooperative match results overlay
    const overlay = document.getElementById('match-results-overlay');
    console.log("Found overlay element:", overlay);
    
    if (overlay) {
        // Build buttons based on result
        let buttonsHTML = '';
        if (canAccessPhotobooth) {
            buttonsHTML = `
                <button id="go-photobooth-btn" style="margin:2vw 1vw 0 1vw;padding:1vw 2vw;font-size:1.5vw;background:#00f2ff;color:#000;border:none;border-radius:2vw;box-shadow:0 0 20px #00f2ff;cursor:pointer;">📸 Go to Photobooth</button>
                <button id="back-home-btn" style="margin:2vw 1vw 0 1vw;padding:1vw 2vw;font-size:1.5vw;background:#222;color:#fff;border:none;border-radius:2vw;box-shadow:0 0 20px #888;cursor:pointer;">🏠 Back to Home</button>
            `;
        } else {
            buttonsHTML = `
                <button id="try-again-btn" style="margin:2vw 1vw 0 1vw;padding:1vw 2vw;font-size:1.5vw;background:#e63946;color:#fff;border:none;border-radius:2vw;box-shadow:0 0 20px #e63946;cursor:pointer;">🔄 Try Again</button>
                <button id="back-home-btn" style="margin:2vw 1vw 0 1vw;padding:1vw 2vw;font-size:1.5vw;background:#222;color:#fff;border:none;border-radius:2vw;box-shadow:0 0 20px #888;cursor:pointer;">🏠 Back to Home</button>
            `;
        }
        
        console.log("Setting overlay innerHTML...");
        overlay.innerHTML = `
            <div style="width:100%;text-align:center;">
                <div style="font-size:3vw;color:#00f2ff;text-shadow:0 0 10px #00f2ff;">${resultText}</div>
                <div style="display:flex;justify-content:center;align-items:center;margin-top:2vw;">
                    <div style="flex:1;text-align:center;">
                        <div style="font-size:2vw;color:#fff;">${p1Name}</div>
                        <div style="font-size:6vw;color:#00ff99;">${p1Score}</div>
                        <div style="font-size:1.5vw;color:#fff;">BPM</div>
                    </div>
                    <div style="flex:1;text-align:center;">
                        <div style="font-size:2vw;color:#fff;">${p2Name}</div>
                        <div style="font-size:6vw;color:#00ff99;">${p2Score}</div>
                        <div style="font-size:1.5vw;color:#fff;">BPM</div>
                    </div>
                </div>
                ${buttonsHTML}
            </div>
        `;
        overlay.style.display = 'flex';
        console.log("Overlay should now be visible!");
        
        // Attach button listeners
        setTimeout(() => {
            console.log("Attaching button listeners...");
            
            const goPhotoboothBtn = document.getElementById('go-photobooth-btn');
            if (goPhotoboothBtn) {
                console.log("Photo booth button found, attaching click handler");
                goPhotoboothBtn.onclick = () => {
                    console.log("Photo booth button clicked!");
                    saveAndNavigate('photo.html');
                };
            } else {
                console.log("Photo booth button not found!");
            }

            const backHomeBtn = document.getElementById('back-home-btn');
            if (backHomeBtn) {
                console.log("Back home button found, attaching click handler");
                backHomeBtn.onclick = () => {
                    console.log("Back home button clicked!");
                    saveAndNavigate('index.html');
                };
            } else {
                console.log("Back home button not found!");
            }
            
            const tryAgainBtn = document.getElementById('try-again-btn');
            if (tryAgainBtn) {
                console.log("Try again button found, attaching click handler");
                tryAgainBtn.onclick = () => {
                    console.log("Try again button clicked!");
                    window.location.reload();
                };
            }
        }, 100);
    } else {
        console.error("Could not find match-results-overlay element!");
    }
}

// Save match result to Firebase
async function saveToFirebase(winnerName) {
    try {
        // Calculate winnerScore for leaderboard sorting
        const winnerScore = Math.min(p1Score, p2Score);
        await db.collection("leaderboard").add({
            p1Name, p1Score, p2Name, p2Score,
            winner: winnerName,
            winnerScore,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (err) {
        console.error("Firebase update failed:", err);
    }
}

const ctxGraph = document.getElementById('liveGraph').getContext('2d');
let graphData = new Array(50).fill(0); // Holds 50 points of data

const pulseChart = new Chart(ctxGraph, {
    type: 'line',
    data: {
        labels: new Array(50).fill(''),
        datasets: [{
            label: 'Heart Rate Activity',
            data: graphData,
            borderColor: '#00f2ff', // Neon Cyan
            borderWidth: 2,
            fill: false,
            tension: 0.4, // Makes the line wavy/smooth
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { min: 40, max: 120, display: false },
            x: { display: false }
        },
        plugins: { legend: { display: false } },
        animation: false // Disabled for real-time performance
    }
});

// ...existing code...
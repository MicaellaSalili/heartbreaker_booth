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
    
        // Show results in player zones
        document.getElementById('p1-bpm').innerText = p1Score;
        document.getElementById('p2-bpm').innerText = p2Score;
        document.getElementById('p1-result').innerText = p1Score;
        document.getElementById('p2-result').innerText = p2Score;

        let p1Status = '';
        let p2Status = '';
        if (p1Score >= 100 && p2Score >= 100) {
            p1Status = `${p1Name} WINS!`;
            p2Status = `${p2Name} WINS!`;
        } else if (p1Score >= 100 && p2Score < 100) {
            p1Status = `${p1Name} WINS!`;
            p2Status = `${p2Name} LOSES`;
        } else if (p1Score < 100 && p2Score >= 100) {
            p1Status = `${p1Name} LOSES`;
            p2Status = `${p2Name} WINS!`;
        } else {
            p1Status = `${p1Name} LOSES`;
            p2Status = `${p2Name} LOSES`;
        }

        // Show WIN/LOSE labels in player zones
        let p1StatusEl = document.getElementById('p1-status-label');
        let p2StatusEl = document.getElementById('p2-status-label');
        if (!p1StatusEl) {
            p1StatusEl = document.createElement('div');
            p1StatusEl.id = 'p1-status-label';
            p1StatusEl.className = 'player-status-label';
            document.getElementById('p1-area').appendChild(p1StatusEl);
        }
        if (!p2StatusEl) {
            p2StatusEl = document.createElement('div');
            p2StatusEl.id = 'p2-status-label';
            p2StatusEl.className = 'player-status-label';
            document.getElementById('p2-area').appendChild(p2StatusEl);
        }
        p1StatusEl.innerText = p1Status;
        p2StatusEl.innerText = p2Status;

        // Set player area background: red for win, black for lose
        const p1Zone = document.getElementById('p1-zone');
        const p2Zone = document.getElementById('p2-zone');
        // Reset opacity for both zones
        if (p1Zone) p1Zone.style.opacity = '1.0';
        if (p2Zone) p2Zone.style.opacity = '1.0';
        if (p1Zone) {
            if (p1Score >= 100) {
                p1Zone.style.background = '#ff2d2d';
                p1Zone.style.color = '#fff';
            } else {
                p1Zone.style.background = '#000';
                p1Zone.style.color = '#fff';
            }
        }
        if (p2Zone) {
            if (p2Score >= 100) {
                p2Zone.style.background = '#ff2d2d';
                p2Zone.style.color = '#fff';
            } else {
                p2Zone.style.background = '#000';
                p2Zone.style.color = '#fff';
            }
        }

        // Hide start buttons
        if (document.getElementById('start-p1-btn')) document.getElementById('start-p1-btn').style.display = 'none';
        if (document.getElementById('start-p2-btn')) document.getElementById('start-p2-btn').style.display = 'none';

        // Replace timer-wrapper with correct buttons below the graph
        const timerArea = document.getElementById('timer-area');
        if (timerArea) {
            const btnRow = document.createElement('div');
            btnRow.id = 'battle-btn-row';
            btnRow.style.display = 'flex';
            btnRow.style.justifyContent = 'center';
            btnRow.style.gap = '20px';
            btnRow.style.marginTop = '0';
            let anyWin = (p1Score >= 100) || (p2Score >= 100);
            if (anyWin) {
                btnRow.innerHTML = `
                    <button id="go-photobooth-btn" class="overlay-buttons">Photobooth</button>
                    <button id="back-home-btn" class="overlay-buttons">Home</button>
                `;
            } else {
                btnRow.innerHTML = `
                    <button id="try-again-btn" class="overlay-buttons">Retry</button>
                    <button id="back-home-btn" class="overlay-buttons">Home</button>
                `;
            }
            timerArea.replaceWith(btnRow);
            if (anyWin) {
                document.getElementById('go-photobooth-btn').onclick = () => {
                    saveAndNavigate('photo.html');
                };
            } else {
                document.getElementById('try-again-btn').onclick = () => {
                    window.location.reload();
                };
            }
            document.getElementById('back-home-btn').onclick = () => {
                saveAndNavigate('index.html');
            };
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
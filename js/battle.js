// Overlay navigation for photobooth
function goToPhotobooth() {
    window.location.href = 'photo.html';
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
    setActivePlayer(1);
});
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

// Button references
const p1Btn = document.getElementById('start-p1-btn');
const p2Btn = document.getElementById('start-p2-btn');
const timerDisplay = document.getElementById('timer-display');

// Set player names in UI
document.getElementById('p1-name-display').innerText = p1Name;
document.getElementById('p2-name-display').innerText = p2Name;

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
    isRecording = false;
    clearInterval(timerInterval);

    if (currentPlayer === 1) {
        // Handle Player 1 completion
        p1Score = typeof currentBPM !== 'undefined' ? currentBPM : p1Score;
        document.getElementById('p1-result').innerText = p1Score;

        // UI updates to prepare for Player 2
        alert("Player 1 Finished! Transfer the sensor to Player 2.");
        if (p2Btn) p2Btn.disabled = false;
        if (p1Btn) p1Btn.disabled = true;
    } else {
        // Handle Player 2 completion
        p2Score = typeof currentBPM !== 'undefined' ? currentBPM : p2Score;
        document.getElementById('p2-result').innerText = p2Score;

        // CRITICAL: Call winner logic immediately after Player 2's 20s
        determineWinner();
    }
}

async function determineWinner() {
    const winnerName = (p1Score < p2Score) ? p1Name : p2Name;
    const loserName = (p1Score < p2Score) ? p2Name : p1Name;
    const winnerScore = (p1Score < p2Score) ? p1Score : p2Score;
    const loserScore = (p1Score < p2Score) ? p2Score : p1Score;
    localStorage.setItem('winnerName', winnerName);

    // Show high-contrast match results overlay
    const overlay = document.getElementById('match-results-overlay');
    if (overlay) {
        document.getElementById('winner-name').innerText = winnerName;
        document.getElementById('winner-score').innerText = winnerScore;
        document.getElementById('loser-name').innerText = loserName;
        document.getElementById('loser-score').innerText = loserScore;
        overlay.style.display = 'flex';
    }

    // 2. Save both players as individual entries with 'score' field
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    const matchLabel = `${p1Name} vs ${p2Name}`;
    const players = [
        {
            name: p1Name,
            score: Number(p1Score),
            section: p1Section,
            email: p1Email,
            status: (p1Score < p2Score) ? "Win" : "Lose",
            match: matchLabel
        },
        {
            name: p2Name,
            score: Number(p2Score),
            section: p2Section,
            email: p2Email,
            status: (p2Score < p1Score) ? "Win" : "Lose",
            match: matchLabel
        }
    ];
    for (let p of players) {
        try {
            await db.collection("leaderboard").add({
                name: p.name,
                score: p.score,
                section: p.section,
                email: p.email,
                status: p.status,
                match: p.match,
                timestamp: timestamp
            });
        } catch (err) {
            console.error("Firebase update failed:", err);
        }
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
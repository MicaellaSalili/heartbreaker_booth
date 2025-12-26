// Reference to your Firestore collection
const leaderboardRef = db.collection("leaderboard");

function loadLeaderboard() {
    // Show the highest BPM ever recorded (descending order)
    leaderboardRef.orderBy("score", "desc").limit(10).onSnapshot((snapshot) => {
        const tableBody = document.getElementById('leaderboardBody');
        tableBody.innerHTML = "";
        let rank = 1;
        snapshot.forEach((doc) => {
            const data = doc.data();
            const row = `
                <tr>
                    <td>${rank++}</td>
                    <td>${data.name || data.p1Name || 'Player'}</td>
                    <td>${data.score || data.p1Score || 0} BPM</td>
                    <td>${data.status || (data.winner ? (data.winner + ' Won!') : '')}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    });
}

// Call the function when the page loads
window.onload = loadLeaderboard;

function startChallenge() {
    // 1. Get values from the input fields
    const p1Name = document.getElementById('p1-name').value;
    const p1Section = document.getElementById('p1-section').value;
    const p1Email = document.getElementById('p1-email').value;
    const p2Name = document.getElementById('p2-name').value;
    const p2Section = document.getElementById('p2-section').value;
    const p2Email = document.getElementById('p2-email').value;

    // 2. Simple Validation: Ensure names are entered
    if (!p1Name || !p2Name) {
        alert("Please enter names for both players!");
        return;
    }

    // 3. Save to localStorage so battle.html can access them
    localStorage.setItem('p1Name', p1Name);
    localStorage.setItem('p1Section', p1Section);
    localStorage.setItem('p1Email', p1Email);
    localStorage.setItem('p2Name', p2Name);
    localStorage.setItem('p2Section', p2Section);
    localStorage.setItem('p2Email', p2Email);

    // 4. Redirect to the battle page
    window.location.href = "battle.html";
}
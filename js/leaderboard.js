// Sync only the Top 5 for the sidebar in battle.html
function syncSidebarLeaderboard() {
    const listElement = document.getElementById('leaderboard-list');
    if (!listElement || typeof db === 'undefined') return;
    db.collection("leaderboard")
        .orderBy("score", "desc")
        .limit(5)
        .onSnapshot((snapshot) => {
            listElement.innerHTML = "";
            snapshot.docs.forEach((doc, i) => {
                const d = doc.data();
                const score = Number(d.score);
                const row = `<tr>
                    <td style=\"color:#ffde00; padding: 5px 0;\">#${i+1}</td>
                    <td>${d.name || '---'}</td>
                    <td style=\"text-align: right; color:#00f2ff;\">${Number.isFinite(score) ? score : 0}</td>
                </tr>`;
                listElement.innerHTML += row;
            });
        });
}
// Real-time leaderboard sync for any page
function syncLeaderboard(listId) {
    const tableBody = document.getElementById(listId);
    if (!tableBody) {
        console.warn(`Element with ID '${listId}' not found for leaderboard sync`);
        return;
    }
    
    if (typeof db === 'undefined') {
        console.warn('Database not initialized, skipping leaderboard sync');
        return;
    }

    try {
        db.collection("leaderboard")
            .orderBy("score", "desc")
            .onSnapshot((snapshot) => {
                tableBody.innerHTML = "";
                snapshot.docs.forEach((doc, i) => {
                    const d = doc.data();
                    const time = d.timestamp ? d.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "---";
                    const score = Number(d.score);
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td style="color: #ffde00; font-weight: bold;">#${i + 1}</td>
                        <td>${d.name || '---'}</td>
                        <td style="color: #00f2ff;">${Number.isFinite(score) ? score : 0}</td>
                        <td>${d.status || '---'}</td>
                        <td>${d.match || '---'}</td>
                        <td>${d.section || '---'}</td>
                        <td>${time}</td>
                    `;
                    tableBody.appendChild(row);
            });
        }, (error) => {
            console.error("Leaderboard fetch failed: ", error);
        });
    } catch (error) {
        console.error("Error setting up leaderboard sync:", error);
    }
}

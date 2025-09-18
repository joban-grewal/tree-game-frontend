const treeCollection = [];

function uploadImage() {
    const input = document.getElementById('imageInput');
    if (!input.files.length) {
        alert("Select an image first!");
        return;
    }
    const formData = new FormData();
    formData.append("image", input.files[0]);

    fetch("https://tree-game-api.onrender.com/upload", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log("API response:", data);
        if (data.success) {
            addTree(data);
        }
        document.getElementById('result').innerHTML = `
            <h3>Result</h3>
            <p><b>Species:</b> ${data.info.species}</p>
            <p><b>Confidence:</b> ${data.info.confidence}%</p>
            <p><b>More Info:</b> ${data.info.wiki_summary || 'No additional info available.'}</p>
        `;
    })
    .catch(err => alert("Error: " + err));
}

function addTree(treeData) {
    treeCollection.push(`${treeData.info.species} (${treeData.filename})`);
    updateCollection();
    updatePoints();
}

function updateCollection() {
    const container = document.getElementById('tree-collection');
    container.innerHTML = '';
    treeCollection.forEach(item => {
        const p = document.createElement('p');
        p.textContent = item;
        container.appendChild(p);
    });
}

function updatePoints() {
    fetch('https://tree-game-api.onrender.com/leaderboard')
        .then(res => res.json())
        .then(data => {
            const userPoints = data.find(u => u.user === 'Demo User')?.points || 0;
            document.getElementById('user-points').innerText = userPoints;
        });
}

function loadLeaderboard() {
    fetch('https://tree-game-api.onrender.com/leaderboard')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('leaderboard');
            container.innerHTML = '';
            data.forEach(u => {
                const p = document.createElement('p');
                p.textContent = `${u.user}: ${u.points} points`;
                container.appendChild(p);
            });
        });
}

document.getElementById('toggle-collection').addEventListener('click', () => {
    document.getElementById('tree-collection').classList.toggle('active');
});

document.getElementById('toggle-leaderboard').addEventListener('click', () => {
    document.getElementById('leaderboard').classList.toggle('active');
});

// Load leaderboard initially (optional)
loadLeaderboard();

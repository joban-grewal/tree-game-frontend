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
        if (data.success) {
            addTree(data);
        }
        document.getElementById('result').innerHTML = `
            <h3>Result</h3>
            <p><b>Species:</b> ${data.info.species}</p>
            <p><b>Confidence:</b> ${data.info.confidence}%</p>
            <p><b>Fact:</b> ${data.info.facts}</p>
            <p><b>More Info:</b> ${data.info.wiki_summary}</p>
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
    const ul = document.getElementById('my-trees');
    ul.innerHTML = "";
    treeCollection.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
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
            container.innerHTML = '<h3>Leaderboard</h3>' + data.map(u => `<p>${u.user}: ${u.points} points</p>`).join('');
        });
}

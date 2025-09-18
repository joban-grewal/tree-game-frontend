const treeCollection = [];

function uploadImage() {
    const input = document.getElementById('imageInput');
    const uploadButton = document.getElementById('upload-button');
    const resultDiv = document.getElementById('result');

    if (!input.files.length) {
        alert("Please select an image first!");
        return;
    }

    // --- 🔄 Provide User Feedback ---
    uploadButton.disabled = true;
    uploadButton.textContent = "Identifying...";
    resultDiv.innerHTML = ''; // Clear previous results

    const formData = new FormData();
    formData.append("image", input.files[0]);

    fetch("https://tree-game-api.onrender.com/upload", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log("API response:", data);
        // --- ✅ Better API Response Handling ---
        if (data.success) {
            addTree(data);
            resultDiv.innerHTML = `
                <h3>Result</h3>
                <p><b>Species:</b> ${data.info.species}</p>
                <p><b>Confidence:</b> ${data.info.confidence}%</p>
                <p><b>More Info:</b> ${data.info.wiki_summary || 'No additional info available.'}</p>
            `;
        } else {
            // Handle errors reported by the API
            resultDiv.innerHTML = `<p><b>Error:</b> ${data.message || 'Could not identify the tree.'}</p>`;
        }
    })
    .catch(err => {
        console.error("Fetch Error:", err);
        resultDiv.innerHTML = `<p><b>Error:</b> An unexpected error occurred. Please try again.</p>`;
    })
    .finally(() => {
        // --- Re-enable the button regardless of success or failure ---
        uploadButton.disabled = false;
        uploadButton.textContent = "Upload & Identify";
    });
}

function addTree(treeData) {
    treeCollection.push(`${treeData.info.species} (${treeData.filename})`);
    updateCollection();
    updatePoints();
    // --- Automatically open the collection sidebar ---
    document.getElementById('tree-collection').classList.add('active');
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
        })
        .catch(err => console.error("Could not update points:", err));
}

function loadLeaderboard() {
    fetch('https://tree-game-api.onrender.com/leaderboard')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('leaderboard');
            container.innerHTML = '';
            // Sort leaderboard from highest to lowest points
            data.sort((a, b) => b.points - a.points);
            data.forEach(u => {
                const p = document.createElement('p');
                p.textContent = `${u.user}: ${u.points} points`;
                container.appendChild(p);
            });
        })
        .catch(err => console.error("Could not load leaderboard:", err));
}

document.getElementById('toggle-collection').addEventListener('click', () => {
    document.getElementById('tree-collection').classList.toggle('active');
});

document.getElementById('toggle-leaderboard').addEventListener('click', () => {
    document.getElementById('leaderboard').classList.toggle('active');
});

// Load leaderboard on initial page load
loadLeaderboard();
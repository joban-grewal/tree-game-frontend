// Holds scanned trees in-memory (demo - use backend/db for real app)
const treeCollection = [];

function uploadImage() {
    const input = document.getElementById('imageInput');
    if (!input.files.length) {
        alert("Select an image first!");
        return;
    }
    const formData = new FormData();
    formData.append("image", input.files[0]);
    fetch("http://127.0.0.1:5000/upload", {
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
        `;
    })
    .catch(err => alert("Error: " + err));
}

// Add identified tree to collection and update UI
function addTree(treeData) {
    treeCollection.push(treeData.info.species + " (" + treeData.filename + ")");
    updateCollection();
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

// After a successful identification
function addTree(treeInfo) {
  const listItem = `${treeInfo.species} (Confidence: ${treeInfo.confidence}%)`;
  treeCollection.push(listItem);
  updateCollection();
  updatePoints();  // refresh points
}

// Fetch user points from backend and update display
function updatePoints() {
  // Call backend (simulate points here for demo)
  fetch('http://127.0.0.1:5000/leaderboard') // or a dedicated points API
    .then(res => res.json())
    .then(data => {
      // find your user points (for demo, just get demo_user)
      const userPoints = data.find(u => u.user === 'Demo User')?.points || 0;
      document.getElementById('user-points').innerText = userPoints;
    });
}

// Load leaderboard
function loadLeaderboard() {
  fetch('http://127.0.0.1:5000/leaderboard')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('leaderboard');
      container.innerHTML = '<h3>Leaderboard</h3>' + data.map(u => `<p>${u.user}: ${u.points} points</p>`).join('');
    });
}

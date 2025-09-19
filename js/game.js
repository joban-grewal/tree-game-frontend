document.addEventListener('DOMContentLoaded', () => {
    const treeCollection = [];

    // --- Element References ---
    const imageInput = document.getElementById('imageInput');
    const uploadButton = document.getElementById('upload-button');
    const resultArea = document.getElementById('result-area');
    const userPointsSpan = document.getElementById('user-points');
    const customUploadLabel = document.querySelector('.custom-file-upload');

    // --- Health Feature References ---
    const healthCheckContainer = document.getElementById('health-check-container');
    const healthCheckBtn = document.getElementById('health-check-btn');
    const healthResultArea = document.getElementById('health-result-area');

    // --- Modal References ---
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const collectionModal = document.getElementById('collection-modal');
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const collectionBtn = document.getElementById('collection-btn');
    const closeButtons = document.querySelectorAll('.modal-close');
    const modalOverlays = document.querySelectorAll('.modal-overlay');

    // --- Event Listeners ---
    uploadButton.addEventListener('click', uploadImage);
    healthCheckBtn.addEventListener('click', checkHealth);

    leaderboardBtn.addEventListener('click', () => {
        loadLeaderboard();
        leaderboardModal.classList.add('active');
    });
    collectionBtn.addEventListener('click', () => {
        collectionModal.classList.add('active');
    });

    closeButtons.forEach(button => button.addEventListener('click', () => {
        leaderboardModal.classList.remove('active');
        collectionModal.classList.remove('active');
    }));

    modalOverlays.forEach(overlay => overlay.addEventListener('click', () => {
        leaderboardModal.classList.remove('active');
        collectionModal.classList.remove('active');
    }));

    imageInput.addEventListener('change', () => {
        customUploadLabel.textContent = imageInput.files.length > 0 ? imageInput.files[0].name : 'Choose an Image';
    });

    // --- Core Functions ---
    function uploadImage() {
        if (!imageInput.files.length) {
            alert("Please select an image first!");
            return;
        }
        uploadButton.disabled = true;
        uploadButton.textContent = "Identifying...";
        resultArea.innerHTML = '';
        healthCheckContainer.style.display = 'none';
        healthResultArea.innerHTML = '';

        const formData = new FormData();
        formData.append("image", imageInput.files[0]);

        fetch("https://tree-game-api.onrender.com/upload", { method: "POST", body: formData })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addTree(data);
                resultArea.innerHTML = `
                    <h3>Identification Result</h3>
                    <p><b>Species:</b> ${data.info.species}</p>
                    <p><b>Confidence:</b> ${data.info.confidence}%</p>
                    <p><b>More Info:</b> ${data.info.wiki_summary || 'No additional info available.'}</p>
                `;
                healthCheckContainer.style.display = 'block';
            } else {
                resultArea.innerHTML = `<p><b>Error:</b> ${data.message || 'Could not identify the tree.'}</p>`;
            }
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            resultArea.innerHTML = `<p><b>Error:</b> An unexpected error occurred. Please try again.</p>`;
        })
        .finally(() => {
            uploadButton.disabled = false;
            uploadButton.textContent = "Upload & Identify";
        });
    }

    function checkHealth() {
        if (!imageInput.files.length) {
            alert("No image available for health check.");
            return;
        }
        healthCheckBtn.disabled = true;
        healthCheckBtn.textContent = "Diagnosing...";
        healthResultArea.innerHTML = '';

        const formData = new FormData();
        formData.append("image", imageInput.files[0]);

        fetch("https://tree-game-api.onrender.com/diagnose", { method: "POST", body: formData })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                healthResultArea.innerHTML = `
                    <h3>🩺 Health Report</h3>
                    <p><b>Diagnosis:</b> ${data.diagnosis}</p>
                    <h4>💡 Care Advice</h4>
                    <div>${data.care_advice}</div>
                `;
            } else {
                healthResultArea.innerHTML = `<p><b>Error:</b> Could not complete health diagnosis.</p>`;
            }
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            healthResultArea.innerHTML = `<p><b>Error:</b> An unexpected error occurred during diagnosis.</p>`;
        })
        .finally(() => {
            healthCheckBtn.disabled = false;
            healthCheckBtn.textContent = "🩺 Check Health";
        });
    }

    function addTree(treeData) {
        treeCollection.push(`${treeData.info.species} (${treeData.filename})`);
        updateCollection();
        loadLeaderboard(); // This will also update the points display
    }

    function updateCollection() {
        const container = document.getElementById('collection-content');
        container.innerHTML = '';
        if (treeCollection.length === 0) {
            container.innerHTML = '<p>You haven\'t collected any trees yet!</p>';
            return;
        }
        treeCollection.forEach(item => {
            const p = document.createElement('p');
            p.textContent = item;
            container.appendChild(p);
        });
    }

    function loadLeaderboard() {
        const container = document.getElementById('leaderboard-content');
        container.innerHTML = '<p>Loading...</p>';

        fetch('https://tree-game-api.onrender.com/leaderboard')
            .then(res => res.json())
            .then(data => {
                container.innerHTML = '';
                data.forEach(u => {
                    const p = document.createElement('p');
                    p.textContent = `${u.user}: ${u.points} points`;
                    container.appendChild(p);
                });
                // Update the main points display after fetching the leaderboard
                const demoUser = data.find(u => u.user === 'Demo User');
                if (demoUser) {
                    userPointsSpan.innerText = demoUser.points;
                }
            })
            .catch(err => {
                console.error("Could not load leaderboard:", err);
                container.innerHTML = '<p>Could not load leaderboard data.</p>';
            });
    }
    
    // --- Initial Load ---
    loadLeaderboard();
    updateCollection();
});
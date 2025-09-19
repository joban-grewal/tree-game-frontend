document.addEventListener('DOMContentLoaded', () => {
    const treeCollection = [];

    // --- Element References ---
    const imageInput = document.getElementById('imageInput');
    const uploadButton = document.getElementById('upload-button');
    const resultArea = document.getElementById('result-area');
    const userPointsSpan = document.getElementById('user-points');
    const customUploadLabel = document.querySelector('.custom-file-upload');

    // --- NEW: Health Feature References ---
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
    healthCheckBtn.addEventListener('click', checkHealth); // NEW

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
        healthCheckContainer.style.display = 'none'; // Hide health button
        healthResultArea.innerHTML = ''; // Clear old health report

        const formData = new FormData();
        formData.append("image", imageInput.files[0]);

        fetch("http://127.0.0.1:5000/upload", { method: "POST", body: formData })
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
                healthCheckContainer.style.display = 'block'; // Show health button
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

    // --- NEW: Health Check Function ---
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

        fetch("http://127.0.0.1:5000/diagnose", { method: "POST", body: formData })
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

    function addTree(treeData) { /* ... (rest of the functions are the same) ... */ }
    function updateCollection() { /* ... */ }
    function updatePoints() { /* ... */ }
    function loadLeaderboard() { /* ... */ }
    
    // Paste your existing addTree, updateCollection, updatePoints, and loadLeaderboard functions here
    // For brevity, they are omitted, but they are unchanged.
});
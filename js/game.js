document.addEventListener('DOMContentLoaded', () => {
    const treeCollection = [];

    // --- Element References ---
    const imageInput = document.getElementById('imageInput');
    const uploadButton = document.getElementById('upload-button');
    const resultArea = document.getElementById('result-area');
    const userPointsSpan = document.getElementById('user-points');
    const customUploadLabel = document.querySelector('.custom-file-upload');

    // --- Modal References ---
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const collectionModal = document.getElementById('collection-modal');
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const collectionBtn = document.getElementById('collection-btn');
    const closeButtons = document.querySelectorAll('.modal-close');
    const modalOverlays = document.querySelectorAll('.modal-overlay');

    // --- Event Listeners ---
    uploadButton.addEventListener('click', uploadImage);
    leaderboardBtn.addEventListener('click', () => {
        loadLeaderboard();
        leaderboardModal.classList.add('active');
    });
    collectionBtn.addEventListener('click', () => {
        collectionModal.classList.add('active');
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            leaderboardModal.classList.remove('active');
            collectionModal.classList.remove('active');
        });
    });

    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', () => {
            leaderboardModal.classList.remove('active');
            collectionModal.classList.remove('active');
        });
    });

    // Update label text when a file is chosen
    imageInput.addEventListener('change', () => {
        if (imageInput.files.length > 0) {
            customUploadLabel.textContent = imageInput.files[0].name;
        } else {
            customUploadLabel.textContent = 'Choose an Image';
        }
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

        const formData = new FormData();
        formData.append("image", imageInput.files[0]);

        fetch("https://tree-game-api.onrender.com/upload", {
            method: "POST",
            body: formData
        })
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

    function addTree(treeData) {
        treeCollection.push(`${treeData.info.species} (${treeData.filename})`);
        updateCollection();
        updatePoints();
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

    function updatePoints() {
        fetch('https://tree-game-api.onrender.com/leaderboard')
            .then(res => res.json())
            .then(data => {
                const userPoints = data.find(u => u.user === 'Demo User')?.points || 0;
                userPointsSpan.innerText = userPoints;
            })
            .catch(err => console.error("Could not update points:", err));
    }

    function loadLeaderboard() {
        const container = document.getElementById('leaderboard-content');
        container.innerHTML = '<p>Loading...</p>';

        fetch('https://tree-game-api.onrender.com/leaderboard')
            .then(res => res.json())
            .then(data => {
                container.innerHTML = '';
                data.sort((a, b) => b.points - a.points);
                data.forEach(u => {
                    const p = document.createElement('p');
                    p.textContent = `${u.user}: ${u.points} points`;
                    container.appendChild(p);
                });
            })
            .catch(err => {
                console.error("Could not load leaderboard:", err);
                container.innerHTML = '<p>Could not load leaderboard data.</p>';
            });
    }

    // --- Initial Load ---
    updatePoints();
    updateCollection();
});
document.addEventListener('DOMContentLoaded', () => {
    const treeCollection = [];
    let currentSpecies = ""; // Variable to store the identified species
    // CHANGED: Added the list of supported plants for the health check
    const supportedPlants = ['potato', 'tomato', 'corn', 'maize'];
    let totalPoints = 0; // Track total points

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

    // --- Helper Functions for Enhanced UX ---
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function animatePoints(newPoints) {
        const start = parseInt(userPointsSpan.innerText) || 0;
        const end = newPoints;
        const duration = 1000;
        const startTime = performance.now();
        
        function updatePoints(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * progress);
            userPointsSpan.innerText = current;
            
            if (progress < 1) {
                requestAnimationFrame(updatePoints);
            }
        }
        
        requestAnimationFrame(updatePoints);
    }

    function createLoadingSpinner() {
        return `<div class="loading-spinner">
            <div class="spinner"></div>
            <p>Processing your image...</p>
        </div>`;
    }

    // --- Event Listeners ---
    uploadButton.addEventListener('click', uploadImage);
    healthCheckBtn.addEventListener('click', checkHealth);

    leaderboardBtn.addEventListener('click', () => {
        loadLeaderboard();
        leaderboardModal.classList.add('active');
    });

    collectionBtn.addEventListener('click', () => {
        updateCollection();
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
        if (imageInput.files.length > 0) {
            const fileName = imageInput.files[0].name;
            customUploadLabel.innerHTML = `
                <i class="fas fa-file-image"></i>
                <span>${fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}</span>
            `;
            customUploadLabel.style.background = 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)';
            customUploadLabel.style.color = 'white';
            
            // Preview image
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.createElement('div');
                preview.className = 'image-preview';
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                const uploadCard = document.querySelector('.upload-card');
                const existingPreview = uploadCard.querySelector('.image-preview');
                if (existingPreview) existingPreview.remove();
                uploadCard.appendChild(preview);
            };
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            customUploadLabel.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <span>Choose an Image</span>
            `;
            customUploadLabel.style.background = '';
            customUploadLabel.style.color = '';
        }
    });

    // --- Core Functions ---
    function uploadImage() {
        if (!imageInput.files.length) {
            showNotification("Please select an image first!", 'error');
            // Shake animation for upload button
            uploadButton.classList.add('shake');
            setTimeout(() => uploadButton.classList.remove('shake'), 500);
            return;
        }

        uploadButton.disabled = true;
        uploadButton.innerHTML = `
            <span class="btn-text">Identifying...</span>
            <div class="mini-spinner"></div>
        `;
        resultArea.innerHTML = createLoadingSpinner();
        healthCheckContainer.style.display = 'none';
        healthResultArea.innerHTML = '';

        const formData = new FormData();
        formData.append("image", imageInput.files[0]);

        fetch("https://tree-game-api.onrender.com/upload", { method: "POST", body: formData })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentSpecies = data.info.species;
                addTree(data);
                
                // Enhanced result display with animation
                resultArea.innerHTML = `
                    <div class="result-card success-result">
                        <div class="result-header">
                            <div class="result-icon">🌳</div>
                            <h3>Tree Identified Successfully!</h3>
                        </div>
                        <div class="result-content">
                            <div class="info-row">
                                <span class="info-label">
                                    <i class="fas fa-tree"></i> Species:
                                </span>
                                <span class="info-value">${data.info.species}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">
                                    <i class="fas fa-percentage"></i> Confidence:
                                </span>
                                <div class="confidence-bar">
                                    <div class="confidence-fill" style="width: ${data.info.confidence}%">
                                        ${data.info.confidence}%
                                    </div>
                                </div>
                            </div>
                            ${data.info.wiki_summary ? `
                            <div class="info-details">
                                <h4><i class="fas fa-info-circle"></i> About this tree</h4>
                                <p>${data.info.wiki_summary}</p>
                            </div>
                            ` : ''}
                        </div>
                        <div class="points-earned">
                            <span>+10 Points Earned! 🎉</span>
                        </div>
                    </div>
                `;

                const speciesName = data.info.species.toLowerCase();
                const isSupported = supportedPlants.some(plant => speciesName.includes(plant));
                if (isSupported) {
                    healthCheckBtn.disabled = false;
                    healthCheckBtn.textContent = "🩺 Check Health";
                    healthCheckBtn.title = "Click to run a health diagnosis on this plant.";
                } else {
                    healthCheckBtn.disabled = true;
                    healthCheckBtn.textContent = "Health Check Unavailable";
                    healthCheckBtn.title = "Health diagnosis is only available for Potato, Tomato, and Corn for now.";
                }
                
                // Animate confidence bar
                setTimeout(() => {
                    const confidenceFill = document.querySelector('.confidence-fill');
                    if (confidenceFill) {
                        confidenceFill.style.animation = 'fillBar 1s ease-out';
                    }
                }, 100);
                
                healthCheckContainer.style.display = 'block';
                showNotification(`Great job! You've identified a ${data.info.species}!`, 'success');
                
                // Update points with animation
                totalPoints += 10;
                animatePoints(totalPoints);
            } else {
                resultArea.innerHTML = `
                    <div class="result-card error-result">
                        <div class="result-header">
                            <div class="result-icon">❌</div>
                            <h3>Identification Failed</h3>
                        </div>
                        <div class="result-content">
                            <p>${data.message || 'Could not identify the tree. Please try with a clearer image.'}</p>
                        </div>
                        <button class="retry-btn" onclick="location.reload()">
                            <i class="fas fa-redo"></i> Try Again
                        </button>
                    </div>
                `;
                showNotification('Could not identify the tree. Please try again.', 'error');
            }
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            resultArea.innerHTML = `
                <div class="result-card error-result">
                    <div class="result-header">
                        <div class="result-icon">⚠️</div>
                        <h3>Connection Error</h3>
                    </div>
                    <div class="result-content">
                        <p>An unexpected error occurred. Please check your connection and try again.</p>
                    </div>
                </div>
            `;
            showNotification('Connection error. Please try again.', 'error');
        })
        .finally(() => {
            uploadButton.disabled = false;
            uploadButton.innerHTML = `
                <span class="btn-text">Upload & Identify</span>
                <span class="btn-icon">🔍</span>
            `;
        });
    }

    function checkHealth() {
        if (!imageInput.files.length) {
            showNotification("No image available for health check.", 'error');
            healthCheckBtn.classList.add('shake');
            setTimeout(() => healthCheckBtn.classList.remove('shake'), 500);
            return;
        }

        healthCheckBtn.disabled = true;
        healthCheckBtn.innerHTML = `
            <span>Diagnosing...</span>
            <div class="mini-spinner"></div>
        `;
        healthResultArea.innerHTML = createLoadingSpinner();

        const formData = new FormData();
        formData.append("image", imageInput.files[0]);
        formData.append("species", currentSpecies);

        fetch("https://tree-game-api.onrender.com/diagnose", { method: "POST", body: formData })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                healthResultArea.innerHTML = `
                    <div class="health-card">
                        <div class="health-header">
                            <div class="health-status ${data.diagnosis.includes('healthy') ? 'healthy' : 'warning'}">
                                <i class="fas ${data.diagnosis.includes('healthy') ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                            </div>
                            <h3>🩺 Health Report</h3>
                        </div>
                        <div class="diagnosis-section">
                            <h4><i class="fas fa-clipboard-check"></i> Diagnosis</h4>
                            <p>${data.diagnosis}</p>
                        </div>
                        <div class="care-section">
                            <h4><i class="fas fa-lightbulb"></i> Care Advice</h4>
                            <div class="care-advice">${formatCareAdvice(data.care_advice)}</div>
                        </div>
                        <div class="health-score">
                            <div class="score-circle">
                                <span class="score-value">${getHealthScore(data.diagnosis)}</span>
                                <span class="score-label">Health Score</span>
                            </div>
                        </div>
                    </div>
                `;
                showNotification('Health diagnosis complete!', 'success');
            } else {
                healthResultArea.innerHTML = `
                    <div class="result-card error-result">
                        <div class="result-header">
                            <div class="result-icon">❌</div>
                            <h3>Diagnosis Failed</h3>
                        </div>
                        <div class="result-content">
                            <p>${data.error || 'Could not complete health diagnosis.'}</p>
                        </div>
                    </div>
                `;
                showNotification('Could not complete diagnosis.', 'error');
            }
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            healthResultArea.innerHTML = `
                <div class="result-card error-result">
                    <div class="result-header">
                        <div class="result-icon">⚠️</div>
                        <h3>Connection Error</h3>
                    </div>
                    <div class="result-content">
                        <p>An unexpected error occurred during diagnosis.</p>
                    </div>
                </div>
            `;
            showNotification('Connection error during diagnosis.', 'error');
        })
        .finally(() => {
            healthCheckBtn.disabled = false;
            healthCheckBtn.innerHTML = `
                <span>Check Tree Health</span>
                <i class="fas fa-stethoscope"></i>
            `;
        });
    }

    function formatCareAdvice(advice) {
        // Convert care advice to bullet points if it contains sentences
        const sentences = advice.split('. ').filter(s => s.length > 0);
        if (sentences.length > 1) {
            return '<ul class="care-list">' + 
                sentences.map(s => `<li><i class="fas fa-leaf"></i> ${s.replace(/\.$/, '')}</li>`).join('') + 
                '</ul>';
        }
        return `<p>${advice}</p>`;
    }

    function getHealthScore(diagnosis) {
        // Simple health score based on diagnosis keywords
        const lowerDiagnosis = diagnosis.toLowerCase();
        if (lowerDiagnosis.includes('healthy') || lowerDiagnosis.includes('good')) {
            return '85%';
        } else if (lowerDiagnosis.includes('moderate') || lowerDiagnosis.includes('minor')) {
            return '60%';
        } else if (lowerDiagnosis.includes('severe') || lowerDiagnosis.includes('critical')) {
            return '30%';
        }
        return '70%';
    }

    function addTree(treeData) {
        treeCollection.push({
            name: treeData.info.species,
            filename: treeData.filename,
            confidence: treeData.info.confidence,
            timestamp: new Date().toLocaleDateString()
        });
        updateCollection();
        loadLeaderboard();
    }

    function updateCollection() {
        const container = document.getElementById('collection-content');
        container.innerHTML = '';
        
        if (treeCollection.length === 0) {
            container.innerHTML = `
                <div class="empty-collection">
                    <i class="fas fa-tree"></i>
                    <p>You haven't collected any trees yet!</p>
                    <p class="hint">Start by uploading a tree image above</p>
                </div>
            `;
            return;
        }
        
        const collectionGrid = document.createElement('div');
        collectionGrid.className = 'collection-grid';
        
        treeCollection.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'collection-card';
            card.innerHTML = `
                <div class="collection-number">#${index + 1}</div>
                <div class="collection-icon">🌲</div>
                <h4>${item.name}</h4>
                <div class="collection-details">
                    <span><i class="fas fa-percentage"></i> ${item.confidence}%</span>
                    <span><i class="fas fa-calendar"></i> ${item.timestamp}</span>
                </div>
            `;
            collectionGrid.appendChild(card);
        });
        
        container.appendChild(collectionGrid);
        
        // Add collection stats
        const stats = document.createElement('div');
        stats.className = 'collection-stats';
        stats.innerHTML = `
            <div class="stat">
                <i class="fas fa-tree"></i>
                <span>${treeCollection.length} Trees Collected</span>
            </div>
            <div class="stat">
                <i class="fas fa-star"></i>
                <span>${totalPoints} Total Points</span>
            </div>
        `;
        container.appendChild(stats);
    }

    function loadLeaderboard() {
        const container = document.getElementById('leaderboard-content');
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading leaderboard...</p>
            </div>
        `;

        fetch('https://tree-game-api.onrender.com/leaderboard')
            .then(res => res.json())
            .then(data => {
                container.innerHTML = '';
                
                if (data.length === 0) {
                    container.innerHTML = '<p class="no-data">No leaderboard data available yet.</p>';
                    return;
                }
                
                const leaderboardList = document.createElement('div');
                leaderboardList.className = 'leaderboard-list';
                
                data.forEach((u, index) => {
                    const item = document.createElement('div');
                    item.className = `leaderboard-item ${index < 3 ? 'top-three' : ''}`;
                    
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                    
                    item.innerHTML = `
                        <div class="rank">${medal}</div>
                        <div class="player-info">
                            <span class="player-name">${u.user}</span>
                            <div class="player-stats">
                                <span class="points">${u.points} points</span>
                            </div>
                        </div>
                        ${u.user === 'Demo User' ? '<div class="you-badge">YOU</div>' : ''}
                    `;
                    leaderboardList.appendChild(item);
                });
                
                container.appendChild(leaderboardList);
                
                const demoUser = data.find(u => u.user === 'Demo User');
                if (demoUser) {
                    animatePoints(demoUser.points);
                }
            })
            .catch(err => {
                console.error("Could not load leaderboard:", err);
                container.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Could not load leaderboard data.</p>
                        <button class="retry-btn" onclick="loadLeaderboard()">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                `;
            });
    }
    
    // --- Initial Load ---
    loadLeaderboard();
    updateCollection();
});
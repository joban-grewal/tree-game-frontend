// ===== TREE GUARDIAN GAME ENGINE =====
class TreeGuardianGame {
    constructor() {
        // Game State
        this.state = {
            user: {
                name: 'Forest Guardian',
                level: 1,
                experience: 0,
                points: 0,
                streak: 0,
                lastActive: new Date().toDateString(),
                achievements: [],
                settings: {
                    soundEnabled: true,
                    notifications: true
                }
            },
            collection: [],
            currentImage: null,
            currentSpecies: '',
            dailyMission: {
                target: 3,
                progress: 0,
                completed: false
            },
            stats: {
                treesIdentified: 0,
                accuracy: 0,
                daysActive: 1,
                badgesEarned: 0
            }
        };

        // Supported plants for health check
        this.supportedPlants = ['potato', 'tomato', 'corn', 'maize'];
        
        // Achievement definitions
        this.achievements = [
            { id: 'first_tree', name: 'First Discovery', icon: '🌱', requirement: 1, type: 'trees' },
            { id: 'tree_collector', name: 'Tree Collector', icon: '🌳', requirement: 10, type: 'trees' },
            { id: 'forest_expert', name: 'Forest Expert', icon: '🌲', requirement: 50, type: 'trees' },
            { id: 'streak_week', name: 'Week Warrior', icon: '🔥', requirement: 7, type: 'streak' },
            { id: 'level_5', name: 'Rising Star', icon: '⭐', requirement: 5, type: 'level' },
            { id: 'level_10', name: 'Tree Master', icon: '👑', requirement: 10, type: 'level' },
            { id: 'perfect_diagnosis', name: 'Plant Doctor', icon: '🩺', requirement: 5, type: 'health' },
            { id: 'daily_champion', name: 'Daily Champion', icon: '🏆', requirement: 10, type: 'daily' }
        ];

        // Sound effects (using Web Audio API)
        this.sounds = {
            success: this.createSound(800, 'sine', 0.1),
            error: this.createSound(300, 'sawtooth', 0.1),
            levelUp: this.createSound(1000, 'sine', 0.2),
            achievement: this.createSound(600, 'triangle', 0.15)
        };

        this.init();
    }

    // ===== INITIALIZATION =====
    init() {
        this.loadState();
        this.initElements();
        this.initEventListeners();
        this.initParticles();
        this.updateUI();
        this.checkDailyStreak();
        this.hidePreloader();
        this.startConnectionMonitor();
    }

    initElements() {
        // Main elements
        this.elements = {
            // Upload elements
            imageInput: document.getElementById('imageInput'),
            uploadButton: document.getElementById('upload-button'),
            cameraBtn: document.getElementById('camera-btn'),
            previewContainer: document.getElementById('image-preview-container'),
            previewImage: document.getElementById('preview-image'),
            removeImageBtn: document.getElementById('remove-image'),
            
            // Result elements
            resultSection: document.getElementById('result-section'),
            resultArea: document.getElementById('result-area'),
            healthSection: document.getElementById('health-section'),
            healthCheckBtn: document.getElementById('health-check-btn'),
            healthResultArea: document.getElementById('health-result-area'),
            
            // UI elements
            userPoints: document.getElementById('user-points'),
            userLevel: document.getElementById('user-level'),
            levelProgress: document.getElementById('level-progress'),
            streakCount: document.getElementById('streak-count'),
            
            // Stats elements
            treesIdentified: document.getElementById('trees-identified'),
            accuracyRate: document.getElementById('accuracy-rate'),
            daysActive: document.getElementById('days-active'),
            badgesEarned: document.getElementById('badges-earned'),
            
            // Modal elements
            achievementsModal: document.getElementById('achievements-modal'),
            leaderboardModal: document.getElementById('leaderboard-modal'),
            collectionModal: document.getElementById('collection-modal'),
            profileModal: document.getElementById('profile-modal'),
            petBtn: document.getElementById('pet-btn'),
            petModal: document.getElementById('pet-modal'),
            
            // Buttons
            achievementsBtn: document.getElementById('achievements-btn'),
            leaderboardBtn: document.getElementById('leaderboard-btn'),
            collectionBtn: document.getElementById('collection-btn'),
            profileBtn: document.getElementById('profile-btn'),
            soundToggle: document.getElementById('sound-toggle'),
            
            // Other
            connectionStatus: document.getElementById('connection-status'),
            notificationContainer: document.getElementById('notification-container')
        };
    }

    initEventListeners() {
        // Upload events
        this.elements.imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
        this.elements.uploadButton.addEventListener('click', () => this.uploadImage());
        this.elements.cameraBtn.addEventListener('click', () => this.openCamera());
        this.elements.removeImageBtn.addEventListener('click', () => this.removeImage());
        this.elements.healthCheckBtn.addEventListener('click', () => this.checkHealth());
        
        // Modal events
        this.elements.achievementsBtn.addEventListener('click', () => this.openModal('achievements'));
        this.elements.leaderboardBtn.addEventListener('click', () => this.openModal('leaderboard'));
        this.elements.collectionBtn.addEventListener('click', () => this.openModal('collection'));
        this.elements.profileBtn.addEventListener('click', () => this.openModal('profile'));
        this.elements.petBtn.addEventListener('click', () => this.openModal('pet'));
        
        // Modal close events
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e));
        });
        
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => this.closeModal(e));
        });
        
        // Tab events
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e));
        });
        
        // Filter events
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterCollection(e));
        });
        
        // Sound toggle
        this.elements.soundToggle.addEventListener('click', () => this.toggleSound());
    }

    // ===== PARTICLE EFFECTS =====
    initParticles() {
        const container = document.getElementById('particles-container');
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            container.appendChild(particle);
        }
    }

    // ===== SOUND SYSTEM =====
    createSound(frequency, type, duration) {
        return () => {
            if (!this.state.user.settings.soundEnabled) return;
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
        };
    }

    toggleSound() {
        this.state.user.settings.soundEnabled = !this.state.user.settings.soundEnabled;
        this.elements.soundToggle.classList.toggle('muted');
        this.elements.soundToggle.innerHTML = this.state.user.settings.soundEnabled ? 
            '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
        this.saveState();
    }

    // ===== IMAGE HANDLING =====
    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (file.size > maxSize) {
            this.showNotification('File too large! Maximum size is 10MB', 'error');
            return false;
        }
        
        if (!validTypes.includes(file.type)) {
            this.showNotification('Invalid file type! Please upload an image', 'error');
            return false;
        }
        
        return true;
    }

    removeImage() {
        this.elements.imageInput.value = '';
        this.elements.previewContainer.classList.add('hidden');
        this.elements.uploadButton.disabled = true;
        this.state.currentImage = null;
    }

    openCamera() {
        // Create a file input specifically for camera
        const cameraInput = document.createElement('input');
        cameraInput.type = 'file';
        cameraInput.accept = 'image/*';
        cameraInput.capture = 'environment'; // Use back camera on mobile
        
        cameraInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                // Process the captured image
                const file = e.target.files[0];
                this.elements.imageInput.files = e.target.files;
                this.handleImageSelect({ target: { files: [file] } });
            }
        });
        
        // Trigger the camera
        cameraInput.click();
    }

    handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file
        if (!this.validateFile(file)) return;
        
        // Show loading state
        this.showNotification('Processing image...', 'info');
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.elements.previewImage.src = e.target.result;
            this.elements.previewContainer.classList.remove('hidden');
            this.elements.uploadButton.disabled = false;
            this.state.currentImage = file;
            
            // Update the file input label
            const fileName = file.name;
            const uploadLabel = document.querySelector('.file-upload-btn .btn-content span');
            if (uploadLabel) {
                uploadLabel.textContent = fileName.length > 20 ? 
                    fileName.substring(0, 20) + '...' : fileName;
            }
        };
        reader.readAsDataURL(file);
    }

    // ===== UPLOAD & IDENTIFY =====
    async uploadImage() {
        if (!this.state.currentImage) {
            this.showNotification('Please select an image first!', 'error');
            return;
        }
        
        this.elements.uploadButton.disabled = true;
        this.elements.uploadButton.innerHTML = `
            <span class="btn-text">Identifying...</span>
            <div class="loading"></div>
        `;
        
        try {
            // Compress image if needed
            let imageFile = this.state.currentImage;
            if (imageFile.size > 1024 * 1024) {
                this.showNotification('Optimizing image...', 'info');
                imageFile = await this.compressImage(imageFile);
            }
            
            const formData = new FormData();
            formData.append('image', imageFile);
            
            const response = await fetch('https://tree-game-api.onrender.com/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.handleIdentificationSuccess(data);
            } else {
                this.handleIdentificationError(data);
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Connection error. Please try again.', 'error');
        } finally {
            this.elements.uploadButton.disabled = false;
            this.elements.uploadButton.innerHTML = `
                <span class="btn-text">Upload & Identify</span>
                <span class="btn-icon"><i class="fas fa-search"></i></span>
            `;
        }
    }

    // ===== UPDATED: Handle Identification Success with Duplicate Prevention =====
    handleIdentificationSuccess(data) {
        this.state.currentSpecies = data.info.species;
        
        // Check if tree already exists in collection
        const existingTreeIndex = this.state.collection.findIndex(
            tree => tree.species.toLowerCase() === data.info.species.toLowerCase()
        );
        
        let isNewDiscovery = false;
        let message = '';
        
        if (existingTreeIndex === -1) {
            // New tree - add to collection
            isNewDiscovery = true;
            this.state.collection.push({
                species: data.info.species,
                confidence: data.info.confidence,
                timestamp: new Date().toISOString(),
                firstDiscovered: new Date().toISOString(),
                timesIdentified: 1,
                bestConfidence: data.info.confidence,
                health: 'unknown'
            });
            message = `🎉 New Discovery! ${data.info.species} added to your collection!`;
            
            // Bonus points for new discovery
            this.state.user.points += 20; // Extra 20 points for new tree
            
        } else {
            // Existing tree - update if better confidence
            const existingTree = this.state.collection[existingTreeIndex];
            existingTree.timesIdentified++;
            existingTree.lastSeen = new Date().toISOString();
            
            if (data.info.confidence > existingTree.bestConfidence) {
                existingTree.bestConfidence = data.info.confidence;
                existingTree.confidence = data.info.confidence;
                message = `📸 Better photo! Confidence improved to ${data.info.confidence}%`;
            } else {
                message = `✓ ${data.info.species} already in collection (seen ${existingTree.timesIdentified} times)`;
            }
            
            this.state.collection[existingTreeIndex] = existingTree;
        }
        
        // Update stats
        this.state.stats.treesIdentified++;
        this.state.user.points += data.points_earned || 10;
        this.state.user.experience += 20;
        
        // Update daily mission
        if (!this.state.dailyMission.completed) {
            this.state.dailyMission.progress++;
            if (this.state.dailyMission.progress >= this.state.dailyMission.target) {
                this.completeDailyMission();
            }
        }
        
        // Display results with collection status
        this.displayIdentificationResult(data, isNewDiscovery, message);
        
        // Show special notification for collection status
        if (isNewDiscovery) {
            this.showNotification(message, 'success');
            // Play special sound for new discovery
            this.sounds.achievement();
        } else {
            this.showNotification(message, 'info');
            this.sounds.success();
        }
        
        // Check for achievements
        this.checkAchievements();
        
        // Check for level up
        this.checkLevelUp();
        
        // Save state
        this.saveState();
        this.updateUI();
    }

    // ===== UPDATED: Display Result with Collection Status =====
    displayIdentificationResult(data, isNewDiscovery = false, collectionMessage = '') {
        this.elements.resultSection.classList.remove('hidden');
        const wikiSummary = data.info.wiki_summary || 'No additional information available.';
        
        // Get collection stats for this tree
        const treeInCollection = this.state.collection.find(
            tree => tree.species.toLowerCase() === data.info.species.toLowerCase()
        );
        
        this.elements.resultArea.innerHTML = `
            <div class="result-success glass-card animate-in">
                <div class="result-header">
                    <div class="result-icon">🌳</div>
                    <div>
                        <h3>Tree Identified Successfully!</h3>
                        <p class="result-subtitle">+${data.points_earned || 10} Points ${isNewDiscovery ? '+ 20 Discovery Bonus!' : ''}</p>
                    </div>
                </div>
                
                ${isNewDiscovery ? `
                    <div class="new-discovery-banner">
                        <i class="fas fa-star"></i>
                        <span>NEW DISCOVERY!</span>
                        <i class="fas fa-star"></i>
                    </div>
                ` : ''}
                
                ${!isNewDiscovery && treeInCollection ? `
                    <div class="collection-status">
                        <i class="fas fa-check-circle"></i>
                        <span>Already in collection • Seen ${treeInCollection.timesIdentified} times • Best: ${treeInCollection.bestConfidence}%</span>
                    </div>
                ` : ''}
                
                <div class="result-details">
                    <div class="detail-item">
                        <label><i class="fas fa-tree"></i> Species</label>
                        <span class="detail-value">${data.info.species}</span>
                    </div>
                    
                    <div class="detail-item">
                        <label><i class="fas fa-percentage"></i> Confidence</label>
                        <div class="confidence-meter">
                            <div class="confidence-bar" style="width: ${data.info.confidence}%">
                                ${data.info.confidence}%
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-item full-width">
                        <label><i class="fas fa-info-circle"></i> About This Tree</label>
                        <div class="wiki-summary-box">
                            <p>${wikiSummary}</p>
                            ${data.info.species !== 'Unknown' ? `
                                <a href="https://en.wikipedia.org/wiki/${data.info.species.split('(')[0].trim().replace(/ /g, '_')}" 
                                target="_blank" class="wiki-link">
                                    <i class="fas fa-external-link-alt"></i> Learn more on Wikipedia
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="result-actions">
                    <button class="action-btn share-btn" onclick="game.shareResult()">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                    ${isNewDiscovery ? `
                        <button class="action-btn celebrate-btn" onclick="game.celebrateDiscovery()">
                            <i class="fas fa-sparkles"></i> Celebrate!
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Show health check if supported
        const speciesName = data.info.species.toLowerCase();
        const isSupported = this.supportedPlants.some(plant => 
            speciesName.includes(plant)
        );
        
        if (isSupported) {
            this.elements.healthSection.classList.remove('hidden');
            this.elements.healthCheckBtn.disabled = false;
            this.showNotification('Health check available for this plant!', 'success');
        } else {
            this.elements.healthSection.classList.add('hidden');
        }
    }

    handleIdentificationError(data) {
        this.elements.resultSection.classList.remove('hidden');
        this.elements.resultArea.innerHTML = `
            <div class="result-error animate-in">
                <div class="result-header">
                    <div class="result-icon">❌</div>
                    <div>
                        <h3>Identification Failed</h3>
                        <p class="result-subtitle">Please try with a clearer image</p>
                    </div>
                </div>
                <p class="error-message">${data.message || 'Could not identify the tree'}</p>
                <button class="retry-btn" onclick="game.removeImage()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
        
        this.sounds.error();
    }

    // ===== NEW: Celebrate Discovery Function =====
    celebrateDiscovery() {
        // Create confetti effect
        const colors = ['#ffd93d', '#6BCB77', '#4D96FF', '#FF6B6B'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }
        
        this.showNotification('🎊 Congratulations on your discovery!', 'success');
    }

    // ===== HEALTH CHECK =====
    async checkHealth() {
        if (!this.state.currentImage || !this.state.currentSpecies) {
            this.showNotification('No image available for health check', 'error');
            return;
        }
        
        this.elements.healthCheckBtn.disabled = true;
        this.elements.healthCheckBtn.innerHTML = `
            <span>Diagnosing...</span>
            <div class="loading"></div>
        `;
        
        try {
            const formData = new FormData();
            formData.append('image', this.state.currentImage);
            formData.append('species', this.state.currentSpecies);
            
            const response = await fetch('https://tree-game-api.onrender.com/diagnose', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayHealthResult(data);
                
                // Update health status in collection
                const treeIndex = this.state.collection.findIndex(
                    tree => tree.species.toLowerCase() === this.state.currentSpecies.toLowerCase()
                );
                if (treeIndex !== -1) {
                    const isHealthy = data.diagnosis.toLowerCase().includes('healthy');
                    this.state.collection[treeIndex].health = isHealthy ? 'healthy' : 'diseased';
                    this.saveState();
                }
                
                this.sounds.success();
            } else {
                this.showNotification(data.error || 'Health check failed', 'error');
                this.sounds.error();
            }
        } catch (error) {
            console.error('Health check error:', error);
            this.showNotification('Connection error during diagnosis', 'error');
        } finally {
            this.elements.healthCheckBtn.disabled = false;
            this.elements.healthCheckBtn.innerHTML = `
                <span>Run Diagnosis</span>
                <i class="fas fa-stethoscope"></i>
            `;
        }
    }

    displayHealthResult(data) {
        const isHealthy = data.diagnosis.toLowerCase().includes('healthy');
        
        this.elements.healthResultArea.classList.remove('hidden');
        this.elements.healthResultArea.innerHTML = `
            <div class="health-result glass-card animate-in">
                <div class="health-result-header">
                    <div class="health-status-icon ${isHealthy ? 'healthy' : 'warning'}">
                        <i class="fas ${isHealthy ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                    </div>
                    <div>
                        <h3>Health Report</h3>
                        <p class="health-diagnosis">${data.diagnosis}</p>
                    </div>
                </div>
                
                <div class="care-advice">
                    <h4><i class="fas fa-lightbulb"></i> Care Recommendations</h4>
                    ${data.care_advice}
                </div>
                
                <div class="health-score-display">
                    <div class="score-meter">
                        <div class="score-fill ${isHealthy ? 'good' : 'warning'}" 
                             style="width: ${isHealthy ? '85' : '45'}%">
                        </div>
                    </div>
                    <span class="score-label">Health Score: ${isHealthy ? '85%' : '45%'}</span>
                </div>
            </div>
        `;
    }

    // ===== ACHIEVEMENTS SYSTEM =====
    checkAchievements() {
        // Check unique species achievement
        const uniqueSpecies = this.state.collection.length;
        
        this.achievements.forEach(achievement => {
            if (this.state.user.achievements.includes(achievement.id)) return;
            
            let unlocked = false;
            
            switch (achievement.type) {
                case 'trees':
                    // Use unique species count instead of total identifications
                    unlocked = uniqueSpecies >= achievement.requirement;
                    break;
                case 'streak':
                    unlocked = this.state.user.streak >= achievement.requirement;
                    break;
                case 'level':
                    unlocked = this.state.user.level >= achievement.requirement;
                    break;
                case 'daily':
                    unlocked = this.state.dailyMission.completed;
                    break;
            }
            
            if (unlocked) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        this.state.user.achievements.push(achievement.id);
        this.state.stats.badgesEarned++;
        this.state.user.points += 50;
        
        this.showAchievementPopup(achievement);
        this.sounds.achievement();
        this.saveState();
        this.updateUI();
    }

    showAchievementPopup(achievement) {
        const popup = document.getElementById('achievement-popup');
        document.getElementById('achievement-name').textContent = achievement.name;
        popup.querySelector('.achievement-icon').textContent = achievement.icon;
        
        popup.classList.remove('hidden');
        
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 3000);
    }

    // ===== LEVEL SYSTEM =====
    checkLevelUp() {
        const requiredExp = this.state.user.level * 100;
        
        if (this.state.user.experience >= requiredExp) {
            this.state.user.level++;
            this.state.user.experience = 0;
            this.state.user.points += 100;
            
            this.showLevelUpAnimation();
            this.sounds.levelUp();
            this.saveState();
            this.updateUI();
        }
    }

    showLevelUpAnimation() {
        const animation = document.getElementById('levelup-animation');
        document.getElementById('new-level').textContent = this.state.user.level;
        
        animation.classList.remove('hidden');
        
        setTimeout(() => {
            animation.classList.add('hidden');
        }, 3000);
    }

    // ===== DAILY MISSIONS =====
    completeDailyMission() {
        this.state.dailyMission.completed = true;
        this.state.user.points += 50;
        this.showNotification('Daily Mission Complete! +50 Points', 'success');
        this.checkAchievements();
        this.saveState();
        this.updateUI();
    }

    checkDailyStreak() {
        const today = new Date().toDateString();
        const lastActive = this.state.user.lastActive;
        
        if (lastActive !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastActive === yesterday.toDateString()) {
                this.state.user.streak++;
            } else {
                this.state.user.streak = 1;
            }
            
            this.state.user.lastActive = today;
            this.state.stats.daysActive++;
            
            // Reset daily mission
            this.state.dailyMission.progress = 0;
            this.state.dailyMission.completed = false;
            
            this.saveState();
        }
    }

    // ===== MODALS =====
    openModal(type) {
        const modal = this.elements[`${type}Modal`];
        modal.classList.add('active');
        
        switch (type) {
            case 'achievements':
                this.loadAchievements();
                break;
            case 'leaderboard':
                this.loadLeaderboard();
                break;
            case 'collection':
                this.loadCollection();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }

    closeModal(event) {
        const modal = event.target.closest('.modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    switchTab(event) {
        const tabs = event.target.parentElement.querySelectorAll('.tab-btn');
        tabs.forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
        
        const tabType = event.target.dataset.tab;
        this.loadLeaderboard(tabType);
    }

    filterCollection(event) {
        const filters = event.target.parentElement.querySelectorAll('.filter-btn');
        filters.forEach(filter => filter.classList.remove('active'));
        event.target.classList.add('active');
        
        const filterType = event.target.dataset.filter;
        this.loadCollection(filterType);
    }

    // ===== LOAD MODAL CONTENT =====
    loadAchievements() {
        const container = document.getElementById('achievements-content');
        container.innerHTML = '';
        
        this.achievements.forEach(achievement => {
            const unlocked = this.state.user.achievements.includes(achievement.id);
            const card = document.createElement('div');
            card.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-progress">
                    ${unlocked ? 'Unlocked!' : `${this.getAchievementProgress(achievement)}`}
                </div>
            `;
            container.appendChild(card);
        });
    }

    getAchievementProgress(achievement) {
        let current = 0;
        
        switch (achievement.type) {
            case 'trees':
                current = this.state.collection.length; // Use unique species count
                break;
            case 'streak':
                current = this.state.user.streak;
                break;
            case 'level':
                current = this.state.user.level;
                break;
        }
        
        return `${current}/${achievement.requirement}`;
    }

    async loadLeaderboard(period = 'weekly') {
        const container = document.getElementById('leaderboard-content');
        container.innerHTML = '<div class="loading"></div>';
        
        try {
            const response = await fetch('https://tree-game-api.onrender.com/leaderboard');
            const data = await response.json();
            
            container.innerHTML = '';
            
            data.forEach((player, index) => {
                const item = document.createElement('div');
                item.className = `leaderboard-item ${index < 3 ? 'top-three' : ''}`;
                
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                
                item.innerHTML = `
                    <div class="rank-number">${medal || index + 1}</div>
                    <div class="player-info">
                        <span class="player-name">${player.user}</span>
                        <span class="player-score">${player.points} points</span>
                    </div>
                    ${player.user === 'Demo User' ? '<div class="you-badge">YOU</div>' : ''}
                `;
                
                container.appendChild(item);
            });
        } catch (error) {
            container.innerHTML = '<p>Failed to load leaderboard</p>';
        }
    }

    // ===== UPDATED: Enhanced Collection Display =====
    loadCollection(filter = 'all') {
        const container = document.getElementById('collection-content');
        container.innerHTML = '';
        
        if (this.state.collection.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tree"></i>
                    <p>No trees collected yet!</p>
                    <p class="hint">Start discovering unique tree species!</p>
                </div>
            `;
            return;
        }
        
        // Add collection stats header
        const uniqueSpecies = this.state.collection.length;
        const totalIdentifications = this.state.collection.reduce((sum, tree) => sum + (tree.timesIdentified || 1), 0);
        
        const statsHeader = document.createElement('div');
        statsHeader.className = 'collection-stats-header';
        statsHeader.innerHTML = `
            <div class="collection-summary">
                <div class="summary-item">
                    <i class="fas fa-dna"></i>
                    <span>${uniqueSpecies} Unique Species</span>
                </div>
                <div class="summary-item">
                    <i class="fas fa-camera"></i>
                    <span>${totalIdentifications} Total Scans</span>
                </div>
                <div class="summary-item">
                    <i class="fas fa-percentage"></i>
                    <span>${Math.round(this.state.collection.reduce((sum, t) => sum + (t.bestConfidence || t.confidence), 0) / uniqueSpecies)}% Avg Confidence</span>
                </div>
            </div>
        `;
        container.appendChild(statsHeader);
        
        // Filter collection
        let filtered = this.state.collection;
        if (filter === 'healthy') {
            filtered = filtered.filter(tree => tree.health === 'healthy');
        } else if (filter === 'diseased') {
            filtered = filtered.filter(tree => tree.health === 'diseased');
        }
        
        // Create grid
        const grid = document.createElement('div');
        grid.className = 'collection-grid';
        
        filtered.forEach((tree, index) => {
            const card = document.createElement('div');
            card.className = 'tree-card enhanced';
            card.innerHTML = `
                <div class="tree-number">#${index + 1}</div>
                <div class="tree-icon">🌳</div>
                <div class="tree-name">${tree.species}</div>
                <div class="tree-stats">
                    <div class="stat-badge">
                        <i class="fas fa-percentage"></i> ${tree.bestConfidence || tree.confidence}%
                    </div>
                    <div class="stat-badge">
                        <i class="fas fa-eye"></i> ${tree.timesIdentified || 1}x
                    </div>
                </div>
                <div class="tree-date">
                    <i class="fas fa-calendar"></i> ${new Date(tree.firstDiscovered || tree.timestamp).toLocaleDateString()}
                </div>
                ${tree.health !== 'unknown' ? `
                    <div class="tree-health ${tree.health}">${tree.health}</div>
                ` : ''}
            `;
            grid.appendChild(card);
        });
        
        container.appendChild(grid);
    }

    loadProfile() {
        const container = document.querySelector('.profile-stats-grid');
        const uniqueSpecies = this.state.collection.length;
        
        container.innerHTML = `
            <div class="profile-stat">
                <i class="fas fa-trophy"></i>
                <span class="stat-value">${this.state.user.points}</span>
                <span class="stat-label">Total Points</span>
            </div>
            <div class="profile-stat">
                <i class="fas fa-star"></i>
                <span class="stat-value">${this.state.user.level}</span>
                <span class="stat-label">Level</span>
            </div>
            <div class="profile-stat">
                <i class="fas fa-fire"></i>
                <span class="stat-value">${this.state.user.streak}</span>
                <span class="stat-label">Day Streak</span>
            </div>
            <div class="profile-stat">
                <i class="fas fa-tree"></i>
                <span class="stat-value">${uniqueSpecies}</span>
                <span class="stat-label">Unique Trees</span>
            </div>
            <div class="profile-stat">
                <i class="fas fa-medal"></i>
                <span class="stat-value">${this.state.stats.badgesEarned}</span>
                <span class="stat-label">Badges Earned</span>
            </div>
            <div class="profile-stat">
                <i class="fas fa-calendar"></i>
                <span class="stat-value">${this.state.stats.daysActive}</span>
                <span class="stat-label">Days Active</span>
            </div>
        `;
    }

    // ===== UI UPDATES =====
    updateUI() {
        // Update points and level
        this.animateValue(this.elements.userPoints, this.state.user.points);
        this.elements.userLevel.textContent = this.state.user.level;
        
        // Update level progress
        const progress = (this.state.user.experience / (this.state.user.level * 100)) * 100;
        this.elements.levelProgress.style.width = `${progress}%`;
        
        // Update streak
        this.elements.streakCount.textContent = this.state.user.streak;
        
        // Update stats - show unique species instead of total identifications
        const uniqueSpecies = this.state.collection.length;
        this.elements.treesIdentified.textContent = uniqueSpecies;
        this.elements.accuracyRate.textContent = `${this.state.stats.accuracy || 0}%`;
        this.elements.daysActive.textContent = this.state.stats.daysActive;
        this.elements.badgesEarned.textContent = this.state.stats.badgesEarned;
        
        // Update mission progress
        const missionText = document.querySelector('.mission-progress');
        if (missionText) {
            missionText.textContent = `(${this.state.dailyMission.progress}/${this.state.dailyMission.target})`;
        }
    }

    animateValue(element, value) {
        const current = parseInt(element.textContent) || 0;
        const increment = (value - current) / 30;
        let step = 0;
        
        const timer = setInterval(() => {
            step++;
            const newValue = Math.round(current + increment * step);
            element.textContent = newValue;
            
            if (step >= 30) {
                element.textContent = value;
                clearInterval(timer);
            }
        }, 20);
    }

    // ===== UTILITIES =====
    async compressImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const maxWidth = 1024;
                    const maxHeight = 1024;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    }, 'image/jpeg', 0.8);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                'fa-info-circle'
            }"></i>
            <span>${message}</span>
        `;
        
        this.elements.notificationContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    shareResult() {
        if (navigator.share) {
            navigator.share({
                title: 'Tree Guardian',
                text: `I just identified a ${this.state.currentSpecies} tree! 🌳`,
                url: window.location.href
            });
        } else {
            this.showNotification('Sharing not supported on this device', 'info');
        }
    }

    saveToCollection() {
        this.showNotification('Saved to collection!', 'success');
        this.saveState();
    }

    // ===== CONNECTION MONITORING =====
    startConnectionMonitor() {
        setInterval(async () => {
            try {
                const response = await fetch('https://tree-game-api.onrender.com/healthz');
                if (response.ok) {
                    this.updateConnectionStatus(true);
                } else {
                    this.updateConnectionStatus(false);
                }
            } catch {
                this.updateConnectionStatus(false);
            }
        }, 30000);
    }

    updateConnectionStatus(online) {
        const status = this.elements.connectionStatus;
        if (online) {
            status.classList.add('online');
            status.classList.remove('offline');
            status.innerHTML = '<i class="fas fa-wifi"></i><span>Online</span>';
        } else {
            status.classList.remove('online');
            status.classList.add('offline');
            status.innerHTML = '<i class="fas fa-wifi-slash"></i><span>Offline</span>';
        }
    }

    // ===== STATE MANAGEMENT =====
    saveState() {
        localStorage.setItem('treeGuardianState', JSON.stringify(this.state));
    }

    loadState() {
        const saved = localStorage.getItem('treeGuardianState');
        if (saved) {
            this.state = { ...this.state, ...JSON.parse(saved) };
        }
    }

    // ===== PRELOADER =====
    hidePreloader() {
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.classList.add('hidden');
            }
        }, 2000);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new TreeGuardianGame();
});
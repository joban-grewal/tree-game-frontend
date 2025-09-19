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
    handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file
        if (!this.validateFile(file)) return;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.elements.previewImage.src = e.target.result;
            this.elements.previewContainer.classList.remove('hidden');
            this.elements.uploadButton.disabled = false;
            this.state.currentImage = file;
        };
        reader.readAsDataURL(file);
    }

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
        // For mobile devices - trigger file input with camera
        this.elements.imageInput.setAttribute('capture', 'environment');
        this.elements.imageInput.click();
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

    handleIdentificationSuccess(data) {
        this.state.currentSpecies = data.info.species;
        
        // Update stats
        this.state.stats.treesIdentified++;
        this.state.user.points += data.points_earned || 10;
        this.state.user.experience += 20;
        
        // Add to collection
        this.state.collection.push({
            species: data.info.species,
            confidence: data.info.confidence,
            timestamp: new Date().toISOString(),
            health: 'unknown'
        });
        
        // Update daily mission
        if (!this.state.dailyMission.completed) {
            this.state.dailyMission.progress++;
            if (this.state.dailyMission.progress >= this.state.dailyMission.target) {
                this.completeDailyMission();
            }
        }
        
        // Display results
        this.displayIdentificationResult(data);
        
        // Check for achievements
        this.checkAchievements();
        
        // Check for level up
        this.checkLevelUp();
        
        // Play sound
        this.sounds.success();
        
        // Save state
        this.saveState();
        this.updateUI();
    }

    displayIdentificationResult(data) {
        this.elements.resultSection.classList.remove('hidden');
        this.elements.resultArea.innerHTML = `
            <div class="result-success animate-in">
                <div class="result-header">
                    <div class="result-icon">🌳</div>
                    <div>
                        <h3>Tree Identified Successfully!</h3>
                        <p class="result-subtitle">+${data.points_earned || 10} Points Earned</p>
                    </div>
                </div>
                
                <div class="result-details">
                    <div class="detail-item">
                        <label>Species</label>
                        <span class="detail-value">${data.info.species}</span>
                    </div>
                    
                    <div class="detail-item">
                        <label>Confidence</label>
                        <div class="confidence-meter">
                            <div class="confidence-bar" style="width: ${data.info.confidence}%">
                                ${data.info.confidence}%
                            </div>
                        </div>
                    </div>
                    
                    ${data.info.wiki_summary ? `
                    <div class="detail-item full-width">
                        <label>About This Tree</label>
                        <p class="wiki-summary">${data.info.wiki_summary}</p>
                    </div>
                    ` : ''}
                </div>
                
                <div class="result-actions">
                    <button class="action-btn share-btn" onclick="game.shareResult()">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                    <button class="action-btn save-btn" onclick="game.saveToCollection()">
                        <i class="fas fa-bookmark"></i> Save
                    </button>
                </div>
            </div>
        `;
        
        // Show health check if supported
        const isSupported = this.supportedPlants.some(plant => 
            data.info.species.toLowerCase().includes(plant)
        );
        
        if (isSupported) {
            this.elements.healthSection.classList.remove('hidden');
            this.elements.healthCheckBtn.disabled = false;
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
        
        // Update last item in collection
        if (this.state.collection.length > 0) {
            this.state.collection[this.state.collection.length - 1].health = 
                isHealthy ? 'healthy' : 'diseased';
        }
        
        this.saveState();
    }

    // ===== ACHIEVEMENTS SYSTEM =====
    checkAchievements() {
        this.achievements.forEach(achievement => {
            if (this.state.user.achievements.includes(achievement.id)) return;
            
            let unlocked = false;
            
            switch (achievement.type) {
                case 'trees':
                    unlocked = this.state.stats.treesIdentified >= achievement.requirement;
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
                current = this.state.stats.treesIdentified;
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

    loadCollection(filter = 'all') {
        const container = document.getElementById('collection-content');
        container.innerHTML = '';
        
        if (this.state.collection.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tree"></i>
                    <p>No trees collected yet!</p>
                    <p class="hint">Start by uploading a tree image</p>
                </div>
            `;
            return;
        }
        
        let filtered = this.state.collection;
        if (filter === 'healthy') {
            filtered = filtered.filter(tree => tree.health === 'healthy');
        } else if (filter === 'diseased') {
            filtered = filtered.filter(tree => tree.health === 'diseased');
        }
        
        filtered.forEach(tree => {
            const card = document.createElement('div');
            card.className = 'tree-card';
            card.innerHTML = `
                <div class="tree-icon">🌳</div>
                <div class="tree-name">${tree.species}</div>
                <div class="tree-date">${new Date(tree.timestamp).toLocaleDateString()}</div>
                ${tree.health !== 'unknown' ? `
                    <div class="tree-health ${tree.health}">${tree.health}</div>
                ` : ''}
            `;
            container.appendChild(card);
        });
    }

    loadProfile() {
        const container = document.querySelector('.profile-stats-grid');
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
                <span class="stat-value">${this.state.stats.treesIdentified}</span>
                <span class="stat-label">Trees Found</span>
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
        
        // Update stats
        this.elements.treesIdentified.textContent = this.state.stats.treesIdentified;
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
            preloader.classList.add('hidden');
        }, 2000);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new TreeGuardianGame();
});
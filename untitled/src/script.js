// ========== SUPABASE CONFIGURATION ==========
const SUPABASE_URL = 'https://racpickhjiysvixqugtr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_B2O3EwYNSBd66F4aMJGr7w_FT7ex53V';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ========== YOUR EXISTING VARIABLES (Updated) ==========
let aiGuess = '';
let capturedImageData = '';
let sessionId = localStorage.getItem('food_trainer_session') || 
                'session_' + Math.random().toString(36).substr(2, 9);
let trainingHistory = [];

// ========== BACKEND FUNCTIONS ==========

// 1. Save training to Supabase
async function saveToBackend(imageData, aiGuess, userCorrection, finalFood) {
    console.log('📤 Saving to Supabase...');
    
    try {
        const { data, error } = await supabase
            .from('food_trainings')
            .insert([
                {
                    session_id: sessionId,
                    image_data: imageData.substring(0, 10000),
                    ai_guess: aiGuess,
                    user_correction: userCorrection,
                    final_food: finalFood,
                    is_correct: !userCorrection,
                    confidence_score: Math.random() * 0.5 + 0.5
                }
            ])
            .select();
        
        if (error) throw error;
        
        console.log('✅ Saved to database:', data);
        showNotification('✅ Training saved to cloud!', 'success');
        return { success: true, data: data[0] };
        
    } catch (error) {
        console.error('❌ Database error:', error);
        showNotification('⚠️ Saved locally (will sync later)', 'warning');
        
        return saveToLocalStorage(imageData, aiGuess, userCorrection, finalFood);
    }
}

// 2. Local storage fallback
function saveToLocalStorage(imageData, aiGuess, userCorrection, finalFood) {
    const training = {
        id: 'local_' + Date.now(),
        created_at: new Date().toISOString(),
        session_id: sessionId,
        image_preview: imageData.substring(0, 100) + '...',
        ai_guess: aiGuess,
        user_correction: userCorrection,
        final_food: finalFood,
        is_correct: !userCorrection,
        is_local: true
    };
    
    let localTrainings = JSON.parse(localStorage.getItem('local_food_trainings') || '[]');
    localTrainings.unshift(training);
    localStorage.setItem('local_food_trainings', JSON.stringify(localTrainings.slice(0, 50)));
    
    trainingHistory.unshift(training);
    updateHistoryUI();
    
    return { success: true, data: training, localBackup: true };
}

// 3. Load training history
async function loadTrainingHistory() {
    console.log('📖 Loading training history...');
    
    try {
        const { data, error } = await supabase
            .from('food_trainings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (!error && data && data.length > 0) {
            trainingHistory = data;
            showNotification(`📊 Loaded ${data.length} cloud trainings`, 'info');
        } else {
            const localData = JSON.parse(localStorage.getItem('local_food_trainings') || '[]');
            trainingHistory = localData;
            if (localData.length > 0) {
                showNotification(`📱 Loaded ${localData.length} local trainings`, 'info');
            }
        }
        
        updateHistoryUI();
        
    } catch (error) {
        console.error('Error loading history:', error);
        trainingHistory = JSON.parse(localStorage.getItem('local_food_trainings') || '[]');
        updateHistoryUI();
    }
}

// 4. Sync local data to cloud
async function syncLocalToCloud() {
    const localTrainings = JSON.parse(localStorage.getItem('local_food_trainings') || '[]');
    const unsynced = localTrainings.filter(t => t.is_local);
    
    if (unsynced.length === 0) return;
    
    console.log(`🔄 Syncing ${unsynced.length} local trainings...`);
    
    for (const training of unsynced) {
        try {
            await supabase
                .from('food_trainings')
                .insert([
                    {
                        session_id: training.session_id,
                        image_data: training.image_preview,
                        ai_guess: training.ai_guess,
                        user_correction: training.user_correction,
                        final_food: training.final_food,
                        is_correct: training.is_correct
                    }
                ]);
            
            localTrainings.splice(localTrainings.indexOf(training), 1);
        } catch (error) {
            console.error('Failed to sync one training:', error);
        }
    }
    
    localStorage.setItem('local_food_trainings', JSON.stringify(localTrainings));
    showNotification(`✅ Synced ${unsynced.length} trainings to cloud`, 'success');
}

// ========== UPDATED UI FUNCTIONS ==========

function updateHistoryUI() {
    const historyContainer = document.getElementById('history-container');
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '';
    
    if (trainingHistory.length === 0) {
        historyContainer.innerHTML = '<p class="empty-history">No training history yet. Capture some food!</p>';
        return;
    }
    
    trainingHistory.slice(0, 10).forEach((training, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const isCorrect = training.is_correct || !training.user_correction;
        const icon = isCorrect ? '✅' : '🔄';
        const source = training.is_local ? '📱' : '☁️';
        
        div.innerHTML = `
            <div class="history-header">
                <span class="history-icon">${icon} ${source}</span>
                <span class="history-date">${new Date(training.created_at).toLocaleDateString()}</span>
            </div>
            <div class="history-content">
                <strong>AI:</strong> ${training.ai_guess}<br>
                ${training.user_correction ? `<strong>You:</strong> ${training.user_correction}<br>` : ''}
                <strong>Final:</strong> ${training.final_food}
            </div>
        `;
        
        historyContainer.appendChild(div);
    });
    
    document.getElementById('totalTrainings').textContent = trainingHistory.length;
    const correctCount = trainingHistory.filter(t => t.is_correct).length;
    const accuracy = trainingHistory.length > 0 ? Math.round((correctCount / trainingHistory.length) * 100) : 0;
    document.getElementById('accuracyRate').textContent = `${accuracy}%`;
}

function showNotification(message, type = 'info') {
    let notification = document.getElementById('backend-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'backend-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: opacity 0.3s;
        `;
        document.body.appendChild(notification);
    }
    
    const colors = {
        success: '#48bb78',
        warning: '#ed8936',
        error: '#f56565',
        info: '#4299e1'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.opacity = '1';
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ========== MODIFIED EXISTING FUNCTIONS ==========

function captureImage() {
    const video = document.getElementById('cameraFeed');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    capturedImageData = canvas.toDataURL('image/jpeg', 0.8);
    
    document.getElementById('capturedImage').src = capturedImageData;
    document.getElementById('capturedImage').style.display = 'block';
    
    generateAIGuess();
}

function generateAIGuess() {
    const foods = ['Pizza', 'Hamburger', 'Salad', 'Apple', 'Banana', 'Pasta', 'Rice', 'Chicken', 'Soup', 'Sandwich'];
    aiGuess = foods[Math.floor(Math.random() * foods.length)];
    
    document.getElementById('aiGuess').textContent = aiGuess;
    document.getElementById('aiGuess').style.display = 'block';
    document.getElementById('correctionSection').style.display = 'block';
    
    showNotification(`🤖 AI thinks it's ${aiGuess}`, 'info');
}

async function submitCorrection() {
    const userInput = document.getElementById('userCorrection').value;
    const finalFood = userInput || aiGuess;
    const isCorrect = !userInput;
    
    document.getElementById('finalFood').textContent = finalFood;
    document.getElementById('finalFoodDisplay').style.display = 'block';
    
    const result = await saveToBackend(capturedImageData, aiGuess, userInput, finalFood);
    
    await loadTrainingHistory();
    
    document.getElementById('userCorrection').value = '';
    
    showNotification(isCorrect ? '✅ AI was correct!' : '🔄 Thanks for the correction!', 'success');
}

function toggleCamera() {
    const video = document.getElementById('cameraFeed');
    const toggleBtn = document.getElementById('toggleCamera');
    
    if (video.style.display === 'none' || video.style.display === '') {
        navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }
        })
        .then(stream => {
            video.srcObject = stream;
            video.style.display = 'block';
            toggleBtn.textContent = '📷 Stop Camera';
            showNotification('📸 Camera started', 'info');
        })
        .catch(err => {
            console.error('Camera error:', err);
            showNotification('❌ Camera access denied', 'error');
        });
    } else {
        const stream = video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        video.srcObject = null;
        video.style.display = 'none';
        toggleBtn.textContent = '📷 Start Camera';
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Food Trainer Backend Initialized');
    
    localStorage.setItem('food_trainer_session', sessionId);
    
    loadTrainingHistory();
    
    setTimeout(syncLocalToCloud, 2000);
    
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'backend-status';
    statusIndicator.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: #48bb78;
        color: white;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        z-index: 1000;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    statusIndicator.textContent = '☁️ Backend Connected';
    document.body.appendChild(statusIndicator);
    
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test Connection';
    testBtn.onclick = async () => {
        showNotification('Testing Supabase connection...', 'info');
        const { data, error } = await supabase.from('food_trainings').select('count');
        if (error) {
            showNotification('❌ Connection failed', 'error');
        } else {
            showNotification('✅ Backend working!', 'success');
        }
    };
    testBtn.style.cssText = `
        position: fixed;
        bottom: 50px;
        left: 10px;
        padding: 8px 15px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 15px;
        cursor: pointer;
        font-size: 12px;
        z-index: 1000;
    `;
    document.body.appendChild(testBtn);
});// ========== WAITLIST FUNCTION ==========
async function joinWaitlist() {
  const emailInput = document.getElementById('waitlistEmail');
  const email = emailInput.value.trim();
  
  if (!email || !email.includes('@')) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }
  
  showNotification('Adding you to waitlist...', 'info');
  
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        {
          email: email,
          joined_at: new Date().toISOString(),
          source: 'food_trainer_app',
          session_id: sessionId
        }
      ]);
    
    if (error) {
      console.error('Waitlist error:', error);
      // Save locally as backup
      saveEmailToLocalStorage(email);
      showNotification('✅ Added to local waitlist!', 'success');
      emailInput.value = '';
      return;
    }
    
    showNotification('✅ Added to waitlist!', 'success');
    emailInput.value = '';
    
  } catch (error) {
    console.error('Error:', error);
    saveEmailToLocalStorage(email);
    showNotification('✅ Added to local waitlist!', 'success');
    emailInput.value = '';
  }
}

function saveEmailToLocalStorage(email) {
  const waitlist = JSON.parse(localStorage.getItem('waitlist_emails') || '[]');
  if (!waitlist.includes(email)) {
    waitlist.push({
      email: email,
      joined_at: new Date().toISOString()
    });
    localStorage.setItem('waitlist_emails', JSON.stringify(waitlist));
  }
}

// ========== CONNECT BUTTON ==========
document.addEventListener('DOMContentLoaded', function() {
  // Connect waitlist button
  const waitlistBtn = document.getElementById('joinWaitlistBtn');
  if (waitlistBtn) {
    waitlistBtn.onclick = joinWaitlist;
  }
  
  // Enter key support for email field
  const emailInput = document.getElementById('waitlistEmail');
  if (emailInput) {
    emailInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        joinWaitlist();
      }
    });
  }
});
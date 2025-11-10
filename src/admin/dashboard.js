/**
 * Admin Dashboard
 * View and export all participant data with analytics
 */

import '../styles/experiment.css';
import { exportAllData } from '../firebase/saveData.js';
import { Chart } from 'chart.js/auto';
import {
  createRTTimelineChart,
  createAccuracyChart,
  createDifficultyChart,
  createCongruencyComparisonChart,
} from '../components/DataVisualization.js';

// Import Firebase for fetching data from Firestore
import { db, isFirebaseEnabled, ensureFirebaseAuth } from '../firebase/config.js';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const ADMIN_PASSWORD = 'acct_admin_DEMO_by_ss';

/**
 * Fetch all user IDs from Firebase Firestore
 * @returns {Promise<string[]>}
 */
async function fetchAllFirebaseUsers() {
  if (!isFirebaseEnabled) {
    console.log('Firebase not enabled, cannot fetch users');
    return [];
  }

  try {
    console.log('Querying Firebase users collection...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log('Firebase query returned', usersSnapshot.size, 'documents');

    if (usersSnapshot.empty) {
      console.log('Users collection is empty in Firebase');
      return [];
    }

    const userIds = usersSnapshot.docs.map(doc => doc.id);
    console.log('Found user IDs:', userIds);
    return userIds;
  } catch (error) {
    console.error('Error fetching Firebase users:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    if (error.code === 'permission-denied') {
      console.error('PERMISSION DENIED: Check Firestore security rules');
      console.error('Make sure rules allow: allow read, write: if request.auth != null;');
    }

    return [];
  }
}

/**
 * Get trials for a user from both localStorage and Firebase
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function getTrialsForUser(userId) {
  let trials = [];

  // Get from localStorage first
  const localTrials = getFromLocalStorage(`trials_${userId}`) || [];
  trials = [...localTrials];

  // Get from Firebase if enabled
  if (isFirebaseEnabled) {
    try {
      const trialsRef = collection(db, 'users', userId, 'trials');
      const trialsSnapshot = await getDocs(trialsRef);
      const firebaseTrials = trialsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Merge Firebase trials (avoid duplicates by timestamp)
      const existingTimestamps = new Set(trials.map(t => t.timestamp));
      firebaseTrials.forEach(trial => {
        if (!existingTimestamps.has(trial.timestamp)) {
          trials.push(trial);
        }
      });

      console.log('Loaded', firebaseTrials.length, 'trials from Firebase for', userId);
    } catch (error) {
      console.error('Error fetching trials for', userId, ':', error);
      console.error('Error code:', error.code);
    }
  }

  return trials;
}

/**
 * Get session data for a user from both localStorage and Firebase
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async function getSessionForUser(userId) {
  let session = {};

  // Get from localStorage first
  const localSession = getFromLocalStorage(`session_${userId}`) || {};
  session = { ...localSession };

  // Get from Firebase if enabled (Firebase data takes precedence if both exist)
  if (isFirebaseEnabled) {
    try {
      const userDocRef = collection(db, 'users');
      const userSnapshot = await getDocs(userDocRef);
      const userDoc = userSnapshot.docs.find(doc => doc.id === userId);

      if (userDoc && userDoc.exists()) {
        const firebaseSession = userDoc.data();
        session = { ...session, ...firebaseSession };
        console.log('Loaded session from Firebase for', userId);
      }
    } catch (error) {
      console.error('Error fetching session for', userId, ':', error);
      console.error('Error code:', error.code);
    }
  }

  return session;
}

// Show login first
function showAdminLogin() {
  // Check if admin is already logged in (within 1 hour)
  const adminLoginTime = localStorage.getItem('acct_admin_login_time');

  if (adminLoginTime) {
    const loginTimestamp = new Date(adminLoginTime).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

    if (now - loginTimestamp < oneHour) {
      // Still logged in, show dashboard directly
      console.log('Using existing admin session');
      showDashboard();
      return;
    }
  }

  const container = document.getElementById('admin-container');
  container.innerHTML = `
    <div class="admin-login" style="
      max-width: 380px;
      margin: 4rem auto;
      padding: 1.5rem;
      border: 1px solid #e5e5e5;
      border-radius: 0.375rem;
    ">
      <h2 style="text-align: center; margin-bottom: 1.5rem; font-size: 1.375rem;">Admin Dashboard</h2>
      <form id="admin-login-form">
        <div style="margin-bottom: 0.875rem;">
          <label style="display: block; margin-bottom: 0.375rem; color: #404040; font-size: 0.813rem;">
            Admin Password
          </label>
          <input
            type="password"
            id="admin-password"
            style="width: 100%; padding: 0.438rem; border: 1px solid #e5e5e5; border-radius: 0.25rem; font-size: 0.875rem;"
          />
        </div>
        <div id="admin-error" style="color: #dc2626; font-size: 0.813rem; margin-bottom: 0.875rem; display: none;"></div>
        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.5rem;">
          Login
        </button>
      </form>
    </div>
  `;

  document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('admin-error');

    if (password === ADMIN_PASSWORD) {
      // Save login timestamp
      localStorage.setItem('acct_admin_login_time', new Date().toISOString());

      // Authenticate with Firebase before showing dashboard
      console.log('Admin authenticating with Firebase...');
      const authSuccess = await ensureFirebaseAuth();

      if (!authSuccess) {
        console.error('Firebase authentication failed for admin');
        errorDiv.textContent = 'Warning: Firebase authentication failed. Only local data will be visible.';
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#f59e0b';
      }

      await showDashboard();
    } else {
      errorDiv.textContent = 'Invalid password';
      errorDiv.style.display = 'block';
    }
  });
}

// Show main dashboard
async function showDashboard() {
  const container = document.getElementById('admin-container');

  // Show loading state
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto; padding: 1.5rem; text-align: center;">
      <h2>Loading data...</h2>
      <p style="color: #737373;">Fetching data from ${isFirebaseEnabled ? 'Firebase and localStorage' : 'localStorage only'}...</p>
    </div>
  `;

  // Get all data from both localStorage AND Firebase
  let participantData = [];

  // First, get local data
  const allLocalUserIds = getAllUserIds();
  console.log('Found', allLocalUserIds.length, 'users in localStorage');

  // Fetch from Firebase if enabled
  let firebaseUserIds = [];
  if (isFirebaseEnabled) {
    try {
      console.log('Fetching data from Firebase...');
      firebaseUserIds = await fetchAllFirebaseUsers();
      console.log('Found', firebaseUserIds.length, 'users in Firebase');
    } catch (error) {
      console.error('Error fetching from Firebase:', error);
    }
  }

  // Combine both sources (remove duplicates)
  const allUserIds = [...new Set([...allLocalUserIds, ...firebaseUserIds])];
  console.log('Total unique users:', allUserIds.length);

  // Fetch data for each user
  for (const userId of allUserIds) {
    const trials = await getTrialsForUser(userId);
    const session = await getSessionForUser(userId);

    // Calculate performance metrics
    const stroopTrials = trials.filter((t) => t.task_type === 'stroop');
    const nbackTrials = trials.filter((t) => t.task_type === 'nback');
    const gonogoTrials = trials.filter((t) => t.task_type === 'gonogo');

    const calculateAccuracy = (taskTrials) => {
      if (taskTrials.length === 0) return 0;
      const correct = taskTrials.filter((t) => t.correct).length;
      return ((correct / taskTrials.length) * 100).toFixed(1);
    };

    const calculateAvgRT = (taskTrials) => {
      if (taskTrials.length === 0) return 0;
      const validTrials = taskTrials.filter((t) => t.rt && t.rt > 0);
      if (validTrials.length === 0) return 0;
      const totalRT = validTrials.reduce((sum, t) => sum + t.rt, 0);
      return Math.round(totalRT / validTrials.length);
    };

    participantData.push({
      userId,
      trials,
      session,
      trialCount: trials.length,
      completionStatus: session.completed ? 'Completed' : 'In Progress',
      metrics: {
        overall: {
          accuracy: calculateAccuracy(trials),
          avgRT: calculateAvgRT(trials),
        },
        stroop: {
          trials: stroopTrials.length,
          accuracy: calculateAccuracy(stroopTrials),
          avgRT: calculateAvgRT(stroopTrials),
        },
        nback: {
          trials: nbackTrials.length,
          accuracy: calculateAccuracy(nbackTrials),
          avgRT: calculateAvgRT(nbackTrials),
        },
        gonogo: {
          trials: gonogoTrials.length,
          accuracy: calculateAccuracy(gonogoTrials),
          avgRT: calculateAvgRT(gonogoTrials),
          commissionErrors: gonogoTrials.filter((t) => t.commission_error).length,
          omissionErrors: gonogoTrials.filter((t) => t.omission_error).length,
        },
      },
    });
  }

  console.log('Processed data for', participantData.length, 'participants');

  const avgAccuracy = participantData.reduce((sum, p) => sum + parseFloat(p.metrics.overall.accuracy), 0) / (participantData.length || 1);
  const avgRT = participantData.reduce((sum, p) => sum + p.metrics.overall.avgRT, 0) / (participantData.length || 1);

  container.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto; padding: 1.5rem;">
      <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #e5e5e5; padding-bottom: 0.875rem;">
        <div>
          <h1 style="font-size: 1.5rem;">Admin Dashboard</h1>
          <p style="font-size: 0.75rem; color: #737373; margin: 0.25rem 0 0 0;">
            Data source: ${isFirebaseEnabled ? 'Firebase + localStorage' : 'localStorage only'}
          </p>
        </div>
        <button id="logout-btn" class="btn btn-secondary" style="padding: 0.375rem 0.875rem; font-size: 0.813rem;">Logout</button>
      </header>

      <!-- Summary Stats -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
        <div style="padding: 0.875rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
          <div style="font-size: 1.5rem; font-weight: 600; color: #0a0a0a;">${participantData.length}</div>
          <div style="font-size: 0.688rem; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">Participants</div>
        </div>
        <div style="padding: 0.875rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
          <div style="font-size: 1.5rem; font-weight: 600; color: #0a0a0a;">${participantData.filter((p) => p.completionStatus === 'Completed').length}</div>
          <div style="font-size: 0.688rem; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">Completed</div>
        </div>
        <div style="padding: 0.875rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
          <div style="font-size: 1.5rem; font-weight: 600; color: #0a0a0a;">${participantData.reduce((sum, p) => sum + p.trialCount, 0)}</div>
          <div style="font-size: 0.688rem; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">Total Trials</div>
        </div>
        <div style="padding: 0.875rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
          <div style="font-size: 1.5rem; font-weight: 600; color: #0a0a0a;">${avgAccuracy.toFixed(1)}%</div>
          <div style="font-size: 0.688rem; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">Avg Accuracy</div>
        </div>
        <div style="padding: 0.875rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
          <div style="font-size: 1.5rem; font-weight: 600; color: #0a0a0a;">${Math.round(avgRT)}ms</div>
          <div style="font-size: 0.688rem; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">Avg RT</div>
        </div>
      </div>

      <!-- Aggregate Charts -->
      <div id="aggregate-charts" style="margin-bottom: 2rem;"></div>

      <!-- Export Section -->
      <div style="margin-bottom: 1.5rem; padding: 1rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
        <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">Export All Data</h3>
        <div style="display: flex; gap: 0.5rem;">
          <button id="export-all-csv" class="btn btn-primary" style="padding: 0.438rem 1rem; font-size: 0.813rem;">CSV</button>
          <button id="export-all-json" class="btn btn-secondary" style="padding: 0.438rem 1rem; font-size: 0.813rem;">JSON</button>
        </div>
      </div>

      <!-- Participants List -->
      <div>
        <h2 style="font-size: 1.25rem; margin-bottom: 0.875rem;">Participants</h2>
        <div id="participant-list"></div>
      </div>
    </div>
  `;

  // Render aggregate charts
  renderAggregateCharts(participantData);

  // Render participant list
  renderParticipantList(participantData);

  // Export handlers
  document.getElementById('export-all-csv').addEventListener('click', () => {
    exportAllDataAsCSV(participantData);
  });

  document.getElementById('export-all-json').addEventListener('click', () => {
    exportAllDataAsJSON(participantData);
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    // Clear admin session
    localStorage.removeItem('acct_admin_login_time');
    showAdminLogin();
  });
}

// Render aggregate charts showing combined user data
function renderAggregateCharts(participantData) {
  const chartsContainer = document.getElementById('aggregate-charts');

  chartsContainer.innerHTML = `
    <h3 style="font-size: 1.125rem; margin-bottom: 1rem;">Aggregate Analytics</h3>

    <!-- Timeline Charts (same as shown to users) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div style="padding: 1rem; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
        <h4 style="font-size: 0.875rem; margin-bottom: 0.75rem; color: #737373;">Response Time Over Trials (All Participants)</h4>
        <canvas id="aggregate-rt-timeline-chart"></canvas>
      </div>
      <div style="padding: 1rem; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
        <h4 style="font-size: 0.875rem; margin-bottom: 0.75rem; color: #737373;">Accuracy Over Trials (All Participants)</h4>
        <canvas id="aggregate-accuracy-timeline-chart"></canvas>
      </div>
    </div>

    <!-- Summary Bar Charts -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
      <div style="padding: 1rem; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
        <h4 style="font-size: 0.875rem; margin-bottom: 0.75rem; color: #737373;">Accuracy by Task Type</h4>
        <canvas id="aggregate-accuracy-chart" style="max-height: 200px;"></canvas>
      </div>
      <div style="padding: 1rem; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
        <h4 style="font-size: 0.875rem; margin-bottom: 0.75rem; color: #737373;">Response Time by Task Type</h4>
        <canvas id="aggregate-rt-chart" style="max-height: 200px;"></canvas>
      </div>
      <div style="padding: 1rem; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
        <h4 style="font-size: 0.875rem; margin-bottom: 0.75rem; color: #737373;">Participant Performance Distribution</h4>
        <canvas id="aggregate-distribution-chart" style="max-height: 200px;"></canvas>
      </div>
    </div>
  `;

  // Combine all trials from all participants for timeline charts
  const allTrials = participantData.flatMap(p => p.trials).filter(t => t.trial_type !== 'practice');

  // Create aggregate timeline charts (same as shown to users)
  if (allTrials.length > 0) {
    const validRTTrials = allTrials.filter(t => t.rt && t.rt > 0);
    if (validRTTrials.length > 0) {
      createRTTimelineChart('aggregate-rt-timeline-chart', validRTTrials);
    }
    createAccuracyChart('aggregate-accuracy-timeline-chart', allTrials);
  }

  // Calculate aggregate metrics
  const stroopAccuracies = participantData.map(p => parseFloat(p.metrics.stroop.accuracy)).filter(a => a > 0);
  const nbackAccuracies = participantData.map(p => parseFloat(p.metrics.nback.accuracy)).filter(a => a > 0);
  const gonogoAccuracies = participantData.map(p => parseFloat(p.metrics.gonogo.accuracy)).filter(a => a > 0);

  const stroopRTs = participantData.map(p => p.metrics.stroop.avgRT).filter(rt => rt > 0);
  const nbackRTs = participantData.map(p => p.metrics.nback.avgRT).filter(rt => rt > 0);
  const gonogoRTs = participantData.map(p => p.metrics.gonogo.avgRT).filter(rt => rt > 0);

  const avgAcc = arr => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  // Accuracy by Task Type Chart
  new Chart(document.getElementById('aggregate-accuracy-chart'), {
    type: 'bar',
    data: {
      labels: ['Stroop', 'N-Back', 'Go/No-Go'],
      datasets: [{
        label: 'Average Accuracy (%)',
        data: [avgAcc(stroopAccuracies), avgAcc(nbackAccuracies), avgAcc(gonogoAccuracies)],
        backgroundColor: ['#0a0a0a', '#404040', '#737373'],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { font: { size: 10 } } },
        x: { ticks: { font: { size: 10 } } }
      }
    }
  });

  // Response Time by Task Type Chart
  new Chart(document.getElementById('aggregate-rt-chart'), {
    type: 'bar',
    data: {
      labels: ['Stroop', 'N-Back', 'Go/No-Go'],
      datasets: [{
        label: 'Average RT (ms)',
        data: [avgAcc(stroopRTs), avgAcc(nbackRTs), avgAcc(gonogoRTs)],
        backgroundColor: ['#0a0a0a', '#404040', '#737373'],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 10 } } },
        x: { ticks: { font: { size: 10 } } }
      }
    }
  });

  // Participant Performance Distribution
  const accuracyBuckets = [0, 0, 0, 0, 0]; // 0-20, 20-40, 40-60, 60-80, 80-100
  participantData.forEach(p => {
    const acc = parseFloat(p.metrics.overall.accuracy);
    const bucket = Math.min(Math.floor(acc / 20), 4);
    accuracyBuckets[bucket]++;
  });

  new Chart(document.getElementById('aggregate-distribution-chart'), {
    type: 'bar',
    data: {
      labels: ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'],
      datasets: [{
        label: 'Number of Participants',
        data: accuracyBuckets,
        backgroundColor: '#0a0a0a',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
        x: { ticks: { font: { size: 10 } } }
      }
    }
  });
}

// Render participant list
function renderParticipantList(participantData) {
  const listContainer = document.getElementById('participant-list');

  if (participantData.length === 0) {
    listContainer.innerHTML = '<p style="color: #737373;">No participant data found.</p>';
    return;
  }

  const html = participantData
    .map(
      (p) => `
    <div style="margin-bottom: 0.75rem; padding: 0.875rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1;">
          <div style="font-weight: 500; font-size: 0.875rem; margin-bottom: 0.25rem;">${p.userId}</div>
          <div style="font-size: 0.75rem; color: #737373;">
            ${p.trialCount} trials · ${p.completionStatus} ·
            Accuracy: ${p.metrics.overall.accuracy}% ·
            RT: ${p.metrics.overall.avgRT}ms
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary" onclick="viewParticipantDetails('${p.userId}')" style="padding: 0.313rem 0.75rem; font-size: 0.75rem;">
            View Details
          </button>
          <button class="btn btn-secondary" onclick="exportParticipant('${p.userId}')" style="padding: 0.313rem 0.75rem; font-size: 0.75rem;">
            Export
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  listContainer.innerHTML = html;
}

// View participant details with charts
window.viewParticipantDetails = function (userId) {
  const trials = getFromLocalStorage(`trials_${userId}`) || [];
  const session = getFromLocalStorage(`session_${userId}`) || {};
  const container = document.getElementById('admin-container');

  // Filter trials by task type
  const stroopTrials = trials.filter((t) => t.task_type === 'stroop');
  const nbackTrials = trials.filter((t) => t.task_type === 'nback');
  const gonogoTrials = trials.filter((t) => t.task_type === 'gonogo');

  // Calculate metrics
  const calcAcc = (t) => t.length > 0 ? ((t.filter(x => x.correct).length / t.length) * 100).toFixed(1) : 0;
  const calcRT = (t) => {
    const validTrials = t.filter(x => x.rt && x.rt > 0);
    return validTrials.length > 0 ? Math.round(validTrials.reduce((s, x) => s + x.rt, 0) / validTrials.length) : 0;
  };

  container.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto; padding: 1.5rem;">
      <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #e5e5e5; padding-bottom: 0.875rem;">
        <div>
          <button onclick="location.reload()" class="btn btn-secondary" style="padding: 0.313rem 0.75rem; font-size: 0.75rem; margin-bottom: 0.5rem;">← Back</button>
          <h1 style="font-size: 1.5rem;">Participant Details</h1>
          <p style="font-size: 0.875rem; color: #737373; margin: 0;">${userId}</p>
        </div>
        <button onclick="exportParticipant('${userId}')" class="btn btn-primary" style="padding: 0.438rem 1rem; font-size: 0.813rem;">Export Data</button>
      </header>

      <!-- Summary Stats -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
        <div style="padding: 0.875rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
          <div style="font-size: 1.5rem; font-weight: 600;">${trials.length}</div>
          <div style="font-size: 0.688rem; color: #737373; text-transform: uppercase;">Total Trials</div>
        </div>
        <div style="padding: 0.875rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
          <div style="font-size: 1.5rem; font-weight: 600;">${calcAcc(trials)}%</div>
          <div style="font-size: 0.688rem; color: #737373; text-transform: uppercase;">Accuracy</div>
        </div>
        <div style="padding: 0.875rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
          <div style="font-size: 1.5rem; font-weight: 600;">${calcRT(trials)}ms</div>
          <div style="font-size: 0.688rem; color: #737373; text-transform: uppercase;">Avg RT</div>
        </div>
        <div style="padding: 0.875rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
          <div style="font-size: 1.5rem; font-weight: 600;">${session.completed ? 'Yes' : 'No'}</div>
          <div style="font-size: 0.688rem; color: #737373; text-transform: uppercase;">Completed</div>
        </div>
      </div>

      <!-- Performance Charts -->
      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.125rem; margin-bottom: 1rem;">Performance Analytics</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <div style="padding: 1rem; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
            <canvas id="detail-rt-timeline-chart"></canvas>
          </div>
          <div style="padding: 1rem; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
            <canvas id="detail-accuracy-timeline-chart"></canvas>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
            <h4 style="font-size: 0.875rem; margin-bottom: 0.75rem; color: #737373;">Accuracy by Task</h4>
            <canvas id="detail-accuracy-by-task-chart" style="max-height: 220px;"></canvas>
          </div>
          <div style="padding: 1rem; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
            <h4 style="font-size: 0.875rem; margin-bottom: 0.75rem; color: #737373;">Average RT by Task</h4>
            <canvas id="detail-rt-by-task-chart" style="max-height: 220px;"></canvas>
          </div>
        </div>
      </div>

      <!-- Task Breakdown -->
      <div>
        <h3 style="font-size: 1.125rem; margin-bottom: 1rem;">Task Breakdown</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
          ${stroopTrials.length > 0 ? `
          <div style="padding: 1rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
            <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;">Stroop Task</h4>
            <div style="font-size: 0.75rem; color: #737373; margin-bottom: 0.5rem;">${stroopTrials.length} trials</div>
            <div style="font-size: 0.813rem;">Accuracy: <strong>${calcAcc(stroopTrials)}%</strong></div>
            <div style="font-size: 0.813rem;">Avg RT: <strong>${calcRT(stroopTrials)}ms</strong></div>
          </div>
          ` : ''}
          ${nbackTrials.length > 0 ? `
          <div style="padding: 1rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
            <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;">N-Back Task</h4>
            <div style="font-size: 0.75rem; color: #737373; margin-bottom: 0.5rem;">${nbackTrials.length} trials</div>
            <div style="font-size: 0.813rem;">Accuracy: <strong>${calcAcc(nbackTrials)}%</strong></div>
            <div style="font-size: 0.813rem;">Avg RT: <strong>${calcRT(nbackTrials)}ms</strong></div>
          </div>
          ` : ''}
          ${gonogoTrials.length > 0 ? `
          <div style="padding: 1rem; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.25rem;">
            <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;">Go/No-Go Task</h4>
            <div style="font-size: 0.75rem; color: #737373; margin-bottom: 0.5rem;">${gonogoTrials.length} trials</div>
            <div style="font-size: 0.813rem;">Accuracy: <strong>${calcAcc(gonogoTrials)}%</strong></div>
            <div style="font-size: 0.813rem;">Commission Errors: <strong>${gonogoTrials.filter(t => t.commission_error).length}</strong></div>
            <div style="font-size: 0.813rem;">Omission Errors: <strong>${gonogoTrials.filter(t => t.omission_error).length}</strong></div>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  // Render RT timeline chart (same as shown to users)
  const validRTTrials = trials.filter(t => t.rt && t.rt > 0);
  if (validRTTrials.length > 0) {
    createRTTimelineChart('detail-rt-timeline-chart', validRTTrials);
  }

  // Render accuracy timeline chart
  if (trials.length > 0) {
    createAccuracyChart('detail-accuracy-timeline-chart', trials);
  }

  // Render accuracy by task chart
  new Chart(document.getElementById('detail-accuracy-by-task-chart'), {
    type: 'bar',
    data: {
      labels: ['Stroop', 'N-Back', 'Go/No-Go'],
      datasets: [{
        label: 'Accuracy (%)',
        data: [
          parseFloat(calcAcc(stroopTrials)),
          parseFloat(calcAcc(nbackTrials)),
          parseFloat(calcAcc(gonogoTrials))
        ],
        backgroundColor: ['#0a0a0a', '#404040', '#737373'],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { font: { size: 10 } } },
        x: { ticks: { font: { size: 10 } } }
      }
    }
  });

  // Render RT by task chart
  new Chart(document.getElementById('detail-rt-by-task-chart'), {
    type: 'bar',
    data: {
      labels: ['Stroop', 'N-Back', 'Go/No-Go'],
      datasets: [{
        label: 'Avg RT (ms)',
        data: [
          calcRT(stroopTrials),
          calcRT(nbackTrials),
          calcRT(gonogoTrials)
        ],
        backgroundColor: ['#0a0a0a', '#404040', '#737373'],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 10 } } },
        x: { ticks: { font: { size: 10 } } }
      }
    }
  });
};

// Export single participant
window.exportParticipant = function (userId) {
  const trials = getFromLocalStorage(`trials_${userId}`) || [];
  const session = getFromLocalStorage(`session_${userId}`) || {};

  const data = {
    userId,
    trials,
    session,
    exportedAt: new Date().toISOString(),
  };

  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ACCT_${userId}_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Export all as CSV
function exportAllDataAsCSV(participantData) {
  const allTrials = participantData.flatMap((p) => p.trials);

  if (allTrials.length === 0) {
    alert('No trial data to export');
    return;
  }

  // Get all unique keys
  const keys = Object.keys(allTrials[0]);
  const csvHeader = keys.join(',');

  const csvRows = allTrials.map((trial) => {
    return keys
      .map((key) => {
        const value = trial[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      })
      .join(',');
  });

  const csv = [csvHeader, ...csvRows].join('\\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ACCT_all_data_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Export all as JSON
function exportAllDataAsJSON(participantData) {
  const data = {
    participants: participantData,
    exportedAt: new Date().toISOString(),
    totalParticipants: participantData.length,
  };

  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ACCT_all_data_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// Get all user IDs from localStorage
function getAllUserIds() {
  const userIds = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('acct_trials_')) {
      const userId = key.replace('acct_trials_', '');
      userIds.push(userId);
    }
  }
  return userIds;
}

// Get from localStorage
function getFromLocalStorage(key) {
  try {
    const storageKey = `acct_${key}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading from local storage:', error);
    return null;
  }
}

// Initialize
showAdminLogin();

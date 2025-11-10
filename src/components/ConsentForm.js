// Consent and instruction screens
import { experimentConfig } from '../config/experiment.config.js';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';

export function createConsentTimeline(jsPsych) {
  return {
    type: htmlKeyboardResponse,
    stimulus: () => {
      return `
        <div class="consent-container">
          <div class="consent-content">
            ${experimentConfig.text.consent}
            <div class="consent-buttons">
              <button id="consent-agree" class="btn btn-primary">
                I Consent and Want to Participate
              </button>
              <button id="consent-decline" class="btn btn-secondary">
                I Do Not Consent
              </button>
            </div>
          </div>
        </div>
      `;
    },
    choices: 'NO_KEYS',
    on_load: function () {
      // Handle consent button clicks
      document.getElementById('consent-agree').addEventListener('click', () => {
        jsPsych.finishTrial({ consented: true });
      });

      document.getElementById('consent-decline').addEventListener('click', () => {
        jsPsych.finishTrial({ consented: false });
      });
    },
    on_finish: function (data) {
      if (!data.consented) {
        // End experiment if not consented
        jsPsych.endExperiment(
          '<div class="end-message"><p>Thank you for your time. The experiment has been terminated.</p></div>'
        );
      }
    },
  };
}

export function createWelcomeTimeline() {
  return {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="welcome-container">
        <h1>${experimentConfig.text.welcome}</h1>
        <p>Thank you for participating in this research study.</p>
        <p>This experiment will take approximately <strong>10-15 minutes</strong> to complete.</p>
        <p>Please ensure you are in a quiet environment and can focus without interruption.</p>
        <br>
        <p><em>Press any key to continue to the consent form.</em></p>
      </div>
    `,
  };
}

export function createInstructionsTimeline() {
  return {
    type: htmlKeyboardResponse,
    stimulus: experimentConfig.text.instructions,
    post_trial_gap: 500,
  };
}

export function createPracticeInstructionsTimeline() {
  return {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="instructions-container">
        <h2>Practice Trials</h2>
        <p>Let's start with a few practice trials to get familiar with the task.</p>
        <p>You will receive feedback on each practice trial.</p>
        <p><strong>Remember:</strong> Respond to the <em>color</em> of the text, not the word itself.</p>
        <br>
        <p><em>Press any key when you're ready to begin the practice.</em></p>
      </div>
    `,
  };
}

export function createStartExperimentTimeline() {
  return {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="instructions-container">
        <h2>Ready to Begin!</h2>
        <p>Great! Now you'll begin the main experiment.</p>
        <p>The difficulty will adapt based on your performance.</p>
        <p><strong>Tips for success:</strong></p>
        <ul style="text-align: left; max-width: 500px; margin: 20px auto;">
          <li>Respond as quickly and accurately as possible</li>
          <li>Focus on the color, ignore the word</li>
          <li>Take breaks between blocks if needed</li>
          <li>Stay focused throughout the task</li>
        </ul>
        <br>
        <p><em>Press any key to start the experiment.</em></p>
      </div>
    `,
    post_trial_gap: 1000,
  };
}

export function createDebriefTimeline(performanceSummary) {
  return {
    type: htmlKeyboardResponse,
    stimulus: () => {
      const accuracy = (performanceSummary.accuracy * 100).toFixed(1);
      const avgRT = performanceSummary.averageRT.toFixed(0);

      return `
        <div class="debrief-container">
          <h2>Experiment Complete!</h2>
          <p>Thank you for participating in this study.</p>

          <div class="final-stats">
            <h3>Your Performance Summary</h3>
            <div class="performance-stats">
              <div class="stat-card">
                <div class="stat-value">${performanceSummary.totalTrials}</div>
                <div class="stat-label">Total Trials</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${accuracy}%</div>
                <div class="stat-label">Overall Accuracy</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${avgRT}ms</div>
                <div class="stat-label">Avg Response Time</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">Level ${performanceSummary.currentLevel}</div>
                <div class="stat-label">Final Difficulty</div>
              </div>
            </div>
          </div>

          <div class="debrief-info">
            <h3>About This Study</h3>
            <p>This experiment investigated <strong>cognitive control</strong> – the ability to override automatic responses and focus on relevant information.</p>
            <p>The Stroop task measures how well you can ignore the automatic response of reading the word and instead focus on naming the color.</p>
            <p>The adaptive difficulty algorithm adjusted the task based on your performance, providing a personalized challenge level.</p>
          </div>

          <div class="data-info">
            <p><strong>Data Privacy:</strong> All your data has been stored anonymously and will be used only for research purposes.</p>
            <p>Your participant ID: <code id="participant-id-display"></code></p>
          </div>

          <br>
          <p><em>Press any key to finish.</em></p>
        </div>
      `;
    },
    on_load: function () {
      // Display participant ID
      const participantId = localStorage.getItem('acct_participant_id');
      const displayElement = document.getElementById('participant-id-display');
      if (displayElement && participantId) {
        displayElement.textContent = participantId;
      }
    },
  };
}




import { initJsPsych } from 'jspsych';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';

import AdaptiveStroopPlugin from './plugins/adaptiveStroopPlugin.js';
import ProgressFeedbackPlugin from './plugins/feedbackPlugin.js';
import NBackPlugin from './plugins/nBackPlugin.js';
import GoNoGoPlugin from './plugins/goNoGoPlugin.js';

import {
  createWelcomeTimeline,
  createConsentTimeline,
  createInstructionsTimeline,
  createPracticeInstructionsTimeline,
  createStartExperimentTimeline,
  createDebriefTimeline,
} from './components/ConsentForm.js';

import {
  createRTTimelineChart,
  createAccuracyChart,
  createDifficultyChart,
  createCongruencyComparisonChart,
  createVisualizationHTML,
} from './components/DataVisualization.js';

import { AdaptiveDifficultyManager } from './utils/adaptiveLogic.js';
import {
  generateStimulus,
  generateStimulusBlock,
  generatePracticeTrials,
  getValidKeys,
} from './utils/stimulusGenerator.js';
import { exportExperimentData } from './utils/csvExport.js';

// simple auth
import { showLoginScreen, getCurrentUserId } from './auth/simpleAuth.js';

// Firebase authentication
import { ensureFirebaseAuth } from './firebase/config.js';

// data storage
import {
  saveTrialData,
  saveSessionData,
  exportAllData,
  finalizeTrialData,
} from './firebase/saveData.js';

import { experimentConfig } from './config/experiment.config.js';
import './styles/experiment.css';

// Helper function to get task instructions
function getTaskInstructions(taskType, blockNumber) {
  const instructions = {
    stroop: `
      <div class="instructions-container">
        <h2>Block ${blockNumber}: Color Naming Task</h2>
        <p>In this task, you will see words displayed in different colors.</p>
        <p><strong>Your goal:</strong> Press the key corresponding to the <strong>color</strong> of the text, not the word itself.</p>
        <div style="margin: 2rem 0;">
          <p><kbd>R</kbd> = Red</p>
          <p><kbd>G</kbd> = Green</p>
          <p><kbd>B</kbd> = Blue</p>
          <p><kbd>Y</kbd> = Yellow</p>
        </div>
        <p>Example: If you see <span style="color: blue;">RED</span>, press <kbd>B</kbd> for blue.</p>
        <p style="margin-top: 2rem; color: #737373; font-size: 0.938rem;"><strong>Press SPACE to begin</strong></p>
      </div>
    `,
    nback: `
      <div class="instructions-container">
        <h2>Block ${blockNumber}: Working Memory Task (2-Back)</h2>
        <p>In this task, you will see a sequence of letters.</p>
        <p><strong>Your goal:</strong> Press <kbd>F</kbd> if the current letter matches the letter from 2 trials back.</p>
        <p>Press <kbd>J</kbd> if it does NOT match.</p>
        <div style="margin: 2rem 0;">
          <p>Example sequence: A → B → <strong>A</strong></p>
          <p>On the third letter (A), you should press <kbd>F</kbd> because it matches 2 trials back.</p>
        </div>
        <p style="margin-top: 2rem; color: #737373; font-size: 0.938rem;"><strong>Press SPACE to begin</strong></p>
      </div>
    `,
    gonogo: `
      <div class="instructions-container">
        <h2>Block ${blockNumber}: Impulse Control Task</h2>
        <p>In this task, you will see different letters displayed in green or red.</p>
        <p><strong>Your goal:</strong></p>
        <div style="margin: 2rem 0;">
          <p>Press <kbd>SPACE</kbd> when you see a <span style="color: #16a34a;">GREEN</span> letter</p>
          <p>Do NOT press anything when you see a <span style="color: #dc2626;">RED</span> letter</p>
        </div>
        <p>Try to respond as quickly as possible to green letters, but hold back for red letters!</p>
        <p style="margin-top: 2rem; color: #737373; font-size: 0.938rem;"><strong>Press SPACE to begin</strong></p>
      </div>
    `,
  };

  return instructions[taskType] || '';
}

// main runner function
async function runExperiment() {
  const userId = await showLoginScreen();

  const authSuccess = await ensureFirebaseAuth();

  const jsPsych = initJsPsych({
    show_progress_bar: true,
    auto_update_progress_bar: true,
    message_progress_bar: 'Progress',
    on_finish: function () {
      displayCompletionScreen();
    },
  });

  const difficultyManager = new AdaptiveDifficultyManager();

  let currentBlock = 0;
  let allTrialData = [];
  const experimentStartTime = Date.now();

  const timeline = [];

  // build up the timeline
  timeline.push(createWelcomeTimeline());
  timeline.push(createConsentTimeline(jsPsych));
  timeline.push(createInstructionsTimeline());

  // practice phase
  timeline.push(createPracticeInstructionsTimeline());

  const practiceStimuli = generatePracticeTrials(5);
  const practiceTrials = practiceStimuli.map((stimulus) => ({
    type: AdaptiveStroopPlugin,
    stimulus_word: stimulus.word,
    stimulus_color: stimulus.color,
    correct_response: stimulus.correctResponse,
    congruent: stimulus.congruent,
    choices: getValidKeys(experimentConfig.stimuli.colors),
    stimulus_duration: 2500,
    trial_duration: 3500,
    show_feedback: true,
    feedback_duration: 800,
    block: 0,
    difficulty_level: 1,
    on_finish: function (data) {
      data.user_id = userId;
      data.trial_type = 'practice';
      data.timestamp = Date.now();
    },
  }));

  timeline.push(...practiceTrials);

  // 5. Start main experiment
  timeline.push(createStartExperimentTimeline());

  // 6. Main experiment blocks - Mix of different task types
  const taskTypes = ['stroop', 'nback', 'gonogo'];

  for (let block = 1; block <= experimentConfig.blocks.total; block++) {
    // Determine task type for this block (rotate through types)
    const taskType = taskTypes[(block - 1) % taskTypes.length];

    // Add task instruction screen
    timeline.push({
      type: htmlKeyboardResponse,
      stimulus: getTaskInstructions(taskType, block),
      choices: [' '], // Space key
    });

    if (taskType === 'stroop') {
      // Stroop task trials
      const blockStimuli = generateStimulusBlock(
        experimentConfig.blocks.trialsPerBlock,
        difficultyManager.currentColorSet,
        experimentConfig.stimuli.words
      );

      const blockTrials = blockStimuli.map((stimulus, trialIndex) => {
        return {
          type: AdaptiveStroopPlugin,
          stimulus_word: stimulus.word,
          stimulus_color: stimulus.color,
          correct_response: stimulus.correctResponse,
          congruent: stimulus.congruent,
          choices: getValidKeys(difficultyManager.currentColorSet),
          stimulus_duration: () => difficultyManager.currentStimulusTime,
          trial_duration: () => difficultyManager.currentStimulusTime + 1000,
          show_feedback: false,
          block: block,
          difficulty_level: () => difficultyManager.currentDifficultyLevel,
          on_finish: function (data) {
            data.user_id = userId;
            data.trial_type = 'stroop';
            data.task_type = 'stroop';
            data.trial_index = allTrialData.length;
            data.timestamp = Date.now();
            difficultyManager.recordTrial(data);
            allTrialData.push(data);
            saveTrialData(userId, data);
            if (difficultyManager.shouldAdjustDifficulty()) {
              difficultyManager.adjustDifficulty();
            }
          },
        };
      });
      timeline.push(...blockTrials);

    } else if (taskType === 'nback') {
      // N-Back task trials
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const nLevel = 2; // 2-back task
      const nbackTrials = [];
      const trialSequence = [];

      // Generate trial sequence with ~30% targets
      for (let i = 0; i < 10; i++) {
        if (i >= nLevel && Math.random() < 0.3) {
          // Target trial - match n trials back
          trialSequence.push(trialSequence[i - nLevel]);
        } else {
          // Non-target - random letter
          trialSequence.push(letters[Math.floor(Math.random() * letters.length)]);
        }
      }

      for (let i = 0; i < trialSequence.length; i++) {
        const isTarget = i >= nLevel && trialSequence[i] === trialSequence[i - nLevel];
        nbackTrials.push({
          type: NBackPlugin,
          stimulus: trialSequence[i],
          n_level: nLevel,
          is_target: isTarget,
          stimulus_duration: 500,
          trial_duration: 2500,
          fixation_duration: 500,
          show_feedback: true,
          on_finish: function (data) {
            data.user_id = userId;
            data.trial_type = 'nback';
            data.task_type = 'nback';
            data.trial_index = allTrialData.length;
            data.block = block;
            data.timestamp = Date.now();
            allTrialData.push(data);
            saveTrialData(userId, data);
          },
        });
      }
      timeline.push(...nbackTrials);

    } else if (taskType === 'gonogo') {
      // Go/No-Go task trials
      const letters = ['X', 'O', 'M', 'N', 'P'];
      const goStimulus = 'X'; // X is "go"
      const gonogoTrials = [];

      // Generate trials with 70% go, 30% no-go
      for (let i = 0; i < 10; i++) {
        const isGo = Math.random() < 0.7;
        const stimulus = isGo ? goStimulus : letters[1 + Math.floor(Math.random() * (letters.length - 1))];

        gonogoTrials.push({
          type: GoNoGoPlugin,
          stimulus: stimulus,
          trial_type: isGo ? 'go' : 'nogo',
          stimulus_duration: 800,
          trial_duration: 2000,
          response_window: 1500,
          show_feedback: true,
          feedback_duration: 500,
          on_finish: function (data) {
            data.user_id = userId;
            data.task_type = 'gonogo';
            data.trial_index = allTrialData.length;
            data.block = block;
            data.timestamp = Date.now();
            allTrialData.push(data);
            saveTrialData(userId, data);
          },
        });
      }
      timeline.push(...gonogoTrials);
    }

    // Add block trials to timeline (already pushed above)

    // Add progress feedback after each block (except last)
    if (block < experimentConfig.blocks.total) {
      timeline.push({
        type: ProgressFeedbackPlugin,
        block_number: block,
        total_blocks: experimentConfig.blocks.total,
        block_accuracy: () => {
          // Calculate accuracy for this block
          const blockTrials = allTrialData.slice(-experimentConfig.blocks.trialsPerBlock);
          const correct = blockTrials.filter((t) => t.correct).length;
          return correct / blockTrials.length;
        },
        average_rt: () => {
          // Calculate average RT for this block
          const blockTrials = allTrialData.slice(-experimentConfig.blocks.trialsPerBlock);
          const totalRT = blockTrials.reduce((sum, t) => sum + (t.rt || 0), 0);
          return totalRT / blockTrials.length;
        },
        difficulty_level: () => difficultyManager.currentDifficultyLevel,
        difficulty_name: () =>
          experimentConfig.adaptation.levels[difficultyManager.currentDifficultyLevel]
            .name,
        adjustment_message: () => {
          const lastAdjustment =
            difficultyManager.adjustmentHistory[
              difficultyManager.adjustmentHistory.length - 1
            ];
          return lastAdjustment ? lastAdjustment.reason : '';
        },
      });
    }
  }

  // 7. Final debrief
  timeline.push({
    type: htmlKeyboardResponse,
    stimulus: () => {
      const summary = difficultyManager.getPerformanceSummary();
      return createDebriefTimeline(summary).stimulus();
    },
    on_finish: async function () {
      // Flush any remaining trial data to Firebase
      await finalizeTrialData();

      // Save final session data
      const summary = difficultyManager.getPerformanceSummary();
      const sessionData = {
        user_id: userId,
        totalTrials: summary.totalTrials,
        totalCorrect: summary.correctTrials,
        overallAccuracy: summary.accuracy,
        averageRT: summary.averageRT,
        finalDifficultyLevel: summary.currentLevel,
        totalAdjustments: summary.adjustments,
        completionTime: (Date.now() - experimentStartTime) / 1000 / 60,
        completed: true,
        timestamp: new Date().toISOString(),
      };

      await saveSessionData(userId, sessionData);
    },
  });

  // Run the experiment
  await jsPsych.run(timeline);
}

/**
 * Display completion screen with visualizations and export options
 */
function displayCompletionScreen() {
  const container = document.getElementById('jspsych-target');
  if (!container) return;

  container.innerHTML = `
    <div class="completion-container">
      <h1>Thank You for Completing the Study!</h1>
      <p>Your data has been saved successfully.</p>

      ${createVisualizationHTML()}

      <div class="export-section">
        <h3>Export Your Data</h3>
        <button id="export-csv-btn" class="btn btn-primary">Download Data (CSV)</button>
        <button id="export-json-btn" class="btn btn-secondary">Download Data (JSON)</button>
      </div>

      <div class="footer-info">
        <p>You may now close this window.</p>
        <p><small>Participant ID: <span id="final-participant-id"></span></small></p>
      </div>
    </div>
  `;

  // Display user ID
  const userId = localStorage.getItem('acct_user_id');
  document.getElementById('final-participant-id').textContent =
    userId || 'Unknown';

  // Get all data
  const allData = exportAllData();

  // Create visualizations
  if (allData.trials && allData.trials.length > 0) {
    // Extract performance history (exclude practice trials)
    const performanceHistory = allData.trials
      .filter((t) => t.trial_type !== 'practice')
      .map((t) => ({
        correct: t.correct,
        rt: t.rt,
        congruent: t.congruent,
      }));

    // Create charts
    try {
      createRTTimelineChart('rt-timeline-chart', performanceHistory);
      createAccuracyChart('accuracy-chart', performanceHistory);

      const difficultyHistory = allData.trials
        .filter((t) => t.trial_type !== 'practice' && t.task_type === 'stroop')
        .map((t, index) => ({
          newLevel: t.difficulty_level,
          newTime: t.stimulus_duration,
        }));

      if (difficultyHistory.length > 0) {
        createDifficultyChart('difficulty-chart', difficultyHistory);
      }

      createCongruencyComparisonChart('congruency-chart', allData.trials);
    } catch (error) {
      // Error creating charts
    }
  }

  // Export handlers
  document.getElementById('export-csv-btn').addEventListener('click', () => {
    exportExperimentData(allData, userId);
  });

  document.getElementById('export-json-btn').addEventListener('click', () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACCT_data_${userId}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });
}

// Start the experiment when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runExperiment);
} else {
  runExperiment();
}

// Export for potential external use
export { runExperiment };

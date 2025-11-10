// Progress Feedback Plugin for jsPsych
// Shows performance feedback and progress between blocks

import { ParameterType } from 'jspsych';

const info = {
  name: 'progress-feedback',
  parameters: {
    block_number: {
      type: ParameterType.INT,
      pretty_name: 'Block number',
      default: 1,
      description: 'Current block number',
    },
    total_blocks: {
      type: ParameterType.INT,
      pretty_name: 'Total blocks',
      default: 5,
      description: 'Total number of blocks',
    },
    block_accuracy: {
      type: ParameterType.FLOAT,
      pretty_name: 'Block accuracy',
      default: 0,
      description: 'Accuracy for the completed block (0-1)',
    },
    average_rt: {
      type: ParameterType.FLOAT,
      pretty_name: 'Average RT',
      default: 0,
      description: 'Average reaction time in milliseconds',
    },
    difficulty_level: {
      type: ParameterType.INT,
      pretty_name: 'Difficulty level',
      default: 2,
      description: 'Current difficulty level',
    },
    difficulty_name: {
      type: ParameterType.STRING,
      pretty_name: 'Difficulty name',
      default: 'Intermediate',
      description: 'Name of difficulty level',
    },
    adjustment_message: {
      type: ParameterType.STRING,
      pretty_name: 'Adjustment message',
      default: '',
      description: 'Message about difficulty adjustment',
    },
    continue_key: {
      type: ParameterType.KEY,
      pretty_name: 'Continue key',
      default: ' ',
      description: 'Key to continue to next block',
    },
    show_rest_message: {
      type: ParameterType.BOOL,
      pretty_name: 'Show rest message',
      default: true,
      description: 'Whether to show rest message',
    },
  },
};

class ProgressFeedbackPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    // Calculate progress percentage
    const progress = (trial.block_number / trial.total_blocks) * 100;
    const accuracyPercent = (trial.block_accuracy * 100).toFixed(1);
    const avgRT = trial.average_rt.toFixed(0);

    // Create motivational message based on performance
    let message = '';
    if (trial.block_accuracy >= 0.9) {
      message = "Excellent work! You're performing at a high level!";
    } else if (trial.block_accuracy >= 0.75) {
      message = "Great job! You're doing well!";
    } else if (trial.block_accuracy >= 0.6) {
      message = "Good effort! Keep focusing on accuracy.";
    } else {
      message = 'Take your time and focus on getting the correct responses.';
    }

    const levelLabels = ['Lvl 1', 'Lvl 2', 'Lvl 3', 'Lvl 4', 'Lvl 5'];
    const label = levelLabels[trial.difficulty_level - 1] || 'Lvl';

    // Create HTML
    const html = `
      <div class="feedback-container">
        <h2>Block ${trial.block_number} of ${trial.total_blocks} Complete!</h2>

        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${progress}%"></div>
        </div>
        <p class="progress-text">${progress.toFixed(0)}% Complete</p>

        <div class="performance-stats">
          <div class="stat-card">
            <div class="stat-value">${accuracyPercent}%</div>
            <div class="stat-label">Accuracy</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${avgRT}ms</div>
            <div class="stat-label">Avg Response Time</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${label}</div>
            <div class="stat-label">${trial.difficulty_name}</div>
          </div>
        </div>

        <div class="feedback-message">
          <p class="motivational-message">${message}</p>
          ${trial.adjustment_message ? `<p class="adjustment-message">${trial.adjustment_message}</p>` : ''}
        </div>

        ${
          trial.show_rest_message
            ? `
          <div class="rest-message">
            <p>Take a moment to rest if needed.</p>
          </div>
        `
            : ''
        }

        <div class="continue-prompt">
          <p>Press <kbd>SPACE</kbd> to continue to the next block</p>
        </div>
      </div>
    `;

    display_element.innerHTML = html;

    // Handle keyboard response
    const after_response = (info) => {
      // Data to save
      const trial_data = {
        block_number: trial.block_number,
        block_accuracy: trial.block_accuracy,
        average_rt: trial.average_rt,
        difficulty_level: trial.difficulty_level,
        rt: info.rt,
      };

      // Clear display
      display_element.innerHTML = '';

      // End trial
      this.jsPsych.finishTrial(trial_data);
    };

    // Listen for spacebar
    this.jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: after_response,
      valid_responses: [trial.continue_key],
      rt_method: 'performance',
      persist: false,
    });
  }
}

ProgressFeedbackPlugin.info = info;

export default ProgressFeedbackPlugin;

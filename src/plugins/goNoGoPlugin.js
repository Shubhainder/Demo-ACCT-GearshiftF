/**
 * Go/No-Go Task Plugin
 * Measures response inhibition and impulse control
 * Related to attention and cognitive control research
 */

import { ParameterType } from 'jspsych';

const info = {
  name: 'go-no-go',
  parameters: {
    stimulus: {
      type: ParameterType.STRING,
      default: 'X',
      description: 'The stimulus to display',
    },
    trial_type: {
      type: ParameterType.STRING,
      default: 'go',
      description: 'Trial type: "go" or "nogo"',
    },
    stimulus_duration: {
      type: ParameterType.INT,
      default: 500,
      description: 'Duration to show stimulus in ms',
    },
    trial_duration: {
      type: ParameterType.INT,
      default: 1500,
      description: 'Total trial duration in ms',
    },
    response_window: {
      type: ParameterType.INT,
      default: 1000,
      description: 'Time window for valid responses in ms',
    },
    show_feedback: {
      type: ParameterType.BOOL,
      default: false,
      description: 'Whether to show feedback',
    },
    feedback_duration: {
      type: ParameterType.INT,
      default: 500,
      description: 'Duration of feedback in ms',
    },
  },
};

class GoNoGoPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    // Setup variables
    let response = null;
    let rt = null;
    const startTime = performance.now();
    let responseRecorded = false;

    // Show stimulus
    this.showStimulus(display_element, trial);

    // Set up keyboard response
    const keyboardListener = this.jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: (info) => {
        if (!responseRecorded) {
          response = info.key;
          rt = info.rt;
          responseRecorded = true;
          this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
        }
      },
      valid_responses: [' '],
      rt_method: 'performance',
      persist: false,
      allow_held_key: false,
    });

    // Remove stimulus after duration
    this.jsPsych.pluginAPI.setTimeout(() => {
      display_element.innerHTML = '';
    }, trial.stimulus_duration);

    // End response window
    this.jsPsych.pluginAPI.setTimeout(() => {
      // Determine correctness
      const correct = this.isCorrect(trial.trial_type, response, rt, trial.response_window);

      if (trial.show_feedback) {
        this.showFeedback(display_element, correct, trial.trial_type);

        this.jsPsych.pluginAPI.setTimeout(() => {
          endTrial(correct);
        }, trial.feedback_duration);
      } else {
        endTrial(correct);
      }
    }, trial.response_window);

    const endTrial = (correct) => {
      // Cancel keyboard listener
      this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);

      // Clear display
      display_element.innerHTML = '';

      // Gather trial data
      const trial_data = {
        stimulus: trial.stimulus,
        trial_type: trial.trial_type,
        response: response,
        rt: rt,
        correct: correct,
        commission_error: trial.trial_type === 'nogo' && response !== null,
        omission_error: trial.trial_type === 'go' && response === null,
        stimulus_duration: trial.stimulus_duration,
      };

      // End trial
      this.jsPsych.finishTrial(trial_data);
    };
  }

  showStimulus(display_element, trial) {
    const color = trial.trial_type === 'go' ? '#16a34a' : '#dc2626';

    display_element.innerHTML = `
      <div class="gonogo-container">
        <div class="gonogo-stimulus" style="color: ${color}; font-size: 4rem; font-weight: 700;">
          ${trial.stimulus}
        </div>
        <div class="gonogo-instructions" style="margin-top: 2rem; color: #737373; font-size: 0.875rem;">
          <p>Press <kbd>SPACE</kbd> for green letters</p>
          <p>Do NOT press for red letters</p>
        </div>
      </div>
    `;
  }

  showFeedback(display_element, correct, trial_type) {
    let feedbackText = '';
    let feedbackClass = '';

    if (correct) {
      feedbackText = trial_type === 'go' ? 'Correct!' : 'Correct (no response)';
      feedbackClass = 'correct';
    } else {
      if (trial_type === 'go') {
        feedbackText = 'Too slow!';
      } else {
        feedbackText = 'Incorrect - should not respond!';
      }
      feedbackClass = 'incorrect';
    }

    display_element.innerHTML = `
      <div class="gonogo-container">
        <div class="feedback ${feedbackClass}">${feedbackText}</div>
      </div>
    `;
  }

  isCorrect(trial_type, response, rt, response_window) {
    if (trial_type === 'go') {
      // Should respond - correct if responded in time
      return response !== null && rt <= response_window;
    } else {
      // Should NOT respond - correct if no response
      return response === null;
    }
  }
}

GoNoGoPlugin.info = info;

export default GoNoGoPlugin;

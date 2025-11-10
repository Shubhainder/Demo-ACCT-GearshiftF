// Custom jsPsych plugin for the stroop task
// based on the standard html-keyboard-response but with adaptive timing

import { ParameterType } from 'jspsych';

const info = {
  name: 'adaptive-stroop',
  parameters: {
    stimulus_word: {
      type: ParameterType.STRING,
      pretty_name: 'Stimulus word',
      default: undefined,
    },
    stimulus_color: {
      type: ParameterType.STRING,
      pretty_name: 'Stimulus color',
      default: undefined,
    },
    correct_response: {
      type: ParameterType.KEY,
      default: undefined,
    },
    choices: {
      type: ParameterType.KEYS,
      default: ['r', 'b', 'g', 'y', 'p', 'o'], // might add more colors later
    },
    stimulus_duration: {
      type: ParameterType.INT,
      pretty_name: 'Stimulus duration',
      default: 2000,
      description: 'How long to show the stimulus in milliseconds',
    },
    trial_duration: {
      type: ParameterType.INT,
      pretty_name: 'Trial duration',
      default: 3000,
      description: 'Maximum trial duration in milliseconds',
    },
    show_fixation: {
      type: ParameterType.BOOL,
      pretty_name: 'Show fixation',
      default: true,
      description: 'Whether to show fixation cross before stimulus',
    },
    fixation_duration: {
      type: ParameterType.INT,
      pretty_name: 'Fixation duration',
      default: 500,
      description: 'How long to show fixation cross in milliseconds',
    },
    show_feedback: {
      type: ParameterType.BOOL,
      pretty_name: 'Show feedback',
      default: false,
      description: 'Whether to show feedback after response',
    },
    feedback_duration: {
      type: ParameterType.INT,
      pretty_name: 'Feedback duration',
      default: 500,
      description: 'How long to show feedback in milliseconds',
    },
    congruent: {
      type: ParameterType.BOOL,
      pretty_name: 'Congruent trial',
      default: false,
      description: 'Whether this is a congruent trial',
    },
    block: {
      type: ParameterType.INT,
      pretty_name: 'Block number',
      default: 1,
      description: 'Current block number',
    },
    difficulty_level: {
      type: ParameterType.INT,
      pretty_name: 'Difficulty level',
      default: 2,
      description: 'Current difficulty level',
    },
  },
};

class AdaptiveStroopPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    // Data to store
    const trial_data = {
      stimulus_word: trial.stimulus_word,
      stimulus_color: trial.stimulus_color,
      correct_response: trial.correct_response,
      congruent: trial.congruent,
      block: trial.block,
      difficulty_level: trial.difficulty_level,
      stimulus_duration: trial.stimulus_duration,
    };

    let response = {
      rt: null,
      key: null,
    };

    let start_time = null;
    let stimulus_shown = false;

    // Show fixation cross first
    if (trial.show_fixation) {
      display_element.innerHTML = `
        <div class="stroop-container">
          <div class="fixation-cross">+</div>
        </div>
      `;

      this.jsPsych.pluginAPI.setTimeout(() => {
        show_stimulus();
      }, trial.fixation_duration);
    } else {
      show_stimulus();
    }

    // Show the stimulus
    const show_stimulus = () => {
      display_element.innerHTML = `
        <div class="stroop-container">
          <div class="stroop-stimulus" style="color: ${trial.stimulus_color};">
            ${trial.stimulus_word}
          </div>
          <div class="key-reminder">
            <small>R=Red | B=Blue | G=Green | Y=Yellow | P=Purple | O=Orange</small>
          </div>
        </div>
      `;

      start_time = performance.now();
      stimulus_shown = true;

      // Hide stimulus after duration
      this.jsPsych.pluginAPI.setTimeout(() => {
        if (response.key === null) {
          display_element.innerHTML = `
            <div class="stroop-container">
              <div class="blank-screen"></div>
            </div>
          `;
        }
      }, trial.stimulus_duration);
    };

    // Handle keyboard response
    const after_response = (info) => {
      // Only record first response
      if (response.key !== null) {
        return;
      }

      response = info;

      // Determine if response was correct
      const correct = response.key === trial.correct_response;
      trial_data.response = response.key;
      trial_data.rt = response.rt;
      trial_data.correct = correct;

      if (trial.show_feedback) {
        show_feedback(correct);
      } else {
        end_trial();
      }
    };

    // Show feedback
    const show_feedback = (correct) => {
      display_element.innerHTML = `
        <div class="stroop-container">
          <div class="feedback ${correct ? 'correct' : 'incorrect'}">
            ${correct ? 'Correct!' : 'Incorrect'}
          </div>
        </div>
      `;

      this.jsPsych.pluginAPI.setTimeout(() => {
        end_trial();
      }, trial.feedback_duration);
    };

    // End trial
    const end_trial = () => {
      // Kill keyboard listener
      this.jsPsych.pluginAPI.cancelAllKeyboardResponses();

      // Clear any remaining timeouts
      this.jsPsych.pluginAPI.clearAllTimeouts();

      // Clear display
      display_element.innerHTML = '';

      // Move to next trial
      this.jsPsych.finishTrial(trial_data);
    };

    // Start keyboard listener
    this.jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: after_response,
      valid_responses: trial.choices,
      rt_method: 'performance',
      persist: false,
      allow_held_key: false,
    });

    // End trial if no response in time
    if (trial.trial_duration !== null) {
      this.jsPsych.pluginAPI.setTimeout(() => {
        if (response.key === null) {
          trial_data.response = null;
          trial_data.rt = null;
          trial_data.correct = false;
          end_trial();
        }
      }, trial.trial_duration);
    }
  }
}

AdaptiveStroopPlugin.info = info;

export default AdaptiveStroopPlugin;

/**
 * N-Back Task Plugin
 * Measures working memory and cognitive load
 * Related to adaptive intelligence research
 */

import { ParameterType } from 'jspsych';

const info = {
  name: 'n-back-task',
  parameters: {
    stimulus: {
      type: ParameterType.STRING,
      default: 'A',
      description: 'The letter to display',
    },
    n_level: {
      type: ParameterType.INT,
      default: 2,
      description: 'N-back level (1, 2, or 3)',
    },
    is_target: {
      type: ParameterType.BOOL,
      default: false,
      description: 'Whether this is a target trial (matches n trials back)',
    },
    stimulus_duration: {
      type: ParameterType.INT,
      default: 500,
      description: 'Duration to show stimulus in ms',
    },
    trial_duration: {
      type: ParameterType.INT,
      default: 2500,
      description: 'Total trial duration in ms',
    },
    fixation_duration: {
      type: ParameterType.INT,
      default: 500,
      description: 'Fixation cross duration in ms',
    },
    show_feedback: {
      type: ParameterType.BOOL,
      default: false,
      description: 'Whether to show feedback',
    },
  },
};

class NBackPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    // Setup variables
    let response = null;
    let rt = null;
    const startTime = performance.now();
    let feedbackShown = false;

    // Show fixation
    this.showFixation(display_element);

    // Show stimulus after fixation
    this.jsPsych.pluginAPI.setTimeout(() => {
      this.showStimulus(display_element, trial);

      // Set up keyboard response
      const keyboardListener = this.jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: (info) => {
          if (response === null) {
            response = info.key;
            rt = info.rt;
            handleResponse();
          }
        },
        valid_responses: ['f', 'j'],
        rt_method: 'performance',
        persist: false,
        allow_held_key: false,
      });

      // Auto-end trial after stimulus duration
      this.jsPsych.pluginAPI.setTimeout(() => {
        display_element.innerHTML = '';

        if (response === null) {
          rt = trial.trial_duration;
          handleResponse();
        }
      }, trial.stimulus_duration);
    }, trial.fixation_duration);

    const handleResponse = () => {
      // Determine if response was correct
      const correct = this.isCorrect(trial.is_target, response);

      if (trial.show_feedback && !feedbackShown) {
        feedbackShown = true;
        this.showFeedback(display_element, correct);

        this.jsPsych.pluginAPI.setTimeout(() => {
          endTrial(correct);
        }, 800);
      } else {
        endTrial(correct);
      }
    };

    const endTrial = (correct) => {
      // Clear display
      display_element.innerHTML = '';

      // Gather trial data
      const trial_data = {
        stimulus: trial.stimulus,
        n_level: trial.n_level,
        is_target: trial.is_target,
        response: response,
        correct: correct,
        rt: rt,
        stimulus_duration: trial.stimulus_duration,
      };

      // End trial
      this.jsPsych.finishTrial(trial_data);
    };
  }

  showFixation(display_element) {
    display_element.innerHTML = `
      <div class="nback-container">
        <div class="fixation-cross">+</div>
      </div>
    `;
  }

  showStimulus(display_element, trial) {
    display_element.innerHTML = `
      <div class="nback-container">
        <div class="nback-stimulus">${trial.stimulus}</div>
        <div class="nback-instructions">
          <p>Press <kbd>F</kbd> if this matches ${trial.n_level} trials back</p>
          <p>Press <kbd>J</kbd> if it does not match</p>
        </div>
      </div>
    `;
  }

  showFeedback(display_element, correct) {
    const feedbackClass = correct ? 'correct' : 'incorrect';
    const feedbackText = correct ? 'Correct!' : 'Incorrect';

    display_element.innerHTML = `
      <div class="nback-container">
        <div class="feedback ${feedbackClass}">${feedbackText}</div>
      </div>
    `;
  }

  isCorrect(is_target, response) {
    if (response === null) return false;

    // 'f' = target match, 'j' = no match
    if (is_target) {
      return response === 'f';
    } else {
      return response === 'j';
    }
  }
}

NBackPlugin.info = info;

export default NBackPlugin;

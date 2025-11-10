// Generate stroop stimuli
import { experimentConfig } from '../config/experiment.config.js';

// generate a single trial stimulus
export function generateStimulus(
  colors = experimentConfig.stimuli.colors,
  words = experimentConfig.stimuli.words,
  congruentProbability = 0.25
) {
  const word = words[Math.floor(Math.random() * words.length)];
  let color;

  const isCongruent = Math.random() < congruentProbability;

  if (isCongruent) {
    color = word.toLowerCase(); // word matches color
  } else {
    // pick a different color
    const incongruentColors = colors.filter((c) => c !== word.toLowerCase());
    color = incongruentColors[Math.floor(Math.random() * incongruentColors.length)];
  }

  const correctResponse = experimentConfig.keyMappings[color];

  return {
    word: word,
    color: color,
    congruent: isCongruent,
    correctResponse: correctResponse,
  };
}

// create a whole block of trials
export function generateStimulusBlock(numTrials, colors, words) {
  const stimuli = [];

  // make sure we have a good mix of congruent/incongruent
  // roughly 25% congruent, 75% incongruent
  const numCongruent = Math.floor(numTrials * 0.25);
  const numIncongruent = numTrials - numCongruent;

  // Generate congruent trials
  for (let i = 0; i < numCongruent; i++) {
    stimuli.push(generateStimulus(colors, words, 1.0));
  }

  // Generate incongruent trials
  for (let i = 0; i < numIncongruent; i++) {
    stimuli.push(generateStimulus(colors, words, 0.0));
  }

  // Shuffle the array
  return shuffleArray(stimuli);
}

/**
 * Generate practice trials
 * @param {number} numTrials - Number of practice trials
 * @returns {Array} Array of practice stimuli
 */
export function generatePracticeTrials(numTrials = 5) {
  // Use only basic colors for practice
  return generateStimulusBlock(
    numTrials,
    experimentConfig.stimuli.colors,
    experimentConfig.stimuli.words
  );
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create HTML string for stimulus display
 * @param {string} word - Word to display
 * @param {string} color - Color to display in
 * @returns {string} HTML string
 */
export function createStimulusHTML(word, color) {
  return `
    <div class="stroop-stimulus">
      <div class="stimulus-word" style="color: ${color}; font-size: 64px; font-weight: bold;">
        ${word}
      </div>
    </div>
  `;
}

/**
 * Create fixation cross HTML
 * @returns {string} HTML string
 */
export function createFixationHTML() {
  return `
    <div class="fixation">
      <div style="font-size: 48px; color: #333;">+</div>
    </div>
  `;
}

/**
 * Get valid response keys for current color set
 * @param {Array} colors - Current color set
 * @returns {Array} Array of valid keys
 */
export function getValidKeys(colors) {
  return colors.map((color) => experimentConfig.keyMappings[color]);
}

/**
 * Get color name from key press
 * @param {string} key - Key that was pressed
 * @returns {string|null} Color name or null if invalid
 */
export function getColorFromKey(key) {
  const entries = Object.entries(experimentConfig.keyMappings);
  const match = entries.find(([color, mappedKey]) => mappedKey === key);
  return match ? match[0] : null;
}

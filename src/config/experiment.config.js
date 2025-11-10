// experiment config - adjust these to change parameters
 

export const experimentConfig = {
  experimentName: 'Adaptive Cognitive Control Task',
  experimentVersion: '1.0.0',

  blocks: {
    total: 5,
    trialsPerBlock: 10, // tested with 10, seems good
    showProgressAfterBlock: true,
  },

  stimuli: {
    colors: ['red', 'blue', 'green', 'yellow'],
    words: ['RED', 'BLUE', 'GREEN', 'YELLOW'],

    // for harder levels we add purple and orange
    advancedColors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
    advancedWords: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'],
  },

  keyMappings: {
    red: 'r',
    blue: 'b',
    green: 'g',
    yellow: 'y',
    purple: 'p',
    orange: 'o',
  },

  timing: {
    fixation: 500,
    stimulusDefault: 2000,
    stimulusMin: 800, // don't go below this or it's too fast
    stimulusMax: 3500,
    feedback: 1000,
    interTrialInterval: 500,
  },

  adaptation: {
    windowSize: 5, // look at last 5 trials
    highAccuracyThreshold: 0.90, // 90% accuracy
    lowAccuracyThreshold: 0.60, // 60% accuracy

    // Difficulty adjustments
    stimulusTimeDecrease: 200, // ms to decrease on high accuracy
    stimulusTimeIncrease: 300, // ms to increase on low accuracy

    // Difficulty levels
    levels: {
      1: { name: 'Beginner', colors: 4, stimulusTime: 2500 },
      2: { name: 'Intermediate', colors: 4, stimulusTime: 2000 },
      3: { name: 'Advanced', colors: 4, stimulusTime: 1500 },
      4: { name: 'Expert', colors: 6, stimulusTime: 1200 },
      5: { name: 'Master', colors: 6, stimulusTime: 900 },
    },
  },

  // Data collection settings
  data: {
    saveToFirebase: true,
    saveLocally: true,
    anonymousAuth: true,
  },

  // UI text
  text: {
    welcome: 'Welcome to the Adaptive Cognitive Control Task',
    consent: `
      <h2>Informed Consent</h2>
      <p>This is a research study investigating cognitive control and adaptive learning.</p>
      <p><strong>What you'll do:</strong> You will see color words displayed in different colors.
      Your task is to press the key corresponding to the <em>color of the text</em>, not the word itself.</p>
      <p><strong>Time:</strong> Approximately 10-15 minutes</p>
      <p><strong>Privacy:</strong> All data is collected anonymously. No personal information is stored.</p>
      <p><strong>Voluntary:</strong> You may stop at any time.</p>
      <p>By clicking "I Consent", you agree to participate in this study.</p>
    `,
    instructions: `
      <h2>Instructions</h2>
      <p>In this task, you will see words displayed in different colors.</p>
      <p><strong>Your goal:</strong> Press the key that matches the <em>color</em> of the text, NOT the word.</p>

      <div style="margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 8px;">
        <p><strong>Key Mappings:</strong></p>
        <ul style="list-style: none; padding: 0;">
          <li><kbd>R</kbd> = Red</li>
          <li><kbd>B</kbd> = Blue</li>
          <li><kbd>G</kbd> = Green</li>
          <li><kbd>Y</kbd> = Yellow</li>
        </ul>
        <p style="margin-top: 15px;"><em>Advanced levels may include Purple (P) and Orange (O)</em></p>
      </div>

      <p><strong>Example:</strong> If you see <span style="color: blue;">RED</span>, press <kbd>B</kbd> (for blue).</p>
      <p><strong>Adaptive Difficulty:</strong> The task will adjust to your performance.
      Do your best to respond quickly and accurately!</p>
      <p>Press any key to begin the practice trials.</p>
    `,
  },
};

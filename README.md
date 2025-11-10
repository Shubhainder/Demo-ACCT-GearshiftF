# Adaptive Cognitive Control Task (ACCT)

[![CI/CD Pipeline](https://github.com/yourusername/Adaptive-Cognitive-Control-Task/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/yourusername/Adaptive-Cognitive-Control-Task/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready, browser-based cognitive research experiment that dynamically adapts difficulty based on participant performance. Built with **jsPsych 8**, **Firebase**, **Vite**, and **Chart.js**.

 

## 🧩 Overview

The Adaptive Cognitive Control Task (ACCT) is a sophisticated implementation of a **Stroop-like paradigm** that demonstrates:

- **Real-time adaptive difficulty adjustment** based on rolling accuracy
- **Firebase integration** for data storage and authentication
- **Production-ready architecture** with modular, testable code
- **Data visualization** with interactive charts
- **CI/CD pipeline** with automated deployment to GitHub Pages

Perfect for demonstrating modern web-based research methodologies, adaptive testing algorithms, and professional software development practices.

---

## ✨ Features

### Core Experiment
- 🎯 **Stroop Task**: Participants respond to text color (not word content)
- 📊 **Adaptive Difficulty**: Task adjusts based on participant performance
- 🔄 **Rolling Accuracy Window**: 5-trial window for smooth adaptation
- 📈 **5 Difficulty Levels**: From Beginner to Master
- ⏱️ **Dynamic Timing**: Stimulus duration adjusts from 900ms to 3500ms

### Technical Features
- 🔐 **Simple Authentication**: Secure login system  (Hard coded for demo)
- 💾 **Dual Storage**: Firebase Firestore with batched writes + localStorage
- 📊 **Real-time Charts**: Performance visualization with Chart.js
- 📥 **Data Export**: CSV and JSON download options
- 🎨 **Responsive Design**: Minimal white design, works on all devices
- ♿ **Accessible**: WCAG 2.1 compliant
- 🚀 **Optimized**: Batched Firebase writes, fast Vite builds

### Research Features
- 🔒 **Data Anonymization**: Pseudonymous participant IDs
- 💾 **Session Resume**: Continue interrupted sessions
- 📑 **Structured Data**: Research-ready data format
- 📊 **Performance Metrics**: RT, accuracy, congruency effects
- 🎯 **Counterbalancing**: Randomized stimulus presentation

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- (Optional) Firebase project for data storage

 

 
 

**Note**: The experiment works in offline mode without Firebase, using localStorage. Firebase writes are batched (every 10 trials or 30 seconds) for optimal performance.

---

## 📖 Usage

### Running the Experiment

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Format code
npm run format
```

### Deploying to GitHub Pages

The project includes automated deployment via GitHub Actions:

1. Push to `main` branch
2. GitHub Actions builds and deploys automatically
3. Access at `https://shubhainder.github.io/Demo-ACCT-GearshiftF/`

To enable GitHub Pages:
1. Go to repository **Settings** > **Pages**
2. Source: **GitHub Actions**
3. Add Firebase secrets to repository secrets 

---

## 🏗️ Architecture

```
adaptive-cog-task/
├── src/
│   ├── main.js                 # Main experiment orchestration
│   ├── config/
│   │   └── experiment.config.js  # Centralized configuration
│   ├── plugins/
│   │   ├── adaptiveStroopPlugin.js  # Custom Stroop plugin
│   │   └── feedbackPlugin.js        # Progress feedback plugin
│   ├── components/
│   │   ├── ConsentForm.js           # Consent & instructions
│   │   └── DataVisualization.js     # Chart.js visualizations
│   ├── firebase/
│   │   ├── config.js                # Firebase initialization
│   │   └── saveData.js              # Data storage logic
│   ├── utils/
│   │   ├── adaptiveLogic.js         # Difficulty algorithm
│   │   ├── csvExport.js             # CSV export utilities
│   │   └── stimulusGenerator.js     # Stimulus generation
│   └── styles/
│       └── experiment.css           # Production styles
├── index.html                       # Entry point
├── vite.config.js                   # Vite configuration
├── .github/workflows/ci.yml         # CI/CD pipeline
└── package.json
```

### Key Design Patterns

- **Separation of Concerns**: Modular architecture with clear responsibilities
- **Configuration-Driven**: Centralized config for easy customization
- **Plugin Architecture**: Custom jsPsych plugins for reusability
- **Progressive Enhancement**: Works offline, enhanced with Firebase
- **Error Resilience**: Graceful degradation and fallbacks

---

## 🧮 Adaptive Algorithm

The difficulty adaptation algorithm works as follows:

1. **Track Performance**: Maintain rolling window of last 5 trials
2. **Calculate Accuracy**: `accuracy = correct_trials / total_trials`
3. **Adjust Difficulty**:
   - **High Accuracy (≥90%)**: Decrease stimulus time by 200ms or increase level
   - **Low Accuracy (≤60%)**: Increase stimulus time by 300ms or decrease level
   - **Target Range (60-90%)**: No adjustment

### Difficulty Levels

| Level | Name         | Colors | Stimulus Time |
|-------|-------------|--------|---------------|
| 1     | Beginner    | 4      | 2500ms        |
| 2     | Intermediate| 4      | 2000ms        |
| 3     | Advanced    | 4      | 1500ms        |
| 4     | Expert      | 6      | 1200ms        |
| 5     | Master      | 6      | 900ms         |

 
---

## 📊 Data Structure

### Trial Data
```javascript
{
  participant_id: "abc123",
  block: 2,
  trial_index: 15,
  stimulus_word: "RED",
  stimulus_color: "blue",
  correct_response: "b",
  response: "b",
  correct: true,
  rt: 847,
  difficulty_level: 3,
  stimulus_duration: 1500,
  congruent: false,
  timestamp: "2024-01-15T10:30:45.123Z"
}
```

### Session Data
```javascript
{
  participant_id: "abc123",
  totalTrials: 50,
  totalCorrect: 42,
  overallAccuracy: 0.84,
  averageRT: 925,
  finalDifficultyLevel: 4,
  completionTime: 12.5,
  completed: true
}
```

---

## 🎨 Customization

### Modify Experiment Parameters

Edit `src/config/experiment.config.js`:

```javascript
export const experimentConfig = {
  blocks: {
    total: 5,              // Number of blocks
    trialsPerBlock: 10,    // Trials per block
  },
  adaptation: {
    windowSize: 5,         // Rolling window size
    highAccuracyThreshold: 0.90,
    lowAccuracyThreshold: 0.60,
  },
  // ... more settings
};
```

### Add Custom Stimuli

```javascript
stimuli: {
  colors: ['red', 'blue', 'green', 'yellow', 'purple'],
  words: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'],
}
```

### Customize Styling

Edit `src/styles/experiment.css` to change colors, fonts, and layout.

---

 

## 🧪 Testing

```bash
# Run linter
npm run lint

# Format code
npm run format

# Build test
npm run build
```

For participant testing:
1. Run `npm run dev`
2. Test on multiple browsers (Chrome, Firefox, Safari)
3. Test on mobile devices
4. Verify data export functionality

---

 

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **jsPsych**: Josh de Leeuw and contributors
- **Firebase**: Google Cloud Platform
- **Chart.js**: Chart.js contributors
- **Vite**: Evan You and Vite team

---

## 📧 Contact

For questions or support:
- Open an issue on GitHub
 

---

 

**Built with ❤️ for cognitive research and open science**

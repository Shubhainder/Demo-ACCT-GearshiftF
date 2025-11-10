// Adaptive difficulty manager
// Handles the logic for adjusting task difficulty based on performance

import { experimentConfig } from '../config/experiment.config.js';

export class AdaptiveDifficultyManager {
  constructor() {
    this.performanceHistory = [];
    this.currentDifficultyLevel = 2; // start at intermediate
    this.currentStimulusTime =
      experimentConfig.adaptation.levels[2].stimulusTime;
    this.currentColorSet = experimentConfig.stimuli.colors;
    this.adjustmentHistory = [];
  }

  recordTrial(trialData) {
    this.performanceHistory.push({
      correct: trialData.correct,
      rt: trialData.rt,
      timestamp: Date.now(),
    });

    // keep only the last N trials for rolling average
    const windowSize = experimentConfig.adaptation.windowSize;
    if (this.performanceHistory.length > windowSize) {
      this.performanceHistory.shift();
    }
  }

  // calculate rolling accuracy
  getRollingAccuracy() {
    if (this.performanceHistory.length === 0) return 0;

    let correctCount = 0;
    for (let i = 0; i < this.performanceHistory.length; i++) {
      if (this.performanceHistory[i].correct) {
        correctCount++;
      }
    }
    return correctCount / this.performanceHistory.length;
  }

  getAverageRT() {
    if (this.performanceHistory.length === 0) return 0;

    const totalRT = this.performanceHistory.reduce((sum, t) => sum + t.rt, 0);
    return totalRT / this.performanceHistory.length;
  }

  shouldAdjustDifficulty() {
    // need at least windowSize trials before adjusting
    return (
      this.performanceHistory.length >= experimentConfig.adaptation.windowSize
    );
  }

  // main difficulty adjustment logic
  adjustDifficulty() {
    if (!this.shouldAdjustDifficulty()) {
      return {
        adjusted: false,
        reason: 'need more data',
      };
    }

    const accuracy = this.getRollingAccuracy();
    const config = experimentConfig.adaptation;

    let adjustment = {
      adjusted: false,
      previousLevel: this.currentDifficultyLevel,
      newLevel: this.currentDifficultyLevel,
      previousTime: this.currentStimulusTime,
      newTime: this.currentStimulusTime,
      accuracy: accuracy,
      reason: '',
    };

    // if they're doing really well, make it harder
    if (accuracy >= config.highAccuracyThreshold) {
      const newTime = Math.max(
        this.currentStimulusTime - config.stimulusTimeDecrease,
        experimentConfig.timing.stimulusMin
      );

      if (newTime < this.currentStimulusTime) {
        this.currentStimulusTime = newTime;
        adjustment.adjusted = true;
        adjustment.newTime = newTime;
        adjustment.reason = 'High accuracy - decreased stimulus time';
      }

      // Also try to increase difficulty level
      const newLevel = this.calculateDifficultyLevel();
      if (newLevel > this.currentDifficultyLevel) {
        this.currentDifficultyLevel = newLevel;
        this.updateColorSet();
        adjustment.newLevel = newLevel;
        adjustment.reason += ' and increased difficulty level';
      }
    }
    // Low accuracy - decrease difficulty
    else if (accuracy <= config.lowAccuracyThreshold) {
      const newTime = Math.min(
        this.currentStimulusTime + config.stimulusTimeIncrease,
        experimentConfig.timing.stimulusMax
      );

      if (newTime > this.currentStimulusTime) {
        this.currentStimulusTime = newTime;
        adjustment.adjusted = true;
        adjustment.newTime = newTime;
        adjustment.reason = 'Low accuracy - increased stimulus time';
      }

      // Also try to decrease difficulty level
      const newLevel = Math.max(1, this.currentDifficultyLevel - 1);
      if (newLevel < this.currentDifficultyLevel) {
        this.currentDifficultyLevel = newLevel;
        this.updateColorSet();
        adjustment.newLevel = newLevel;
        adjustment.reason += ' and decreased difficulty level';
      }
    } else {
      adjustment.reason = 'Performance within target range - no adjustment';
    }

    // Record this adjustment
    if (adjustment.adjusted) {
      this.adjustmentHistory.push({
        ...adjustment,
        timestamp: Date.now(),
      });
    }

    return adjustment;
  }

  /**
   * Calculate difficulty level based on stimulus time
   * @returns {number} Difficulty level (1-5)
   */
  calculateDifficultyLevel() {
    const levels = experimentConfig.adaptation.levels;
    const time = this.currentStimulusTime;

    // Map time to difficulty levels
    if (time >= 2200) return 1;
    if (time >= 1800) return 2;
    if (time >= 1300) return 3;
    if (time >= 1000) return 4;
    return 5;
  }

  /**
   * Update color set based on difficulty level
   */
  updateColorSet() {
    const level = experimentConfig.adaptation.levels[this.currentDifficultyLevel];

    if (level.colors >= 6) {
      this.currentColorSet = experimentConfig.stimuli.advancedColors;
    } else {
      this.currentColorSet = experimentConfig.stimuli.colors;
    }
  }

  /**
   * Get current difficulty parameters
   * @returns {Object}
   */
  getCurrentDifficulty() {
    return {
      level: this.currentDifficultyLevel,
      levelName: experimentConfig.adaptation.levels[this.currentDifficultyLevel]
        .name,
      stimulusTime: this.currentStimulusTime,
      colorSet: this.currentColorSet,
      rollingAccuracy: this.getRollingAccuracy(),
      averageRT: this.getAverageRT(),
      trialsInWindow: this.performanceHistory.length,
    };
  }

  /**
   * Get performance summary
   * @returns {Object}
   */
  getPerformanceSummary() {
    const allCorrect = this.performanceHistory.filter((t) => t.correct).length;
    const totalTrials = this.performanceHistory.length;

    return {
      totalTrials: totalTrials,
      correctTrials: allCorrect,
      accuracy: totalTrials > 0 ? allCorrect / totalTrials : 0,
      averageRT: this.getAverageRT(),
      currentLevel: this.currentDifficultyLevel,
      adjustments: this.adjustmentHistory.length,
    };
  }

  /**
   * Reset the manager (for new sessions)
   */
  reset() {
    this.performanceHistory = [];
    this.currentDifficultyLevel = 2;
    this.currentStimulusTime =
      experimentConfig.adaptation.levels[2].stimulusTime;
    this.currentColorSet = experimentConfig.stimuli.colors;
    this.adjustmentHistory = [];
  }

  /**
   * Export full state for analysis
   * @returns {Object}
   */
  exportState() {
    return {
      performanceHistory: this.performanceHistory,
      adjustmentHistory: this.adjustmentHistory,
      currentDifficulty: this.getCurrentDifficulty(),
      summary: this.getPerformanceSummary(),
    };
  }
}

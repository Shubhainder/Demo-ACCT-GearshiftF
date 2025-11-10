/**
 * Data Visualization Component
 * Creates charts and visualizations of performance data using Chart.js
 */

import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Create timeline showing RT trend over trials
 * @param {string} canvasId - ID of canvas element
 * @param {Array} performanceHistory - Array of trial data
 */
export function createRTTimelineChart(canvasId, performanceHistory) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    return null;
  }

  const ctx = canvas.getContext('2d');

  // Prepare data
  const trials = performanceHistory.map((_, index) => index + 1);
  const rts = performanceHistory.map((trial) => trial.rt);

  // Calculate moving average for smoother trend line
  const windowSize = 5;
  const movingAverage = calculateMovingAverage(rts, windowSize);

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trials,
      datasets: [
        {
          label: 'Reaction Time',
          data: rts,
          borderColor: 'rgba(75, 192, 192, 0.5)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          borderWidth: 1,
          pointRadius: 2,
          tension: 0,
        },
        {
          label: 'Moving Average (5 trials)',
          data: movingAverage,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: 'Reaction Time Over Trials',
          font: {
            size: 16,
          },
        },
        legend: {
          display: true,
          position: 'top',
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Trial Number',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Reaction Time (ms)',
          },
          beginAtZero: false,
        },
      },
    },
  });

  return chart;
}

/**
 * Create accuracy over time chart
 * @param {string} canvasId - ID of canvas element
 * @param {Array} performanceHistory - Array of trial data
 */
export function createAccuracyChart(canvasId, performanceHistory) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    return null;
  }

  const ctx = canvas.getContext('2d');

  // Calculate rolling accuracy
  const windowSize = 5;
  const rollingAccuracy = calculateRollingAccuracy(performanceHistory, windowSize);
  const trials = rollingAccuracy.map((_, index) => index + 1);

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trials,
      datasets: [
        {
          label: 'Rolling Accuracy (5 trials)',
          data: rollingAccuracy,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: 'Accuracy Over Time',
          font: {
            size: 16,
          },
        },
        legend: {
          display: true,
          position: 'top',
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Trial Number',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Accuracy',
          },
          min: 0,
          max: 1,
          ticks: {
            callback: function (value) {
              return (value * 100).toFixed(0) + '%';
            },
          },
        },
      },
    },
  });

  return chart;
}

/**
 * Create difficulty level progression chart
 * @param {string} canvasId - ID of canvas element
 * @param {Array} adjustmentHistory - Array of difficulty adjustments
 */
export function createDifficultyChart(canvasId, adjustmentHistory) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    return null;
  }

  const ctx = canvas.getContext('2d');

  // Prepare data
  const timestamps = adjustmentHistory.map((adj, index) => index + 1);
  const levels = adjustmentHistory.map((adj) => adj.newLevel);
  const times = adjustmentHistory.map((adj) => adj.newTime);

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [
        {
          label: 'Difficulty Level',
          data: levels,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderWidth: 2,
          yAxisID: 'y',
          stepped: true,
        },
        {
          label: 'Stimulus Duration (ms)',
          data: times,
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        title: {
          display: true,
          text: 'Difficulty Adaptation Over Time',
          font: {
            size: 16,
          },
        },
        legend: {
          display: true,
          position: 'top',
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Adjustment Number',
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Difficulty Level',
          },
          min: 1,
          max: 5,
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Stimulus Duration (ms)',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  });

  return chart;
}

/**
 * Create performance comparison chart (congruent vs incongruent)
 * @param {string} canvasId - ID of canvas element
 * @param {Array} trials - Array of all trial data
 */
export function createCongruencyComparisonChart(canvasId, trials) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    return null;
  }

  const ctx = canvas.getContext('2d');

  // Separate congruent and incongruent trials
  const congruentTrials = trials.filter((t) => t.congruent);
  const incongruentTrials = trials.filter((t) => !t.congruent);

  // Calculate statistics
  const congruentAccuracy =
    congruentTrials.filter((t) => t.correct).length / congruentTrials.length;
  const incongruentAccuracy =
    incongruentTrials.filter((t) => t.correct).length / incongruentTrials.length;

  const congruentAvgRT =
    congruentTrials.reduce((sum, t) => sum + t.rt, 0) / congruentTrials.length;
  const incongruentAvgRT =
    incongruentTrials.reduce((sum, t) => sum + t.rt, 0) /
    incongruentTrials.length;

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Accuracy', 'Avg RT (ms)'],
      datasets: [
        {
          label: 'Congruent Trials',
          data: [congruentAccuracy * 100, congruentAvgRT],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Incongruent Trials',
          data: [incongruentAccuracy * 100, incongruentAvgRT],
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: 'Congruent vs Incongruent Performance',
          font: {
            size: 16,
          },
        },
        legend: {
          display: true,
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Value',
          },
        },
      },
    },
  });

  return chart;
}

/**
 * Calculate moving average
 * @param {Array} data - Array of numbers
 * @param {number} windowSize - Size of moving window
 * @returns {Array} Moving average array
 */
function calculateMovingAverage(data, windowSize) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(avg);
  }
  return result;
}

/**
 * Calculate rolling accuracy
 * @param {Array} performanceHistory - Array of trial objects
 * @param {number} windowSize - Size of rolling window
 * @returns {Array} Rolling accuracy array
 */
function calculateRollingAccuracy(performanceHistory, windowSize) {
  const result = [];
  for (let i = 0; i < performanceHistory.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = performanceHistory.slice(start, i + 1);
    const correct = window.filter((t) => t.correct).length;
    result.push(correct / window.length);
  }
  return result;
}

/**
 * Create visualization container HTML
 * @returns {string} HTML string
 */
export function createVisualizationHTML() {
  return `
    <div class="visualization-container">
      <h2>Performance Visualizations</h2>

      <div class="chart-grid">
        <div class="chart-item">
          <canvas id="rt-timeline-chart"></canvas>
        </div>
        <div class="chart-item">
          <canvas id="accuracy-chart"></canvas>
        </div>
        <div class="chart-item">
          <canvas id="difficulty-chart"></canvas>
        </div>
        <div class="chart-item">
          <canvas id="congruency-chart"></canvas>
        </div>
      </div>

      <div class="chart-controls">
        <button id="export-charts-btn" class="btn btn-secondary">Export Charts as Images</button>
      </div>
    </div>
  `;
}

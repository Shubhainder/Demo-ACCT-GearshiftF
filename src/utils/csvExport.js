/**
 * CSV Export Utilities
 * Functions to export experiment data as downloadable CSV files
 */

/**
 * Convert data array to CSV format
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column names to include (optional)
 * @returns {string} CSV string
 */
export function convertToCSV(data, columns = null) {
  if (!data || data.length === 0) {
    return '';
  }

  // Get column headers
  const headers = columns || Object.keys(data[0]);

  // Create CSV header row
  const csvHeaders = headers.join(',');

  // Create CSV data rows
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        let value = row[header];

        // Handle different data types
        if (value === null || value === undefined) {
          return '';
        }

        // Convert objects/arrays to JSON strings
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }

        // Escape quotes and wrap in quotes if contains comma or quote
        value = String(value);
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }

        return value;
      })
      .join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Download data as CSV file
 * @param {string} csvContent - CSV string
 * @param {string} filename - Filename for download
 */
export function downloadCSV(csvContent, filename = 'data.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    // Create download link
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}

/**
 * Format trial data for CSV export
 * @param {Array} trials - Array of trial objects
 * @returns {Array} Formatted trial data
 */
export function formatTrialDataForExport(trials) {
  return trials.map((trial, index) => ({
    trial_number: index + 1,
    participant_id: trial.participant_id || '',
    block: trial.block || '',
    stimulus_word: trial.stimulus_word || '',
    stimulus_color: trial.stimulus_color || '',
    correct_response: trial.correct_response || '',
    participant_response: trial.response || '',
    correct: trial.correct ? 1 : 0,
    reaction_time_ms: trial.rt || '',
    difficulty_level: trial.difficulty_level || '',
    stimulus_duration_ms: trial.stimulus_duration || '',
    timestamp: trial.timestamp || trial.localTimestamp || '',
    congruent: trial.congruent ? 1 : 0,
  }));
}

/**
 * Export experiment data to CSV
 * @param {Object} experimentData - Full experiment data object
 * @param {string} participantId - Participant ID for filename
 */
export function exportExperimentData(experimentData, participantId) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  // Export trial data
  if (experimentData.trials && experimentData.trials.length > 0) {
    const formattedTrials = formatTrialDataForExport(experimentData.trials);
    const trialCSV = convertToCSV(formattedTrials);
    downloadCSV(trialCSV, `ACCT_trials_${participantId}_${timestamp}.csv`);
  }

  // Export summary data
  if (experimentData.session) {
    const summaryData = [
      {
        participant_id: participantId,
        total_trials: experimentData.session.totalTrials || 0,
        total_correct: experimentData.session.totalCorrect || 0,
        overall_accuracy: experimentData.session.overallAccuracy || 0,
        average_rt_ms: experimentData.session.averageRT || 0,
        final_difficulty_level: experimentData.session.finalDifficultyLevel || 0,
        total_adjustments: experimentData.session.totalAdjustments || 0,
        completion_time_minutes: experimentData.session.completionTime || 0,
        completed: experimentData.session.completed ? 1 : 0,
        timestamp: experimentData.exportedAt || new Date().toISOString(),
      },
    ];
    const summaryCSV = convertToCSV(summaryData);
    downloadCSV(summaryCSV, `ACCT_summary_${participantId}_${timestamp}.csv`);
  }
}

/**
 * Export performance history (for visualization)
 * @param {Array} performanceHistory
 * @param {string} participantId
 */
export function exportPerformanceHistory(performanceHistory, participantId) {
  if (!performanceHistory || performanceHistory.length === 0) {
    return;
  }

  const formatted = performanceHistory.map((item, index) => ({
    trial_index: index + 1,
    correct: item.correct ? 1 : 0,
    reaction_time_ms: item.rt,
    timestamp: item.timestamp,
  }));

  const csv = convertToCSV(formatted);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  downloadCSV(csv, `ACCT_performance_${participantId}_${timestamp}.csv`);
}

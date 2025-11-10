/**
 * Data Storage Module
 * Handles saving experiment data to Firebase and local storage
 */

import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseEnabled, auth } from './config.js';

// Trial buffer for batched Firebase writes
let trialBuffer = [];
let batchTimeout = null;
const BATCH_SIZE = 5; // Write to Firebase every 5 trials (reduced for testing)
const BATCH_DELAY = 15000; // Or every 15 seconds, whichever comes first (reduced for testing)

// Save trial data with batching optimization
export async function saveTrialData(userId, trialData) {
  saveToLocalStorage(`trials_${userId}`, trialData);

  if (!isFirebaseEnabled) {
    return;
  }

  trialBuffer.push({ userId, trialData });

  if (trialBuffer.length >= BATCH_SIZE) {
    await flushTrialBuffer();
  } else {
    if (batchTimeout) {
      clearTimeout(batchTimeout);
    }
    batchTimeout = setTimeout(flushTrialBuffer, BATCH_DELAY);
  }
}

// Flush trial buffer to Firebase using batch writes
async function flushTrialBuffer() {
  if (trialBuffer.length === 0) {
    return;
  }

  if (!isFirebaseEnabled) {
    return;
  }

  if (!auth || !auth.currentUser) {
    return;
  }

  const batch = writeBatch(db);
  const toWrite = [...trialBuffer];
  trialBuffer = [];

  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }

  const writeStartTime = Date.now();

  try {
    const userIds = new Set(toWrite.map(({ userId }) => userId));

    userIds.forEach((userId) => {
      const userDocRef = doc(db, 'users', userId);
      batch.set(userDocRef, {
        userId: userId,
        lastTrialUpdate: serverTimestamp(),
      }, { merge: true });
    });

    toWrite.forEach(({ userId, trialData }) => {
      const trialsRef = collection(db, 'users', userId, 'trials');
      const newDocRef = doc(trialsRef);
      batch.set(newDocRef, {
        ...trialData,
        timestamp: serverTimestamp(),
      });
    });

    // Add timeout to prevent indefinite hanging
    const commitPromise = batch.commit();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firebase write timeout after 30 seconds')), 30000)
    );

    await Promise.race([commitPromise, timeoutPromise]);
  } catch (error) {
    trialBuffer = [...toWrite, ...trialBuffer];
  }
}

// Force flush remaining trials (call at end of experiment)
export async function finalizeTrialData() {
  await flushTrialBuffer();
}

// Save session summary data
export async function saveSessionData(userId, sessionData) {
  saveToLocalStorage(`session_${userId}`, sessionData);

  if (!isFirebaseEnabled) {
    return;
  }

  if (!auth || !auth.currentUser) {
    return;
  }

  try {
    const sessionRef = doc(db, 'users', userId);
    await setDoc(
      sessionRef,
      {
        ...sessionData,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    // Error saving session
  }
}

/**
 * Update session progress (for resume capability)
 * @param {string} participantId
 * @param {Object} progressData
 */
export async function updateSessionProgress(participantId, progressData) {
  // Save to local storage
  const currentProgress = getFromLocalStorage('progress') || {};
  saveToLocalStorage('progress', { ...currentProgress, ...progressData });

  if (!isFirebaseEnabled) {
    return;
  }

  try {
    const sessionRef = doc(db, 'participants', participantId);
    await updateDoc(sessionRef, {
      progress: progressData,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    // Error updating progress
  }
}

/**
 * Get session progress (for resume)
 * @param {string} participantId
 * @returns {Promise<Object|null>}
 */
export async function getSessionProgress(participantId) {
  // Try local storage first
  const localProgress = getFromLocalStorage('progress');
  if (localProgress && localProgress.participantId === participantId) {
    return localProgress;
  }

  if (!isFirebaseEnabled) {
    return null;
  }

  try {
    const sessionRef = doc(db, 'participants', participantId);
    const sessionDoc = await getDoc(sessionRef);

    if (sessionDoc.exists()) {
      return sessionDoc.data().progress || null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Save data to local storage
 * @param {string} key
 * @param {Object} data
 */
function saveToLocalStorage(key, data) {
  try {
    const storageKey = `acct_${key}`;
    let existing = JSON.parse(localStorage.getItem(storageKey) || '[]');

    if (!Array.isArray(existing)) {
      existing = [existing];
    }

    existing.push({
      ...data,
      localTimestamp: new Date().toISOString(),
    });

    localStorage.setItem(storageKey, JSON.stringify(existing));
  } catch (error) {
    // Error saving to local storage
  }
}

/**
 * Get data from local storage
 * @param {string} key
 * @returns {any}
 */
export function getFromLocalStorage(key) {
  try {
    const storageKey = `acct_${key}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Clear all experiment data from local storage
 */
export function clearLocalData() {
  try {
    const keys = ['trials', 'session', 'progress'];
    keys.forEach((key) => {
      localStorage.removeItem(`acct_${key}`);
    });
  } catch (error) {
    // Error clearing local data
  }
}

// Export all data for current user
export function exportAllData() {
  const userId = localStorage.getItem('acct_user_id');
  if (!userId) {
    return {
      trials: [],
      session: {},
      exportedAt: new Date().toISOString(),
    };
  }

  return {
    trials: getFromLocalStorage(`trials_${userId}`) || [],
    session: getFromLocalStorage(`session_${userId}`) || {},
    exportedAt: new Date().toISOString(),
  };
}

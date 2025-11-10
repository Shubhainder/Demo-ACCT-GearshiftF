# Test Firebase Write in Production

## Quick Test - Copy and Run in Browser Console

Open your **production site** (GitHub Pages), open DevTools console, and run this:

```javascript
// Test 1: Check authentication
console.log('Auth current user:', auth?.currentUser?.uid);

// Test 2: Try a simple write
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/config.js';

const testWrite = async () => {
  console.log('Starting test write...');
  const startTime = Date.now();

  try {
    const testRef = doc(db, 'test', 'write_test_' + Date.now());
    await setDoc(testRef, {
      test: true,
      timestamp: serverTimestamp(),
      message: 'Test write from production'
    });

    const endTime = Date.now();
    console.log('TEST WRITE SUCCESS! Took', endTime - startTime, 'ms');
  } catch (error) {
    const endTime = Date.now();
    console.error('TEST WRITE FAILED after', endTime - startTime, 'ms');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
};

testWrite();
```

## What to Look For:

### If it succeeds quickly (< 2 seconds):
- Writes are working
- Problem is specific to batch writes or user documents
- Check Firestore console to see if test document was created

### If it hangs for 30+ seconds then times out:
- Network issue OR
- Security rules are blocking writes OR
- Firestore database doesn't exist / wrong region

### If it fails immediately with error:
- Check the error code:
  - `permission-denied` = Security rules issue
  - `unauthenticated` = Auth not working despite what we think
  - `not-found` = Database doesn't exist

## After Test, Check Firebase Console

1. Go to Firebase Console → Firestore Database
2. Look for a collection called `test`
3. Check if document `write_test_[timestamp]` exists
4. If YES: Writes work, problem is elsewhere
5. If NO: Write failed, check error in console

## Alternative: Check Current Firestore Rules

Firebase Console → Firestore Database → Rules tab

**Current rules should be:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Try changing to (TEMPORARILY for testing):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Click "Publish" and test again.

If it works with `if true` but not with `if request.auth != null`, then auth object isn't being passed correctly with writes.

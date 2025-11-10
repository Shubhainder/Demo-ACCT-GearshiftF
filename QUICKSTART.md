# Quick Start & Troubleshooting

## ✅ You're on the main branch now!

Your changes are all here. The app is ready to run.

## 🚀 How to run:

```bash
# Make sure you're on main branch
git branch

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

Then open **http://localhost:3000** in your browser.

## 🐛 If you see blank screen:

### 1. Hard Refresh (Most Common Fix)
- **Chrome/Edge**: Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Firefox**: Press `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
- **Safari**: Press `Cmd + Option + R`

### 2. Clear Browser Cache
- Open DevTools (F12)
- Right-click the reload button
- Select "Empty Cache and Hard Reload"

### 3. Check Console for Errors
- Open DevTools (F12)
- Go to Console tab
- Look for red error messages
- Share them if you see any

### 4. Verify Build Works
```bash
npm run build
# Should say "✓ built in X.XXs" with no errors
```

### 5. Test the built version
```bash
npm run preview
# Open the URL it gives you (usually http://localhost:4173)
```

## 📊 What You Should See:

1. **Loading screen** (white background, black text, minimal)
2. **Welcome screen** with "Adaptive Cognitive Control Task" title
3. **Consent form** with two buttons
4. **Instructions** explaining the Stroop task
5. **Practice trials** (5 trials with feedback)
6. **Main experiment** (5 blocks of 10 trials each)
7. **Results screen** with charts and export buttons

## 🎨 Design Check:

- ✅ White background
- ✅ Black text
- ✅ Black buttons with white text  
- ✅ No gradients anywhere
- ✅ Clean, minimal aesthetic

## 🔧 Build Commands:

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Check code
npm run format       # Format code
```

## 📝 Notes:

- The app works WITHOUT Firebase (uses localStorage)
- The app works WITHOUT GitHub Actions (that's just for deployment)
- Everything runs client-side in the browser
- No backend needed for local development

## 🆘 Still Having Issues?

Check:
1. Node.js version: `node --version` (should be 18+)
2. npm version: `npm --version` (should be 8+)
3. Port 3000 available: `lsof -i :3000` (should be empty or show vite)

Kill existing server: `pkill -f vite`

Then try `npm run dev` again.

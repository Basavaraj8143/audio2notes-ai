# Audio2Notes Mobile App

A React Native (Expo) mobile client for the Audio2Notes AI backend. Mirrors the full web workflow: **Upload → Transcript Review → Note Generation → History → Q&A → Export**.

## 📱 Screens

| Screen | Description |
|---|---|
| **Upload** | Pick an audio file, run the transcription pipeline with step-by-step progress |
| **Transcript Review** | Review ASR output chunks before committing to note generation |
| **Notes** | View structured notes (sections, key points, definitions) + in-app Q&A chat |
| **History** | Browse past sessions, tap to reload notes |
| **Settings** | Configure backend API URL for local / physical device testing |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- **Expo Go** app on your phone (or Android Studio / Xcode for emulators)
- The Audio2Notes backend running locally

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Start the Backend

From the backend directory (to avoid module import issues):

```bash
# Windows
cd backend
..\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

# Mac / Linux
cd backend
../venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

> ⚠️ Use `--host 0.0.0.0` so the server is reachable from other devices on your network.
> ⚠️ Keep this terminal open - the backend must remain running while using the mobile app.

### 3. Configure API URL

**Android Emulator** (AVD): The app auto-configures to `http://10.0.2.2:8000`.

**iOS Simulator**: The app auto-configures to `http://localhost:8000`.

**Physical Device**: You must set your computer's LAN IP:
1. Find your IP: run `ipconfig` (Windows) or `ifconfig | grep inet` (Mac/Linux)
2. Open the app → tap **⚙ Settings** → enter `http://YOUR_LAN_IP:8000`
3. Make sure your phone and computer are on the **same Wi-Fi network**

### 4. Start the App

Open a new terminal and navigate to the mobile directory:

```bash
cd mobile
npm start
```

This opens the Expo Dev Server. You'll see a QR code and menu options. Then:
- **Android Emulator**: Press `a` (requires Android Studio AVD running)
- **iOS Simulator**: Press `i` (requires Xcode and iOS Simulator running)
- **Web Browser**: Press `w` (for web testing)
- **Physical Device**: Scan the QR code with the Expo Go app (from App Store/Play Store)

> 💡 Keep both terminals open - one for backend, one for Expo dev server.

## 🏗️ Project Structure

```
mobile/
├── App.tsx                      # Root entry (re-exports app/App.tsx)
├── index.ts                     # Expo registerRootComponent
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
├── app/
│   └── App.tsx                  # Navigation orchestrator (state-based)
└── src/
    ├── components/
    │   ├── Theme.ts             # Design tokens (colors, spacing, radius)
    │   ├── Card.tsx             # Reusable card surface
    │   ├── CustomButton.tsx     # Primary / secondary / link button
    │   ├── Header.tsx           # App header with back + settings
    │   └── LoadingSpinner.tsx   # Activity indicator wrapper
    ├── screens/
    │   ├── UploadScreen.tsx     # File pick + pipeline progress
    │   ├── TranscriptReviewScreen.tsx
    │   ├── NotesScreen.tsx      # Notes tabs + embedded Q&A chat
    │   ├── HistoryScreen.tsx    # Session list
    │   └── SettingsScreen.tsx   # API URL configuration
    ├── services/
    │   ├── apiClient.ts         # Base fetch wrapper + URL config
    │   └── notesService.ts      # Domain-specific API calls
    └── types/
        └── index.ts             # TypeScript interfaces
```

## 🔌 Backend API Contract

All calls go through the FastAPI backend at `http://<host>:8000`:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/audio/upload` | Upload audio → returns session + transcript |
| `POST` | `/api/v1/audio/process` | Approve transcript → generate notes |
| `GET`  | `/api/v1/notes/history` | List past sessions |
| `GET`  | `/api/v1/notes/{id}` | Fetch session notes |
| `POST` | `/api/v1/qa/ask` | Ask a grounded question |
| `GET`  | `/api/v1/export/{id}/{format}` | Download PDF/DOCX/TXT |

## 🏃 Development Tips

- **Hot Reload**: Edit any `.tsx` file — the app reloads automatically in Expo Go.
- **Logs**: Open terminal where `npm start` runs; `console.log` output appears there.
- **Network errors**: If you see "Network request failed", the API URL is likely wrong. Open Settings and update it.
- **Large files**: Transcription can take 30–120 seconds depending on audio length and server hardware.

## 🔧 Troubleshooting

### Missing expo-asset package
If you see an error like `The required package expo-asset cannot be found`:
```bash
cd mobile
npm install expo-asset
```

### Backend module import error
If you see `ModuleNotFoundError: No module named 'api'` when starting the backend:
- Make sure you're running the backend command from the `backend/` directory, not the project root
- Use the commands specified in step 2 above

### Expo version warnings
You may see version compatibility warnings when starting Expo. These are usually non-critical, but you can update packages if needed:
```bash
cd mobile
npm install expo@latest expo-sharing@latest react-native@latest
```

### Backend not reachable from device
- Ensure backend is running with `--host 0.0.0.0`
- For physical devices, verify your computer's LAN IP in Settings
- Make sure device and computer are on the same Wi-Fi network
- Check that firewall isn't blocking port 8000

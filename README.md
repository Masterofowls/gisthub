# GistHub 🐙

A full-featured Android GitHub Gist Manager built with **Expo React Native** and **Material Design 3**.

## Features

- 🔐 **GitHub Auth** — Device Flow OAuth or Personal Access Token
- 📝 **Create/Edit/Delete Gists** — Multiple files per gist, public or secret
- ⭐ **Starred Gists** — Browse and manage starred gists
- 🎨 **Syntax Highlighting** — 25+ languages powered by highlight.js
- 📁 **Import / Export** — Import from JSON or files, export all gists
- 📋 **Copy / Paste** — One-tap code copy, import files directly
- 💾 **Offline Cache** — TTL-based caching with AsyncStorage
- 🌓 **Light / Dark Theme** — Follows system preference, MD3 colors
- 🔀 **Fork Gists** — Fork any public gist
- 🔗 **Share Gists** — Share URLs or export files

## Screenshots

_(Add screenshots after first build)_

## Setup

### 1. Prerequisites

- Node.js 20+
- Android Studio / Android SDK (for local builds)
- GitHub account

### 2. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/gisthub.git
cd gisthub
npm install
```

### 3. (Optional) GitHub OAuth App

For **Device Flow** sign-in (recommended UX):

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - Application name: `GistHub`
   - Homepage URL: `https://github.com/YOUR_USERNAME/gisthub`
   - Authorization callback URL: `gisthub://auth`
   - ✅ Enable Device Flow
4. Copy the **Client ID**
5. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   # Edit .env and set EXPO_PUBLIC_GITHUB_CLIENT_ID=your_client_id
   ```

Without this, the app uses PAT (Personal Access Token) mode only.

### 4. Run locally

```bash
npx expo start
# Then press 'a' for Android emulator
```

### 5. Build APK locally

```bash
npm run prebuild    # generates android/ folder
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## GitHub Actions CI/CD

Every push to `main` automatically:
1. Builds an Android APK
2. Uploads it as a workflow artifact
3. Creates a GitHub Release with the APK attached

### Setup secrets and variables

```bash
# Required: Set GitHub OAuth Client ID as a repository variable
gh variable set GITHUB_CLIENT_ID --body "YOUR_CLIENT_ID"

# Optional: Release signing (for signed APK)
# First generate a keystore:
keytool -genkey -v -keystore release.keystore -alias gisthub -keyalg RSA -keysize 2048 -validity 10000
# Then encode and set as secret:
base64 release.keystore | gh secret set KEYSTORE_BASE64
gh secret set KEYSTORE_PASSWORD --body "your_store_password"
gh secret set KEY_ALIAS --body "gisthub"
gh secret set KEY_PASSWORD --body "your_key_password"
```

### Trigger a build manually

```bash
gh workflow run build-android.yml
gh run watch  # monitor progress
```

### Download the latest APK

```bash
# List recent releases
gh release list

# Download the APK from latest release
gh release download --pattern "*.apk"
```

## Project Structure

```
gisthub/
├── app/
│   ├── _layout.tsx          # Root layout + providers
│   ├── index.tsx            # Auth redirect
│   ├── auth.tsx             # Login screen
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Bottom tabs
│   │   ├── index.tsx        # My Gists list
│   │   ├── starred.tsx      # Starred gists
│   │   └── settings.tsx     # Settings + profile
│   └── gist/
│       ├── [id].tsx         # Gist detail + code viewer
│       ├── create.tsx       # Create gist modal
│       └── edit/[id].tsx    # Edit gist modal
├── components/
│   ├── gist-card.tsx        # List item card
│   ├── code-viewer.tsx      # Syntax-highlighted code display
│   ├── file-editor.tsx      # Multi-file editor
│   └── empty-state.tsx      # Empty / error states
├── context/
│   └── auth-context.tsx     # Auth state provider
├── hooks/
│   ├── use-gists.ts         # Gist list + CRUD
│   └── use-gist.ts          # Single gist detail
├── services/
│   ├── auth-service.ts      # Device Flow + PAT auth
│   ├── github-api.ts        # GitHub REST API
│   └── cache-service.ts     # AsyncStorage TTL cache
├── utils/
│   ├── syntax-highlighter.tsx  # Custom hljs-based highlighter
│   └── export-utils.ts      # Import/export logic
├── constants/
│   ├── theme.ts             # MD3 light/dark themes
│   └── languages.ts         # Language detection + colors
└── .github/workflows/
    └── build-android.yml    # CI/CD pipeline
```

## Tech Stack

| Library | Purpose |
|---|---|
| Expo SDK 53 | Build toolchain |
| Expo Router v5 | File-based navigation |
| React Native Paper v5 | Material Design 3 UI |
| highlight.js | Syntax highlighting |
| AsyncStorage | Offline caching |
| expo-secure-store | Secure token storage |
| expo-clipboard | Copy code |
| expo-document-picker | Import files |
| expo-sharing | Export gists |
| axios | HTTP client |
| date-fns | Date formatting |

## License

MIT © 2025

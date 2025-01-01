# Maidaan Capacitor Complete - Project Setup and Development Guide

This guide outlines the steps, commands, and prerequisites required to set up, develop, and build the Maidaan Capacitor project.

## Repository

**GitHub Repository:** [MaidaanCapacitorComplete](https://github.com/nepal143/MaidaanCapacitorComplete.git)

---

## Prerequisites

1. **Node.js and npm**
   - Ensure Node.js (v16 or later) and npm are installed.
   - Download from [Node.js Official Site](https://nodejs.org/).

2. **Capacitor CLI**
   - Install Capacitor CLI globally:
     ```bash
     npm install -g @capacitor/cli
     ```

3. **Android Studio**
   - Download and install Android Studio from [Android Developer](https://developer.android.com/studio).
   - Ensure the following components are installed:
     - Android SDK
     - Android SDK Platform-Tools
     - Android Emulator

4. **Service Account Key**
   - Place the `serviceaccount.json` file containing your Firebase service account key in the root directory.
   1) one on ./serviceaccount.json
   2) one in src/components/Games/SpellBee/serviceaccount.json

5. **.env File**
   - Set up a `.env` file in the root directory for environment-specific variables (e.g., Firebase configuration). 

---

## Project Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/nepal143/MaidaanCapacitorComplete.git
   cd MaidaanCapacitorComplete
   ```

2. **Install Dependencies**
   Normal installation encountered issues, so always use the following command to install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Update or Add Packages**
   The following packages were updated or added during development:

   - `@babel/plugin-proposal-private-property-in-object`: Fixes build errors related to Babel presets.
   - `@capacitor/android`: For Android platform integration.
   - `@capacitor/core`: Core Capacitor functionalities.
   - `@capacitor/cli`: CLI tools for Capacitor.

   These packages are essential for the project to function correctly.

4. **Build the Web App**
   Create a production build of the web application:
   ```bash
   npm run build
   ```

5. **Sync Capacitor**
   Sync the Capacitor project to ensure the latest web assets and plugins are added to the native platforms:
   ```bash
   npm run build
   npx cap sync
   ```
   If you encounter issues, ensure all required dependencies are installed.

6. **Open Android Studio**
   Open the Android project in Android Studio:
   ```bash
   npx cap open android
   ```

---

## Android Development

1. **Sync Changes**
   After making changes to the web app, build and sync again:
   ```bash
   npm run build
   npx cap sync
   ```

2. **Build APK**
   - Open the project in Android Studio.
   - Build the APK:
     1. Go to **Build > Build Bundle(s)/APK(s) > Build APK(s)**.
     2. Locate the APK in the `android/app/build/outputs/apk/debug` directory.

3. **Debugging**
   - Use an emulator or a physical device to test the app.
   - Ensure USB debugging is enabled on the physical device.

---

## Notes

- **Legacy Peer Dependencies:** Due to dependency conflicts, always use `--legacy-peer-deps` when installing packages or updating dependencies.
- **Environment Variables:** Ensure the `.env` file is correctly set up with the required keys.
- **Service Account File:** `serviceaccount.json` must contain valid Firebase credentials for the project to function.

---

## Commands Summary

### General Commands

- Install dependencies:
  ```bash
  npm install --legacy-peer-deps
  ```
- Run development server:
  ```bash
  npm start
  ```
- Build for production:
  ```bash
  npm run build
  ```
- Sync Capacitor:
  ```bash
  npm run build
  npx cap sync
  ```
- Open Android Studio:
  ```bash
  npx cap open android
  ```

### Android-Specific Commands

- Build APK:
  ```
  Use Android Studio to build APK.
  ```

---

Follow this guide to ensure the proper setup and smooth development of the Maidaan Capacitor project. If you encounter any issues, refer to the Capacitor or npm documentation.


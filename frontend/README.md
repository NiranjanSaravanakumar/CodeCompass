# Frontend

This folder contains the React + Vite client for CodeCompass.

## What it does

The frontend provides the user interface for:

- pasting a GitHub repository URL
- sending the URL to the backend for analysis
- rendering the generated onboarding document
- chatting with the AI assistant about the repository

## Main files

- [src/App.jsx](src/App.jsx) contains the main app logic and UI
- [src/App.css](src/App.css) contains the styling for the experience
- [src/main.jsx](src/main.jsx) mounts the app into the DOM

## Development

From this folder, run:

```bash
npm install
npm run dev
```

The app expects the backend to be running at the URL defined by `VITE_API_BASE` or `http://localhost:8000` by default.

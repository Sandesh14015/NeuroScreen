# NeuroScreen

NeuroScreen is a browser-based cognitive screening research prototype. It guides a user through a set of short activities, calculates screening scores, keeps a local session history, and generates a summary report that can be exported as a PDF.

> NeuroScreen is not a clinical diagnostic tool. Its results are intended for research and demonstration purposes only and should not replace evaluation by a qualified healthcare professional.

## Features

- Guided screening flow with profile setup and language selection
- English, Hindi, and Odia interface support
- Speech and voice-pattern assessment using browser microphone APIs
- Clock-drawing activity
- Trail-making activity
- Digit-span memory activity
- Typing-pattern activity
- Combined risk scoring with baseline comparison across saved sessions
- Dashboard for viewing screening history
- PDF report export
- Browser-local session storage

## Tech Stack

- React
- Vite
- Recharts
- jsPDF and jsPDF AutoTable
- Lucide React

## Getting Started

### Prerequisites

Install a current version of Node.js and npm.

### Installation

```bash
npm install
```

### Run the Development Server

```bash
npm run dev
```

The Vite development server runs on `http://localhost:3000` by default.

### Build for Production

```bash
npm run build
```

The production bundle is generated in `dist/`.

### Preview the Production Build

```bash
npm run preview
```

## Testing

Run the scoring-engine tests with:

```bash
npm test
```

## Browser Requirements

Use a modern browser with JavaScript enabled. The speech activity requires microphone permission and relies on browser media APIs. Speech-recognition availability may vary by browser.

## Privacy

Screening sessions are stored locally in the browser using `localStorage`. The app does not require a backend service. Clearing the browser's site data removes saved session history.

## Project Structure

```text
src/
  components/       Screening tasks, dashboard, and report UI
  i18n/             Interface translations
  utils/            Scoring and speech-analysis logic
test/               Scoring-engine tests
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

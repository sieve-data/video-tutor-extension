# VideoTutor

VideoTutor is a Chrome browser extension that transforms educational YouTube videos into interactive learning experiences. Get AI-powered explanations, summaries, and instant answers to your questions while watching any video.

## Features

- **🎓 Learn Tab**: AI-generated summaries and key insights from video content
- **📝 Transcript Tab**: Full video transcript with timestamps and search functionality
- **💬 Chat Tab**: Interactive AI chat to ask questions about the video content
- **🌙 Dark Mode**: Seamless integration with YouTube's theme
- **⚡ Real-time**: Processes content as you watch

## Installation (Development)

Since VideoTutor is pending approval on the Chrome Web Store, you can install it manually:

### Prerequisites

- Node.js (v16 or higher)
- pnpm package manager
- Chromium based browser (e.g. Chrome, Arc, Brave, etc...)

### Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd breakdown
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Build the extension:**

   ```bash
   pnpm run build
   ```

4. **Load into Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" by toggling the switch in the top right corner
   - Click "Load unpacked" and select the `build/chrome-mv3-dev` directory from the project

### API Key Setup

VideoTutor requires API keys to function:

1. **OpenAI API Key** - for AI chat and explanations
2. **Sieve API Key** - for video transcript processing

The extension will prompt you to enter these keys on first use.

## Running the YouTube Chat Extension Locally

Follow these steps to install and run the extension in your browser for local development:

1. **Clone the repository**

   ```bash
   git clone https://github.com/PaoloJN/youtube-ai-extension.git
   cd youtube-chat-extension
   ```

2. **Get your OpenAI and Sieve API keys**

   - [OpenAI API](https://openai.com/api/)
   - [Sieve API](https://www.sievedata.com/)

   When you visit YouTube after loading the extension, you'll be prompted to enter these keys.

3. **Install dependencies & build**

   ```bash
   pnpm install
   pnpm run build
   ```

4. **Load the extension into Chrome**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** by toggling the switch in the top-right corner
   - Click **Load unpacked** and select the `build/chrome-mv3-dev` directory generated in the previous step

5. Open YouTube and start chatting with videos! 🎉

## Usage

1. Navigate to any YouTube video
2. The VideoTutor panel will appear in the video's secondary panel
3. Choose your learning mode:
   - **Learn**: Get AI explanations of the current video segment
   - **Transcript**: Read the full transcript with timestamps
   - **Chat**: Ask questions about the video content

## Development

```bash

# Build for production
pnpm run build

# Package for distribution
pnpm run package
```

## Tech Stack

- **Framework**: Plasmo (browser extension framework)
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit + Jotai
- **AI**: OpenAI API

## Support

For issues or questions, please open an issue on this repository.

---

Based on [Youtube AI](https://github.com/PaoloJN/youtube-ai-extension)

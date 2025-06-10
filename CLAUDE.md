# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Breakdown is a Chrome browser extension that provides real-time concept explanations and AI chat functionality for educational YouTube videos. It injects into YouTube watch pages and offers transcript processing, AI-powered chat, and video summaries.

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (hot reload enabled)
pnpm dev

# Build the extension
pnpm build

# Package the extension for distribution
pnpm package
```

## Architecture Overview

### Technology Stack
- **Framework**: Plasmo (browser extension framework)
- **UI**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom animations
- **State Management**: Redux Toolkit with Redux Persist + Jotai for atomic state
- **AI Integration**: OpenAI API for chat and summaries

### Key Architectural Decisions

1. **Content Script Architecture**: The extension uses Plasmo's content script system to inject into YouTube pages. Main entry point is `src/contents/plasmo-main-ui.tsx` which mounts into YouTube's secondary panel.

2. **State Management Pattern**: 
   - Redux for global application state with persistence
   - Jotai atoms for component-level state and OpenAI configuration
   - Context providers for feature-specific state (chat, transcript, summary)

3. **Component Organization**:
   - `/components/ui/` - Reusable UI primitives (shadcn/ui based)
   - `/components/` - Feature-specific components (chat, transcript, summary)
   - `/contexts/` - React contexts for feature state management
   - `/lib/` - Utilities, hooks, and atoms

4. **Background Service Workers**: Located in `src/background/ports/` for handling chat and completion requests between content script and background processes.

5. **Styling Strategy**: Uses Tailwind CSS with shadow DOM for style isolation from YouTube's styles.

## Important Notes

- The extension requires OpenAI API key configuration (stored in extension storage)
- All YouTube DOM interactions happen through the content script
- The extension tracks video state and fetches transcript data in real-time
- Uses AGPL-3.0 license requiring source code disclosure
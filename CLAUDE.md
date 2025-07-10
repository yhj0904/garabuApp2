# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator  
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint code quality checks

### Build Commands
- `eas build --platform ios` - Build for iOS (production)
- `eas build --platform android` - Build for Android (production)
- `eas build --profile development` - Build development version

## Project Architecture

This is a React Native app built with Expo, featuring a personal finance tracking application (Garabu).

### Core Stack
- **React Native 0.79.5** with New Architecture enabled
- **Expo SDK 53** with Expo Router for file-based routing
- **TypeScript** with strict mode enabled
- **Zustand** for state management (primary) + React Context (legacy auth)

### Key Architecture Patterns

#### Routing Structure
Uses Expo Router with grouped routes:
- `app/(auth)/` - Authentication screens (login, signup)
- `app/(tabs)/` - Main tab navigation (home, explore, asset, more)
- `app/(modals)/` - Modal screens (settings, profile, etc.)

#### State Management
Dual approach currently in use:
- **Zustand stores** in `stores/` (modern, preferred approach)
  - `authStore.ts` - Authentication state with Expo SecureStore integration
  - `bookStore.ts`, `categoryStore.ts` - Financial data management
- **React Context** in `contexts/` (legacy, being phased out)
  - `AuthContext.tsx` - Legacy auth context

#### Service Layer
- `services/api.ts` - Main API service with JWT authentication
- `services/oauthService.ts` - OAuth2 integration (Google/Naver)
- `services/notificationService.ts` - Push notifications
- `services/syncService.ts` - Data synchronization

#### Configuration Management
- `config/config.ts` - Environment-specific configuration
- Development uses local network IP (192.168.10.54:8080) for backend
- Production configured for api.garabu.com

### Backend Integration

The app integrates with a Spring Boot backend server:
- Backend location: `/Users/yoonhyungjoo/Documents/garabu/garabuserver`
- Start backend: `./gradlew bootRun` in server directory
- API uses JWT authentication with token refresh mechanism
- Supports both email/password and OAuth2 authentication

### Key Features Architecture

#### Authentication Flow
1. Uses `authStore.ts` (Zustand) for state management
2. Tokens stored securely via Expo SecureStore
3. Automatic token refresh on 401 responses
4. OAuth2 flow via `oauthService.ts`

#### Financial Data Management
- Book-based architecture (shared family budgets)
- Ledger entries with categories and payment methods
- Member invitation system with role-based permissions
- Real-time synchronization capabilities

### UI/UX Patterns
- Themed components using React Navigation theming
- Haptic feedback integration
- Dark/light mode support
- Platform-specific adaptations (iOS/Android/Web)

## Development Notes

### Environment Setup
- Backend server must be running for full functionality
- Use actual device IP in config for mobile testing
- OAuth credentials required for social login features

### Testing
- No specific test commands found - check if test framework needs setup
- Manual testing via Expo Go app recommended for development

### Code Style
- ESLint with Expo configuration
- TypeScript strict mode enabled
- Path aliases configured (`@/*` points to root)

### Deployment
- Uses EAS Build for production builds
- Configured for both iOS App Store and Google Play deployment
- Bundle identifier: `com.popori99.garabuapp2`
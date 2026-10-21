# Project Guidance

## User Preferences

- Modern, clean, user-friendly design
- Responsive layouts usable on desktop, tablet and mobile
- Software-only experience with no extra hardware
- Prefer free or locally available services
- Never present simulated functionality as real AI processing
- Accessibility first: high contrast, adjustable text size, keyboard operability, visible focus

## Accepted Requirements

- Central AI core asks about disability type and routes to four modules
- Visually Impaired module with image upload, image understanding, text-to-speech, voice commands, and spoken descriptions
- Deaf and Mute module with chatbot, speech-to-text, text-to-speech, visual communication, and sign-language learning
- Cognitive Assistance module with text simplification, step-by-step instructions, summarization, and interactive AI assistant
- Mobility Assistance module with voice-controlled navigation, hands-free interaction, accessible controls, and everyday digital task help
- Shared AI assistant, accessible dashboard, speech input and output, clear navigation, high-contrast mode, adjustable text sizes, keyboard accessibility, responsive layouts
- Functional module navigation, working buttons, forms, chatbot interactions, image processing workflows, and proper error handling
- Modular, maintainable components
- README and environment configuration examples
- Clearly identify features requiring external API keys or additional models

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Backend commands from src/backend/: mops install, mops check --fix, mops build; bindings from the repo root: pnpm bindgen.
- Record-update `with` must be parenthesized as `{ init(...) with f = v }`; a bare `}) with` parses as an identifier and fails with M0274.
- OQL auto-derivation has no Blob _toRow; use Entity.manual + .payload for records containing Blob.
- caffeineai-inference-client 0.1.1 message models: #user uses OneOf2.JSON.init({content=#string;role=#user}); assistant uses OneOf3 with content=?#string; system uses OneOf with role=#system_.
- The platform inference client serves text models only, so image description must work from filename plus caller-supplied context text rather than image pixels.
- Frontend backend enums are values: import AssistanceModule/TextSize/ChatRole from @/backend and use enum members, never string casts.
- biome useSemanticElements rejects role=dialog/radiogroup divs; use native <dialog> and <fieldset>/<legend>.
- Mounting SignInButton and AccessibilityControls in Layout.tsx restored both the persistence and accessibility criteria; the backend guards were already correct.
- Every animate-spin in this app pairs with motion-reduce:animate-none; check the guard on each spinner, not just one.
- TanStack Router typed navigate({to}) requires literal route paths; narrow a metadata route field to a union of the registered paths instead of casting.
- Upload path: ExternalBlob.fromBytes(bytes, type, name).withUploadProgress(cb) then actor.uploadImage(name, blob); ExternalBlob is a value export from @/backend.
- biome useFocusableInteractive rejects a bare role=progressbar div; use the shadcn Progress primitive instead.
- useSpeechRecognition's onFinal callback only fires on recognition end; for an editable composer read speech.transcript and insert it on demand, and put voice-command routing in onFinal.

// Azure Speech SDK related code and constants have been removed.

let internalIsRecognizing: boolean = false;
let internalIsSynthesizing: boolean = false;
let synthesisOnEndCb: (() => void) | null = null;

// Stub implementation for speech recognition initialization
export const initializeSpeechRecognition = (
  onStart: () => void,
  onResult: (transcript: string) => void,
  onError: (error: string) => void,
  onEnd: () => void
): boolean => {
  console.warn("Speech recognition feature is under development. Initialize called.");
  // Simulate successful initialization for UI consistency if needed by App.tsx
  // onError("Speech recognition is not implemented yet."); // Optionally inform
  return false; // Indicate that recognizer is not actually set up
};

// Stub implementation for starting speech recognition
export const startRecognition = (): Promise<void> => {
  console.warn("Speech recognition feature is under development. Start called.");
  if (internalIsRecognizing) {
    return Promise.resolve();
  }
  // internalIsRecognizing = true; // If you want to simulate the state for UI
  return Promise.resolve();
  // return Promise.reject(new Error("Speech recognition not implemented."));
};

// Stub implementation for stopping speech recognition
export const stopRecognition = (): Promise<void> => {
  console.warn("Speech recognition feature is under development. Stop called.");
  internalIsRecognizing = false;
  return Promise.resolve();
};

// Stub implementation for text-to-speech
export const speakText = (text: string, onEndCallback?: () => void): Promise<void> => {
  console.warn(`Speech synthesis feature is under development. Would speak: "${text}"`);
  internalIsSynthesizing = true; // Simulate synthesis start
  synthesisOnEndCb = onEndCallback || null;
  
  // Simulate speech finishing after a short delay
  setTimeout(() => {
    internalIsSynthesizing = false;
    if (synthesisOnEndCb) {
      synthesisOnEndCb();
      synthesisOnEndCb = null;
    }
  }, 500); // Short delay to simulate speech

  return Promise.resolve();
  // return Promise.reject(new Error("Speech synthesis not implemented."));
};

// Stub implementation for checking if speech is active
export const isSpeaking = (): boolean => {
  return internalIsSynthesizing;
};

// Stub implementation for cancelling speech
export const cancelSpeech = () => {
  console.warn("Speech synthesis feature is under development. Cancel called.");
  if (internalIsSynthesizing) {
    internalIsSynthesizing = false;
    if (synthesisOnEndCb) {
      synthesisOnEndCb(); // Call the stored onEnd callback
      synthesisOnEndCb = null;
    }
  }
};
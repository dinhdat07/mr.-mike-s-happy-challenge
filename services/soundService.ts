
import { SoundFile, SoundBank } from '../types';
import { CONFIG } from '../constants';


let audioContext: AudioContext | null = null;
const soundBuffers: { [key: string]: AudioBuffer } = {};
const activeSources: { [key: string]: AudioBufferSourceNode[] } = {};


const getAudioContext = (): AudioContext | null => {
  if (typeof window !== 'undefined' && !audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Preload a single sound. In a real app, you might want to manage loading state.
const loadSound = async (key: string, soundFile: SoundFile): Promise<void> => {
  const context = getAudioContext();
  if (!context || !soundFile || !soundFile.url || soundBuffers[key]) return;

  // For this example, we assume sound files are small and don't implement full loading UI
  // In a real app, you'd fetch from a URL. Here, we'll simulate or error.
  // Since we don't have actual files, this function will effectively be a no-op for now
  // or you'd use a library that handles sound sprites or generates simple tones.
  // For now, let's console log that it would load.
  // console.log(`Attempting to "load" sound: ${key} from ${soundFile.url}`);
  
  // Placeholder: If you had actual sound files, the fetch and decodeAudioData would go here.
  // try {
  //   const response = await fetch(soundFile.url);
  //   const arrayBuffer = await response.arrayBuffer();
  //   const audioBuffer = await context.decodeAudioData(arrayBuffer);
  //   soundBuffers[key] = audioBuffer;
  // } catch (error) {
  //   console.error(`Error loading sound ${key}:`, error);
  // }
};

// Preload all sounds defined in CONFIG.SOUND_EFFECTS
export const preloadSounds = async (): Promise<void> => {
  const soundsToLoad: Promise<void>[] = [];
  for (const key in CONFIG.SOUND_EFFECTS) {
    const soundFile = CONFIG.SOUND_EFFECTS[key as keyof SoundBank];
    if (soundFile) {
      soundsToLoad.push(loadSound(key, soundFile));
    }
  }
  await Promise.all(soundsToLoad);
};

// Call preloadSounds on script load (or in App.tsx useEffect once)
// preloadSounds(); // This would ideally be called once during app initialization.

export const playSound = (soundFile?: SoundFile, soundKey?: string): void => {
  const context = getAudioContext();
  if (!context || !soundFile) return;

  // For this demo, as we can't load actual files, we'll use the oscillator fallback
  // to at least make *some* sound.
  
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  let frequency = 440; // A4
  let duration = 0.2;
  let type: OscillatorType = 'sine';

  if (soundKey === 'correct') {
    frequency = 660; type = 'triangle'; duration = 0.3;
  } else if (soundKey === 'incorrect') {
    frequency = 220; type = 'sawtooth'; duration = 0.4;
  } else if (soundKey === 'buttonClick') {
    frequency = 880; type = 'square'; duration = 0.1;
  } else if (soundKey === 'streak') {
    frequency = 1000; type = 'sine'; duration = 0.5;
  } else if (soundKey === 'gameOver') {
    frequency = 150; type = 'sine'; duration = 0.8;
  }

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gainNode.gain.setValueAtTime(soundFile.volume ?? 0.3, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + duration);

  // Actual buffer playing logic (if sounds were loaded):
  // const bufferToPlay = soundKey ? soundBuffers[soundKey] : null;
  // if (bufferToPlay) {
  //   const source = context.createBufferSource();
  //   source.buffer = bufferToPlay;
  //   const gainNode = context.createGain();
  //   gainNode.gain.value = soundFile.volume ?? 0.5;
  //   source.connect(gainNode);
  //   gainNode.connect(context.destination);
  //   source.start(0);

  //   if (soundKey) {
  //       if (!activeSources[soundKey]) activeSources[soundKey] = [];
  //       activeSources[soundKey].push(source);
  //       source.onended = () => {
  //           activeSources[soundKey] = activeSources[soundKey].filter(s => s !== source);
  //       };
  //   }
  // } else {
  //   console.warn(`Sound buffer for ${soundKey || soundFile.url} not found or sound disabled. Using fallback tone.`);
  //   // Fallback tone generation as above
  // }
};

export const stopSound = (soundKey: string) => {
    if (activeSources[soundKey]) {
        activeSources[soundKey].forEach(source => {
            try { source.stop(); } catch (e) {/* ignore if already stopped */}
        });
        activeSources[soundKey] = [];
    }
};
    
declare global {
  interface SpeechRecognition {
    start: () => void;
    stop: () => void;
    onresult: any;
    onerror: any;
  }
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export {};

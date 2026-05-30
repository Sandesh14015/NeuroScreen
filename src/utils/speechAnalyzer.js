/**
 * NeuroScreen — Speech Analyzer
 * Uses Web Audio API for acoustic feature extraction
 * and Web Speech API for speech-to-text transcription
 */

/**
 * Creates an audio recorder and analyzer
 * @returns {Object} Analyzer instance with start/stop/getMetrics methods
 */
export function createSpeechAnalyzer() {
  let audioContext = null;
  let analyser = null;
  let mediaStream = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let recognition = null;
  let isRecording = false;

  // Metrics trackers
  let transcript = '';
  let wordTimestamps = [];
  let silenceSegments = [];
  let totalSpeechDuration = 0;
  let totalSilenceDuration = 0;
  let startTime = 0;
  let lastSpeechTime = 0;
  let isSpeaking = false;
  let silenceThreshold = 0.02;
  let silenceStartTime = 0;
  let animationFrameId = null;

  // Waveform data for visualization
  let waveformData = new Uint8Array(0);

  async function start(lang = 'en-IN') {
    try {
      // Request microphone
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Setup Web Audio API
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      // Setup MediaRecorder for playback
      mediaRecorder = new MediaRecorder(mediaStream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      mediaRecorder.start();

      // Setup Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        // Map language codes
        const langMap = {
          en: 'en-IN',
          hi: 'hi-IN',
          or: 'or-IN',
        };
        recognition.lang = langMap[lang] || lang;

        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript + ' ';
              // Track word timestamp
              const words = result[0].transcript.trim().split(/\s+/);
              words.forEach((word) => {
                wordTimestamps.push({
                  word,
                  time: Date.now() - startTime,
                });
              });
            } else {
              interimTranscript += result[0].transcript;
            }
          }

          if (finalTranscript) {
            transcript += finalTranscript;
          }
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          // Restart on recoverable errors
          if (event.error === 'no-speech' || event.error === 'aborted') {
            if (isRecording) {
              try { recognition.start(); } catch (e) { /* ignore */ }
            }
          }
        };

        recognition.onend = () => {
          // Auto-restart if still recording
          if (isRecording) {
            try { recognition.start(); } catch (e) { /* ignore */ }
          }
        };

        recognition.start();
      }

      // Start metrics tracking
      isRecording = true;
      startTime = Date.now();
      lastSpeechTime = startTime;
      silenceStartTime = startTime;
      isSpeaking = false;

      // Begin audio analysis loop
      analyzeAudio();

      return true;
    } catch (error) {
      console.error('Failed to start speech analyzer:', error);
      return false;
    }
  }

  function analyzeAudio() {
    if (!isRecording || !analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);
    waveformData = dataArray;

    // Calculate RMS volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / bufferLength);

    const now = Date.now();

    if (rms > silenceThreshold) {
      // Speech detected
      if (!isSpeaking) {
        // Transition: silence -> speech
        const silenceDuration = now - silenceStartTime;
        if (silenceDuration > 300) {
          silenceSegments.push(silenceDuration);
          totalSilenceDuration += silenceDuration;
        }
        isSpeaking = true;
      }
      lastSpeechTime = now;
    } else {
      // Silence detected
      if (isSpeaking && (now - lastSpeechTime > 300)) {
        // Transition: speech -> silence
        isSpeaking = false;
        silenceStartTime = now;
      }
    }

    animationFrameId = requestAnimationFrame(analyzeAudio);
  }

  function stop() {
    isRecording = false;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    if (recognition) {
      try { recognition.stop(); } catch (e) { /* ignore */ }
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }

    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }

    const endTime = Date.now();
    totalSpeechDuration = (endTime - startTime) / 1000;

    // Final silence segment
    if (!isSpeaking) {
      const silenceDuration = endTime - silenceStartTime;
      if (silenceDuration > 300) {
        silenceSegments.push(silenceDuration);
        totalSilenceDuration += silenceDuration;
      }
    }
  }

  function getTranscript() {
    return transcript.trim();
  }

  function getWaveformData() {
    return waveformData;
  }

  function getMetrics() {
    const text = transcript.trim();
    const words = text ? text.split(/\s+/).filter(w => w.length > 0) : [];
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));

    // Count hesitations (repeated words, filler words)
    const fillers = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'अम', 'उह', 'ଅମ'];
    let hesitations = 0;
    words.forEach((word, i) => {
      if (fillers.includes(word.toLowerCase())) hesitations++;
      if (i > 0 && word.toLowerCase() === words[i - 1].toLowerCase()) hesitations++;
    });

    const totalTime = totalSpeechDuration || 1;
    const silenceTime = totalSilenceDuration / 1000;
    const pauseRatio = silenceTime / totalTime;
    const speechRate = words.length / (totalTime / 60); // words per minute

    return {
      totalWords: words.length,
      uniqueWords: uniqueWords.size,
      pauseRatio: Math.min(pauseRatio, 1),
      speechRate,
      totalDuration: totalTime,
      hesitations,
      silenceSegments: silenceSegments.length,
      avgPauseDuration: silenceSegments.length > 0
        ? silenceSegments.reduce((a, b) => a + b, 0) / silenceSegments.length / 1000
        : 0,
      wordTimestamps,
    };
  }

  function getAudioBlob() {
    if (audioChunks.length === 0) return null;
    return new Blob(audioChunks, { type: 'audio/webm' });
  }

  function playback() {
    const blob = getAudioBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  }

  return {
    start,
    stop,
    getTranscript,
    getMetrics,
    getWaveformData,
    getAudioBlob,
    playback,
    get isRecording() { return isRecording; },
  };
}

/**
 * Check if speech recognition is supported
 */
export function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Check if microphone access is available
 */
export async function checkMicrophoneAccess() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

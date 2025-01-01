import React from "react";

export async function PlayAudio(encodedAudio) {
  // Check if the browser supports web audio. Safari wants a prefix.
  if ("AudioContext" in window || "webkitAudioContext" in window) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext(); // Make it crossbrowser
    let gainNode = context.createGain();
    gainNode.gain.value = 1; // set volume to 100%
    let yodelBuffer = void 0;

    // The Promise-based syntax for BaseAudioContext.decodeAudioData() is not supported in Safari(Webkit).
    const arrayBuffer = await _base64ToArrayBuffer(encodedAudio);
    context.decodeAudioData(
      arrayBuffer,
      (audioBuffer) => {
        yodelBuffer = audioBuffer;
        _play(yodelBuffer, context);
      },
      (error) => console.error(error)
    );
  }
}

const _play = (audioBuffer, context) => {
  const source = context.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(context.destination);
  source.start();
};

const _base64ToArrayBuffer = async (base64) => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  let bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};


export let audioElRef = null;
export const playAudioClip = (clip) => {
  if (audioElRef && !audioElRef.paused) {
    audioElRef.pause();
  }
 
  audioElRef = new Audio(clip); // Create a new Audio element
  audioElRef.play();
};

export const pauseAudioClip = () => {
  if (audioElRef && !audioElRef.paused) {
    audioElRef.pause();
  }
}

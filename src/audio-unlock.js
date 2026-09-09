// Unlock browser audio on the first real user interaction.
// This is needed for the XP boot/login sounds because browsers block
// media playback until the page has received a user gesture.
let unlocked = false;
let context = null;

function unlockAudio() {
  if (unlocked) return;
  unlocked = true;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      context = context || new AudioContext();
      if (context.state === "suspended") context.resume().catch(() => {});
    }
  } catch {}

  window.removeEventListener("pointerdown", unlockAudio, true);
  window.removeEventListener("keydown", unlockAudio, true);
  window.removeEventListener("touchstart", unlockAudio, true);
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlockAudio, true);
  window.addEventListener("keydown", unlockAudio, true);
  window.addEventListener("touchstart", unlockAudio, true);
}

export function isAudioUnlocked() {
  return unlocked;
}

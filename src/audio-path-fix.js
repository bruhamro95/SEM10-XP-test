// Keep the existing sound calls in App.jsx working on a GitHub Pages project site.
// App.jsx currently uses absolute /sounds/... URLs, while the deployed app lives
// under /SEM10-XP-test/. Only those legacy sound URLs are rewritten; all other
// Audio behavior remains native.
const NativeAudio = window.Audio;
const SOUND_ROOT = "/sounds/";
const PROJECT_BASE = import.meta.env.BASE_URL;

function ProjectAudio(src) {
  const fixedSrc =
    typeof src === "string" && src.startsWith(SOUND_ROOT)
      ? `${PROJECT_BASE}${src.slice(SOUND_ROOT.length)}`
      : src;

  return new NativeAudio(fixedSrc);
}

ProjectAudio.prototype = NativeAudio.prototype;
Object.setPrototypeOf(ProjectAudio, NativeAudio);
window.Audio = ProjectAudio;

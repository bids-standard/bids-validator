import {
  process
} from "./chunk-ZSFRIFKI.js";
import {
  Buffer,
  __export,
  init_Buffer
} from "./chunk-CF75XJX3.js";

// node_modules/.deno/ansi-escapes@7.3.0/node_modules/ansi-escapes/index.js
init_Buffer();

// node_modules/.deno/ansi-escapes@7.3.0/node_modules/ansi-escapes/base.js
var base_exports = {};
__export(base_exports, {
  ConEmu: () => ConEmu,
  beep: () => beep,
  beginSynchronizedOutput: () => beginSynchronizedOutput,
  clearScreen: () => clearScreen,
  clearTerminal: () => clearTerminal,
  clearViewport: () => clearViewport,
  cursorBackward: () => cursorBackward,
  cursorDown: () => cursorDown,
  cursorForward: () => cursorForward,
  cursorGetPosition: () => cursorGetPosition,
  cursorHide: () => cursorHide,
  cursorLeft: () => cursorLeft,
  cursorMove: () => cursorMove,
  cursorNextLine: () => cursorNextLine,
  cursorPrevLine: () => cursorPrevLine,
  cursorRestorePosition: () => cursorRestorePosition,
  cursorSavePosition: () => cursorSavePosition,
  cursorShow: () => cursorShow,
  cursorTo: () => cursorTo,
  cursorUp: () => cursorUp,
  endSynchronizedOutput: () => endSynchronizedOutput,
  enterAlternativeScreen: () => enterAlternativeScreen,
  eraseDown: () => eraseDown,
  eraseEndLine: () => eraseEndLine,
  eraseLine: () => eraseLine,
  eraseLines: () => eraseLines,
  eraseScreen: () => eraseScreen,
  eraseStartLine: () => eraseStartLine,
  eraseUp: () => eraseUp,
  exitAlternativeScreen: () => exitAlternativeScreen,
  iTerm: () => iTerm,
  image: () => image,
  link: () => link,
  scrollDown: () => scrollDown,
  scrollUp: () => scrollUp,
  setCwd: () => setCwd,
  synchronizedOutput: () => synchronizedOutput
});
init_Buffer();
import os from "node:os";

// node_modules/.deno/environment@1.1.0/node_modules/environment/index.js
init_Buffer();
var isBrowser = globalThis.window?.document !== void 0;
var isNode = globalThis.process?.versions?.node !== void 0;
var isBun = globalThis.process?.versions?.bun !== void 0;
var isDeno = globalThis.Deno?.version?.deno !== void 0;
var isElectron = globalThis.process?.versions?.electron !== void 0;
var isJsDom = globalThis.navigator?.userAgent?.includes("jsdom") === true;
var isWebWorker = typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope;
var isDedicatedWorker = typeof DedicatedWorkerGlobalScope !== "undefined" && globalThis instanceof DedicatedWorkerGlobalScope;
var isSharedWorker = typeof SharedWorkerGlobalScope !== "undefined" && globalThis instanceof SharedWorkerGlobalScope;
var isServiceWorker = typeof ServiceWorkerGlobalScope !== "undefined" && globalThis instanceof ServiceWorkerGlobalScope;
var platform = globalThis.navigator?.userAgentData?.platform;
var isMacOs = platform === "macOS" || globalThis.navigator?.platform === "MacIntel" || globalThis.navigator?.userAgent?.includes(" Mac ") === true || globalThis.process?.platform === "darwin";
var isWindows = platform === "Windows" || globalThis.navigator?.platform === "Win32" || globalThis.process?.platform === "win32";
var isLinux = platform === "Linux" || globalThis.navigator?.platform?.startsWith("Linux") === true || globalThis.navigator?.userAgent?.includes(" Linux ") === true || globalThis.process?.platform === "linux";
var isIos = platform === "iOS" || globalThis.navigator?.platform === "MacIntel" && globalThis.navigator?.maxTouchPoints > 1 || /iPad|iPhone|iPod/.test(globalThis.navigator?.platform);
var isAndroid = platform === "Android" || globalThis.navigator?.platform === "Android" || globalThis.navigator?.userAgent?.includes(" Android ") === true || globalThis.process?.platform === "android";

// node_modules/.deno/ansi-escapes@7.3.0/node_modules/ansi-escapes/base.js
var ESC = "\x1B[";
var OSC = "\x1B]";
var BEL = "\x07";
var SEP = ";";
var isTerminalApp = !isBrowser && process.env.TERM_PROGRAM === "Apple_Terminal";
var isWindows2 = !isBrowser && process.platform === "win32";
var isTmux = !isBrowser && (process.env.TERM?.startsWith("screen") || process.env.TERM?.startsWith("tmux") || process.env.TMUX !== void 0);
var cwdFunction = isBrowser ? () => {
  throw new Error("`process.cwd()` only works in Node.js, not the browser.");
} : process.cwd;
var wrapOsc = (sequence) => {
  if (isTmux) {
    return "\x1BPtmux;" + sequence.replaceAll("\x1B", "\x1B\x1B") + "\x1B\\";
  }
  return sequence;
};
var cursorTo = (x, y) => {
  if (typeof x !== "number") {
    throw new TypeError("The `x` argument is required");
  }
  if (typeof y !== "number") {
    return ESC + (x + 1) + "G";
  }
  return ESC + (y + 1) + SEP + (x + 1) + "H";
};
var cursorMove = (x, y) => {
  if (typeof x !== "number") {
    throw new TypeError("The `x` argument is required");
  }
  let returnValue = "";
  if (x < 0) {
    returnValue += ESC + -x + "D";
  } else if (x > 0) {
    returnValue += ESC + x + "C";
  }
  if (y < 0) {
    returnValue += ESC + -y + "A";
  } else if (y > 0) {
    returnValue += ESC + y + "B";
  }
  return returnValue;
};
var cursorUp = (count = 1) => ESC + count + "A";
var cursorDown = (count = 1) => ESC + count + "B";
var cursorForward = (count = 1) => ESC + count + "C";
var cursorBackward = (count = 1) => ESC + count + "D";
var cursorLeft = ESC + "G";
var cursorSavePosition = isTerminalApp ? "\x1B7" : ESC + "s";
var cursorRestorePosition = isTerminalApp ? "\x1B8" : ESC + "u";
var cursorGetPosition = ESC + "6n";
var cursorNextLine = ESC + "E";
var cursorPrevLine = ESC + "F";
var cursorHide = ESC + "?25l";
var cursorShow = ESC + "?25h";
var eraseLines = (count) => {
  let clear = "";
  for (let i = 0; i < count; i++) {
    clear += eraseLine + (i < count - 1 ? cursorUp() : "");
  }
  if (count) {
    clear += cursorLeft;
  }
  return clear;
};
var eraseEndLine = ESC + "K";
var eraseStartLine = ESC + "1K";
var eraseLine = ESC + "2K";
var eraseDown = ESC + "J";
var eraseUp = ESC + "1J";
var eraseScreen = ESC + "2J";
var scrollUp = ESC + "S";
var scrollDown = ESC + "T";
var clearScreen = "\x1Bc";
var clearViewport = `${eraseScreen}${ESC}H`;
var isOldWindows = () => {
  if (isBrowser || !isWindows2) {
    return false;
  }
  const parts = os.release().split(".");
  const major = Number(parts[0]);
  const build = Number(parts[2] ?? 0);
  if (major < 10) {
    return true;
  }
  if (major === 10 && build < 10586) {
    return true;
  }
  return false;
};
var clearTerminal = isOldWindows() ? `${eraseScreen}${ESC}0f` : `${eraseScreen}${ESC}3J${ESC}H`;
var enterAlternativeScreen = ESC + "?1049h";
var exitAlternativeScreen = ESC + "?1049l";
var beginSynchronizedOutput = ESC + "?2026h";
var endSynchronizedOutput = ESC + "?2026l";
var synchronizedOutput = (text) => beginSynchronizedOutput + text + endSynchronizedOutput;
var beep = BEL;
var link = (text, url) => {
  const openLink = wrapOsc(`${OSC}8${SEP}${SEP}${url}${BEL}`);
  const closeLink = wrapOsc(`${OSC}8${SEP}${SEP}${BEL}`);
  return openLink + text + closeLink;
};
var image = (data, options = {}) => {
  let returnValue = `${OSC}1337;File=inline=1`;
  if (options.width) {
    returnValue += `;width=${options.width}`;
  }
  if (options.height) {
    returnValue += `;height=${options.height}`;
  }
  if (options.preserveAspectRatio === false) {
    returnValue += ";preserveAspectRatio=0";
  }
  const imageBuffer = Buffer.from(data);
  return wrapOsc(returnValue + `;size=${imageBuffer.byteLength}:` + imageBuffer.toString("base64") + BEL);
};
var iTerm = {
  setCwd: (cwd = cwdFunction()) => wrapOsc(`${OSC}50;CurrentDir=${cwd}${BEL}`),
  annotation(message, options = {}) {
    let returnValue = `${OSC}1337;`;
    const hasX = options.x !== void 0;
    const hasY = options.y !== void 0;
    if ((hasX || hasY) && !(hasX && hasY && options.length !== void 0)) {
      throw new Error("`x`, `y` and `length` must be defined when `x` or `y` is defined");
    }
    message = message.replaceAll("|", "");
    returnValue += options.isHidden ? "AddHiddenAnnotation=" : "AddAnnotation=";
    if (options.length > 0) {
      returnValue += (hasX ? [message, options.length, options.x, options.y] : [options.length, message]).join("|");
    } else {
      returnValue += message;
    }
    return wrapOsc(returnValue + BEL);
  }
};
var ConEmu = {
  setCwd: (cwd = cwdFunction()) => wrapOsc(`${OSC}9;9;${cwd}${BEL}`)
};
var setCwd = (cwd = cwdFunction()) => iTerm.setCwd(cwd) + ConEmu.setCwd(cwd);
export {
  ConEmu,
  beep,
  beginSynchronizedOutput,
  clearScreen,
  clearTerminal,
  clearViewport,
  cursorBackward,
  cursorDown,
  cursorForward,
  cursorGetPosition,
  cursorHide,
  cursorLeft,
  cursorMove,
  cursorNextLine,
  cursorPrevLine,
  cursorRestorePosition,
  cursorSavePosition,
  cursorShow,
  cursorTo,
  cursorUp,
  base_exports as default,
  endSynchronizedOutput,
  enterAlternativeScreen,
  eraseDown,
  eraseEndLine,
  eraseLine,
  eraseLines,
  eraseScreen,
  eraseStartLine,
  eraseUp,
  exitAlternativeScreen,
  iTerm,
  image,
  link,
  scrollDown,
  scrollUp,
  setCwd,
  synchronizedOutput
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbm9kZV9tb2R1bGVzLy5kZW5vL2Fuc2ktZXNjYXBlc0A3LjMuMC9ub2RlX21vZHVsZXMvYW5zaS1lc2NhcGVzL2luZGV4LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy8uZGVuby9hbnNpLWVzY2FwZXNANy4zLjAvbm9kZV9tb2R1bGVzL2Fuc2ktZXNjYXBlcy9iYXNlLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy8uZGVuby9lbnZpcm9ubWVudEAxLjEuMC9ub2RlX21vZHVsZXMvZW52aXJvbm1lbnQvaW5kZXguanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImV4cG9ydCAqIGZyb20gJy4vYmFzZS5qcyc7XG5leHBvcnQgKiBhcyBkZWZhdWx0IGZyb20gJy4vYmFzZS5qcyc7XG4iLCAiaW1wb3J0IHByb2Nlc3MgZnJvbSAnbm9kZTpwcm9jZXNzJztcbmltcG9ydCBvcyBmcm9tICdub2RlOm9zJztcbmltcG9ydCB7aXNCcm93c2VyfSBmcm9tICdlbnZpcm9ubWVudCc7XG5cbmNvbnN0IEVTQyA9ICdcXHUwMDFCWyc7XG5jb25zdCBPU0MgPSAnXFx1MDAxQl0nO1xuY29uc3QgQkVMID0gJ1xcdTAwMDcnO1xuY29uc3QgU0VQID0gJzsnO1xuXG5jb25zdCBpc1Rlcm1pbmFsQXBwID0gIWlzQnJvd3NlciAmJiBwcm9jZXNzLmVudi5URVJNX1BST0dSQU0gPT09ICdBcHBsZV9UZXJtaW5hbCc7XG5jb25zdCBpc1dpbmRvd3MgPSAhaXNCcm93c2VyICYmIHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMic7XG5jb25zdCBpc1RtdXggPSAhaXNCcm93c2VyICYmIChwcm9jZXNzLmVudi5URVJNPy5zdGFydHNXaXRoKCdzY3JlZW4nKSB8fCBwcm9jZXNzLmVudi5URVJNPy5zdGFydHNXaXRoKCd0bXV4JykgfHwgcHJvY2Vzcy5lbnYuVE1VWCAhPT0gdW5kZWZpbmVkKTtcblxuY29uc3QgY3dkRnVuY3Rpb24gPSBpc0Jyb3dzZXIgPyAoKSA9PiB7XG5cdHRocm93IG5ldyBFcnJvcignYHByb2Nlc3MuY3dkKClgIG9ubHkgd29ya3MgaW4gTm9kZS5qcywgbm90IHRoZSBicm93c2VyLicpO1xufSA6IHByb2Nlc3MuY3dkO1xuXG5jb25zdCB3cmFwT3NjID0gc2VxdWVuY2UgPT4ge1xuXHRpZiAoaXNUbXV4KSB7XG5cdFx0Ly8gVG11eCByZXF1aXJlcyBPU0Mgc2VxdWVuY2VzIHRvIGJlIHdyYXBwZWQgd2l0aCBEQ1MgdG11eDsgPHNlcXVlbmNlPiBTVFxuXHRcdC8vIGFuZCBhbGwgRVNDcyBpbiA8c2VxdWVuY2U+IHRvIGJlIHJlcGxhY2VkIHdpdGggRVNDIEVTQy5cblx0XHQvLyBJdCBvbmx5IGFjY2VwdHMgRVNDIGJhY2tzbGFzaCBmb3IgU1QuXG5cdFx0cmV0dXJuICdcXHUwMDFCUHRtdXg7JyArIHNlcXVlbmNlLnJlcGxhY2VBbGwoJ1xcdTAwMUInLCAnXFx1MDAxQlxcdTAwMUInKSArICdcXHUwMDFCXFxcXCc7XG5cdH1cblxuXHRyZXR1cm4gc2VxdWVuY2U7XG59O1xuXG5leHBvcnQgY29uc3QgY3Vyc29yVG8gPSAoeCwgeSkgPT4ge1xuXHRpZiAodHlwZW9mIHggIT09ICdudW1iZXInKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIGB4YCBhcmd1bWVudCBpcyByZXF1aXJlZCcpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiB5ICE9PSAnbnVtYmVyJykge1xuXHRcdHJldHVybiBFU0MgKyAoeCArIDEpICsgJ0cnO1xuXHR9XG5cblx0cmV0dXJuIEVTQyArICh5ICsgMSkgKyBTRVAgKyAoeCArIDEpICsgJ0gnO1xufTtcblxuZXhwb3J0IGNvbnN0IGN1cnNvck1vdmUgPSAoeCwgeSkgPT4ge1xuXHRpZiAodHlwZW9mIHggIT09ICdudW1iZXInKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIGB4YCBhcmd1bWVudCBpcyByZXF1aXJlZCcpO1xuXHR9XG5cblx0bGV0IHJldHVyblZhbHVlID0gJyc7XG5cblx0aWYgKHggPCAwKSB7XG5cdFx0cmV0dXJuVmFsdWUgKz0gRVNDICsgKC14KSArICdEJztcblx0fSBlbHNlIGlmICh4ID4gMCkge1xuXHRcdHJldHVyblZhbHVlICs9IEVTQyArIHggKyAnQyc7XG5cdH1cblxuXHRpZiAoeSA8IDApIHtcblx0XHRyZXR1cm5WYWx1ZSArPSBFU0MgKyAoLXkpICsgJ0EnO1xuXHR9IGVsc2UgaWYgKHkgPiAwKSB7XG5cdFx0cmV0dXJuVmFsdWUgKz0gRVNDICsgeSArICdCJztcblx0fVxuXG5cdHJldHVybiByZXR1cm5WYWx1ZTtcbn07XG5cbmV4cG9ydCBjb25zdCBjdXJzb3JVcCA9IChjb3VudCA9IDEpID0+IEVTQyArIGNvdW50ICsgJ0EnO1xuZXhwb3J0IGNvbnN0IGN1cnNvckRvd24gPSAoY291bnQgPSAxKSA9PiBFU0MgKyBjb3VudCArICdCJztcbmV4cG9ydCBjb25zdCBjdXJzb3JGb3J3YXJkID0gKGNvdW50ID0gMSkgPT4gRVNDICsgY291bnQgKyAnQyc7XG5leHBvcnQgY29uc3QgY3Vyc29yQmFja3dhcmQgPSAoY291bnQgPSAxKSA9PiBFU0MgKyBjb3VudCArICdEJztcblxuZXhwb3J0IGNvbnN0IGN1cnNvckxlZnQgPSBFU0MgKyAnRyc7XG5leHBvcnQgY29uc3QgY3Vyc29yU2F2ZVBvc2l0aW9uID0gaXNUZXJtaW5hbEFwcCA/ICdcXHUwMDFCNycgOiBFU0MgKyAncyc7XG5leHBvcnQgY29uc3QgY3Vyc29yUmVzdG9yZVBvc2l0aW9uID0gaXNUZXJtaW5hbEFwcCA/ICdcXHUwMDFCOCcgOiBFU0MgKyAndSc7XG5leHBvcnQgY29uc3QgY3Vyc29yR2V0UG9zaXRpb24gPSBFU0MgKyAnNm4nO1xuZXhwb3J0IGNvbnN0IGN1cnNvck5leHRMaW5lID0gRVNDICsgJ0UnO1xuZXhwb3J0IGNvbnN0IGN1cnNvclByZXZMaW5lID0gRVNDICsgJ0YnO1xuZXhwb3J0IGNvbnN0IGN1cnNvckhpZGUgPSBFU0MgKyAnPzI1bCc7XG5leHBvcnQgY29uc3QgY3Vyc29yU2hvdyA9IEVTQyArICc/MjVoJztcblxuZXhwb3J0IGNvbnN0IGVyYXNlTGluZXMgPSBjb3VudCA9PiB7XG5cdGxldCBjbGVhciA9ICcnO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuXHRcdGNsZWFyICs9IGVyYXNlTGluZSArIChpIDwgY291bnQgLSAxID8gY3Vyc29yVXAoKSA6ICcnKTtcblx0fVxuXG5cdGlmIChjb3VudCkge1xuXHRcdGNsZWFyICs9IGN1cnNvckxlZnQ7XG5cdH1cblxuXHRyZXR1cm4gY2xlYXI7XG59O1xuXG5leHBvcnQgY29uc3QgZXJhc2VFbmRMaW5lID0gRVNDICsgJ0snO1xuZXhwb3J0IGNvbnN0IGVyYXNlU3RhcnRMaW5lID0gRVNDICsgJzFLJztcbmV4cG9ydCBjb25zdCBlcmFzZUxpbmUgPSBFU0MgKyAnMksnO1xuZXhwb3J0IGNvbnN0IGVyYXNlRG93biA9IEVTQyArICdKJztcbmV4cG9ydCBjb25zdCBlcmFzZVVwID0gRVNDICsgJzFKJztcbmV4cG9ydCBjb25zdCBlcmFzZVNjcmVlbiA9IEVTQyArICcySic7XG5leHBvcnQgY29uc3Qgc2Nyb2xsVXAgPSBFU0MgKyAnUyc7XG5leHBvcnQgY29uc3Qgc2Nyb2xsRG93biA9IEVTQyArICdUJztcblxuZXhwb3J0IGNvbnN0IGNsZWFyU2NyZWVuID0gJ1xcdTAwMUJjJztcblxuZXhwb3J0IGNvbnN0IGNsZWFyVmlld3BvcnQgPSBgJHtlcmFzZVNjcmVlbn0ke0VTQ31IYDtcblxuY29uc3QgaXNPbGRXaW5kb3dzID0gKCkgPT4ge1xuXHRpZiAoaXNCcm93c2VyIHx8ICFpc1dpbmRvd3MpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRjb25zdCBwYXJ0cyA9IG9zLnJlbGVhc2UoKS5zcGxpdCgnLicpO1xuXHRjb25zdCBtYWpvciA9IE51bWJlcihwYXJ0c1swXSk7XG5cdGNvbnN0IGJ1aWxkID0gTnVtYmVyKHBhcnRzWzJdID8/IDApO1xuXG5cdGlmIChtYWpvciA8IDEwKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRpZiAobWFqb3IgPT09IDEwICYmIGJ1aWxkIDwgMTBfNTg2KSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRyZXR1cm4gZmFsc2U7XG59O1xuXG5leHBvcnQgY29uc3QgY2xlYXJUZXJtaW5hbCA9IGlzT2xkV2luZG93cygpXG5cdD8gYCR7ZXJhc2VTY3JlZW59JHtFU0N9MGZgXG5cdC8vIDEuIEVyYXNlcyB0aGUgc2NyZWVuIChPbmx5IGRvbmUgaW4gY2FzZSBgMmAgaXMgbm90IHN1cHBvcnRlZClcblx0Ly8gMi4gRXJhc2VzIHRoZSB3aG9sZSBzY3JlZW4gaW5jbHVkaW5nIHNjcm9sbGJhY2sgYnVmZmVyXG5cdC8vIDMuIE1vdmVzIGN1cnNvciB0byB0aGUgdG9wLWxlZnQgcG9zaXRpb25cblx0Ly8gTW9yZSBpbmZvOiBodHRwczovL3d3dy5yZWFsLXdvcmxkLXN5c3RlbXMuY29tL2RvY3MvQU5TSWNvZGUuaHRtbFxuXHQ6IGAke2VyYXNlU2NyZWVufSR7RVNDfTNKJHtFU0N9SGA7XG5cbmV4cG9ydCBjb25zdCBlbnRlckFsdGVybmF0aXZlU2NyZWVuID0gRVNDICsgJz8xMDQ5aCc7XG5leHBvcnQgY29uc3QgZXhpdEFsdGVybmF0aXZlU2NyZWVuID0gRVNDICsgJz8xMDQ5bCc7XG5cbmV4cG9ydCBjb25zdCBiZWdpblN5bmNocm9uaXplZE91dHB1dCA9IEVTQyArICc/MjAyNmgnO1xuZXhwb3J0IGNvbnN0IGVuZFN5bmNocm9uaXplZE91dHB1dCA9IEVTQyArICc/MjAyNmwnO1xuZXhwb3J0IGNvbnN0IHN5bmNocm9uaXplZE91dHB1dCA9IHRleHQgPT4gYmVnaW5TeW5jaHJvbml6ZWRPdXRwdXQgKyB0ZXh0ICsgZW5kU3luY2hyb25pemVkT3V0cHV0O1xuXG5leHBvcnQgY29uc3QgYmVlcCA9IEJFTDtcblxuZXhwb3J0IGNvbnN0IGxpbmsgPSAodGV4dCwgdXJsKSA9PiB7XG5cdGNvbnN0IG9wZW5MaW5rID0gd3JhcE9zYyhgJHtPU0N9OCR7U0VQfSR7U0VQfSR7dXJsfSR7QkVMfWApO1xuXHRjb25zdCBjbG9zZUxpbmsgPSB3cmFwT3NjKGAke09TQ304JHtTRVB9JHtTRVB9JHtCRUx9YCk7XG5cdHJldHVybiBvcGVuTGluayArIHRleHQgKyBjbG9zZUxpbms7XG59O1xuXG5leHBvcnQgY29uc3QgaW1hZ2UgPSAoZGF0YSwgb3B0aW9ucyA9IHt9KSA9PiB7XG5cdGxldCByZXR1cm5WYWx1ZSA9IGAke09TQ30xMzM3O0ZpbGU9aW5saW5lPTFgO1xuXG5cdGlmIChvcHRpb25zLndpZHRoKSB7XG5cdFx0cmV0dXJuVmFsdWUgKz0gYDt3aWR0aD0ke29wdGlvbnMud2lkdGh9YDtcblx0fVxuXG5cdGlmIChvcHRpb25zLmhlaWdodCkge1xuXHRcdHJldHVyblZhbHVlICs9IGA7aGVpZ2h0PSR7b3B0aW9ucy5oZWlnaHR9YDtcblx0fVxuXG5cdGlmIChvcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW8gPT09IGZhbHNlKSB7XG5cdFx0cmV0dXJuVmFsdWUgKz0gJztwcmVzZXJ2ZUFzcGVjdFJhdGlvPTAnO1xuXHR9XG5cblx0Y29uc3QgaW1hZ2VCdWZmZXIgPSBCdWZmZXIuZnJvbShkYXRhKTtcblxuXHQvLyBgc2l6ZWAgaXMgb3B0aW9uYWwgaW4gdGhlIHNwZWMsIGJ1dCB4dGVybS5qcyByZXF1aXJlcyBpdC5cblx0cmV0dXJuIHdyYXBPc2MocmV0dXJuVmFsdWUgKyBgO3NpemU9JHtpbWFnZUJ1ZmZlci5ieXRlTGVuZ3RofWAgKyAnOicgKyBpbWFnZUJ1ZmZlci50b1N0cmluZygnYmFzZTY0JykgKyBCRUwpO1xufTtcblxuZXhwb3J0IGNvbnN0IGlUZXJtID0ge1xuXHRzZXRDd2Q6IChjd2QgPSBjd2RGdW5jdGlvbigpKSA9PiB3cmFwT3NjKGAke09TQ301MDtDdXJyZW50RGlyPSR7Y3dkfSR7QkVMfWApLFxuXG5cdGFubm90YXRpb24obWVzc2FnZSwgb3B0aW9ucyA9IHt9KSB7XG5cdFx0bGV0IHJldHVyblZhbHVlID0gYCR7T1NDfTEzMzc7YDtcblxuXHRcdGNvbnN0IGhhc1ggPSBvcHRpb25zLnggIT09IHVuZGVmaW5lZDtcblx0XHRjb25zdCBoYXNZID0gb3B0aW9ucy55ICE9PSB1bmRlZmluZWQ7XG5cdFx0aWYgKChoYXNYIHx8IGhhc1kpICYmICEoaGFzWCAmJiBoYXNZICYmIG9wdGlvbnMubGVuZ3RoICE9PSB1bmRlZmluZWQpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ2B4YCwgYHlgIGFuZCBgbGVuZ3RoYCBtdXN0IGJlIGRlZmluZWQgd2hlbiBgeGAgb3IgYHlgIGlzIGRlZmluZWQnKTtcblx0XHR9XG5cblx0XHRtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlQWxsKCd8JywgJycpO1xuXG5cdFx0cmV0dXJuVmFsdWUgKz0gb3B0aW9ucy5pc0hpZGRlbiA/ICdBZGRIaWRkZW5Bbm5vdGF0aW9uPScgOiAnQWRkQW5ub3RhdGlvbj0nO1xuXG5cdFx0aWYgKG9wdGlvbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0cmV0dXJuVmFsdWUgKz0gKFxuXHRcdFx0XHRoYXNYXG5cdFx0XHRcdFx0PyBbbWVzc2FnZSwgb3B0aW9ucy5sZW5ndGgsIG9wdGlvbnMueCwgb3B0aW9ucy55XVxuXHRcdFx0XHRcdDogW29wdGlvbnMubGVuZ3RoLCBtZXNzYWdlXVxuXHRcdFx0KS5qb2luKCd8Jyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVyblZhbHVlICs9IG1lc3NhZ2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHdyYXBPc2MocmV0dXJuVmFsdWUgKyBCRUwpO1xuXHR9LFxufTtcblxuZXhwb3J0IGNvbnN0IENvbkVtdSA9IHtcblx0c2V0Q3dkOiAoY3dkID0gY3dkRnVuY3Rpb24oKSkgPT4gd3JhcE9zYyhgJHtPU0N9OTs5OyR7Y3dkfSR7QkVMfWApLFxufTtcblxuZXhwb3J0IGNvbnN0IHNldEN3ZCA9IChjd2QgPSBjd2RGdW5jdGlvbigpKSA9PiBpVGVybS5zZXRDd2QoY3dkKSArIENvbkVtdS5zZXRDd2QoY3dkKTtcbiIsICIvKiBnbG9iYWxzIFdvcmtlckdsb2JhbFNjb3BlLCBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZSwgU2hhcmVkV29ya2VyR2xvYmFsU2NvcGUsIFNlcnZpY2VXb3JrZXJHbG9iYWxTY29wZSAqL1xuXG5leHBvcnQgY29uc3QgaXNCcm93c2VyID0gZ2xvYmFsVGhpcy53aW5kb3c/LmRvY3VtZW50ICE9PSB1bmRlZmluZWQ7XG5cbmV4cG9ydCBjb25zdCBpc05vZGUgPSBnbG9iYWxUaGlzLnByb2Nlc3M/LnZlcnNpb25zPy5ub2RlICE9PSB1bmRlZmluZWQ7XG5cbmV4cG9ydCBjb25zdCBpc0J1biA9IGdsb2JhbFRoaXMucHJvY2Vzcz8udmVyc2lvbnM/LmJ1biAhPT0gdW5kZWZpbmVkO1xuXG5leHBvcnQgY29uc3QgaXNEZW5vID0gZ2xvYmFsVGhpcy5EZW5vPy52ZXJzaW9uPy5kZW5vICE9PSB1bmRlZmluZWQ7XG5cbmV4cG9ydCBjb25zdCBpc0VsZWN0cm9uID0gZ2xvYmFsVGhpcy5wcm9jZXNzPy52ZXJzaW9ucz8uZWxlY3Ryb24gIT09IHVuZGVmaW5lZDtcblxuZXhwb3J0IGNvbnN0IGlzSnNEb20gPSBnbG9iYWxUaGlzLm5hdmlnYXRvcj8udXNlckFnZW50Py5pbmNsdWRlcygnanNkb20nKSA9PT0gdHJ1ZTtcblxuZXhwb3J0IGNvbnN0IGlzV2ViV29ya2VyID0gdHlwZW9mIFdvcmtlckdsb2JhbFNjb3BlICE9PSAndW5kZWZpbmVkJyAmJiBnbG9iYWxUaGlzIGluc3RhbmNlb2YgV29ya2VyR2xvYmFsU2NvcGU7XG5cbmV4cG9ydCBjb25zdCBpc0RlZGljYXRlZFdvcmtlciA9IHR5cGVvZiBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsVGhpcyBpbnN0YW5jZW9mIERlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlO1xuXG5leHBvcnQgY29uc3QgaXNTaGFyZWRXb3JrZXIgPSB0eXBlb2YgU2hhcmVkV29ya2VyR2xvYmFsU2NvcGUgIT09ICd1bmRlZmluZWQnICYmIGdsb2JhbFRoaXMgaW5zdGFuY2VvZiBTaGFyZWRXb3JrZXJHbG9iYWxTY29wZTtcblxuZXhwb3J0IGNvbnN0IGlzU2VydmljZVdvcmtlciA9IHR5cGVvZiBTZXJ2aWNlV29ya2VyR2xvYmFsU2NvcGUgIT09ICd1bmRlZmluZWQnICYmIGdsb2JhbFRoaXMgaW5zdGFuY2VvZiBTZXJ2aWNlV29ya2VyR2xvYmFsU2NvcGU7XG5cbi8vIE5vdGU6IEknbSBpbnRlbnRpb25hbGx5IG5vdCBEUllpbmcgdXAgdGhlIG90aGVyIHZhcmlhYmxlcyB0byBrZWVwIHRoZW0gXCJsYXp5XCIuXG5jb25zdCBwbGF0Zm9ybSA9IGdsb2JhbFRoaXMubmF2aWdhdG9yPy51c2VyQWdlbnREYXRhPy5wbGF0Zm9ybTtcblxuZXhwb3J0IGNvbnN0IGlzTWFjT3MgPSBwbGF0Zm9ybSA9PT0gJ21hY09TJ1xuXHR8fCBnbG9iYWxUaGlzLm5hdmlnYXRvcj8ucGxhdGZvcm0gPT09ICdNYWNJbnRlbCcgLy8gRXZlbiBvbiBBcHBsZSBzaWxpY29uIE1hY3MuXG5cdHx8IGdsb2JhbFRoaXMubmF2aWdhdG9yPy51c2VyQWdlbnQ/LmluY2x1ZGVzKCcgTWFjICcpID09PSB0cnVlXG5cdHx8IGdsb2JhbFRoaXMucHJvY2Vzcz8ucGxhdGZvcm0gPT09ICdkYXJ3aW4nO1xuXG5leHBvcnQgY29uc3QgaXNXaW5kb3dzID0gcGxhdGZvcm0gPT09ICdXaW5kb3dzJ1xuXHR8fCBnbG9iYWxUaGlzLm5hdmlnYXRvcj8ucGxhdGZvcm0gPT09ICdXaW4zMidcblx0fHwgZ2xvYmFsVGhpcy5wcm9jZXNzPy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJztcblxuZXhwb3J0IGNvbnN0IGlzTGludXggPSBwbGF0Zm9ybSA9PT0gJ0xpbnV4J1xuXHR8fCBnbG9iYWxUaGlzLm5hdmlnYXRvcj8ucGxhdGZvcm0/LnN0YXJ0c1dpdGgoJ0xpbnV4JykgPT09IHRydWVcblx0fHwgZ2xvYmFsVGhpcy5uYXZpZ2F0b3I/LnVzZXJBZ2VudD8uaW5jbHVkZXMoJyBMaW51eCAnKSA9PT0gdHJ1ZVxuXHR8fCBnbG9iYWxUaGlzLnByb2Nlc3M/LnBsYXRmb3JtID09PSAnbGludXgnO1xuXG5leHBvcnQgY29uc3QgaXNJb3MgPSBwbGF0Zm9ybSA9PT0gJ2lPUydcblx0fHwgKGdsb2JhbFRoaXMubmF2aWdhdG9yPy5wbGF0Zm9ybSA9PT0gJ01hY0ludGVsJyAmJiBnbG9iYWxUaGlzLm5hdmlnYXRvcj8ubWF4VG91Y2hQb2ludHMgPiAxKVxuXHR8fCAvaVBhZHxpUGhvbmV8aVBvZC8udGVzdChnbG9iYWxUaGlzLm5hdmlnYXRvcj8ucGxhdGZvcm0pO1xuXG5leHBvcnQgY29uc3QgaXNBbmRyb2lkID0gcGxhdGZvcm0gPT09ICdBbmRyb2lkJ1xuXHR8fCBnbG9iYWxUaGlzLm5hdmlnYXRvcj8ucGxhdGZvcm0gPT09ICdBbmRyb2lkJ1xuXHR8fCBnbG9iYWxUaGlzLm5hdmlnYXRvcj8udXNlckFnZW50Py5pbmNsdWRlcygnIEFuZHJvaWQgJykgPT09IHRydWVcblx0fHwgZ2xvYmFsVGhpcy5wcm9jZXNzPy5wbGF0Zm9ybSA9PT0gJ2FuZHJvaWQnO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7OztBQUFBOzs7QUNBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0EsT0FBTyxRQUFROzs7QUNEZjtBQUVPLElBQU0sWUFBWSxXQUFXLFFBQVEsYUFBYTtBQUVsRCxJQUFNLFNBQVMsV0FBVyxTQUFTLFVBQVUsU0FBUztBQUV0RCxJQUFNLFFBQVEsV0FBVyxTQUFTLFVBQVUsUUFBUTtBQUVwRCxJQUFNLFNBQVMsV0FBVyxNQUFNLFNBQVMsU0FBUztBQUVsRCxJQUFNLGFBQWEsV0FBVyxTQUFTLFVBQVUs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

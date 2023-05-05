let canvasStream;
let mediaRecorder: MediaRecorder;
let timeout: NodeJS.Timeout;
let videoName: string;
export let isDownloadStopped = false;

function downloadVideo(chunks: Blob[]) {
  let blob = new Blob(chunks, { type: "video/webm" });
  const recording_url = URL.createObjectURL(blob);
  let a: HTMLAnchorElement = document.createElement("a");
  // @ts-ignore
  a.style = "display: none;";
  a.href = recording_url;
  a.download = `${videoName}.webm`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(recording_url);
    document.body.removeChild(a);
  }, 0);
}

export function recordVideo(canvas: HTMLCanvasElement | undefined | null, nameOfVideo: string, duration?: number) {
  let chunks: Blob[] = [];
  videoName = nameOfVideo;
  isDownloadStopped = false;
  if (canvas) {
    canvasStream = canvas.captureStream(60); // fps
    mediaRecorder = new MediaRecorder(canvasStream, { mimeType: "video/webm" });
    // mediaRecorder = new MediaRecorder(canvasStream, { mimeType: `${videoName}/webm` });
    mediaRecorder.ondataavailable = (evt) => {
      chunks.push(evt.data);
    };
    if (duration) {
      timeout = setTimeout(() => {
        mediaRecorder.stop();
        isDownloadStopped = true;
      }, duration * 1000);
    }
    mediaRecorder.onstop = () => {
      downloadVideo(chunks);
    };
    mediaRecorder.start();
  }
}

export function stopRecordVideo() {
  isDownloadStopped = true;
  try {
    mediaRecorder.stop();
    clearTimeout(timeout);
  } catch (e) {}

}
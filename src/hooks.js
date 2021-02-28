import { useCallback, useRef, useState } from "react";

export const useMediaRecorder = (options) => {
    const {
        audio,
        onStart = () => {},
        onStop = () => {},
    } = options

  const mediaRecorder = useRef(null);
  const mediaChunks = useRef([]);
  const mediaStream = useRef(null);
  const [status, setStatus] = useState("idle");
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
  const [error, setError] = useState("NONE");

  const getMediaStream = useCallback(async () => {
    setStatus("acquiring_media");
    try {
      const audioStream = await window.navigator.mediaDevices.getUserMedia({
        audio,
      });
      mediaStream.current = audioStream;
      setStatus("idle");
    } catch (error) {
      setError(error.name);
      setStatus("idle");
    }
  }, [audio]);

  const startRecording = async () => {
    setError("NONE");
    if (!mediaStream.current) {
      await getMediaStream();
    }
    if (mediaStream.current) {
      const isStreamEnded = mediaStream.current
        .getTracks()
        .some((track) => track.readyState === "ended");
      if (isStreamEnded) {
        await getMediaStream();
      }
      mediaRecorder.current = new MediaRecorder(mediaStream.current);
      mediaRecorder.current.ondataavailable = onRecordingActive;
      window.a =  mediaRecorder.current
      mediaRecorder.current.onstart = () => {
          onStart(mediaStream.current)
      }
      mediaRecorder.current.onstop = onRecordingStop;
      mediaRecorder.current.onerror = () => {
        setError("NO_RECORDER");
        setStatus("idle");
      };
      mediaRecorder.current.start();
      setStatus("recording");
    }
  };

  const onRecordingActive = ({ data }) => {
    mediaChunks.current.push(data);
  };

  const onRecordingStop = () => {
    const [chunk] = mediaChunks.current;
    const blobProperty = { type: chunk.type || "audio/webm; codecs=opus" };
    const blob = new Blob(mediaChunks.current, blobProperty);
    const url = URL.createObjectURL(blob);
    setStatus("stopped");
    setMediaBlobUrl(url);
    onStop(url, blob);
  };

  const pauseRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.pause();
    }
  };
  const resumeRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "paused") {
      mediaRecorder.current.resume();
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      if (mediaRecorder.current.state !== "inactive") {
        setStatus("stopping");
        mediaRecorder.current.stop();
        mediaStream.current &&
          mediaStream.current.getTracks().forEach((track) => track.stop());
        mediaChunks.current = [];
      }
    }
  };

  return {
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    mediaBlobUrl,
    status,
    stream: mediaStream.current,
  };
}

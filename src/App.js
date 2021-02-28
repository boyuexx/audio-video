import { useEffect, useRef } from "react";
import { useMediaRecorder } from "./hooks";

const renderAudioGraph= (analyser, canvas) => {
  const height = 200
  const width = 200
  const bufferLength = analyser.fftSize; // 默认为2048
  const backgroundColor = 'white'
  const strokeColor = 'black'
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);
  const canvasCtx = canvas.getContext("2d");
  canvasCtx.clearRect(0, 0, width, height);
  canvasCtx.fillStyle = backgroundColor;
  canvasCtx.fillRect(0, 0, width, height);
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = strokeColor;
  canvasCtx.beginPath();

  const sliceWidth = Number(width) / bufferLength;
  let x = 0;
  canvasCtx.moveTo(x, height / 2);
  for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * height / 2;
      canvasCtx["lineTo"](x, y);
      x += sliceWidth;
  }
  canvasCtx.lineTo(width, height / 2);
  canvasCtx.stroke();
}

function App() {
  const canvasRef = useRef()

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    stream,
  } = useMediaRecorder({
    audio: true,
  })

  console.log(status)
  useEffect(() => {
    if (!stream) {
      return;
    }
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    const renderCurve = () => {
      renderAudioGraph(analyser, canvasRef.current)
      if (status === 'recording') {
        window.requestAnimationFrame(renderCurve);
      } else {
        console.log('no rendering')
      }
    }
    renderCurve()
  }, [status, stream])


  return (
    <div className="App">
      <div>
        <button onClick={status === 'recording' ? stopRecording : startRecording}>
          {status === 'recording' ? "停止" :  "录制" }
        </button>
      </div>
      <div>
        <canvas
          ref={canvasRef}
          height={200}
          width={200}
          style={{width: 200, height: 200}}
        />
      </div>
      {
        mediaBlobUrl && <audio controls src={mediaBlobUrl} />
      }
    </div>
  );
}

export default App;

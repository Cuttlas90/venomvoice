import "../Styles/VoiceRecorder.css";
import Siriwave from 'react-siriwave';
import { useState, useEffect } from "react";
import Recorder from "opus-recorder";
import encoderPath from 'opus-recorder/dist/encoderWorker.min.js';
import {DecoderOPUS} from "../component/DecoerOPUS";
import { getOS } from "../component/GetOs";
import { useSelector } from "react-redux";
import { selectUser } from "../features/cryptoVoice/cryptoVoiceSlice";

export default function VoiceRecorder(props) {

  const [amplitude, setAmplitude] = useState(2);
  const [speed, setSpeed] = useState(0.1);
  const [second, setSecond] = useState("00");
  const [minute, setMinute] = useState("00");
  const [recordStatus, setRecordStatus] = useState("");
  const [message, setMessage] = useState({ status: "", message: "" });
  const [counter, setCounter] = useState(0);
  const [audioDuring, setAudioDuring] = useState(0);
  const [audioUrl, setAudioUrl] = useState(0);
  const isLogin = useSelector(selectUser).isLogin;
  const isWalletConnected = useSelector(selectUser).isWalletConnected;
  const StartOPUS = () => {
    var recorder = null;
    if (!Recorder.isRecordingSupported()) {
      setMessage({ status: "error", message: "Recording features are not supported in your browser." })
    } else {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioStream = navigator.mediaDevices.getUserMedia({ audio: true });
      const sourceNode = audioStream
        .then((stream) => {
          const context = new AudioContext();
          return context.createMediaStreamSource(stream);
        });
      // for analyzer wave animation
      let source = undefined;
      let taskHandle = 0;
      let spectrum, dBASpectrum;
      const
        RA = f =>
          12194 ** 2 * f ** 4 /
          ((f ** 2 + 20.6 ** 2) * Math.sqrt((f ** 2 + 107.7 ** 2) * (f ** 2 + 737.9 ** 2)) * (f ** 2 + 12194 ** 2)),
        A = f => 20 * Math.log10(RA(f)) + 2.0;
      const approxVisualisationUpdateFrequency = 5;
      audioStream
        .then(stream => Promise.all([stream, navigator.mediaDevices.enumerateDevices()]))
        .then(([stream, devices]) => {
          //context depending on browser(Chrome/Firefox)
          let context = new AudioContext();
          //create source for sound input.
          source = context.createMediaStreamSource(stream);
          //create analyser node.
          let analyser = context.createAnalyser();

          const
            trackSettings = stream.getAudioTracks()[0].getSettings(),
            sampleRate = trackSettings.sampleRate || context.sampleRate; // Firefox does not support trackSettings.sampleRate

          let totalNumberOfSamples =
            sampleRate / approxVisualisationUpdateFrequency; // e.g. 48000 / 5 = 9600

          analyser.fftSize = 2 ** Math.floor(Math.log2(totalNumberOfSamples));

          const
            uint8TodB = byteLevel =>
              (byteLevel / 255) * (analyser.maxDecibels - analyser.minDecibels) + analyser.minDecibels;

          const
            weightings = [-100];
          for (let i = 1; i < analyser.frequencyBinCount; i++) {
            weightings[i] = A(i * sampleRate / 2 / analyser.frequencyBinCount);
          }

          //array for frequency data.
          // holds Number.NEGATIVE_INFINITY, [0 = -100dB, ..., 255 = -30 dB]
          spectrum = new Uint8Array(analyser.frequencyBinCount);
          dBASpectrum = new Float32Array(analyser.frequencyBinCount);

          let waveForm = new Uint8Array(analyser.frequencyBinCount);

          //connect source->analyser->destination.
          source.connect(analyser);
          // noisy feedback loop if we put the mic on the speakers 
          //analyser.connect(context.destination);


          const updateAnimation = function (idleDeadline) {
            taskHandle = requestIdleCallback(updateAnimation, { timeout: 1000 / approxVisualisationUpdateFrequency });

            //copy frequency data to spectrum from analyser.
            // holds Number.NEGATIVE_INFINITY, [0 = -100dB, ..., 255 = -30 dB]
            analyser.getByteFrequencyData(spectrum);

            spectrum.forEach((byteLevel, idx) => {
              dBASpectrum[idx] = uint8TodB(byteLevel) + weightings[idx];
            });

            const
              //highestPerceptibleFrequencyBin = dBASpectrum.reduce((acc, y, idx) => y > -90 ? idx : acc, 0),
              // S = ∑ s_i
              //totaldBAPower = dBASpectrum.reduce((acc, y) => acc + y),

              // s⍉ = ∑ s_i ∙ i / ∑ s_i
              //meanFrequencyBin = dBASpectrum.reduce((acc, y, idx) => acc + y * idx) / totaldBAPower,

              highestPowerBin =
                dBASpectrum.reduce(([maxPower, iMax], y, idx) =>
                  y > maxPower ? [y, idx] : [maxPower, iMax], [-120, 0]
                )[1],

              //highestDetectedFrequency = highestPerceptibleFrequencyBin * (sampleRate / 2 / analyser.frequencyBinCount),
              //meanFrequency = meanFrequencyBin * (sampleRate / 2 / analyser.frequencyBinCount),
              maxPowerFrequency =
                highestPowerBin * (sampleRate / 2 / analyser.frequencyBinCount);

            //set the speed for siriwave
            // scaled to [0..22kHz] -> [0..1]
            setSpeed(maxPowerFrequency / (10e+3));

            //const averagedBAPower =  totaldBAPower / analyser.frequencyBinCount;

            //find the max amplituded
            // the zero level is at 128
            analyser.getByteTimeDomainData(waveForm);

            // find the maximum not considering negative values (without loss of generality)
            const amplitude = waveForm.reduce((acc, y) => Math.max(acc, y), 128) - 128;

            //scale amplituded from [0, 128] to [0, 10].
            setAmplitude(amplitude / 128 * 10);
          };

          taskHandle = requestIdleCallback(updateAnimation, { timeout: 1000 / approxVisualisationUpdateFrequency });
        });
      var options = {
        monitorGain: 0,
        recordingGain: 1,
        numberOfChannels: 1,
        encoderSampleRate: 8000,
        encoderBitRate: 6000,
        encoderPath: encoderPath,
        sourceNode: sourceNode,
      };
      recorder = new Recorder(options);
      //const recorderPause = () => { recorder.pause(); };
      const recorderStop = () => {
        recorder.stop();
        sourceNode.then(
          function (stream) { stream.mediaStream.getAudioTracks()[0].stop() },
          function (error) { console.log(error) }
        );
      };
      //const recorderResume = () => { recorder.resume(); };
      const recorderStart = () => {
        recorder.start().catch(function (err) {
          recorder.stop();
          setRecordStatus("");
          setMinute("00");
          setSecond("00");
          if (err.message === "Permission denied") {
            setMessage({ status: "error", message: "You blocked perrmision for recording audio" })
            Notification.requestPermission();
          } else {
            setMessage({ status: "error", message: err.message });
          }
        });
      };

      recorderStart();
      // document.getElementById("pause").addEventListener("click", recorderPause);
      document.getElementById("stopButton").addEventListener("click", recorderStop);
      recorder.onstart = function (e) {
        console.log('Recorder is started');
      };

      recorder.onstop = function (e) {
        console.log('Recorder is stopped');
      };

      recorder.onpause = function (e) {
        console.log('Recorder is paused');
      };

      recorder.onresume = function (e) {
        console.log('Recorder is resuming');
      };

      recorder.ondataavailable = function (typedArray) {
        
        // var hex = Buffer.from(typedArray).toString('hex');
        var hex = Buffer.from(typedArray).toString('base64');
        // var arr = Buffer.from(hexFile,'hex');
        props.setHexFile(hex);
        var dataBlob = new Blob([typedArray], { type: 'audio/ogg' });
        //var fileName = new Date().toISOString() + ".opus";
        var url = URL.createObjectURL(dataBlob);
        var OS = getOS();
        if (OS === "MacOS" || OS === "iOS"){
          DecoderOPUS(new Uint8Array(typedArray)).then(
            (res)=>{
              props.setVoiceUrl(res);
              setAudioUrl(res);
            }
          );
        }else{
          props.setVoiceUrl(url);
          setAudioUrl(url);
        }
      };
    };
  }
  
  // useEfect for setting timer
  useEffect(() => {
    let intervalId;

    if (recordStatus === "recording") {
      intervalId = setInterval(() => {
        const secondCounter = counter % 60;
        const minuteCounter = Math.floor(counter / 60);

        let computedSecond =
          String(secondCounter).length === 1
            ? `0${secondCounter}`
            : secondCounter;
        let computedMinute =
          String(minuteCounter).length === 1
            ? `0${minuteCounter}`
            : minuteCounter;

        setSecond(computedSecond);
        setMinute(computedMinute);

        setCounter((counter) => counter + 1);
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [recordStatus, counter]);

  const stopTimer = () => {
    setCounter(0);
    setSecond("00");
    setMinute("00");
  }

  return (
    <div className="RecCountiner p-4">
      <div className="RecHead">
        <button className="RecNavigator d-md-none" onClick={() => props.setActivePage("playList")}>playlist_play</button>
        <h4 className="text-success">Recorder</h4>
        <button className={(isLogin && isWalletConnected)?"icon fs-1 btn p-0 border-0 text-success" :"icon fs-1 btn p-0 border-0 text-danger"} onClick={() => props.setShowModalWallet("wallet")}>account_balance_wallet</button>
      </div>
      <div className="RecMain">
        <div className="degPlay">
          <div className="wave">
            {
              recordStatus === "recording"
              &&
              <Siriwave
                style={"ios"}
                speed={speed * 2}
                amplitude={amplitude / 2}
                color= "#15cc97"
                frequency={6}
                cover={true}
                autostart
                pixelDepth={0.02}
                lerpSpeed={0.02}
              // curveDefinition={[
              //   { attenuation: -2, lineWidth: 1, opacity: 0.1,color: "164, 220, 44" },
              //   { attenuation: -6, lineWidth: 1, opacity: 0.2,color: "164, 220, 44" },
              //   { attenuation: 4, lineWidth: 1, opacity: 0.4,color: "164, 220, 44" },
              //   { attenuation: 2, lineWidth: 1, opacity: 0.6 ,color: "164, 220, 44"},
              //   { attenuation: 1, lineWidth: 1.5, opacity: 1,color: "164, 220, 44" },
              // ]}
              />
            }
          </div>
          <div className=" timing">
            {
              recordStatus === "" && <h6 className="text-primary">Ready to Record</h6>
            }
            {
              recordStatus === "recording" && <h6 className="text-danger blink">Recording</h6>
            }
            {
              recordStatus === "readyForPlay" && <h6 className="text-success">Recorded</h6>
            }
            {
              recordStatus === "playing" && <h6 className="text-light">Playing</h6>
            }
            <p className={recordStatus === "playing" ? "blink" : recordStatus === "recording" ? "record" : ""} >{minute + ":" + second}</p>
          </div>
          {(() => {
            let rows = [];
            for (let i = 0; i < 180; i++) {
              rows.push(
                <div className="degree" style={{ transform: 'rotate(' + 2 * i + 'deg)' }} key={i}>
                  <span className={recordStatus === "playing" ? "active" : ""} style={{ animationDelay: ((audioDuring / 180) * i) + "s", animationDuration: "0.05s" }}></span>
                </div>
              );
            }
            return rows;
          })()}
        </div>
      </div>
      <div className="Recfooter">
        <div className="RecAction">
          <button className={recordStatus === "" ? "RecordBtn" : "d-none"} onClick={() => { StartOPUS(); setRecordStatus("recording") }}>
            <img className="mic" src={window.location.origin + "/Icon/mic.png"} alt="mic" />
          </button>
          <button id="stopButton" className={recordStatus === "recording" ? "RecordBtn" : "d-none"} onClick={() => { setCounter(0); setRecordStatus("readyForPlay") }} >
            <img className="stop" src={window.location.origin + "/Icon/stop.png"} alt="stop" />
          </button>
          <button
            className={recordStatus === "readyForPlay" ? "RecordBtn" : "d-none"}
            onClick={() => document.getElementById('recordedAudio').play()}
          >
            <img className="play" src={window.location.origin + "/Icon/play.png"} alt="play" />
          </button>
          <button
            className={recordStatus === "playing" ? "RecordBtn" : "d-none"}
            onClick={() => document.getElementById('recordedAudio').pause()}
          >
            <img className="pauss" src={window.location.origin + "/Icon/pauss.png"} alt="pauss" />
          </button>
        </div>
        {
          message.status === "error"
          &&
          <span className="mx-auto text-danger">{message.message}</span>
        }
        <audio
          className="d-none"
          id="recordedAudio"
          controls src={audioUrl}
          onPlay={() => setRecordStatus("playing")}
          onPause={() => setRecordStatus("readyForPlay")}
          onLoadedMetadata={(e) => setAudioDuring(e.target.duration)}
        />
        {
          recordStatus !== "recording"
          &&
          <button className="btn border-0 text-primary d-block mx-auto mt-2" onClick={() => { setRecordStatus(""); stopTimer() }}>Restart</button>
        }
        <button className="btn btn-primary d-block mx-auto mt-auto" onClick={() => props.setShowModalWallet("action")}>Send voice to Blockchain</button>
      </div>
    </div>
  )
}
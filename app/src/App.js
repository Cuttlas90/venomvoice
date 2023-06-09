import VoiceRecorder from "./Pages/VoiceRecorder";
import PlayList from "./Pages/playList";
import './Styles/Master.css';
import './Styles/App.css';
import { useEffect, useState } from "react";
import HandelWallet from "./component/HandelWallet";
import { useSelector } from "react-redux";
import { selectUser } from "./features/cryptoVoice/cryptoVoiceSlice";
import HandelPWA from "./component/HandelPWA";


function App() {
  const [activePage, setActivePage] = useState("recorder");
  const [showModalWallet, setShowModalWallet] = useState(false);
  const [hexFile, setHexFile] = useState();
  const [voiceUrl, setVoiceUrl] = useState();
  const isLogin = useSelector(selectUser).isLogin;
  const [positionX, setPositionX] = useState();
  const [showWelcom,setShowWelcom] = useState(true);


  useEffect(()=>{
    if(localStorage.dontShowWellcomMassage === "true"){
      setShowWelcom(false)
    }
  },[showWelcom])
  const setDontshow = (e)=>{
      localStorage.dontShowWellcomMassage = e ;
  }
  const handelStart = (e) => {
    document.getElementById("recorder").style.transition = "none"
    document.getElementById("playList").style.transition = "none"
  }
  const handelMove = (e) => {
    setPositionX(e.changedTouches[0].pageX);
    var distance;
    if (positionX) {
      distance = positionX - e.changedTouches[0].pageX;
    } else {
      distance = 0;
    }
    if ((activePage === "recorder" && distance > 0) || (activePage === "playList" && distance < 0)) {
      var recElm = document.getElementById("recorder")
      var playElm = document.getElementById("playList")
      var recorderX = window.getComputedStyle(recElm).transform.match(/matrix.*\((.+)\)/)[1].split(', ')[4];
      var value = recorderX - distance;
      recElm.style.transform = "translateX(" + value + "px)";
      playElm.style.transform = "translateX(" + value + "px)";
    }
  }
  const handelEnd = () => {
    setPositionX(null);
    var screenX = window.screen.width;
    var recElm = document.getElementById("recorder")
    var recorderX = window.getComputedStyle(recElm).transform.match(/matrix.*\((.+)\)/)[1].split(', ')[4];
    document.getElementById("recorder").style = null;
    document.getElementById("playList").style = null;
    if (activePage === "recorder" && recorderX < -50) {
      setActivePage("playList")
    };
    if (activePage === "playList" && recorderX > (50 - screenX)) {
      setActivePage("recorder")
    };
  }
  return (
    <>
      <div className="appContioner p-md-4">
        <div
          id="recorder"
          onTouchStart={(e) => handelStart(e)}
          onTouchMove={(e) => handelMove(e)}
          onTouchEnd={() => handelEnd()}
          className={activePage === "recorder" ? "recordPage  activePage" : " recordPage"}
        >
          <VoiceRecorder setActivePage={setActivePage} setShowModalWallet={setShowModalWallet} setHexFile={setHexFile} setVoiceUrl={setVoiceUrl} />
        </div>
        <div
          id="playList"
          onTouchStart={(e) => handelStart(e)}
          onTouchMove={(e) => handelMove(e)}
          onTouchEnd={() => handelEnd()}
          className={activePage === "playList" ? "playListPage activePage" : "playListPage"}>
          <PlayList setActivePage={setActivePage} setShowModalWallet={setShowModalWallet} />
        </div>
        <HandelWallet showModalWallet={showModalWallet} setShowModalWallet={setShowModalWallet} hexFile={hexFile} voiceUrl={voiceUrl} />
        {/* <div className="donate" title="Donate Me">
          <button data-bs-toggle="modal" data-bs-target="#QRcodeModal">
            <img src="/icon/donate.png" alt="donate" />
          </button>
        </div>
        <div className="modal fade" id="QRcodeModal" data-bs-backdrop="false" tabIndex="-1" aria-labelledby="QRcodeModalLabel">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h6 className="modal-title text-primary mx-auto" id="QRcodeModalLabel">Donate to this project on Ethereum and Binance </h6>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <svg className="walletconnect-qrcode__image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" shapeRendering="crispEdges"><path fill="#ffffff" d="M0 0h29v29H0z"></path><path stroke="#000000" d="M0 0.5h7m3 0h2m3 0h1m2 0h1m1 0h1m1 0h7M0 1.5h1m5 0h1m4 0h1m3 0h2m2 0h1m2 0h1m5 0h1M0 2.5h1m1 0h3m1 0h1m1 0h1m1 0h2m1 0h1m1 0h1m1 0h1m4 0h1m1 0h3m1 0h1M0 3.5h1m1 0h3m1 0h1m1 0h5m1 0h2m2 0h1m3 0h1m1 0h3m1 0h1M0 4.5h1m1 0h3m1 0h1m1 0h1m2 0h5m1 0h1m2 0h1m1 0h1m1 0h3m1 0h1M0 5.5h1m5 0h1m1 0h1m1 0h2m3 0h2m1 0h2m2 0h1m5 0h1M0 6.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M8 7.5h2m1 0h3m1 0h4m1 0h1M0 8.5h1m1 0h5m2 0h4m5 0h1m3 0h5M0 9.5h1m2 0h2m2 0h2m1 0h2m1 0h1m4 0h5m1 0h1m3 0h1M0 10.5h3m3 0h1m2 0h1m1 0h1m2 0h2m2 0h2m2 0h1m1 0h4M5 11.5h1m1 0h2m1 0h1m3 0h2m1 0h1m2 0h1m1 0h1m4 0h1M0 12.5h1m1 0h1m2 0h3m4 0h1m1 0h2m1 0h1m2 0h7M1 13.5h5m2 0h1m4 0h1m1 0h1m1 0h2m1 0h2m6 0h1M0 14.5h1m2 0h2m1 0h7m1 0h1m1 0h1m1 0h2m1 0h1m1 0h3m1 0h1M0 15.5h1m4 0h1m7 0h1m1 0h1m1 0h1m2 0h1m1 0h1m1 0h2m1 0h1M0 16.5h1m3 0h1m1 0h1m5 0h1m1 0h2m1 0h1m6 0h1m1 0h3M0 17.5h3m4 0h1m2 0h2m3 0h1m1 0h2m1 0h1m7 0h1M0 18.5h1m1 0h7m1 0h3m2 0h1m2 0h2m1 0h1m2 0h1m1 0h1M0 19.5h1m2 0h1m3 0h1m2 0h1m1 0h1m3 0h1m1 0h1m2 0h4m2 0h1M0 20.5h1m3 0h1m1 0h1m1 0h1m2 0h1m3 0h2m1 0h7m1 0h2M8 21.5h2m2 0h2m1 0h1m1 0h1m2 0h1m3 0h1m3 0h1M0 22.5h7m2 0h2m2 0h2m3 0h1m1 0h1m1 0h1m1 0h1m2 0h1M0 23.5h1m5 0h1m1 0h3m1 0h2m1 0h3m2 0h1m3 0h2m1 0h2M0 24.5h1m1 0h3m1 0h1m1 0h3m1 0h1m1 0h2m2 0h8M0 25.5h1m1 0h3m1 0h1m1 0h2m1 0h2m4 0h1m1 0h1m3 0h1m2 0h2M0 26.5h1m1 0h3m1 0h1m1 0h3m1 0h1m1 0h1m3 0h3m3 0h2m1 0h1M0 27.5h1m5 0h1m2 0h1m1 0h2m2 0h3m1 0h1m1 0h1m1 0h2m2 0h1M0 28.5h7m1 0h1m1 0h1m2 0h3m1 0h1m3 0h1m1 0h1m1 0h2"></path></svg>
              </div>
            </div>
          </div>
        </div> */}
      </div>
      <HandelPWA />
      {/* modal for welcom allert */}
      {showWelcom &&
      <div className="walletModal">
        <div className="modal" id="ModalWelcom"shown-bs-modal="true"	 data-bs-backdrop="false" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-modal="true">
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content modalwelcom">
            <div className="modal-header">
              <h5 className="modal-title text-center " id="ModalwelcomLabel">Welcome to  VenomVoice ...</h5>
              <button type="button" className="text-primary icon btn fs-2 px-1 py-0" onClick={()=>setShowWelcom(false)}>close</button>
            </div>
            <div className="modal-body modal-dialog-scrollable">
              <strong className="mb-2 d-block">Using VenomVoice is simple as sending a transaction</strong>
              <ul className="m-0 ps-2" style={{listStyleType: "upper"}}>
              <li>1- Record your deepest feeling</li>
              <li>2- We optimze and compress your voice</li>
              <li>3- Put address of who you like to recieve</li>
              <li>4- Click send, first, It will encrypt using venom technology</li>
              <li>5- Finally Confirm transaction, and Volllllaaaaa</li>
              <li>6- Reciever will find it in his/her inbox</li>
              </ul>
              <span className="mt-1 d-block">It will remain forever on blockchain and he/she can listen to it through their dashboard.</span>
              <br/>
              <span className="text-primary ">Note: You can try it on testnets too!</span>
            </div>
            <div className="d-flex flex-column align-items-center justify-content-start pb-2">
              {/* <div className="wellcomDontShow">
                <input type="checkbox" onChange={(e)=>setDontshow(e)}/>
                <small>dontshowMessage</small>
              </div> */}
              <button type="button" onClick={()=>{setShowWelcom(false);setDontshow(true)}} className="btn btn-primary mt-2 mx-auto" >OK</button>
            </div>
          </div>
        </div>
      </div>
      </div>}
    </>
  );
}

export default App;

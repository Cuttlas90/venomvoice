import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactPaginate from 'react-paginate';
import { getTransActions, handelgetAudio, selectAPI, selectUser } from '../features/cryptoVoice/cryptoVoiceSlice';
import '../Styles/PlayList.css';
import '../Styles/Pagination.css';

export default function PlayList(props) {
  const dispatch = useDispatch();
  const transActionsAPI = useSelector(selectAPI).getTransActions;
  const loginWithPublicKeyAPI = useSelector(selectAPI).login;
  const audios = useSelector(selectUser).audio;
  const getTransActionDataAPI = useSelector(selectAPI).getTransActionData;
  const [blobUrl, setBlobUrl] = useState({});
  const [audioContorols, setAudioContorols] = useState({});
  const [activeList, setActiveList] = useState(3);
  const [activePage, setActivePage] = useState(0);
  const callList = useRef(false);
  const isLogin = useSelector(selectUser).isLogin;
  const isWalletConnected = useSelector(selectUser).isWalletConnected;


  useEffect(() => {
    setBlobUrl(audios);
  }, [audios, blobUrl])

  // useEfect for run gettransaction on load page and change token(if token expired or account change)
  useEffect(() => {
    if (!callList.current || loginWithPublicKeyAPI.token) {
      dispatch(getTransActions({ type: activeList, page: activePage, pageSize: "6" }));
      callList.current = true;
    };
  }, [callList.current, loginWithPublicKeyAPI.token]);

  const handelGetDataTransaction = (txId, chainId,id) => {
    var network = chainId;
    if (!isWalletConnected){
      props.setShowModalWallet("wallet")      
    }else{
      dispatch(handelgetAudio({ network: network, txId: txId,id:id }));
    }
  }
  const handelSetAudioContorols = (e, index) => {
    var obj = audioContorols;
    obj[index] = { during: e.target.duration, play: "" }
    setAudioContorols({ ...obj });
  }
  const handelPlay = (index, act) => {
    var obj = JSON.parse(JSON.stringify(audioContorols));
    obj[index].play = act;
    setAudioContorols(obj);
  }
  const handelPageChange = (page, type) => {
    dispatch(getTransActions({ type: type, page: page, pageSize: "6" }));
  }
  return (
    <div className="playListContiner p-md-4">
      <div className='playListHead p-md-0 p-4'>
        <button className="playNavigator d-md-none" onClick={() => props.setActivePage("recorder")}>mic</button>
        <h4 className='text-success m-0'>Playlist</h4>
        <button className={(isLogin && isWalletConnected)?"icon fs-1 btn p-0 border-0 text-success" :"icon fs-1 btn p-0 border-0 text-danger"} onClick={() => props.setShowModalWallet("wallet")}>account_balance_wallet</button>
      </div>
      <div className='playListMain'>
        <div className='col-12 col-lg-7 d-flex flex-column '>
          <div className='listAction p-md-0 p-2'>
            <div className='sentRecive my-2'>
              <span className='radioBtn'>
                <input type="radio" checked={activeList === 3 ? true : false} name="list" onChange={() => { setActiveList(3); handelPageChange(activePage, 3) }} />
                <i>All</i>
              </span>
              <span className='radioBtn'>
                <input type="radio" name="list" onChange={() => { setActiveList(1); handelPageChange(activePage, 1) }} />
                <i>Inbox</i>
              </span>
              <span className='radioBtn'>
                <input type="radio" name="list" onChange={() => { setActiveList(2); handelPageChange(activePage, 2) }} />
                <i>Outbox</i>
              </span>
            </div>
            <button className='btn btn-primary' onClick={() => handelPageChange(activePage, activeList)}>Sync</button>
          </div>
          {
            transActionsAPI.data.length > 0
              ?
              <div className='w-100 overflow-auto'>
                <table className='mx-auto'>
                  <tbody>
                    {
                      transActionsAPI.data.map((row, index) =>
                        <tr key={index}>
                          <td className='fs-2 text-light px-1 px-sm-2'>{index + 1}</td>
                          <td className='px-1 px-sm-2 position-sticky start-0'>
                            <div className='d-flex align-items-center '>
                              <audio id={"audio" + index} controls
                                src={blobUrl[row.id]} className='d-none'
                                onLoadedMetadata={(e) => handelSetAudioContorols(e, index)}
                                onPlay={() => handelPlay(index, "play")}
                                onPause={() => handelPlay(index, "pause")}
                              />
                              {
                                getTransActionDataAPI.Status[row.id] === "loading"
                                &&
                                <span onClick={() => handelGetDataTransaction(row.transactionHash, row.chainId,row.id)} className="audioAction loading"><i>play_circle</i></span>
                              }
                              {
                                (getTransActionDataAPI.Status[row.id] === "idle" && audioContorols[index])
                                &&
                                <>
                                  {
                                    audioContorols[index].play === "play"
                                      ?
                                      <i onClick={() => { document.getElementById("audio" + index).pause(); document.getElementById("audio" + index).currentTime = 0 }} className="audioAction downloaded">stop_circle</i>
                                      :
                                      <i onClick={() => document.getElementById("audio" + index).play()} className="audioAction downloaded">play_circle</i>
                                  }
                                </>
                              }
                              {
                                (getTransActionDataAPI.Status[row.id] === "rejected" || getTransActionDataAPI.Status[row.id] === undefined)
                                &&
                                <i onClick={() => handelGetDataTransaction(row.transactionHash, row.chainId, row.id)} className="audioAction notDownload">play_circle</i>
                              }
                              <span className='text-light'>{audioContorols[index] ? audioContorols[index].during : "00:00"}</span>
                            </div>
                          </td>
                          <td className='text-light px-1 px-sm-2'>{row.from === transActionsAPI.owner ? "To: " + row.to.substring(0, 4) + "..." + row.to.substring(38, 42) : "From: " + row.from.substring(0, 4) + "..." + row.from.substring(38, 42)}</td>
                          {
                            (getTransActionDataAPI.Status[row.id] === "idle" && audioContorols[index])
                              ?
                              <td className='text-light px-1 px-sm-2'><a href={blobUrl[row.id]} download>{row.createDateTime.substring(0, 10)}</a></td>
                              :
                              <td className='text-light px-1 px-sm-2'>{row.createDateTime.substring(0, 10)}</td>
                          }
                        </tr>
                      )
                    }
                  </tbody>
                </table>
              </div>
              :
              <h6 className='text-center mx-auto text-light mt-3'>No Transactions</h6>
          }
          {
            transActionsAPI.count > 6
            &&
            <div className='pt-3 mt-auto'>
              <ReactPaginate
                breakLabel=". . ."
                nextLabel=">"
                previousLabel="<"
                onPageChange={(e) => { setActivePage(e.selected); handelPageChange(e.selected, activeList) }}
                onClick={(e) => {
                  (activePage < Math.ceil(transActionsAPI.count / 6) && e.isNext)
                    && setActivePage(activePage + 1);
                  (activePage > 0 && e.isPrevious)
                    && setActivePage(activePage - 1)
                }}
                forcePage={activePage}
                pageCount={Math.ceil(transActionsAPI.count / 6)}
                renderOnZeroPageCount={null}
                containerClassName="paginationContainer"
                pageClassName="paginationPage"
                previousClassName="paginationPrevious"
                nextClassName="paginationNext"
                breakClassName="paginationBreak"
                activeClassName="paginationActiveClass"
                pageRangeDisplayed={1}
                marginPagesDisplayed={1}
              />
            </div>
          }
        </div>
        <div className='playlistPic col-lg-5 d-none d-lg-flex'>
          <img src='/pic.png' alt='playlist' />
        </div>
      </div>
    </div>
  )
};

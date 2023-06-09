import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { useEffect, useRef, useState } from "react";
import '../Styles/HandellWallet.css';
import { getNonce, loginWithPublicKey, selectAPI, selectUser, sendTxId, setWalletConnected } from "../features/cryptoVoice/cryptoVoiceSlice";
import { useDispatch, useSelector } from "react-redux";

///////////////////
import { initVenomConnect } from '../features/venom-connect/configure';
import testContractAbi from "../features/venom-connect/abi/test.abi.json";
import { initialWallet, set_provider } from "../features/venom-connect/api";
const connector = new WalletConnect({
    bridge: "https://bridge.walletconnect.org", // Required
    qrcodeModal: QRCodeModal,
});

export default function HandelWallet(props) {
    const [chainId, setChainId] = useState();
    const [userOpenModal, setUserOpenModal] = useState(false);
    const [walletIcon, setWalletIcon] = useState();
    const [activeWallet, setActiveWallet] = useState();
    const [statusConnection, setStatusConnection] = useState({ status: "", message: "" });
    const [statusAction, setStatusAction] = useState({ status: "", message: "" });
    const [audioDuring, setAudioDuring] = useState();
    const [isPlaying, setIsPlaying] = useState(false);
    const [toAddress, setToAddress] = useState("");
    const [amount, setAmount] = useState('0');
    const getNonceAPI = useSelector(selectAPI).getNonce;
    const dispatch = useDispatch();
    const [callGetNonce,setCallGetNonce] = useState(false);
    const [txHash, setTxHash] = useState("");
    const sendTxIdAPI = useSelector(selectAPI).sendTxId;
    const loginWithPublicKeyAPI = useSelector(selectAPI).login
    const [venomConnect, setVenomConnect] = useState();
    const [venomProvider, setVenomProvider] = useState();
    const [address, setAddress] = useState();
    const [balance, setBalance] = useState();
    const [publickKey, setPublickKey] = useState();
    const calledSendMessage = useRef(false);
    const isLogin = useSelector(selectUser).isLogin;
    const [alerEncript, setAlerEncript] = useState(false)

useEffect(()=>{
    if(venomProvider){
        setStatusConnection({ status: "idle", message: "Venom Wallet connected" })
    }else{
        setStatusConnection({ status: "", message: "" })
    };
    if(isLogin){
        setStatusAction({ status: "idle", message: "login successfully" })
    }else{
        setStatusAction({ status: "rejected", message: "try to login" })
    }
},[props,isLogin,venomProvider])

    // use effect for initial wallet on load component
    useEffect(() => {
        const init = async () => {
            var _prov = await initialWallet();
            setVenomConnect(_prov);
        }
        init()
            .catch((err) => { console.log(err) })
    }, [])
    // use effect for handel connection
    useEffect(() => {
        console.log("useeffect run 55")
        const off = venomConnect?.on('connect', onConnect);
        // if (venomConnect) {
        //     checkAuth(venomConnect);
        // }
        return () => {
            off?.();
        };
    }, [venomConnect]);


    // initial venom wallet connect
    const initialWallet1 = async () => {
        console.log("initial wallet run")
        const _venomConnect = await initVenomConnect();
        setVenomConnect(_venomConnect);
        return _venomConnect
    };

    const onConnect = async (provider) => {
        setVenomProvider(provider);
        onProviderReady(provider);
        set_provider(provider);
    };

    const checkAuth = async (_venomConnect) => {
        console.log(_venomConnect)
        console.log("checkAuth run")
        const auth = await _venomConnect?.checkAuth();
        if (auth) await onProviderReady(_venomConnect);
    }
    const onProviderReady = async (provider) => {
        console.log("onproviderReady ruuuuuuuun")
        const providerState = await provider.getProviderState();
        var adres = providerState?.permissions?.accountInteraction?.address.toString();
        setAddress(adres.toLowerCase());
        setActiveWallet({ provider: "Venom Wallet", wallet: providerState?.permissions?.accountInteraction?.contractType });
        setPublickKey(providerState?.permissions?.accountInteraction?.publicKey);
        setChainId(providerState?.selectedConnection);
        localStorage.setItem("address", adres)
        setWalletIcon("/Icon/venomLogo128.png");
        setStatusConnection({ status: "idle", message: "Venom Wallet connected" })
        const venomWalletBalance = provider ? await getBalance(provider, adres) : undefined;
        setBalance(venomWalletBalance);
        dispatch(setWalletConnected({ isWalletConnected: true, address: adres, publicKey: providerState?.permissions?.accountInteraction?.publicKey }));
    };
    const getBalance = async (provider, _address) => {
        console.log('getBlalance run')
        try {
            const providerBalance = await provider?.getBalance?.(_address);

            return providerBalance;
        } catch (error) {
            return undefined;
        }
    };
    const sendMessage = async (data) => {
        calledSendMessage.current = true;
        var res
        try {
            res = await venomProvider.rawApi.sendMessage(
                {
                    sender: address,
                    recipient: toAddress,
                    amount: (amount * 10 ** 9).toString(),
                    bounce: false,
                    payload:
                    {
                        abi: JSON.stringify(testContractAbi),
                        method: "setData",
                        params: { data: JSON.stringify(data).toString() }
                    },
                })
                calledSendMessage.current = true;
        }
        catch (err) {
            console.log(err)
            calledSendMessage.current = true;
            setStatusAction({ status: "rejected", message: "transAction has Error" });
        }
        if (res) {
            setStatusAction({ status: "idle", message: "transAction send sussesfully" });
        }
        console.log(res);
        setTxHash(res.transaction.id.hash)
        handelSendTxId(res.transaction.id.hash)
    }
    const signData = async (message) => {
        var res;
        try {
            res = await venomProvider.signDataRaw(
                {
                    publicKey: publickKey,
                    data: message,
                    withSignatureId: false
                })
        }
        catch (err) {
            setStatusAction({ status: "rejected", message: "please sign by wallet" })
            console.log(err)
        }
        if (res) {
            setStatusAction({ status: "loading", message: "please wait for login" })

        }
        return res
    }

    useEffect(() => {
        if (loginWithPublicKeyAPI.Status === "idle") {
            setStatusAction({ status: "idle", message: "login successfull" })
        }
        if (loginWithPublicKeyAPI.Status === "rejected") {
            setStatusAction({ status: "rejected", message: "try again to login" })
        }
    }, [loginWithPublicKeyAPI])

    useEffect(() => {
        if (getNonceAPI.Status === "rejected") {
            setStatusAction({ status: "rejected", message: "try again to login" })
        }
    }, [getNonceAPI])


    const signWallet = async (message) => {
        setStatusAction({ status: "loading", message: "plase sign in your wallet app" })
        var signature = await signData(message)
        dispatch(loginWithPublicKey({ signature: signature.signature, publicKey: publickKey, venomAddress: address }));
    };
    // useEfect for get Nonce
    useEffect(() => {
        if (publickKey && !callGetNonce && !isLogin) {
            dispatch(getNonce({
                venomAddress: address
            }));
            setStatusAction({ status: "loading", message: "plase wait to sign in" })
            setCallGetNonce(true);
        }
    }, [callGetNonce, publickKey, isLogin])

    //useEfect for call Loginewith Publickey
    useEffect(() => {
        if (getNonceAPI.Status === "idle" && publickKey) {
            var nonce = getNonceAPI.nonce;
            console.log(nonce)
            signWallet(nonce);
        }

    }, [getNonceAPI, publickKey])

    const handelConnect = async () => {

        if (!venomConnect) {
            var _venomConnect = await initialWallet();
            if (_venomConnect) {
                setStatusConnection({ status: "loading", message: "Confirm connection" });
                try {
                    // var _prov = await _venomConnect.connect()
                    setVenomConnect(_venomConnect);
                }
                catch (err) {
                    setStatusConnection({ status: "rejected", message: err });
                }
            }
        } else {
            setStatusConnection({ status: "loading", message: "Confirm connection" });
            try {
                venomConnect.connect();
            }
            catch (err) {
                setStatusConnection({ status: "rejected", message: err });
            }

        }
    };
    const handelDisconnect = () => {
        venomProvider?.disconnect();
        dispatch(setWalletConnected({ isWalletConnected: false, address: "", publicKey: "" }));
        setAddress(undefined);
        setBalance(undefined);
        setChainId(undefined);
        setPublickKey();
        setActiveWallet();
        setUserOpenModal(false);
        localStorage.setItem("address", "");
        setWalletIcon();
        setStatusConnection({ status: "", message: "" });
        setStatusAction({ status: "", message: "" });
        setVenomConnect();
        setVenomProvider();
    }

    // for send TxiD
    const handelSendTxId = (txId) => {
        var token = localStorage.getItem("token");
        dispatch(sendTxId({ token: token, body: { from: address, to: toAddress.toLowerCase(), chainId: chainId, transactionHash: txId } }))
    }


    // get state of address for get publickey of address by boc in state
    const getFullContractState = async (adres) => {
        const res = await venomProvider.getFullContractState({
            address: adres
        });
        console.log("getFullContractState:");
        console.log(res);
        return res
    }
    // for extra publicKey
    const extractPublicKey = async (boc) => {
        var res = await venomProvider.rawApi.extractPublicKey({
            boc: boc
        })
        console.log(res)
        return (res)
    }

    const encryptData = async (recPublicKey, rawData) => {
        console.log(rawData)
        var res = await venomProvider.encryptData({
            publicKey: publickKey,
            recipientPublicKeys: [recPublicKey, publickKey],
            algorithm: "ChaCha20Poly1305",
            data: rawData
        })
        console.log(res);
        return res
    }
    //handel sending transaction 
    const handelSendTransAction = async (check) => {
        var patternAddress = /^0:[a-zA-Z0-9]{64}$/;
        var trustAddress = patternAddress.test(toAddress);
        if (!toAddress || !trustAddress) {
            document.getElementById('actionTable').classList.add("requaredFild");
            if (!trustAddress) { setStatusAction({ status: "notFiled", message: "Sending address is not Valid" }) }
        } else {
            if (check) {
                var recipientState = await getFullContractState(toAddress);
                setStatusAction({ status: "loading", message: "checking distnation State..." });
                if (recipientState?.state?.boc) {
                    setStatusAction({ status: "loading", message: "extracting PublicKey..." });
                    var recipientPublicKey = await extractPublicKey(recipientState.state.boc)
                    if (recipientPublicKey?.publicKey) {
                        console.log(props.hexFile)
                        setStatusAction({ status: "loading", message: "confirm to Encript Data ..." });
                        var encryptedData = await encryptData(recipientPublicKey.publicKey, props.hexFile);
                        if (encryptedData) {
                            setStatusAction({ status: "loading", message: "please confirm transAction and wait ..." });
                            sendMessage({
                                isEncrypted: true,
                                data: encryptedData
                            });
                        } else {
                            setStatusAction({ status: "rejected", message: "transAction not sent try agin" });
                        }
                    } else {
                        setAlerEncript(true);
                        return;
                    }
                } else {
                    setAlerEncript(true);
                    return;
                }
            } else {
                setStatusAction({ status: "loading", message: "please confirm transAction" });
                sendMessage({
                    isEncrypted: false,
                    data: props.hexFile
                });
            }

        }
    }

    const handeltryLoginAgain = () => {
        setCallGetNonce(false);
        setStatusAction({ status: "loading", message: "please wait to login " });
    }

    return (
        <>
            {props.showModalWallet
                &&
                <>
                    <div className="walletModal">
                        {alerEncript &&
                            <div className="alerEncript px-5">
                                <div className="alert alert-danger" role="alert">
                                    <h4 className="alert-heading">Destination wallet is not active!</h4>
                                    <p>The address is inactive and can't receive encrypted data.</p>
                                    <hr />
                                    <div className="d-flex align-items-center justify-content-evenly">
                                        <button className="btn btn-danger" onClick={() => { handelSendTransAction(false); setAlerEncript(false) }}>Send Without Encryption</button>
                                        <button className="btn btn-outline-primary" onClick={() => {setAlerEncript(false);setStatusAction({status:"rejected",message: "try again transAction" })}}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        }
                        <div className="walletModalmain col-12 col-sm-10 ">
                            <div className="row h-100 flex-wrap-reverse">
                                <div className=" walletmodalStatus col-md-5">
                                    <div className="status">
                                        {
                                            activeWallet
                                                ? <h6 className="text-center text-light mb-3">{activeWallet.wallet}</h6>
                                                : <h6 className="text-center text-light mb-3">Wallet is not Connected</h6>
                                        }
                                        <div className="statusConect">
                                            <span><img src="favicon.ico" alt="" /></span>
                                            <div className={statusAction.status === "loading" ? "circle360 icon fs-1 text-white" : "icon fs-1 text-white"}>{(statusAction.status === 'rejected' || statusAction.status === 'notFiled') ? "link_off" : "link"}</div>
                                            {
                                                walletIcon
                                                    ? <span><img src={walletIcon} alt="" /></span>
                                                    : <span className="icon">account_balance_wallet</span>
                                            }
                                        </div>
                                        {
                                            statusAction.status === "loading" && <strong className="text-light">{statusAction.message}</strong>
                                        }
                                        {
                                            statusAction.status === "idle" && <strong className="text-light">{statusAction.message}</strong>
                                        }
                                        {
                                            statusAction.status === "rejected" && <strong className="text-danger">{statusAction.message}</strong>
                                        }
                                        {
                                            (activeWallet && props.showModalWallet === "wallet")
                                            &&
                                            <div className="statusInfo">
                                                <div>
                                                    <p>Your Account:</p>
                                                    <div className="d-flex align-items-center">
                                                        <strong>{address?.substring(0, 12) + " . . . " + address?.substring(address?.length - 8, address?.length)}</strong>
                                                        <i className='icon ms-2 fs-3' onClick={() => navigator.clipboard.writeText(address)} title="copy address">copy</i>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p>Active network:</p>
                                                    <strong>{chainId}</strong>
                                                </div>
                                            </div>
                                        }
                                        {
                                            props.showModalWallet === "action"
                                            &&
                                            <>
                                                <div className="actionWallet">
                                                    <img src="/Icon/sendVoice.png" alt="" />
                                                </div>
                                                <h6>Send Voice to Blockchain</h6>
                                            </>
                                        }
                                    </div>
                                </div>
                                <div className="col-md-7 d-flex flex-column justify-content-between ">
                                    <div className="walletModalHeader">
                                        {
                                            activeWallet
                                                ? <h6 className="m-0"><strong>{activeWallet.wallet}</strong> is connected</h6>
                                                : <h6 className="m-0">Connect to Wallet</h6>
                                        }
                                        <span className="icon fs-4" style={{ cursor: "pointer" }} onClick={() => {props.setShowModalWallet(false);calledSendMessage.current = false;}}>close</span>
                                    </div>
                                    {
                                        (activeWallet && props.showModalWallet === "wallet")
                                        && <>
                                            <div>
                                                <div className="connectWallet w-100 py-4 px-2">
                                                    <span><img src="favicon.ico" alt="" /></span>
                                                    <span style={{ marginLeft: "-20px" }}><img src={walletIcon} alt="" /></span>
                                                </div>
                                            </div>
                                            {statusAction.status === "loading"
                                                ? <span className="text-primary fs-6 font-semi mx-auto mb-3 d-block">please wait ...</span>
                                                : <button className="btn-link fs-6 bg-white p-0 border-0 text-danger font-semi mx-auto mb-3 d-block" onClick={() => handelDisconnect()} >Disconnect Wallet</button>}
                                            {(statusAction.status === "rejected" && statusConnection.status === "idle") &&
                                                <button className="btn btn-primary fs-6 font-semi mx-auto mb-3 d-block" onClick={() => handeltryLoginAgain()} > try again to login</button>}
                                        </>
                                    }
                                    {
                                        !activeWallet
                                        &&
                                        <div className="w-100 p-2 d-flex flex-column flex-grow-1 justify-content-center">
                                            <button className="selectWallet" onClick={() => handelConnect()}>
                                                <span> VENOM WALLET</span>
                                                <img style={{ borderRadius: "50%" }} src="/Icon/venomLogo128.png" alt="Venom Logo" />
                                            </button>
                                            {!window.__hasVenomProvider && <a href="https://chrome.google.com/webstore/detail/venom-wallet/ojggmchlghnjlapmfbnjholfjkiidbch" className="ms-1" target="_blank" rel="noopener noreferrer">Install Extention</a>}
                                            <p className="mt-4 mb-3 text-center">Connect and confirm it in your wallet App</p>
                                        </div>
                                    }
                                    {
                                        (activeWallet && props.showModalWallet === "action")
                                        &&
                                        <>
                                            <div className="w-100  p-2">
                                                <table id="actionTable" className="actionProps">
                                                    <tbody>
                                                        <tr>
                                                            <td>Network:</td>
                                                            <td><strong>{chainId}</strong></td>
                                                        </tr>
                                                        <tr>
                                                            <td>Amount:</td>
                                                            <td>
                                                                <input onChange={(e) => setAmount(e.target.value)} className="value" type="number" inputMode="numeric" placeholder="0.0" />
                                                                <strong>{chainId}</strong>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td colSpan="3" className="text-center">
                                                                <small className="text-primary">To changing network use your app wallet</small>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>To:</td>
                                                            <td>
                                                                <input required className="address" onChange={(e) => setToAddress(e.target.value)} type="text" placeholder="address for send" />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="d-flex align-items-center">
                                                                <span>Voice:</span>
                                                                {
                                                                    isPlaying
                                                                        ?
                                                                        <i onClick={() => { document.getElementById('idAudio').pause(); document.getElementById('idAudio').currentTime = 0; }} className="icon fs-1 ms-1 text-primary" style={{ cursor: "pointer" }}>stop_circle</i>
                                                                        :
                                                                        <i onClick={() => document.getElementById('idAudio').play()} className="icon fs-1 ms-1 text-primary" style={{ cursor: "pointer" }}>play_circle</i>
                                                                }
                                                                <audio id="idAudio" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onLoadedMetadata={(e) => setAudioDuring(e.target.duration)} src={props.voiceUrl} className="d-none" controls />
                                                            </td>
                                                            <td><strong>{audioDuring}s</strong></td>
                                                        </tr>
                                                        <tr>
                                                            <td>txHash:</td>
                                                            <td>
                                                                <div className="d-flex align-items-center ">
                                                                    {/* {
                                                                    txHash !== ""
                                                                    &&
                                                                    <button className="btn btn-success" onClick={() => navigator.clipboard.writeText(txHash)}><span className="icon">copy</span>Copy TxId</button>
                                                                } */}
                                                                    {
                                                                        sendTxIdAPI.Status === "loading" && <div className="d-flex align-items-center"><span className="me-1">sending TxId</span><span className="loadingspan"></span></div>
                                                                    }
                                                                    {
                                                                        (calledSendMessage.current && sendTxIdAPI.Status === "idle") && <div className="d-flex align-items-center"><span className="me-1">TxId sent</span><span className="icon fs-4 text-primary">task_alt</span></div>
                                                                    }
                                                                    {
                                                                        (calledSendMessage.current && sendTxIdAPI.Status === "rejected") && <div className="d-flex align-items-center"><button className="me-1 btn btn-outline-danger" onClick={() => handelSendTxId(txHash)}>Resend TxId</button><span className="icon fs-4 text-danger">error</span></div>
                                                                    }
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            {
                                                statusAction.status === "notFiled" && <small className="text-danger">{statusAction.message}</small>
                                            }
                                            {statusAction.status === "loading"
                                                ? <span className="text-primary fs-6 font-semi mx-auto mb-3 d-block">please wait ...</span>
                                                : (statusAction.status === "rejected" && statusConnection.status === "idle")
                                                    ? isLogin
                                                        ? <button className="btn btn-primary mx-auto d-block mb-2" onClick={() => handelSendTransAction(true)}>Send again TransAction</button>
                                                        : <button className="btn btn-primary fs-6 font-semi mx-auto mb-3 d-block" onClick={() => handeltryLoginAgain()} > try again to login</button>
                                                    : <button className="btn btn-primary mx-auto d-block mb-2" onClick={() => handelSendTransAction(true)}>Send TransAction</button>
                                            }
                                        </>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            }
        </>
    )
}
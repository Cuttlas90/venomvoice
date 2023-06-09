import { initVenomConnect } from './configure';

var _provider;
export const initialWallet = async () => {
    const _venomConnect = await initVenomConnect();
    return _venomConnect
};

export const set_provider = (_prov) => {
    _provider = _prov;
}
export const getTransaction = async (txHash) => {
    console.log("providerrrrrrrrrrrrrrr", _provider)
    var Boc;
    try {
        Boc = await _provider.getTransaction({
            hash: txHash
        })
    }
    catch (err) {
        console.log(err)
    }
    console.log(Boc.transaction.outMessages[0].body);
    return (Boc.transaction.outMessages[0].body)
}


export const DecodeBoc = async (boc) => {
    const unpacked = await _provider.unpackFromCell({
        structure: [{ "name": "data", "type": "string" }],
        boc: boc,
        allowPartial: true,
    });
    console.log('Unpacked data:', unpacked);
    return (unpacked)
}

export const decryptData = async (encriptedData) => {
    var res = await _provider.decryptData(
        encriptedData
    )
    console.log("decryptData");
    console.log(res);
    return (res)
}
import { VenomConnect } from 'venom-connect';
import { ProviderRpcClient } from 'everscale-inpage-provider';
import { EverscaleStandaloneClient } from 'everscale-standalone-client';

const standaloneFallback = () =>
EverscaleStandaloneClient.create({
  connection: {
    id: 1000,
    group: "venom_testnet",
    type: "jrpc",
    data: {
      endpoint: "https://jrpc-testnet.venom.foundation/rpc",
    },
  },
});
export const initVenomConnect = async () => {
  return new VenomConnect({
    theme: 'dark',
    checkNetworkId: 1000,
    providersOptions: {
      venomwallet: {
        links:{},
        walletWaysToConnect: [
          {
            package: ProviderRpcClient,
            packageOptions: {
              fallback: VenomConnect.getPromise('venomwallet', 'extension') || (() => Promise.reject()),
              forceUseFallback: true,
            },
            packageOptionsStandalone: {
              fallback: standaloneFallback,
              forceUseFallback: true,
            },
            id: 'extension',
            type: 'extension',
          },
        ],
        defaultWalletWaysToConnect: [
          'mobile',
          'ios',
          'android',
        ],
      },
    },
  });
};
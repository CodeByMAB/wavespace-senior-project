import {
  connect,
  defaultConfig,
  Network,
  Seed,
} from '@breeztech/breez-sdk-spark-react-native';

class BreezSDKService {
  private sdk: any = null;
  private initialized = false;

  async initialize() {
    if (this.initialized && this.sdk) {
      return this.sdk;
    }

    const mnemonic = 'need to put test mnemonic here ';
    const seed = new Seed.Mnemonic({
      mnemonic,
      passphrase: undefined,
    });

const config = defaultConfig(Network.Mainnet);    config.apiKey = 'need BREEZ API key here';

    this.sdk = await connect({
      config,
      seed,
      storageDir: 'wavespace-wallet',
    });

    this.initialized = true;
    return this.sdk;
  }

  async getSDK() {
    if (!this.sdk) {
      await this.initialize();
    }
    return this.sdk;
  }
}

export default new BreezSDKService();
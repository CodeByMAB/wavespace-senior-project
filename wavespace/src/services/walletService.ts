import {
  connect,
  defaultConfig,
  Seed,
  Network,
  type BreezSdkInterface,
} from '@breeztech/breez-sdk-spark-react-native';
import { documentDirectory } from 'expo-file-system/legacy';
import { getMnemonic, getPassphrase } from './secureStorageService';

let sdkInstance: BreezSdkInterface | null = null;

/**
 * Returns the active Breez SDK instance, or null if the wallet has not been
 * initialized yet.
 */
export function getWalletInstance(): BreezSdkInterface | null {
  return sdkInstance;
}

/**
 * Derives wallet keys from the stored mnemonic + passphrase and connects to
 * the Breez Spark network, starting the initial balance/history sync.
 *
 * Reads mnemonic and passphrase from secure storage (both reads trigger the
 * device-protected key fetch, requiring biometric/PIN authentication).
 *
 * @throws if the mnemonic is missing or SDK connection fails.
 */
export async function initializeWallet(): Promise<BreezSdkInterface> {
  if (sdkInstance) {
    return sdkInstance;
  }

  const mnemonic = await getMnemonic();
  if (!mnemonic) {
    throw new Error('No wallet found. Please create or restore a wallet first.');
  }

  const passphrase = await getPassphrase();

  const seed = new Seed.Mnemonic({
    mnemonic,
    passphrase: passphrase ?? undefined,
  });

  const config = defaultConfig(Network.Mainnet);

  // Derive a local filesystem path for SDK persistent storage.
  const docDir = (documentDirectory ?? '').replace(/^file:\/\//, '');
  const storageDir = `${docDir}breez-sdk`;

  sdkInstance = await connect({
    config,
    seed,
    storageDir,
  });

  return sdkInstance;
}

/**
 * Disconnects the active SDK instance and clears the cached reference.
 * Call on wallet reset or app lock.
 */
export async function disconnectWallet(): Promise<void> {
  if (sdkInstance) {
    try {
      await sdkInstance.disconnect();
    } catch {
      // Ignore disconnect errors during cleanup
    }
    sdkInstance = null;
  }
}

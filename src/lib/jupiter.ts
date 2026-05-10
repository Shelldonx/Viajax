// Jupiter Terminal integration — swap any token to USDC on Solana Mainnet

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

interface JupiterTerminalParams {
  amountUsdc: number;
  targetContainerId: string;
  onSuccess: (txid: string) => void;
  onError: (error: string) => void;
}

interface JupiterWindow {
  Jupiter: {
    init: (config: Record<string, unknown>) => void;
    close: () => void;
  };
}

// Initialize Jupiter Terminal inline in a container
export function initJupiterTerminal(params: JupiterTerminalParams): void {
  const jupWindow = window as unknown as JupiterWindow;
  if (!jupWindow.Jupiter) {
    console.error("[Jupiter] Jupiter Terminal not loaded. Add the script tag first.");
    params.onError("Jupiter Terminal not available");
    return;
  }

  const amountMicroUsdc = String(Math.floor(params.amountUsdc * 1_000_000));

  jupWindow.Jupiter.init({
    displayMode: "integrated",
    integratedTargetId: params.targetContainerId,
    endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com",
    strictTokenList: false,
    defaultExplorer: "Solscan",
    formProps: {
      initialOutputMint: USDC_MINT,
      fixedOutputMint: true,
      initialAmount: amountMicroUsdc,
    },
    onSuccess: ({ txid }: { txid: string }) => {
      console.log(`[Jupiter] Swap successful: ${txid}`);
      params.onSuccess(txid);
    },
    onSwapError: ({ error }: { error: string }) => {
      console.error(`[Jupiter] Swap error: ${error}`);
      params.onError(error);
    },
  });
}

// Close Jupiter Terminal
export function closeJupiterTerminal(): void {
  const jupWindow = window as unknown as JupiterWindow;
  if (jupWindow.Jupiter) {
    jupWindow.Jupiter.close();
  }
}

// Jupiter Terminal script URL
export const JUPITER_TERMINAL_SCRIPT = "https://terminal.jup.ag/main-v3.js";

export { USDC_MINT };

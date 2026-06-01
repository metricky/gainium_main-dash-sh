import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet } from 'lucide-react';
import type { WalletProvider } from '@/hooks/useWeb3Wallet';

interface WalletSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectWallet: (provider: WalletProvider) => void;
  wallets: WalletProvider[];
}

export const WalletSelectorDialog: React.FC<WalletSelectorDialogProps> = ({
  open,
  onClose,
  onSelectWallet,
  wallets,
}) => {
  const handleSelectWallet = (wallet: WalletProvider) => {
    onSelectWallet(wallet);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-xs" zIndex={70}>
        <DialogHeader>
          <DialogTitle>Select Wallet</DialogTitle>
        </DialogHeader>
        {wallets.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No Web3 wallets detected. Please install MetaMask, Bitget Wallet,
            OKX Wallet, or another compatible wallet.
          </p>
        ) : (
          <ul className="space-y-1">
            {wallets.map((wallet) => (
              <li key={wallet.name}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleSelectWallet(wallet)}
                  disabled={!wallet.detected}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted overflow-hidden shrink-0">
                    {wallet.icon ? (
                      <img
                        src={wallet.icon}
                        alt={wallet.name}
                        className="h-9 w-9 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (
                            e.target as HTMLImageElement
                          ).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Wallet
                      className={`h-4 w-4 text-muted-foreground ${wallet.icon ? 'hidden' : ''}`}
                    />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {wallet.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {wallet.detected ? 'Detected' : 'Not installed'}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

import { createContext, useContext, useState } from 'react';

interface AccountContextType {
  isAccountOpen: boolean;
  openAccount: () => void;
  closeAccount: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const openAccount = () => setIsAccountOpen(true);
  const closeAccount = () => setIsAccountOpen(false);

  return (
    <AccountContext.Provider value={{ isAccountOpen, openAccount, closeAccount }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within AccountProvider');
  }
  return context;
};
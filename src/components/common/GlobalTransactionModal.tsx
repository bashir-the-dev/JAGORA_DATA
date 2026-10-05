import React from 'react';
import { useSystemStatus } from '../../context/SystemStatusContext';
import { TransactionProcessingModal } from './ProfessionalLoader';

export const GlobalTransactionModal: React.FC<{ isLightMode?: boolean }> = ({ isLightMode = true }) => {
  const { transactionProgress } = useSystemStatus();

  if (!transactionProgress || !transactionProgress.isOpen) {
    return null;
  }

  return (
    <TransactionProcessingModal
      isOpen={transactionProgress.isOpen}
      serviceTitle={transactionProgress.title}
      recipient={transactionProgress.recipient}
      amount={transactionProgress.amount}
      isLightMode={isLightMode}
    />
  );
};

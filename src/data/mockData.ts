import { NetworkProvider, DataPlan, Transaction, NotificationItem, UserProfile } from '../types';

export const initialUser: UserProfile = {
  name: '',
  phone: '',
  email: '',
  avatarUrl: '',
  isVerified: false,
  balance: 0.00,
  bonusBalance: 0.00,
  biometricEnabled: false,
  hasPin: false,
  virtualAccounts: [],
};

export const networkProviders: NetworkProvider[] = [
  {
    id: 'mtn',
    name: 'MTN',
    badge: 'M',
    badgeColor: '#ffdb3c',
    textColor: '#ffdb3c',
    bgColor: 'rgba(255, 219, 60, 0.1)',
  },
  {
    id: 'airtel',
    name: 'Airtel',
    badge: 'A',
    badgeColor: '#ffb4ab',
    textColor: '#ff5252',
    bgColor: 'rgba(255, 82, 82, 0.1)',
  },
  {
    id: 'glo',
    name: 'Glo',
    badge: 'G',
    badgeColor: '#34a853',
    textColor: '#00c853',
    bgColor: 'rgba(0, 200, 83, 0.1)',
  },
  {
    id: '9mobile',
    name: '9mobile',
    badge: '9',
    badgeColor: '#006400',
    textColor: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.1)',
  },
];

export const dataPlans: DataPlan[] = [
  // MTN Plans
  { id: 'mtn-500mb', network: 'mtn', size: '500MB', validity: '30 Days', type: 'SME Bundle', price: 150 },
  { id: 'mtn-1gb', network: 'mtn', size: '1GB', validity: '30 Days', type: 'SME Bundle', price: 290 },
  { id: 'mtn-2gb', network: 'mtn', size: '2GB', validity: '30 Days', type: 'SME Bundle', price: 580 },
  { id: 'mtn-3gb', network: 'mtn', size: '3GB', validity: '30 Days', type: 'SME Bundle', price: 870 },
  { id: 'mtn-5gb', network: 'mtn', size: '5GB', validity: '30 Days', type: 'SME Bundle', price: 1450 },
  { id: 'mtn-10gb', network: 'mtn', size: '10GB', validity: '30 Days', type: 'SME Bundle', price: 2900 },
  { id: 'mtn-cg-500mb', network: 'mtn', size: '500MB', validity: '30 Days', type: 'Corporate Gifting', price: 160 },
  { id: 'mtn-cg-1gb', network: 'mtn', size: '1GB', validity: '30 Days', type: 'Corporate Gifting', price: 295 },
  { id: 'mtn-cg-2gb', network: 'mtn', size: '2GB', validity: '30 Days', type: 'Corporate Gifting', price: 590 },
  { id: 'mtn-cg-3gb', network: 'mtn', size: '3GB', validity: '30 Days', type: 'Corporate Gifting', price: 885 },
  { id: 'mtn-cg-5gb', network: 'mtn', size: '5GB', validity: '30 Days', type: 'Corporate Gifting', price: 1475 },
  { id: 'mtn-cg-10gb', network: 'mtn', size: '10GB', validity: '30 Days', type: 'Corporate Gifting', price: 2950 },
  { id: 'mtn-cg-15gb', network: 'mtn', size: '15GB', validity: '30 Days', type: 'Corporate Gifting', price: 4400 },
  { id: 'mtn-cg-20gb', network: 'mtn', size: '20GB', validity: '30 Days', type: 'Corporate Gifting', price: 5850 },
  { id: 'mtn-share-1gb-7d', network: 'mtn', size: '1GB', validity: '7 Days', type: 'Data Share', price: 450 },
  { id: 'mtn-share-2gb-7d', network: 'mtn', size: '2GB', validity: '7 Days', type: 'Data Share', price: 850 },
  { id: 'mtn-share-3gb-7d', network: 'mtn', size: '3GB', validity: '7 Days', type: 'Data Share', price: 1200 },
  { id: 'mtn-share-5gb-30d', network: 'mtn', size: '5GB', validity: '30 Days', type: 'Data Share', price: 1800 },
  { id: 'mtn-gifting-25gb', network: 'mtn', size: '25GB', validity: '30 Days', type: 'Direct Gifting', price: 7500 },
  { id: 'mtn-gifting-40gb', network: 'mtn', size: '40GB', validity: '30 Days', type: 'Direct Gifting', price: 11500 },

  // Airtel Plans
  { id: 'airtel-500mb', network: 'airtel', size: '500MB', validity: '30 Days', type: 'Corporate Gifting', price: 160 },
  { id: 'airtel-1gb', network: 'airtel', size: '1GB', validity: '30 Days', type: 'Corporate Gifting', price: 295 },
  { id: 'airtel-2gb', network: 'airtel', size: '2GB', validity: '30 Days', type: 'Corporate Gifting', price: 590 },
  { id: 'airtel-3gb', network: 'airtel', size: '3GB', validity: '30 Days', type: 'Corporate Gifting', price: 885 },
  { id: 'airtel-4gb', network: 'airtel', size: '4GB', validity: '30 Days', type: 'Corporate Gifting', price: 1180 },
  { id: 'airtel-5gb', network: 'airtel', size: '5GB', validity: '30 Days', type: 'Corporate Gifting', price: 1475 },
  { id: 'airtel-10gb', network: 'airtel', size: '10GB', validity: '30 Days', type: 'Corporate Gifting', price: 2950 },
  { id: 'airtel-15gb', network: 'airtel', size: '15GB', validity: '30 Days', type: 'Corporate Gifting', price: 4400 },
  { id: 'airtel-20gb', network: 'airtel', size: '20GB', validity: '30 Days', type: 'Corporate Gifting', price: 5850 },
  { id: 'airtel-gift-1gb-7d', network: 'airtel', size: '1GB', validity: '7 Days', type: 'Direct Gifting', price: 795 },
  { id: 'airtel-gift-1.5gb-7d', network: 'airtel', size: '1.5GB', validity: '7 Days', type: 'Direct Gifting', price: 995 },
  { id: 'airtel-gift-8gb-30d', network: 'airtel', size: '8GB', validity: '30 Days', type: 'Direct Gifting', price: 2975 },
  { id: 'airtel-gift-25gb-30d', network: 'airtel', size: '25GB', validity: '30 Days', type: 'Direct Gifting', price: 7900 },

  // Glo Plans
  { id: 'glo-500mb', network: 'glo', size: '500MB', validity: '30 Days', type: 'Corporate Gifting', price: 150 },
  { id: 'glo-1gb', network: 'glo', size: '1GB', validity: '30 Days', type: 'Corporate Gifting', price: 285 },
  { id: 'glo-2gb', network: 'glo', size: '2GB', validity: '30 Days', type: 'Corporate Gifting', price: 570 },
  { id: 'glo-3gb', network: 'glo', size: '3GB', validity: '30 Days', type: 'Corporate Gifting', price: 855 },
  { id: 'glo-5gb', network: 'glo', size: '5GB', validity: '30 Days', type: 'Corporate Gifting', price: 1425 },
  { id: 'glo-10gb', network: 'glo', size: '10GB', validity: '30 Days', type: 'Corporate Gifting', price: 2850 },
  { id: 'glo-1.5gb', network: 'glo', size: '1.5GB', validity: '30 Days', type: 'Gifting Bundle', price: 530 },
  { id: 'glo-3gb-gift', network: 'glo', size: '3GB', validity: '30 Days', type: 'Gifting Bundle', price: 1000 },
  { id: 'glo-7gb', network: 'glo', size: '7GB', validity: '30 Days', type: 'Gifting Bundle', price: 2000 },
  { id: 'glo-14gb', network: 'glo', size: '14GB', validity: '30 Days', type: 'Gifting Bundle', price: 3900 },

  // 9mobile Plans
  { id: '9mob-500mb', network: '9mobile', size: '500MB', validity: '30 Days', type: 'SME Bundle', price: 150 },
  { id: '9mob-1gb', network: '9mobile', size: '1GB', validity: '30 Days', type: 'SME Bundle', price: 250 },
  { id: '9mob-1.5gb', network: '9mobile', size: '1.5GB', validity: '30 Days', type: 'SME Bundle', price: 375 },
  { id: '9mob-2gb', network: '9mobile', size: '2GB', validity: '30 Days', type: 'SME Bundle', price: 500 },
  { id: '9mob-3gb', network: '9mobile', size: '3GB', validity: '30 Days', type: 'SME Bundle', price: 750 },
  { id: '9mob-4gb', network: '9mobile', size: '4GB', validity: '30 Days', type: 'SME Bundle', price: 1000 },
  { id: '9mob-5gb', network: '9mobile', size: '5GB', validity: '30 Days', type: 'SME Bundle', price: 1250 },
  { id: '9mob-10gb', network: '9mobile', size: '10GB', validity: '30 Days', type: 'SME Bundle', price: 2500 },
  { id: '9mob-15gb', network: '9mobile', size: '15GB', validity: '30 Days', type: 'SME Bundle', price: 3750 },
  { id: '9mob-20gb', network: '9mobile', size: '20GB', validity: '30 Days', type: 'SME Bundle', price: 5000 },
  { id: '9mob-40gb', network: '9mobile', size: '40GB', validity: '30 Days', type: 'SME Bundle', price: 9900 },
];

export const initialTransactions: Transaction[] = [];

export const initialNotifications: NotificationItem[] = [];

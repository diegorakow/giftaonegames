export const PLATFORMS = {
  PSN: {
    id: 'psn',
    name: 'PlayStation',
    color: 'platform-psn',
    gradient: 'from-blue-600 to-blue-800',
  },
  XBOX: {
    id: 'xbox',
    name: 'Xbox',
    color: 'platform-xbox',
    gradient: 'from-green-600 to-green-800',
  },
  STEAM: {
    id: 'steam',
    name: 'Steam',
    color: 'platform-steam',
    gradient: 'from-slate-700 to-slate-900',
  },
  NINTENDO: {
    id: 'nintendo',
    name: 'Nintendo',
    color: 'platform-nintendo',
    gradient: 'from-red-600 to-red-800',
  },
} as const;

export const CATEGORIES = [
  { id: 'gift-card', name: 'Gift Cards', icon: 'CreditCard' },
  { id: 'subscription', name: 'Assinaturas', icon: 'Calendar' },
  { id: 'coins', name: 'Moedas Virtuais', icon: 'Coins' },
  { id: 'dlc', name: 'DLCs & Add-ons', icon: 'Package' },
] as const;

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

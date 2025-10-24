const DATASET_KEY = 'scrollLockCount';

const getCount = () => Number(document.body.dataset[DATASET_KEY] || '0');

export const lockBodyScroll = () => {
  const current = getCount();
  if (current === 0) {
    document.body.style.overflow = 'hidden';
  }
  document.body.dataset[DATASET_KEY] = String(current + 1);
};

export const unlockBodyScroll = () => {
  const current = getCount();
  const next = Math.max(0, current - 1);
  if (next === 0) {
    document.body.style.overflow = '';
    delete document.body.dataset[DATASET_KEY];
  } else {
    document.body.dataset[DATASET_KEY] = String(next);
  }
};

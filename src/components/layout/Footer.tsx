
import React from 'react';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="text-center mt-12 py-4">
      <p className="text-gray-500 text-sm">
        {t('footer.text')}
      </p>
    </footer>
  );
};

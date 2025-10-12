
import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  return (
    <header className="text-center flex flex-col items-center pt-8">
      <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
        <Trans i18nKey="header.title">
          Hipervisor <span className="text-brand-blue">Curitiba do Amanhã</span>
        </Trans>
      </h1>
      <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
        {t('header.subtitle')}
      </p>
    </header>
  );
};

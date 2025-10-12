import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Footer } from './src/components/layout/Footer';
import { Header } from './src/components/layout/Header';
import { HomePage } from './src/pages/HomePage';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = t('app.title');
  }, [i18n.language, t]);

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 md:p-8 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-full mx-auto flex flex-col flex-grow">
        <Header />
        <HomePage />
        <Footer />
      </div>
    </div>
  );
};

export default App;
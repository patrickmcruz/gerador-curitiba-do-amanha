
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
        Gerador <span className="text-brand-blue">Curitiba do Amanhã</span>
      </h1>
      <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
        Suba sua própria imagem para ver Curitiba re-imaginada por IA
      </p>
    </header>
  );
};

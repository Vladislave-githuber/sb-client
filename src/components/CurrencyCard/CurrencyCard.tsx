import React from 'react';
import type { ICurrency } from '../../types';

const CurrencyCard: React.FC<{ currency: ICurrency }> = ({ currency }) => {
  return (
    <div className="currency-card">
      <div className="currency-card-header">
        <span className="currency-card-code">{currency.code}</span>
        <span className="currency-card-scale">Номинал: {currency.scale}</span>
      </div>
      <div className="currency-card-rates">
        <div className="currency-rate">
          <div className="currency-rate-label">Покупка</div>
          <div className="currency-rate-value">{currency.rateBuy.toFixed(2)}</div>
        </div>
        <div className="currency-rate">
          <div className="currency-rate-label">Продажа</div>
          <div className="currency-rate-value">{currency.rateSell.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyCard;
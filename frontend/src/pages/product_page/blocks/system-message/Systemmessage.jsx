import { useState } from 'react';
import './SystemMessage.css';

// Блок «System message» — окно в стиле классического Windows с характеристиками товара.
// details: { density: string, composition: string } — плотность и состав ткани.
// Закрывается по крестику; повторно открыть можно кнопкой-заглушкой снизу.
export default function SystemMessage({ details = {} }) {
  const [closed, setClosed] = useState(false);
  const { density = '—', composition = '—' } = details;

  if (closed) {
    return (
      <button type="button" className="sysmsg-reopen" onClick={() => setClosed(false)}>
        Показать характеристики товара
      </button>
    );
  }

  return (
    <div className="sysmsg">
      <div className="sysmsg-titlebar">
        <span className="sysmsg-title">System message</span>
        <button
          type="button"
          className="sysmsg-close"
          aria-label="Закрыть"
          onClick={() => setClosed(true)}
        >
          ×
        </button>
      </div>
      <div className="sysmsg-body">
        <p>плотность- {density}</p>
        <p>состав- {composition}</p>
      </div>
    </div>
  );
}
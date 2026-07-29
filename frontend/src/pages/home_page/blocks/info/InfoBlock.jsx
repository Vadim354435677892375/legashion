import { useState } from 'react';
import './infoBlock.css';
import docStackIcon from '../../../../assets/doc-stack-icon.png';
import truckGlyph from '../../../../assets/icons/glyph-truck.png';
import runnerGlyph from '../../../../assets/icons/glyph-runner.png';
import phoneGlyph from '../../../../assets/icons/glyph-phone.png';

// Блок «Документы» — три «файла» (доставка / возврат / контакты).
// Базовая иконка стопки документов и глифы (грузовик/бегун/телефон) — реальные
// картинки, присланные пользователем.
// note: текст показывается во всплывающем окне при клике, вместо перехода по href.
// href оставлен как запасной вариант (пока не задан note) — заменить на реальный
// путь к PDF, когда он будет готов.
const DOCS = [
  {
    label: 'Доставка.PDF',
    href: '/docs/delivery.pdf',
    glyph: truckGlyph,
    icon: 'truck',
    note: 'отправка заказа в течении 1-2 дней после оформления!',
  },
  {
    label: 'Возврат.PDF',
    href: '/docs/return.pdf',
    glyph: runnerGlyph,
    icon: 'runner',
    note:
      'возврат возможен в течении 7 дней с момента получения заказа, при условии сохранения товарного вида, наличие бирок и полного комплекта. Отсутствие следов носки.\nВозврат осуществляется через поддержку в Telegram',
  },
  { label: 'Контакты.PDF', href: '/docs/contacts.pdf', glyph: phoneGlyph, icon: 'phone' },
];

export default function InfoBlock() {
  const [openDoc, setOpenDoc] = useState(null);

  return (
    <div className="info-block">
      {DOCS.map((doc) => {
        const { label, href, glyph, icon, note } = doc;
        const cardInner = (
          <>
            <span className="doc-stack">
              <img className="doc-stack-img" src={docStackIcon} alt="" />
              <span className={`doc-glyph-wrap doc-glyph-wrap--${icon}`}>
                <img className="doc-glyph" src={glyph} alt="" />
              </span>
            </span>
            <span className="doc-label">{label}</span>
          </>
        );

        // Если для документа задан текст (note) — кликом открываем всплывающее
        // окно вместо перехода по ссылке.
        if (note) {
          return (
            <button
              type="button"
              className="doc-card"
              key={label}
              onClick={() => setOpenDoc(doc)}
            >
              {cardInner}
            </button>
          );
        }

        return (
          <a className="doc-card" href={href} key={label} target="_blank" rel="noreferrer">
            {cardInner}
          </a>
        );
      })}

      {openDoc && (
        <div className="doc-popup-overlay" onClick={() => setOpenDoc(null)}>
          <div className="doc-popup" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="doc-popup-close"
              aria-label="Закрыть"
              onClick={() => setOpenDoc(null)}
            >
              ×
            </button>
            <span className="doc-stack doc-stack--popup">
              <img className="doc-stack-img" src={docStackIcon} alt="" />
              <span className={`doc-glyph-wrap doc-glyph-wrap--${openDoc.icon}`}>
                <img className="doc-glyph" src={openDoc.glyph} alt="" />
              </span>
            </span>
            <span className="doc-label doc-label--popup">{openDoc.label}</span>
            <p className="doc-popup-text">
              {openDoc.note.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < openDoc.note.split('\n').length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
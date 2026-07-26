import './infoBlock.css';
import docStackIcon from '../../../../assets/doc-stack-icon.png';
import truckGlyph from '../../../../assets/icons/glyph-truck.png';
import runnerGlyph from '../../../../assets/icons/glyph-runner.png';
import phoneGlyph from '../../../../assets/icons/glyph-phone.png';

// Блок «Документы» — три ссылки-«файла» (доставка / возврат / контакты).
// Базовая иконка стопки документов и глифы (грузовик/бегун/телефон) — реальные
// картинки, присланные пользователем.
// href: пока заглушки — заменить на реальные пути к PDF, когда они будут готовы.
const DOCS = [
  { label: 'Доставка.PDF', href: '/docs/delivery.pdf', glyph: truckGlyph, icon: 'truck' },
  { label: 'Возврат.PDF', href: '/docs/return.pdf', glyph: runnerGlyph, icon: 'runner' },
  { label: 'Контакты.PDF', href: '/docs/contacts.pdf', glyph: phoneGlyph, icon: 'phone' },
];

export default function InfoBlock() {
  return (
    <div className="info-block">
      {DOCS.map(({ label, href, glyph, icon }) => (
        <a className="doc-card" href={href} key={label} target="_blank" rel="noreferrer">
          <span className="doc-stack">
            <img className="doc-stack-img" src={docStackIcon} alt="" />
            <span className={`doc-glyph-wrap doc-glyph-wrap--${icon}`}>
              <img className="doc-glyph" src={glyph} alt="" />
            </span>
          </span>
          <span className="doc-label">{label}</span>
        </a>
      ))}
    </div>
  );
}
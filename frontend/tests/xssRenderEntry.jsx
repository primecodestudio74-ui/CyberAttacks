import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import XSSAttack, { XSSLabView } from '../src/pages/Attacks/XSSAttack.jsx';

export const renderInitialXSS = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <XSSAttack />
    </MemoryRouter>
  );
export const renderXSSState = (state) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <XSSLabView state={state} dispatch={() => {}} />
    </MemoryRouter>
  );

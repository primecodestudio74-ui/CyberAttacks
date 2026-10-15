import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import MitmAttack from '../src/pages/Attacks/MitmAttack.jsx';
import DnsSpoofing from '../src/pages/Attacks/DnsSpoofing.jsx';

export const renderLabs = () => ({
  mitm: renderToStaticMarkup(<MemoryRouter><MitmAttack /></MemoryRouter>),
  dns: renderToStaticMarkup(<MemoryRouter><DnsSpoofing /></MemoryRouter>),
});

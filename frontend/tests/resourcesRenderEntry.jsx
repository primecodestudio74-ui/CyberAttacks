import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import ResourcesHub from '../src/components/Resources/ResourcesHub.jsx';

/** The resources hub is mounted inside the dashboard shell's router. */
export const renderResourcesHub = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <ResourcesHub />
    </MemoryRouter>
  );

export default renderResourcesHub;

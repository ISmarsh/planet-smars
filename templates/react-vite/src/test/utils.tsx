import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Renders a component wrapped in BrowserRouter for testing components that use
 * react-router hooks or Link components.
 */
export function renderWithRouter(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    ...options,
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
  });
}

export * from '@testing-library/react';

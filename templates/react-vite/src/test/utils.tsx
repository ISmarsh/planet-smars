import { render, RenderOptions, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Renders a component wrapped in BrowserRouter for testing components that use
 * react-router hooks or Link components.
 *
 * @param ui - The React element to render within the BrowserRouter context.
 * @param options - Optional render options (excluding wrapper, which is set to BrowserRouter).
 */
export function renderWithRouter(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    ...options,
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
  });
}

export { render, screen, fireEvent, waitFor, within };

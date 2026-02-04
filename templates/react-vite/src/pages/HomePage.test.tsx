import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('renders the welcome heading', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome')
  })

  it('renders all feature cards', () => {
    render(<HomePage />)

    expect(screen.getByText('React 19')).toBeInTheDocument()
    expect(screen.getByText('Vite')).toBeInTheDocument()
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('renders the getting started section', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { name: /getting started/i })).toBeInTheDocument()
    expect(screen.getByText(/package\.json/)).toBeInTheDocument()
  })
})

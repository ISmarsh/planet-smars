import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CreditsPage } from './CreditsPage'

describe('CreditsPage', () => {
  it('renders the credits heading', () => {
    render(<CreditsPage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Credits & Licenses')
  })

  it('renders the license section', () => {
    render(<CreditsPage />)

    expect(screen.getByRole('heading', { name: /this project/i })).toBeInTheDocument()
    expect(screen.getByText(/MIT License/i)).toBeInTheDocument()
  })

  it('renders dependency licenses', () => {
    render(<CreditsPage />)

    expect(screen.getByRole('link', { name: 'React' })).toHaveAttribute(
      'href',
      'https://github.com/facebook/react'
    )
    expect(screen.getByRole('link', { name: 'Vite' })).toHaveAttribute(
      'href',
      'https://github.com/vitejs/vite'
    )
    expect(screen.getByRole('link', { name: 'Tailwind CSS' })).toHaveAttribute(
      'href',
      'https://github.com/tailwindlabs/tailwindcss'
    )
  })

  it('renders acknowledgments section', () => {
    render(<CreditsPage />)

    expect(screen.getByRole('heading', { name: /acknowledgments/i })).toBeInTheDocument()
  })
})

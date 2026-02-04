import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useModalState } from './useModalState'

describe('useModalState', () => {
  it('starts closed with null item', () => {
    const { result } = renderHook(() => useModalState<string>())

    expect(result.current.item).toBeNull()
    expect(result.current.isOpen).toBe(false)
  })

  it('opens with the provided item', () => {
    const { result } = renderHook(() => useModalState<string>())

    act(() => {
      result.current.open('test-item')
    })

    expect(result.current.item).toBe('test-item')
    expect(result.current.isOpen).toBe(true)
  })

  it('closes and clears the item', () => {
    const { result } = renderHook(() => useModalState<string>())

    act(() => {
      result.current.open('test-item')
    })

    act(() => {
      result.current.close()
    })

    expect(result.current.item).toBeNull()
    expect(result.current.isOpen).toBe(false)
  })

  it('works with complex objects', () => {
    interface User {
      id: number
      name: string
    }

    const { result } = renderHook(() => useModalState<User>())
    const user = { id: 1, name: 'Alice' }

    act(() => {
      result.current.open(user)
    })

    expect(result.current.item).toEqual(user)
    expect(result.current.isOpen).toBe(true)
  })
})

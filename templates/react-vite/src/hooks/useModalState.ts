/**
 * useModalState — Generic hook for modal visibility tied to an item
 *
 * Unlike useDisclosure (boolean only), this hook holds the actual item,
 * making it easy to pass data to modals without separate state.
 *
 * Usage:
 *   const modal = useModalState<MyItem>()
 *   // open: modal.open(item)
 *   // close: modal.close()
 *   // render: {modal.item && <Modal item={modal.item} onClose={modal.close} />}
 */

import { useState, useCallback } from 'react'

export interface ModalState<T> {
  item: T | null
  isOpen: boolean
  open: (item: T) => void
  close: () => void
}

export function useModalState<T>(): ModalState<T> {
  const [item, setItem] = useState<T | null>(null)

  const open = useCallback((newItem: T) => {
    setItem(newItem)
  }, [])

  const close = useCallback(() => {
    setItem(null)
  }, [])

  return {
    item,
    isOpen: item !== null,
    open,
    close,
  }
}

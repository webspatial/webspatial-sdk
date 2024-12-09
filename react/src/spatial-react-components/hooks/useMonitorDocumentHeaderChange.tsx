import { useEffect } from 'react'
import { notifyUpdateStandInstanceLayout } from '../notifyUpdateStandInstanceLayout'

export function useMonitorDocumentHeaderChange() {
  useEffect(() => {
    const observer = new MutationObserver(mutationsList => {
      notifyUpdateStandInstanceLayout()
    })

    const config = {
      childList: true,
      subtree: true,
      attributes: true,
    }

    observer.observe(document.head, config)

    return () => {
      observer.disconnect()
    }
  }, [])
}

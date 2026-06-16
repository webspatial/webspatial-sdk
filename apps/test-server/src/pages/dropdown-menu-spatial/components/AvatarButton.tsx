import React from 'react'

export const AvatarButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>((props, ref) => {
  return (
    <button
      {...props}
      ref={ref}
      aria-label="user-menu"
      style={{
        display: 'inline-flex',
        width: '52px',
        height: '52px',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #38bdf8, #f97316)',
        color: '#ffffff',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      DB
    </button>
  )
})

AvatarButton.displayName = 'AvatarButton'

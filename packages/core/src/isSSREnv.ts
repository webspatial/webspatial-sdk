const isSSR = typeof window === 'undefined'

export const isSSREnv = () => isSSR

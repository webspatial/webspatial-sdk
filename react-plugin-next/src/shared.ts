const AVP = 'avp'
function getEnv() {
  const env = process.env.XR_ENV || ''
  return env
}

export { getEnv, AVP }

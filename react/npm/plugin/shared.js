const infix = 'avp'
function getEnv() {
  const env = process.env.XR_ENV || ''
  return env
}
module.exports = {
  getEnv,
  infix,
}

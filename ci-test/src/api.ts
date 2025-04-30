export const MOCHA_RESULT_API = '/api/mockresult'

export function postMochaResult(data: TestResults) {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }
  return fetch(MOCHA_RESULT_API, requestOptions).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  })
}

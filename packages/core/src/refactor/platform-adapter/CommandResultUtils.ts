import { CommandResult } from './interface'

export function CommandResultSuccess(data: any): CommandResult {
  return {
    success: true,
    data,
    errorCode: '0',
    errorMessage: '',
  }
}

export function CommandResultFailure(
  errorCode: string,
  errorMessage = '',
): CommandResult {
  return {
    success: false,
    data: undefined,
    errorCode,
    errorMessage,
  }
}

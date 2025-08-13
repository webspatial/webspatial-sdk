import { CommandResult } from './interface'

export function CommandResultSuccess(data: any): CommandResult {
  return {
    success: true,
    data,
    errorCode: '',
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

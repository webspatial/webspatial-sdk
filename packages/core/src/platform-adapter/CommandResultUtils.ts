import { CommandResult } from './interface'

export function CommandResultSuccess<TData>(data: TData): CommandResult<TData> {
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
): CommandResult<undefined> {
  return {
    success: false,
    data: undefined,
    errorCode,
    errorMessage,
  }
}

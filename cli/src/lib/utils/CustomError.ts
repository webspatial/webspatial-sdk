type ErrorType = 'info'|'warning'|'error';
type ErrorMessageItem ={
    code: number;
    message: string;
    tag?: string;
    message_staring_params: Record<string, any>;
}
class CustomError extends Error {
  type: ErrorType;
  customMessage: ErrorMessageItem| Array<ErrorMessageItem>;
  constructor(customMessage: ErrorMessageItem| Array<ErrorMessageItem>, type?: ErrorType) {
    super(JSON.stringify(customMessage));
    this.customMessage = customMessage;
    this.type = type || 'info';
  }
}

export {CustomError};

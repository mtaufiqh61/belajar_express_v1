class AppError extends Error {

  status: number;
  errors: any[];
  
  constructor(message: string, status: number, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export default AppError;
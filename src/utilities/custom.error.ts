export default class CustomError extends Error {
  status: number;

  constructor(message: string, status: number, name = "Error") {
    super(message);
    this.name = name || "Error";
    this.status = status;

    Error.captureStackTrace(this, this.constructor);
  }
}

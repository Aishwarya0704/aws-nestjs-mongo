export class PageDto {
  readonly data: [] | object;
  readonly message: string;

  constructor(data: [] | object, message?: string) {
    this.data = data
    this.message = message;
  }
}

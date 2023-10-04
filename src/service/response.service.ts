import { PageDto } from "../dtos/page.dto";

export class ResponseService {
  static sendResponse(data: any, message?: string) {
    return new PageDto(data, message);
  }
}

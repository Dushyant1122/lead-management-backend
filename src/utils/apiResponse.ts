class ApiResponse {
  success: boolean;
  constructor(
    public statusCode: number,
    public data: object | null,
    public message: string
  ) {
    this.success = statusCode < 400;
  }
}

export default ApiResponse;

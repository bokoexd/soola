export interface ApiError {
  response?: {
    data?: {
      message?: string;
      requiresLogin?: boolean;
    };
    status?: number;
  };
  request?: any;
  message?: string;
  config?: {
    url?: string;
  };
}

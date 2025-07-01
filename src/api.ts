import axios, { AxiosResponse, AxiosError } from 'axios';
import type { ApiResponse, ApiError, ApiConfig } from './types';

class MosdacApiClient {
  private config: ApiConfig;
  private axiosInstance;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:8000',
      timeout: config.timeout || 15000,
      apiKey: config.apiKey,
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`[API] Making request to: ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        console.log('[API] Response received:', response.status);
        return response;
      },
      (error: AxiosError) => {
        console.error('[API] Response error:', error);
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        error: 'API_ERROR',
        message: (error.response.data as any)?.message || 'Server error occurred',
        status: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        error: 'NETWORK_ERROR',
        message: 'Unable to connect to MOSDAC services. Please check your connection.',
        status: 0,
      };
    } else {
      // Request setup error
      return {
        error: 'REQUEST_ERROR',
        message: error.message || 'Failed to make request',
        status: -1,
      };
    }
  }

  async askQuestion(query: string): Promise<ApiResponse> {
    try {
      const response = await this.axiosInstance.post<ApiResponse>('/api/ask', {
        query: query.trim(),
        timestamp: new Date().toISOString(),
      });

      return response.data;
    } catch (error) {
      throw error as ApiError;
    }
  }

  async getHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.axiosInstance.get('/api/health');
      return response.data;
    } catch (error) {
      throw this.handleApiError(error as AxiosError);
    }
  }

  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update axios instance with new config
    this.axiosInstance.defaults.baseURL = this.config.baseUrl;
    this.axiosInstance.defaults.timeout = this.config.timeout;
    
    if (this.config.apiKey) {
      this.axiosInstance.defaults.headers.Authorization = `Bearer ${this.config.apiKey}`;
    }
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }
}

// Mock API responses for development
class MockApiClient {
  private responses: Record<string, ApiResponse> = {
    'what is mosdac': {
      answer: 'MOSDAC (Meteorological and Oceanographic Satellite Data Archival Centre) is a facility at Space Applications Centre (SAC), ISRO for archival, processing and dissemination of Oceanographic, Atmospheric and Land satellite data.',
      sources: ['https://www.mosdac.gov.in/about'],
      related_links: [
        {
          title: 'MOSDAC Data Portal',
          url: 'https://www.mosdac.gov.in/data',
          description: 'Access satellite data and products'
        }
      ],
      confidence: 0.95
    },
    'download satellite data': {
      answer: 'To download satellite data from MOSDAC: 1) Register on the MOSDAC portal, 2) Browse the data catalog, 3) Select your required dataset, 4) Choose the time period and geographical area, 5) Submit your request. Data will be processed and made available for download.',
      sources: ['https://www.mosdac.gov.in/data-download-guide'],
      related_links: [
        {
          title: 'User Registration',
          url: 'https://www.mosdac.gov.in/register',
          description: 'Create your MOSDAC account'
        }
      ],
      confidence: 0.92
    }
  };

  async askQuestion(query: string): Promise<ApiResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const normalizedQuery = query.toLowerCase().trim();
    
    // Find matching response
    for (const [key, response] of Object.entries(this.responses)) {
      if (normalizedQuery.includes(key)) {
        return {
          ...response,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Default response
    return {
      answer: `I understand you're asking about "${query}". While I don't have a specific answer for this query yet, I can help you with information about MOSDAC services, satellite data access, and data products. Please try rephrasing your question or ask about specific satellites or data types.`,
      sources: ['https://www.mosdac.gov.in'],
      confidence: 0.5,
      timestamp: new Date().toISOString()
    };
  }

  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instances
export const apiClient = new MosdacApiClient();
export const mockApiClient = new MockApiClient();

// Export for testing
export { MosdacApiClient, MockApiClient };
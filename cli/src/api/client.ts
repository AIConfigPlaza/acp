import axios, { AxiosInstance, AxiosError } from 'axios'
import { getToken, getBaseUrl } from '../config/token.js'
import type {
  ApiResponse,
  Solution,
  AgentConfig,
  Prompt,
  McpConfig
} from '../types/index.js'

/**
 * API 客户端封装
 */

class ApiClient {
  private client: AxiosInstance
  private baseUrlPromise: Promise<string>

  constructor() {
    // 异步获取 BASE_URL
    this.baseUrlPromise = getBaseUrl()

    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 请求拦截器：自动添加 token 和 baseURL
    this.client.interceptors.request.use(async (config) => {
      // 设置 baseURL
      if (!config.baseURL) {
        config.baseURL = await this.baseUrlPromise
      }

      // 添加 token
      const token = await getToken()
      if (token) {
        config.headers['X-CLI-TOKEN'] = token
      }
      return config
    })

    // 响应拦截器：统一错误处理
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status
          const message = (error.response.data as any)?.message || error.message

          if (status === 401) {
            throw new Error('认证失败，请先执行 acp login 登录')
          } else if (status === 403) {
            throw new Error('权限不足，请检查 token 是否有效')
          } else if (status === 404) {
            throw new Error('请求的资源不存在')
          } else if (status >= 500) {
            throw new Error(`服务器错误 (${status}): ${message}`)
          } else {
            throw new Error(`请求失败 (${status}): ${message}`)
          }
        } else if (error.request) {
          throw new Error('网络错误，请检查网络连接')
        } else {
          throw new Error(`请求配置错误: ${error.message}`)
        }
      }
    )
  }

  /**
   * 获取解决方案列表
   */
  async getSolutions(aiTool?: string): Promise<ApiResponse<Solution[]>> {
    const params = aiTool ? { aiTool } : {}
    const response = await this.client.get<ApiResponse<Solution[]>>(
      '/api/cli/solutions',
      { params }
    )
    return response.data
  }

  /**
   * 获取解决方案详情
   */
  async getSolutionById(id: string): Promise<ApiResponse<Solution>> {
    const response = await this.client.get<ApiResponse<Solution>>(
      `/api/cli/solutions/${id}`
    )
    return response.data
  }

  /**
   * 获取 Agent 配置列表
   */
  async getAgents(): Promise<ApiResponse<AgentConfig[]>> {
    const response = await this.client.get<ApiResponse<AgentConfig[]>>(
      '/api/cli/agents'
    )
    return response.data
  }

  /**
   * 获取 Agent 配置详情
   */
  async getAgentById(id: string): Promise<ApiResponse<AgentConfig>> {
    const response = await this.client.get<ApiResponse<AgentConfig>>(
      `/api/cli/agents/${id}`
    )
    return response.data
  }

  /**
   * 获取 Prompt 列表
   */
  async getPrompts(): Promise<ApiResponse<Prompt[]>> {
    const response = await this.client.get<ApiResponse<Prompt[]>>(
      '/api/cli/prompts'
    )
    return response.data
  }

  /**
   * 获取 Prompt 详情
   */
  async getPromptById(id: string): Promise<ApiResponse<Prompt>> {
    const response = await this.client.get<ApiResponse<Prompt>>(
      `/api/cli/prompts/${id}`
    )
    return response.data
  }

  /**
   * 获取 MCP 配置列表
   */
  async getMcps(): Promise<ApiResponse<McpConfig[]>> {
    const response = await this.client.get<ApiResponse<McpConfig[]>>(
      '/api/cli/mcps'
    )
    return response.data
  }

  /**
   * 获取 MCP 配置详情
   */
  async getMcpById(id: string): Promise<ApiResponse<McpConfig>> {
    const response = await this.client.get<ApiResponse<McpConfig>>(
      `/api/cli/mcps/${id}`
    )
    return response.data
  }
}

// 导出单例
export const apiClient = new ApiClient()

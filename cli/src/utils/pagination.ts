/**
 * 分页工具函数
 */

export interface PaginationOptions {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * 对数组进行分页
 */
export function paginate<T>(
  items: T[],
  options: PaginationOptions
): PaginationResult<T> {
  const { page, pageSize } = options
  const total = items.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize

  return {
    items: items.slice(startIndex, endIndex),
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

/**
 * 按名称搜索（不区分大小写）
 */
export function searchByName<T extends { name: string }>(
  items: T[],
  query: string
): T[] {
  if (!query.trim()) {
    return items
  }

  const lowerQuery = query.toLowerCase().trim()
  return items.filter((item) =>
    item.name.toLowerCase().includes(lowerQuery)
  )
}

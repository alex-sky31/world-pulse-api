import type { DatacentersResponse } from './schema.ts'
import { parseDatacentersData, parseDatacentersResponse } from './schema.ts'
import { datacentersData } from './constant.ts'

export function loadDatacenters(): DatacentersResponse {
  const parsedData = parseDatacentersData(datacentersData)
  if (!parsedData.success) {
    throw new Error('Invalid datacenters data')
  }

  const payload = parseDatacentersResponse({
    datacenters: parsedData.data.datacenters,
    updatedAt: new Date().toISOString(),
  })

  if (!payload.success) {
    throw new Error('Invalid datacenters payload')
  }

  return payload.data
}

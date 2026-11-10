export class ApiError extends Error {
  constructor(message, { status, code = null, errors = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.errors = errors
  }
}

export async function api(path, { method = 'GET', body, headers } = {}) {
  let response

  try {
    response = await fetch(path, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('ارتباط با سرور برقرار نشد.', {
      status: 0,
      code: 'network',
    })
  }

  const payload = await readPayload(response)

  if (!response.ok) {
    throw toApiError(response.status, payload)
  }

  return payload
}

export function toApiError(status, payload) {
  const body = payload && typeof payload === 'object' ? payload : null
  const errors = body && typeof body.errors === 'object' && body.errors !== null
    ? body.errors
    : null
  const code = body && typeof body.code === 'string' ? body.code : null

  return new ApiError(messageFrom(body, status), { status, code, errors })
}

async function readPayload(response) {
  if (response.status === 204) {
    return null
  }

  const text = await response.text()

  if (text === '') {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

function messageFrom(body, status) {
  if (body && typeof body.message === 'string' && body.message !== '') {
    return body.message
  }

  if (status === 401) {
    return 'نشست معتبر نیست.'
  }

  return 'درخواست ناموفق بود.'
}

type HttpMethod = 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE';

interface HttpRequestOptions {
  url: string;
  data?: string;
  method: HttpMethod;
  accessToken?: string;
}

export const httpRequest = async ({
  url,
  data,
  method,
  accessToken
}: HttpRequestOptions) => {
  console.log('url:', url, method, accessToken, data);
  try {
    const response = await fetchRequest({ url, data, method, accessToken });
    if (response.ok) {
      return response;
    }
    return response;
  } catch (error) {
    console.error('Error:', error);
    throw new Error(`HTTP error! status: ${error}`);
  }
};

const fetchRequest = async ({
  url,
  data,
  method,
  accessToken,
}: HttpRequestOptions) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return await fetch(url, {
    method,
    headers,
    body: method === 'GET' || method === 'DELETE' ? null : data,
  });
};


// This file is used to make http requests to the server.
// I am moving this from all the components that have http requests implemented in them.
// Change this function to make it generic and reusable for all the components that need to make http requests for PUT | POST | PATCH | DELETE methods.
export const httpRequest = async (url: string,
  data: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'GET' = 'POST',
  // accessTokenRequired: boolean = true,
  accessToken: string | '' | undefined,
) => {
  try {

    let response: Response;
    switch (method) {
      case 'POST':
        response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: data
        });
        return response.json();
      case 'PUT':
        response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: data
        });
        break;
      case 'GET':
        response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
        });
        return response.json();
      default:
        response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: data
        });
        break;
    }
    return response.json();
  } catch (error) {
    console.error('Error:', error);
  }
}


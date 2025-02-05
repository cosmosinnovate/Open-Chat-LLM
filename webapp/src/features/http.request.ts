
// This file is used to make http requests to the server.
// I am moving this from all the components that have http requests implemented in them.
// Change this function to make it generic and reusable for all the components that need to make http requests for PUT | POST | PATCH | DELETE methods.
export const httpRequest = async (
  url: string,
  data: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE' = 'POST',
  accessToken: string | undefined,
) => {
  console.log("ACCESS TOKEN: ", accessToken)
  console.log("URL: ", url)
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
        break;
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
      case 'PATCH':
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
        break;
      default:
        console.log("DELETE METHOD")
        console.log(url)
        console.log("ACCESS TOKEN TO DELETE A CHAT: ", accessToken)
        response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
        });
        break;
    }
    return response;
  } catch (error) {
    console.error('Error:', error);
  }
}


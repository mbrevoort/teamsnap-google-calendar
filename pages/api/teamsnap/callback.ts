import { NextApiRequest, NextApiResponse } from 'next';
const store = require('../../../lib/store');

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {

  let code = request.query.code;
  let teamsnapClientId = process.env.TEAMSNAP_CLIENT_ID;
  let teamsnapClientSecret = process.env.TEAMSNAP_CLIENT_SECRET;
  let redirectURL = `https://${request.headers.host}${request.url}`;
  let tokenBody = {
    client_id: teamsnapClientId,
    client_secret: teamsnapClientSecret,
    redirect_uri: redirectURL,
    code,
    grant_type: "authorization_code"
  };

  let temasnapURL = "https://auth.teamsnap.com/oauth/token";
  let resp = await fetch(temasnapURL, {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tokenBody)
  });

  if (resp.status != 200) {
    let bodyText = await resp.text();
    response.status(resp.status).json({
      code: resp.status,
      body: bodyText,
      tokenBody,
    })
    return;
  }

  let jsonBody = await resp.json();
  let accessToken = jsonBody.access_token;
  await store.setToken("teamsnap", jsonBody);

  response.status(200).json({
    accessToken,
  });
}



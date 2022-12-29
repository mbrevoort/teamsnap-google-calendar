import { NextApiRequest, NextApiResponse } from 'next';
const {google} = require('googleapis');
import { getClient } from '../../../lib/google_oauth';
const store = require('../../../lib/store');

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const oAuth2Client = await getClient();

  let code = request.query.code as string;
  const r = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(r.tokens);
  await store.setToken("google", r.tokens);

  response.status(200).json({
    expiry: r.tokens.expiry_date
  });
}

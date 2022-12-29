import { NextApiRequest, NextApiResponse } from 'next';
import { getClient } from '../../../lib/google_oauth';

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  
  const oAuth2Client = await getClient();

  // Generate the url that will be used for the consent dialog.
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar'].join(" "),
  });


  response.status(302).setHeader('Location', authorizeUrl).send("ok");
}

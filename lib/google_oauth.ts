import {OAuth2Client} from 'google-auth-library';
import {getToken} from './store';

export async function getClient() {
  const keys = JSON.parse(process.env.GOOGLE_OAUTH_CREDS);
  const oAuth2Client = new OAuth2Client(
    keys.web.client_id,
    keys.web.client_secret,
    keys.web.redirect_uris[0]
  );

  try {
    const token = await getToken("google");
    oAuth2Client.setCredentials(token);  
  } catch(ex) {
    console.log(ex);
  }

  return oAuth2Client;
}

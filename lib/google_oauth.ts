import {OAuth2Client} from 'google-auth-library';
import {getToken} from './store';

let client = null;

export async function getClient() {
  if (client) return client;

  const keys = JSON.parse(atob(process.env.GOOGLE_OAUTH_CREDS));
  const oAuth2Client = new OAuth2Client(
    keys.web.client_id,
    keys.web.client_secret,
    keys.web.redirect_uris[0]
  );

  try {
    const token = await getToken("google");
    oAuth2Client.setCredentials(token);

    oAuth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        oAuth2Client.setCredentials(tokens);
      }
    });

  } catch(ex) {
    console.log(ex);
  }

  client = oAuth2Client;
  return client;
}

const {google} = require('googleapis');
const {Datastore} = require('@google-cloud/datastore');
const TOKEN_KIND = "Token";
const EVENT_KIND = "Event";

function getDatastore() {
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDS);
    const datastore = new Datastore({
        credentials: creds,
        projectId: creds.project_id,
    });
    return datastore;
}

export async function setToken(name, val) {
    const datastore = getDatastore();
    const key = datastore.key([TOKEN_KIND, name])
    const token = {
        key: key,
        data: val
    };
    await datastore.save(token);
}

export async function getToken(name) {
    const datastore = getDatastore();
    const tokenKey = datastore.key([TOKEN_KIND, name])
    return (await datastore.get(tokenKey))[0];
}


export async function setEvent(teamsnapEventId, val) {
    const datastore = getDatastore();
    const key = datastore.key([EVENT_KIND, teamsnapEventId])
    const event = {
        key: key,
        data: val
    };
    await datastore.save(event);
}

export async function getEvent(teamsnapEventId) {
    const datastore = getDatastore();
    const key = datastore.key([EVENT_KIND, teamsnapEventId])
    return (await datastore.get(key))[0];
}
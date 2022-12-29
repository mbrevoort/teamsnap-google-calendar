const {google} = require('googleapis');
const {Datastore} = require('@google-cloud/datastore');
const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDS);
const datastore = new Datastore({
    credentials: creds,
    projectId: creds.project_id,
});
const TOKEN_KIND = "Token";
const EVENT_KIND = "Event";

module.exports.setToken = async function (val) {
    const key = datastore.key([TOKEN_KIND, "token"])
    const token = {
        key: key,
        data: val
    };
    await datastore.save(token);
}

module.exports.getToken = async function () {
    const tokenKey = datastore.key([TOKEN_KIND, "token"])
    return (await datastore.get(tokenKey))[0];
}


module.exports.setEvent = async function (teamsnapEventId, val) {
    const key = datastore.key([EVENT_KIND, teamsnapEventId])
    const event = {
        key: key,
        data: val
    };
    await datastore.save(event);
}

module.exports.getEvent = async function (teamsnapEventId) {
    const key = datastore.key([EVENT_KIND, teamsnapEventId])
    return (await datastore.get(key))[0];
}
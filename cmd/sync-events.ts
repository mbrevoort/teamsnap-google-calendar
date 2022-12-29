import { getClient } from '..//lib/google_oauth';
import { setEvent, getEvent, deleteEvent, getToken } from '../lib/store';
const {google} = require('googleapis');
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const CALENDAR_ID = process.env.CALENDAR_ID;

async function main() {
  const isForceUpdate = true; //process.arrequest.query.force && true;

  const oAuth2Client = await getClient();  
  const calendar = google.calendar({version: 'v3', auth: oAuth2Client});
  
  // Basketball
  let allEvents = (await getGameSummaries("7808210")).filter(it => it.label == "Varsity");;
  // Lacrosse
  allEvents = allEvents.concat(await getGameSummaries("7966304"))

  let updated = 0;
  let created = 0;
  let unchanged = 0;
  // for each game, 
  for (const event of allEvents) {
    const updatedCalendarEvent = makeCalendarEvent(event)

    //   check if an event exists
    let record = await getEvent(event.id)
    if (record) {
      let calEvent = record.calendar;
      console.log(`FOUND ${event.id}`)
      if (!isForceUpdate && !hasEventChanged(calEvent, updatedCalendarEvent)) {
        console.log(`Not changed: ${event.id}, ${calEvent.id}`);
        unchanged++;
        continue;
      }

      if (event.is_canceled) {
        updatedCalendarEvent.summary = `CANCELLED: ${updatedCalendarEvent.summary}`;
      }

      let result = await calendar.events.update({
        eventId: calEvent.id,
        calendarId: CALENDAR_ID,
        resource: updatedCalendarEvent
      })
      updated++;

      await setEvent(event.id, {
        teamsnap: event,
        calendar: result.data
      })
    } else {
      let result = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        resource: updatedCalendarEvent
      })
      created++;

      await setEvent(event.id, {
        teamsnap: event,
        calendar: result.data
      })
    }
  }

  console.log({
    updated,
    created,
    unchanged,
  });
}

function makeCalendarEvent(teamsnapEvent) {
  let startDate = new Date(Date.parse(teamsnapEvent.start_date));
  let endDate = new Date(startDate.getTime() + teamsnapEvent.duration_in_minutes*60000);
  console.log(startDate, endDate)
  let calEvent = {
    summary: teamsnapEvent.name,
    location: teamsnapEvent.location?.address,
    start: {
      dateTime: startDate,
    },
    end: {
      dateTime: endDate
    },
    colorId: '9',
    description: `${teamsnapEvent.label}\n${teamsnapEvent.location?.name}\n${teamsnapEvent.location?.address}\nhttps://go.teamsnap.com/${teamsnapEvent.team_id}/schedule/view_game/${teamsnapEvent.id}`
  }
  return calEvent;
}

function hasEventChanged(existing, current) {
  if (existing.summary != current.summary) return true;
  if (existing.location != current.location) return true;
  if (Date.parse(existing.start?.dateTime) != Date.parse(current.start?.dateTime)) return true;
  if (Date.parse(existing.end?.dateTime) != Date.parse(current.end?.dateTime)) return true;
  if (existing.colorId != current.colorId) return true;
  return false;
}


function filterBy(collection, name, value) {
  return collection.filter(it => it.data.find(item => item.name == name)?.value == value);
}

function getValue(collection, name) {
  return collection.data.find(item => item.name == name)?.value;
}

async function getTeamsnap(url){
  const token = (await getToken("teamsnap"))?.access_token;
  let resp = await fetch(url, {
    method: "GET",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  let body = await resp.json()

  return body?.collection?.items || [];
}

async function getGameSummaries(teamId) {
  let events = await getTeamsnap(`https://apiv3.teamsnap.com/v3/events/search?team_id=${teamId}`);
  let locations = await getTeamsnap(`https://apiv3.teamsnap.com/v3/locations/search?team_id=${teamId}`);

  let locationsMap =  locations.reduce((map, obj) => {
    let id = getValue(obj, "id");
    map[id] = {
      id,
      address: getValue(obj, "address"),
      name: getValue(obj, "name"),
      url: getValue(obj, "url"),
    };
    return map;
  });

  // filter games
  let games = filterBy(events, "is_game", true);

  // filter only games in the future
  games = games.filter(it => Date.parse(it.data.find(item => item.name == "start_date")?.value) > Date.now());

  // create game summaries
  let summaries = games.map(it => {
    console.log(it);
    return {
      id: getValue(it, "id"),
      team_id: getValue(it, "team_id"),
      name: getValue(it, "formatted_title_for_multi_team"),
      label: getValue(it, "label"),
      location: locationsMap[getValue(it, "location_id")],
      start_date: getValue(it, "start_date"),
      duration_in_minutes: getValue(it, "duration_in_minutes"),
      is_canceled: getValue(it, "is_canceled"),
      updated_at: getValue(it, "updated_at"),
      href: it.href,
    }
  })

  return summaries;
}

main();
import { NextApiRequest, NextApiResponse } from 'next';
import { getClient } from '../../../lib/google_oauth';
import { setEvent, getEvent } from '../../../lib/store';
const {google} = require('googleapis');


export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {

  const oAuth2Client = await getClient();  
  const calendar = google.calendar({version: 'v3', auth: oAuth2Client});
  const CALENDAR_ID = "brevoort.com_ql48cvqpjp493dh9pjd3522k8o@group.calendar.google.com";


  // Hardcoded as I'm hacking away at this
  const teamMap = {};
  teamMap["Basketball"] = (await getGameSummaries("7808210")).filter(it => it.label == "Varsity");;
  teamMap["HRHS Lacrosse"] = await getGameSummaries("7966304")
  const allEvents = teamMap["Basketball"].concat( teamMap["HRHS Lacrosse"])

  let updated = 0;
  let created = 0;
  // for each game, 
  for (const event of allEvents) {
    //   check if an event exists
    let record = await getEvent(event.id)
    if (record) {
      console.log(`FOUND ${event.id}`)
      let calEvent = record.calendar;

      let result = await calendar.events.update({
        eventId: calEvent.id,
        calendarId: CALENDAR_ID,
        resource: makeCalendarEvent(event)
      })
      updated++;

      await setEvent(event.id, {
        teamsnap: event,
        calendar: result.data
      })


    } else {
      let calEvent = makeCalendarEvent(event);
      let result = await calendar.events.insert({
        calendarId: CALENDAR_ID,
        resource: calEvent
      })
      created++;

      await setEvent(event.id, {
        teamsnap: event,
        calendar: result.data
      })
    }
  }

  response.status(200).json({
    updated,
    created,
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
    colorId: 7,
  }
  return calEvent;
}


function filterBy(collection, name, value) {
  return collection.filter(it => it.data.find(item => item.name == name)?.value == value);
}

function getValue(collection, name) {
  return collection.data.find(item => item.name == name)?.value;
}

async function getTeamsnap(url){
  const token = process.env.TEAMSNAP_CURRENT_TOKEN;
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
    return {
      id: getValue(it, "id"),
      name: getValue(it, "formatted_title_for_multi_team"),
      label: getValue(it, "label"),
      location: locationsMap[getValue(it, "location_id")],
      start_date: getValue(it, "start_date"),
      duration_in_minutes: getValue(it, "duration_in_minutes"),
      is_canceled: getValue(it, "is_canceled"),
      updated_at: getValue(it, "updated_at"),
    }
  })

  return summaries;
}
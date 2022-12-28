import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {

  // Hardcoded as I'm hacking away at this
  const teamMap = {};
  teamMap["Basketball"] = await getGameSummaries("7808210");
  teamMap["HRHS Lacrosse"] = await getGameSummaries("7966304");
  
  response.status(200).json({
    games: teamMap,
  });
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
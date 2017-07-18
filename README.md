Overview
=========================
This project is the server backend of my open source schedule app for synagogues. The server is capable of parsing "synagogue-schedule-formatted" (a format I made up) json files, and responding to queries on these schedules.

Usage
=========================
This section explains how a developer of a client app may query this service.

Root URL
------------------
The root url is the url of your hosted project (e.g. https://myproject.somehostingsite.com/). For the purposes of this document we will simply refer to it as _"root"_.

Endpoints
------------------
- `root/{schedule}`:

Retieves the data from the schedule file _{schedule}.json_, using the current date.

### Example: 

**Request:**

`root/minyanim`

**Response:**

```json
{
	"meta": { "name": "Regular Minyanim" },
	"data": {
		"shacharit": ["5:45", "6:30", "7:30", "8:15"],
		"mincha": "19:45",
		"arvit": [ "20:15", "21:00" ]
	}
}
```

------------------

- `root/{schedule}?date={some_date}`:

Same as above but fetches the data using the provided date.

------------------

- `root/`:

Retrieves the data from all the schedule files.

```json
{
	"minyanim":
	{
		"meta": { "name": "Regular Minyanim" },
		"data": {
			"shacharit": ["5:45", "6:30", "7:30", "8:15"],
			"mincha": "19:45",
			"arvit": [ "20:15", "21:00" ]
		}
	},
	"rosh-chodesh": {
		"meta": { "name": "Rosh Chodesh" },
		"data": {
			"month": "תמוז",
			"day": "monday"
		}
	},
}
```

------------------

- `root/?date={some_date}`:

Same as above but fetches the data using the provided date.
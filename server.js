'use strict';

const fs = require('fs');
const express = require('express');
const app = express();
const readSchedule = require('./read-schedule.js');

app.use('/:schedule', (req, res, next) =>
{
	if (!fs.existsSync(`./schedules/${req.params.schedule}.json`))
		res.status(404).send('Schedule Not Found');
	else
		next();
});

app.all('/', (req, res) =>
{
	const payload = {};
	const schedules = fs.readdirSync('./schedules').map(x => x.split('.')[0]);

	for (const schedule of schedules)
	{
		payload[schedule] = readSchedule(
			`./schedules/${schedule}.json`,
			req.query.date
		);
	}

	res.json(payload);
});

app.all('/:schedule', (req, res) =>
{
	res.json(readSchedule(
		`./schedules/${req.params.schedule}.json`,
		req.query.date
	));
});

app.listen(process.env.PORT || 3000, () => console.log('Server started'));


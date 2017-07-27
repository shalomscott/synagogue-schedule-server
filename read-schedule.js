'use strict';

const path = require('path');
const jsep = require('jsep');
const moment = require('moment');

module.exports = read;

function read(filepath, date)
{
	date = moment(date);
	filepath = resolveFilepath(filepath);

	const schedule = require(filepath);
	const rawEntry = getRawEntry(schedule, date);
	const items = parseEntryItems(rawEntry, date);

	return { metadata: schedule.metadata, items };
}

function resolveFilepath(filepath)
{
	// WARNING: This only works for the first module that requires this file.
	return path.resolve(path.dirname(module.parent.filename), filepath);
}

function getRawEntry(schedule, date)
{
	for (const entry in schedule)
	{
		const entryDate = moment(entry, 'D/M/YY', true);
		if (entryDate.isValid() && isDateWithinWeek(date, entryDate))
			return Object.assign({}, schedule.static, schedule[entry]);
	}
	// return parseEntry(schedule.static); // Not sure if I want this
}

// Function expects moment instances
function isDateWithinWeek(date, compareDate)
{
	const diff = compareDate.diff(date, 'w', true);
	return (diff < 1 && diff > -0.14285);
}

function parseEntryItems(rawEntry, date)
{
	const items = [];
	for (const key in rawEntry)
	{
		items.push({
			name: key,
			values: ensureIsArray(parseEntryItem(rawEntry[key], rawEntry, date))
		});
	}
	return items;
}

// Parameter "date" is expected to be an instance of moment
function parseEntryItem(itemValue, rawEntry, date)
{
	if (itemValue.constructor === Array)
		return parseArrayItem(itemValue, rawEntry, date);

	if (typeof(itemValue) === 'object')
	{
		switch (itemValue.type)
		{
			case 'week':
				return parseWeeklyItem(itemValue, rawEntry, date);

			case 'expr':
				return parseExpressionItem(itemValue, rawEntry, date);
		}
	}

	return itemValue;
}

function parseArrayItem(itemValue, rawEntry, date)
{
	return itemValue.map(item => parseEntryItem(item, rawEntry, date));
}

function parseWeeklyItem(itemValue, rawEntry, date)
{
	const days = itemValue.val;
	let item = null;
	for (const day in days)
	{
		if (date.day() < normalizeWeekday(day))
			break;
		item = days[day];
	}
	return parseEntryItem(item, rawEntry, date);
}

function normalizeWeekday(weekday)
{
	return moment().day(weekday).day();
}

function parseExpressionItem(itemValue, rawEntry, date)
{
	const parseTree = jsep(itemValue.val);
	let iter = parseExpression(parseTree);
	let { value, done } = iter.next();
	while (!done)
	{
		let parsed = parseEntryItem(rawEntry[value], rawEntry, date);
		const next = iter.next(parsed);
		value = next.value;
		done = next.done;
	}
	return value;
}

function* parseExpression(node)
{
	if (node.type === 'Literal')
		return node.value;
			
	if (node.type === 'Identifier')
		return yield node.name;

	if (node.type === 'BinaryExpression')
	{
		const { left, right, operator } = node;
		const lval = yield* parseExpression(left);
		const rval = yield* parseExpression(right);
		return timeOps[operator](lval, rval);
	}

	if (node.type === 'MemberExpression')
	{
		const { object, property } = node;
		const value = yield* parseExpression(object);
		const index = yield* parseExpression(property);
		return value[index];
	}
}

const timeOps = {
	'+': (lval, rval) =>
	{
		const { time, offset } = orderTimeAndOffset(lval, rval);
		return moment(time, 'H:mm').add(offset, 'm').format('H:mm');
	},
	'-': (lval, rval) => 
	{
		return moment(lval, 'H:mm').subtract(rval, 'm').format('H:mm');
	}
	// TODO: make more operations
}

function orderTimeAndOffset(lval, rval)
{
	if (moment(lval, 'H:m').isValid())
		return { time: lval, offset: rval };
	return { time: rval, offset: lval }
}

function ensureIsArray(value)
{
	if (value.constructor !== Array)
		return [value];
	return value;
}
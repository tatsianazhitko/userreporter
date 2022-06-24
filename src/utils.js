var moment = require("moment");
var Decimal = require('decimal.js');
var Hours = Decimal.clone({ rounding: 0 })


export function getFIO(user) {
    if (user)
        return [
            user.LAST_NAME || '',
            user.NAME || '',
            user.SECOND_NAME || ''
        ].join(" ");
    else
        return'';
}

export function getPeriodToString(from, to) {
  return `${moment(from).format("MMM Do YYYY")} - ${moment(to).format("MMM Do YYYY")}`;
}

export function getTitle(item) {
    if (item)
        return item.TITLE;
    else
        return '';
}

export function roundUp(num, precision) {
    precision = Math.pow(10, precision);
    return Math.ceil(num * precision) / precision;
}

export function convertToHours(minutes) {
    let mins = new Hours(minutes);
    let hours = mins.div(60);
    return hours.toFixed(1);
}

export function formatDate(date) {
    return moment(date).format("DD.MM.YYYY");
}

export function numberOfDay(from, to) {
  return  moment(to).diff(moment(from), 'days') + 1;
}

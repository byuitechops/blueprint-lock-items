/* Dependencies */
const tap = require('tap');
const canvas = require('canvas-wrapper');

module.exports = (course, callback) => {
    tap.test('child-template', (test) => {

        //An API call to retrieve all locked items in a course currently does not exist. 4/25/2018

        test.end();
    });

    callback(null, course);
};

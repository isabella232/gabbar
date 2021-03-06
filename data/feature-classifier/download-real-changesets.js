'use strict';

const argv = require('minimist')(process.argv.slice(2));
const csv = require('csv');
const path = require('path');
const fs = require('fs');
const queue = require('d3-queue').queue;
const request = require('request');
const mkdirp = require('mkdirp');

if (!argv.changesets || !argv.directory) {
    console.log('');
    console.log('USAGE: node download-real-changesets.js OPTIONS');
    console.log('');
    console.log('  OPTIONS');
    console.log('    --changesets       changesets.csv      Changesets dump from osmcha');
    console.log('    --directory        downloads/          Directory to download real changesets to');
    console.log('');
    process.exit(0);
}

// Create directories when they do not exist.
mkdirp.sync(argv.directory);
mkdirp.sync(path.join(argv.directory, 'real-changesets'));

function downloadAndSaveURL(url, filepath, callback) {
    // If changeset has already been download, we are good.
    if (fs.existsSync(filepath)) return callback();

    console.log(url);
    request(url, (error, response, body) => {
        if (error || response.statusCode !== 200) return callback();

        fs.writeFileSync(filepath, body);
        return callback();
    });
}

csv.parse(fs.readFileSync(argv.changesets), (error, changesets) => {
    let q = queue(1);
    let changesetID, url, filepath;

    for (var i = 0; i < changesets.length; i++) {
        let changeset = changesets[i];

        changesetID = changeset[0];
        filepath = path.join(argv.directory, 'real-changesets', changesetID + '.json');
        url = 'https://s3.amazonaws.com/mapbox/real-changesets/production/' + changesetID + '.json';
        q.defer(downloadAndSaveURL, url, filepath);
    }

    q.awaitAll((error, results) => {
        if (error) throw error;
    });
});

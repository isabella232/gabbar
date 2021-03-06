'use strict';

const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const path = require('path');
const csv = require('csv');
const turf = require('@turf/turf');
const realChangesetToChangeset = require('../gabbar/utilities/real-changeset').realChangesetToChangeset;
const getSamples = require('../gabbar/filters/highway').getSamples;

const featureAttributes = require('../gabbar/attributes/feature');
const highwayAttributes = require('../gabbar/attributes/highway');
const userAttributes = require('../gabbar/attributes/user');
const userDatasources = require('../gabbar/datasources/user');


if (!argv.changesets || !argv.realChangesetsDir || !argv.userDetailsDir) {
    console.log('');
    console.log('USAGE: node highway-attributes.js OPTIONS');
    console.log('');
    console.log('  OPTIONS');
    console.log('    --changesets           changesets.csv      Dump of changesets from osmcha');
    console.log('    --realChangesetsDir    real-changesets/    Directory with real changesets');
    console.log('    --userDetailsDir       user-details/       Directory with user details');
    console.log('');
    process.exit(0);
}

csv.parse(fs.readFileSync(argv.changesets), (error, rows) => {

    let header = [
        'changeset_id',
        'changeset_harmful',
        'feature_id',
        'feature_version',
        'action_create',
        'action_modify',
        'action_delete',
        'geometry_type_node',
        'geometry_type_way',
        'geometry_type_relation',
        'geometry_distance_between_versions',
        'old_geometry_line_distance',
        'old_geometry_number_of_nodes',
        'old_geometry_kinks',
        'old_geometry_area',
        'new_geometry_line_distance',
        'new_geometry_number_of_nodes',
        'new_geometry_kinks',
        'new_geometry_area',
        'old_user_mapping_days',
        'new_user_mapping_days',
        'difference_user_mapping_days',
        'ratio_user_mapping_days',
        'old_number_of_tags',
        'new_number_of_tags',
        'difference_number_of_tags',
        'ratio_number_of_tags',
        'old_tags',
        'new_tags',
    ];
    let attributes = [];
    attributes.push(header);

    let seenChangesets = new Set([]);
    for (let row of rows) {
        let changesetID = row[0];

        // Checking for duplicate changesets.
        if (seenChangesets.has(changesetID)) continue;
        seenChangesets.add(changesetID);

        let realChangeset;
        try {
            realChangeset = JSON.parse(fs.readFileSync(path.join(argv.realChangesetsDir, changesetID + '.json')));
        } catch (error) {
            // When the real changeset file does not exist.
            continue;
        }
        let changeset = realChangesetToChangeset(realChangeset);

        let harmful = row[1];
        if (harmful === 'true') harmful = 1;
        else if (harmful === 'false') harmful = 0;
        else harmful = '';

        let samples = getSamples(changeset);
        for (let sample of samples) {
            let newVersion = sample[0];
            let oldVersion = sample[1];

            let newUsername = featureAttributes.getUsername(newVersion);
            let newUserDetails = userDatasources.getUserDetails(newUsername, argv.userDetailsDir);

            let oldUsername = featureAttributes.getUsername(oldVersion);
            let oldUserDetails = userDatasources.getUserDetails(oldUsername, argv.userDetailsDir);

            // Skipping changesets from user labelled due to user_block.
            if (newUsername === 'chinakz') continue;
            if (oldUsername === 'chinakz') continue;

            attributes.push([
                changesetID,
                harmful,
                featureAttributes.getFeatureID(newVersion),
                featureAttributes.getFeatureVersion(newVersion),
                featureAttributes.getAction(newVersion) === 'create' ? 1 : 0,
                featureAttributes.getAction(newVersion) === 'modify' ? 1 : 0,
                featureAttributes.getAction(newVersion) === 'delete' ? 1 : 0,
                featureAttributes.getGeometryType(newVersion) === 'node' ? 1 : 0,
                featureAttributes.getGeometryType(newVersion) === 'way' ? 1 : 0,
                featureAttributes.getGeometryType(newVersion) === 'relation' ? 1 : 0,
                featureAttributes.getDistanceBetweenVersions(newVersion, oldVersion),
                featureAttributes.getLineDistance(oldVersion),
                featureAttributes.getNumberOfNodes(oldVersion),
                featureAttributes.getKinks(oldVersion).length,
                featureAttributes.getArea(oldVersion),
                featureAttributes.getLineDistance(newVersion),
                featureAttributes.getNumberOfNodes(newVersion),
                featureAttributes.getKinks(newVersion).length,
                featureAttributes.getArea(newVersion),
                userAttributes.getMappingDays(oldUserDetails),
                userAttributes.getMappingDays(newUserDetails),
                userAttributes.getMappingDays(newUserDetails) - userAttributes.getMappingDays(oldUserDetails),
                userAttributes.getMappingDays(oldUserDetails) ? userAttributes.getMappingDays(newUserDetails) / userAttributes.getMappingDays(oldUserDetails) : 0,
                featureAttributes.getNumberOfTags(oldVersion),
                featureAttributes.getNumberOfTags(newVersion),
                featureAttributes.getNumberOfTags(newVersion) - featureAttributes.getNumberOfTags(oldVersion),
                featureAttributes.getNumberOfTags(oldVersion) ? featureAttributes.getNumberOfTags(newVersion) / featureAttributes.getNumberOfTags(oldVersion) : 0,
                highwayAttributes.tagsToString(oldVersion, newVersion),
                highwayAttributes.tagsToString(newVersion, oldVersion),
            ]);
        }
    }
    csv.stringify(attributes, (error, asString) => {
        console.log(asString);
    });
});

'use strict';

const turf = require('@turf/turf');
const simpleStatistics = require('simple-statistics');

module.exports = {
    getPrimaryTags: getPrimaryTags,
    getFeatureID: getFeatureID,
    getFeatureVersion: getFeatureVersion,
    getLineDistance: getLineDistance,
    getKinks: getKinks,
    getAction: getAction,
    getGeometryType: getGeometryType,
    getUsername: getUsername,
    getUserID: getUserID,
    isNameModified: isNameModified,
    getFeatureHash: getFeatureHash,
    getNumberOfNodes: getNumberOfNodes,
    getDistanceBetweenVersions: getDistanceBetweenVersions,
    getArea: getArea,
    getNumberOfTags: getNumberOfTags,
    getPrimaryTagCount: getPrimaryTagCount,
    getBBOXArea: getBBOXArea,
    getLengthOfLongestSegment: getLengthOfLongestSegment,
    isNameTouched: isNameTouched,
};

const PRIMARY_TAGS = [
    'aerialway',
    'aeroway',
    'amenity',
    'barrier',
    'boundary',
    'building',
    'craft',
    'emergency',
    'geological',
    'highway',
    'historic',
    'landuse',
    'leisure',
    'man_made',
    'military',
    'natural',
    'office',
    'place',
    'power',
    'public_transport',
    'railway',
    'route',
    'shop',
    'sport',
    'tourism',
    'waterway'
];

function isNameTouched(newVersion, oldVersion) {
    try {
        if (!oldVersion) {
            if ('name' in newVersion.properties.tags) return 1;

            for (let tag of Object.keys(newVersion)) {
                if (tag.index('name:') !== -1) return 1;
            }

            return 0;
        } else {
            if (newVersion.properties.tags.name !== oldVersion.properties.tags.name) return 1;

            for (let tag of Object.keys(newVersion)) {
                if ((tag.index('name:') !== -1) && (newVersion.properties.tags[tag] != oldVersion.properties.tags[tag])) return 1;
            }

            for (let tag of Object.keys(oldVersion)) {
                if ((tag.index('name:') !== -1) && (newVersion.properties.tags[tag] != oldVersion.properties.tags[tag])) return 1;
            }

            return 0;
        }
    } catch (error) {
        return 0;
    }
}


function getPrimaryTags() {
    return PRIMARY_TAGS;
}

function getFeatureHash(feature) {
    try {
        return [
            feature.properties.type,
            feature.properties.id,
            feature.properties.version
        ].join('!');
    } catch (error) {
        return '';
    }
}

function isNameModified(newVersion, oldVersion) {
    try {
        return newVersion.properties.tags.name === oldVersion.properties.tags.name ? 0 : 1;
    } catch (error) {
        return 0;
    }
}

function getFeatureID(feature) {
    try {
        return feature.properties.id;
    } catch (error) {
        return '';
    }
}


function getFeatureVersion(feature) {
    try {
        return parseInt(feature.properties.version);
    } catch (error) {
        return '';
    }
}


function getLineDistance(feature) {
    try {
        return parseFloat(turf.lineDistance(feature).toFixed(3));
    } catch (error) {
        return 0;
    }
}


function getNumberOfNodes(feature) {
    try {
        return feature.geometry.coordinates.length;
    } catch (error) {
        // Return a default length of 1.
        return 1;
    }
}


function getKinks(feature) {
    try {
        return turf.kinks(feature).features;
    } catch (error) {
        return [];
    }
}


function getAction(feature) {
    try {
        return feature.properties.action;
    } catch (error) {
        return '';
    }
}


function getGeometryType(feature) {
    try {
        return feature.properties.type;
    } catch (error) {
        return '';
    }
}


function getUsername(feature) {
    try {
        return feature.properties.user;
    } catch (error) {
        return '';
    }
}


function getUserID(feature) {
    try {
        return feature.properties.uid;
    } catch (error) {
        return '';
    }
}


function getDistanceBetweenVersions(newVersion, oldVersion) {
    try {
        return parseFloat(turf.distance(turf.centroid(newVersion), turf.centroid(oldVersion)).toFixed(4));
    } catch (error) {
        return 0;
    }
}


function getArea(feature) {
    try {
        return parseFloat(turf.area(feature).toFixed(4));
    } catch (error) {
        return 0;
    }
}


function getNumberOfTags(feature) {
    try {
        return Object.keys(feature.properties.tags).length;
    } catch (error) {
        return 0;
    }
}


function getPrimaryTagCount(feature) {
    try {
        let count = [];
        for (let primaryTag of PRIMARY_TAGS) {
            if (primaryTag in feature.properties.tags) {
                count.push(1);
            } else {
                count.push(0);
            }
        }
        return count;
    } catch(error) {
        let count = [];
        for (let primaryTag of PRIMARY_TAGS) {
            count.push(0);
        }
        return count;
    }
}


function getBBOXArea(feature) {
    try {
        let bbox = turf.bboxPolygon(turf.bbox(feature));
        return parseFloat(turf.area(bbox).toFixed(4));
    } catch (error) {
        return 0;
    }
}


function getLengthOfLongestSegment(feature) {
    try {
        let distances = [];
        let coordinates = feature.geometry.coordinates;
        for (var i = 1; i < coordinates.length; i++) {
            let point = turf.point(coordinates[i-1]);
            let anotherPoint = turf.point(coordinates[i]);
            distances.push(turf.distance(point, anotherPoint));
        }
        return parseFloat(simpleStatistics.max(distances).toFixed(4));
    } catch (error) {
        return 0;
    }
}

/*jslint node: true */
'use strict';

var winston = require('winston'),
    path = require('path'),
    fs = require('fs'),
    yaml = require('js-yaml'),
    async = require('async'),
    mqtt = require('mqtt'),
    fs = require('fs'),
    DashButton = require('node-dash-button');

var CONFIG_DIR = process.env.CONFIG_DIR || process.cwd(),
    CONFIG_FILE = path.join(CONFIG_DIR, 'config.yml'),
    SAMPLE_FILE = path.join(__dirname, '_config.yml'),
    CURRENT_VERSION = require('./package').version;

var config,
    buttons = {},
    broker,
    timeouts = {};

// Show Debug logs in console
winston.level = 'debug';

/**
 * Load user configuration (or create it)
 * @method loadConfiguration
 * @return {Object} Configuration
 */
function loadConfiguration () {
    if (!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(CONFIG_FILE, fs.readFileSync(SAMPLE_FILE));
    }

    return yaml.safeLoad(fs.readFileSync(CONFIG_FILE));
}

/**
 * Notify the broker that something triggered
 * @method notifyMQTT
 * @param  {String}     topic    Topic to message
 * @param  {Boolean}    value    Value to set (ON, OFF)
 */
function notifyMQTT (topic, value) {
    var state = value ? 'active': 'inactive';

    winston.debug('Notifying MQTT %s with %s', topic, state);
    broker.publish(topic, state, {
        retain: true
    }, function (err) {
        if (err) {
            winston.error('Error notifying MQTT', err);
        }
    });
}

/**
 * Handle an events from the Amazon Dash
 * @method buttonEvent
 * @param  {String}   mac      Mac Address (identifier)
 * @param  {String}   topic    MQTT topic to write to
 */
function buttonEvent (mac, topic) {
    winston.info('Button press detected on %s for %s', mac, topic);

    // Auto-clear action after 10 seconds
    clearTimeout(timeouts[topic]);
    timeouts[topic] = setTimeout(notifyMQTT.bind(null, topic, false), 10000);

    // Notify MQTT
    notifyMQTT(topic, true);
}

// Main flow
async.series([
    function loadFromDisk (next) {
        winston.info('Starting MQTT Amazon Dash - v%s', CURRENT_VERSION);
        winston.info('Loading configuration');
        config = loadConfiguration();

        process.nextTick(next);
    },
    function connectToMQTT (next) {
        winston.info('Connecting to MQTT at mqtt://%s', config.mqtt.host);
        broker = mqtt.connect('mqtt://' + config.mqtt.host);
        broker.on('connect', function () {
            next();
            // @TODO Not call this twice if we get disconnected
            next = function () {};
        });
    },
    function setupButtons (next) {
        winston.info('Listening for %d buttons', Object.keys(config.buttons).length);

        Object.keys(config.buttons).forEach(function (macAddress) {
            var topic = config.buttons[macAddress];
            buttons[macAddress] = DashButton(macAddress);
            buttons[macAddress].on('detected', buttonEvent.bind(null, macAddress, topic));
        });

        process.nextTick(next);
    }
], function (error) {
    if (error) {
        return winston.error(error);
    }
    winston.info('Waiting for dash buttons to be pressed');
});

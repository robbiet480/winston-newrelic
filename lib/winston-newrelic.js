'use strict';

// jshint curly: false
var winston = require('winston'),
    util = require('util');
console.log('required');
/**
 * The winston-newrelic transporter constructor
 * @constructor
 * @type {Function}
 */
var WinstonNewrelic = module.exports = function(options) {
    if (!options) {
        options = {};
    }
    /**
     * Winston Trasporter Name
     * @type {string}
     */
    this.name = 'winston-newrelic';

    /**
     * Default logging level is error
     * @type {string}
     */
    this.level = (options && options.level) || 'error';

    /**
     * Take the injected instance or require it globally
     * @type {object}
     */
    this.newrelic = (options && options.newrelic) || this.getNewRelic();
};

/**
 * Inherit winston.Transport
 */
util.inherits(WinstonNewrelic, winston.Transport);

/**
 * Transporter getter for backward compatibility
 */
winston.transports.Newrelic = WinstonNewrelic;


/**
 * Dispatched on each log, stores only errors to new-relic
 * @param {string} level
 * @param {string} message
 * @param {object} meta
 * @param {function} callback
 */
WinstonNewrelic.prototype.log = function(level, message, meta, callback) {
    var error;
    if (meta && meta.stack)
        error = { message: meta.message || message, stack: meta.stack };
    else
        error = message;

    this.newrelic.noticeError(error, meta);

    if (typeof callback === 'function') {
        callback(null, true);
    }
};

/**
 * Returns the instance of New Relic used for logging.
 */
WinstonNewrelic.prototype.getNewRelic = function getNewRelic() {
    /* istanbul ignore next: mocked for test purposes */
    return this.newrelic || require('newrelic');
};

/**
 * Formats an error message for New Relic
 * @param {string} level
 * @param {string} msg
 * @param {object} meta
 */
WinstonNewrelic.prototype.formatMessage = function formatMessage(level, message, meta) {
    var logMessage = { message: message },
        customParameters = {
            logLevel: level
        };

    if (message instanceof Error) {
        logMessage.message = message.message;
        logMessage.stack = message.stack;
    }
    if (meta) {
        var stack = logMessage.stack || meta.stack || (meta.error && meta.error.stack);
        logMessage.stack = stack;
        Object.keys(meta).forEach(
            function forEachMeta(prop) {
                if (prop === 'stack') { return; }
                var val = meta[prop];
                if (val instanceof Error) {
                    val = val.toString();
                }
                else if (typeof val === 'function') {
                    val = '[Function: ' + (val.name || '<anonymous>') + ']';
                }
                else if (typeof val === 'object') {
                    val = JSON.stringify(val);
                }
                customParameters[prop] = val;
            });
    }
    if (!logMessage.stack) {
        logMessage.stack = (new Error()).stack;
    }

    return {
        message: logMessage,
        customParameters: customParameters
    };
};
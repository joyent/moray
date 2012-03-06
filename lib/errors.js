// Copyright 2012 Joyent, Inc.  All rights reserved.

var assert = require('assert');
var util = require('util');

var restify = require('restify');

var args = require('./args');


///--- Globals

var assertArgument = args.assertArgument;
var sprintf = util.format;



///--- Helpers

function ISODateString(d) {
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }

    if (typeof (d) === 'string')
        d = new Date(d);

    return d.getUTCFullYear() + '-'
        + pad(d.getUTCMonth()+1) + '-'
        + pad(d.getUTCDate()) + 'T'
        + pad(d.getUTCHours()) + ':'
        + pad(d.getUTCMinutes()) + ':'
        + pad(d.getUTCSeconds()) + 'Z';
}



///--- Errors

/**
 * Error to return on duplicate bucket cases.
 *
 * Note this is a 'RestError' as in restify, so it can be returned directly
 * back to clients.  HttpCode will be 409, and the message will conain a
 * moray urn.
 *
 * @constructor
 * @arg {string} bucket - bucket name.
 * @throws {TypeError} if bucket is not a string.
 */
function BucketAlreadyExistsError(bucket) {
    assertArgument('bucket', 'string', bucket);
    restify.RestError.call(this,
                           409,
                           'BucketAlreadyExists',
                           sprintf('urn:moray:%s: already exists', bucket),
                           BucketAlreadyExistsError);
    this.name = 'BucketAlreadyExistsError';
}
util.inherits(BucketAlreadyExistsError, restify.RestError);


/**
 * Extension over standard ResourceNotFoundError, where we standardize
 * the error messages via a URN scheme.
 *
 * @arg {string} bucket - the bucket name.
 * @arg {string} key    - optional key name.
 */
function ObjectNotFoundError(bucket, key) {
    assertArgument('bucket', 'string', bucket);
    restify.ResourceNotFoundError.call(this,
                                       'urn:moray:%s:%s does not exist',
                                       bucket, key || '');
}
util.inherits(ObjectNotFoundError, restify.ResourceNotFoundError);


/**
 * Error to return when a key is not found, but it is in the tombstone.
 *
 * Note this is a 'RestError' as in restify, so it can be returned directly
 * back to clients.  HttpCode will be 410, and the message will conain a
 * moray urn and deletion time.
 *
 * @constructor
 * @arg {string} bucket - bucket name.
 * @arg {string} key    - key name.
 * @arg {string} dtime  - deletion time (from tombstone table).
 * @throws {TypeError} if bucket is not a string.
 */
function ResourceGoneError(bucket, key, dtime) {
    assertArgument('bucket', 'string', bucket);
    assertArgument('key', 'string', key);
    assert.ok('dtime');

    restify.RestError.call(this,
                           410,
                           'ResourceGone',
                           sprintf('urn:moray:%s:%s was deleted at %s',
                                   bucket, key, ISODateString(dtime)),
                           ResourceGoneError);
    this.name = 'ResourceGoneError';
}
util.inherits(ResourceGoneError, restify.RestError);


///--- Exports

module.exports = {

    BucketAlreadyExistsError: BucketAlreadyExistsError,
    ObjectNotFoundError: ObjectNotFoundError,
    ResourceGoneError: ResourceGoneError

};
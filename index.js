var _ = require('lodash'),
    Q = require('q'),
    util = require('./util.js'),
    google = require('googleapis'),
    service = google.gmail('v1');

var pickInputs = {
        'id': { key: 'id', validate: { req: true } },
        'userId': { key: 'userId', validate: { req: true } }
    },
    pickOutputs = {
        'id': 'id',
        'threadId': 'threadId',
        'labelIds': 'labelIds',
        'snippet': 'snippet',
        'historyId': 'historyId',
        'internalDate': 'internalDate',
        'payload': 'payload',
        'body': 'body',
        'parts': 'parts'
    };

var fetch_msg = function( app, service, user, msg_id ) {
    app.log( 'constructing promise for msg id ' + msg_id );
    var deferred = Q.defer();
    service.users.messages.get( { 'id': msg_id, 'userId': user }, function( err, message ) {
        if ( err ) { return deferred.reject( err );      }
        else       { return deferred.resolve( message ); }
    } );

    return deferred.promise;
};

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        this.log( "blah blah blah " );
        var OAuth2 = google.auth.OAuth2,
            oauth2Client = new OAuth2(),
            credentials = dexter.provider('google').credentials();
        var inputs = util.pickInputs(step, pickInputs),
            validateErrors = util.checkValidateErrors(inputs, pickInputs);

        if (validateErrors)
            return this.fail(validateErrors);

        // set credential
        oauth2Client.setCredentials({
            access_token: _.get(credentials, 'access_token')
        });
        google.options({ auth: oauth2Client });

        var ids  = step.input( 'id' );
        var user = step.input( 'userId' ).first();
        var fetches = [ ];

        this.log( 'starting loop' );
        var app = this;
        ids.each( function( msg_id ) {
            fetches.push( fetch_msg( app, service, user, msg_id ) );
        } );

        Q.all( fetches )
          .then( function( results ) { app.complete( results ) } )
          .fail( function( err ) { app.fail( err ) } );
    },
};

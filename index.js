var _ = require('lodash'),
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

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
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
        var results = [ ];
        var app = this;
        app.log( 'starting loop' );
        ids.each( function( msg_id ) {
            app.log( 'loop iteration', { 'id': msg_id  } );
            service.users.messages.get( { 'id': msg_id, 'userId': user }, function( err, message ) {
                if ( err ) { return app.fail( err ); }
                results.push( util.pickOutputs( message, pickOutputs ) );
                app.log( 'pushed message', message );
            } )
        } );
        app.log( 'ending loop', { 'results': results } );
        return this.complete( results );
/*
        service.users.messages.get(inputs, function (err, message) {

            err? this.fail(err) : this.complete(util.pickOutputs(message, pickOutputs));
        }.bind(this));
*/


    }
};

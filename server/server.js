#!/bin/env node
 //  OpenShift sample Node application
var express = require('express');
var fs = require('fs');
var mongojs = require('mongojs');
var bodyParser = require('body-parser')
var dbName = "/payall";
var connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" + process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" + process.env.OPENSHIFT_MONGODB_DB_HOST + dbName;
var db = mongojs(connection_string, ['aadharkyc', 'order']);

/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = {
                'index.html': ''
            };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) {
        return self.zcache[key];
    };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig) {
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating sample app ...',
                Date(Date.now()), sig);
            process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()));
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function() {
        //  Process on exit and signals.
        process.on('exit', function() {
            self.terminator();
        });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
            'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() {
                self.terminator(element);
            });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = {};

        self.routes['/getOrder/:id'] = function(req, res) {
            var id = req.param('id');
            getOrderById(id, function(data, err) {
                var resData = {};
                resData.success = true;
                resData.result = {};
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                if (!err) {
                    resData.result = data;
                    res.end(JSON.stringify(resData));
                } else {
                    resData.result = err;
                    resData.success = false;
                    res.end(JSON.stringify(resData));
                }
            });
        };
		self.routes['/getUser/:id'] = function(req, res) {
            var id = req.param('id');
           db.aadharkyc.findOne({
                        _id: mongojs.ObjectId(id)
                    }, function(err, data){
                var resData = {};
                resData.success = true;
                resData.result = {};
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                if (!err) {
                    resData.result = data;
                    res.end(JSON.stringify(resData));
                } else {
                    resData.result = err;
                    resData.success = false;
                    res.end(JSON.stringify(resData));
                }
            });
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html'));
        };
    };
    self.createPostRoutes = function() {
        self.postroutes = {};

        self.postroutes['/adduser'] = function(req, res) {

            var item = req.body;
            item.balance = 10000;
            item.createdDttm = new Date().getTime();
            db.aadharkyc.save(item,
                function(err, data) {
                    var resData = {};
                    resData.success = true;
                    resData.result = {};
                    res.writeHead(200, {
                        'Content-Type': 'application/json; charset=utf-8'
                    });
                    if (!err) {
                        resData.result = data;
                        res.end(JSON.stringify(resData));
                    } else {
                        resData.result = err;
                        resData.success = false;
                        res.end(JSON.stringify(resData));
                    }
                });


        }

        self.postroutes['/addorder'] = function(req, res) {

            var item = req.body;
            item.status = "pending";
            item.createdDttm = new Date().getTime();
            db.order.save(item,
                function(err, data) {
                    var resData = {};
                    resData.success = true;
                    res.writeHead(200, {
                        'Content-Type': 'application/json; charset=utf-8'
                    });

                    if (!err) {
                        resData.result = data;
                        res.end(JSON.stringify(resData));
                    } else {
                        resData.result = err;
                        resData.success = false;
                        res.end(JSON.stringify(resData));
                    }
                });

        }
        self.postroutes['/payorder'] = function(req, res) {

            var item = req.body;

            getOrderById(item.orderId, function(orderData, err) {
                var resData = {};
                resData.success = true;
                resData.result = {};
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });
                if (!err) {
                    db.aadharkyc.findOne({
                        _id: mongojs.ObjectId(item.customerId)
                    }, function(err, doc) {
                        if (doc) {
                            if (doc.balance < orderData.amount) {
								orderData.status="Failed";
								orderData.cause="Low balance";
								updateOrder(orderData,function(){
									resData.result = {"message":"low balance"};
									resData.success = false;
									res.end(JSON.stringify(resData));
								});
                            }else{
								doc.balance=doc.balance-orderData.amount;
								updateuser(doc,function(){
									db.aadharkyc.update({_id: mongojs.ObjectId(orderData.receiverId)},{$inc:{balance:orderData.amount}},function(err,re){
									orderData.status="completed";
									orderData.customerId=item.customerId;
									
										updateOrder(orderData,function(){
											resData.success = true;
											res.end(JSON.stringify(resData));
										});
										
									})
								});
							}
                        }

                    });
                } else {
                    resData.result = err;
                    resData.success = false;
                    res.end(JSON.stringify(resData));
                }
            });

        }

    };

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.createPostRoutes();
        self.app = express.createServer();
        self.app.use(bodyParser());
        self.app.use(function(req, res, next) {
            res.header('Access-Control-Allow-Origin', "*");
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
        for (var r in self.postroutes) {
            self.app.post(r, self.postroutes[r]);
        }

    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                Date(Date.now()), self.ipaddress, self.port);
        });
    };

}; /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

function getOrderById(id, callback) {
    db.order.findOne({
        _id: mongojs.ObjectId(id)
    }, function(err, data) {
        callback(data, err);
        return;
    });
}
function updateOrder(orderData,callback){
 db.order.save(orderData, function() {
        callback();
        return;
    });

}
function updateuser(doc,callback){
 db.aadharkyc.save(doc, function() {
        callback();
        return;
    });

}
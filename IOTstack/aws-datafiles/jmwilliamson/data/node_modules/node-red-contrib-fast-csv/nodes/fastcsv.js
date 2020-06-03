
// Copyright (c) 2017 Kim McKinley
// License: MIT

// Node-RED fastcsv js file

// Special thanks to https://github.com/C2FO/fast-csv

module.exports = function(RED) {
    "use strict";
    // Require any external libraries
    var csv = require("fast-csv");

    function replaceLiteralEscapes(str) {
        return str
            .replace(/\\n/g,'\n')
            .replace(/\\r/g,'\r')
            .replace(/\\t/g,'\t');
    }

    // The main node definition
    function FastCsvNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);
        this.rowDelimiterStr = n.rowDelimiter;

        // Store local copies of the node configuration
        this.options = {
            objectMode: true,
            headers: n.headers,
            ignoreEmpty: n.ignoreEmpty,
            discardUnmappedColumns: n.discardUnmappedColumns,
            strictColumnHandling: n.strictColumnHandling,
            delimiter: replaceLiteralEscapes(n.delimiter),
            quote: n.quote,
            escape: n.escape,
            comment: n.comment,
            trim: n.ltrim && n.rtrim ? true : false,
            ltrim: n.ltrim,
            rtrim: n.rtrim,
            rowDelimiter: replaceLiteralEscapes(n.rowDelimiter),
            includeEndRowDelimiter: n.includeEndRowDelimiter,
            quoteHeaders: n.quoteHeaders,
            quoteColumns: n.quoteColumns,
        };
        if (n.headerstr) {
            this.options.headers = n.headerstr.split(',');
        }

        // copy "this" object
        var node = this;

        function parseCsv(msg) {
            var parsedObj = [];
            csv
                .fromString(msg.payload, node.options)
                .on("data", function(data){
                    parsedObj.push(data);
                })
                .on("end", function() {
                    msg.payload = parsedObj;
                    if (parsedObj.length)
                        node.status({fill: "green", shape: "dot", text: ' Parsed: ' + parsedObj.length + ' lines'});
                    else
                        node.status({fill: "red", shape: "ring", text: " No lines parsed!"});
                    node.send(msg);
                }); 
        }
        
        function formatCsv(msg) {
            csv.writeToString(
                msg.payload,
                node.options,
                function(err, data) {
                    if (err) {
                        node.error(err.msg);
                    }
                    else {
                        var re = new RegExp(node.rowDelimiterStr, "g");
                        var lines = (data.match(re)||[]).length;
                        if (lines) {
                            node.status({fill: "green", shape: "dot", text: ' Formatted: ' + lines + ' lines'});
                            msg.payload = data;
                        }
                        else {
                            node.status({fill: "red", shape: "ring", text: " No lines formatted!"});
                            msg.payload = node.options.rowDelimiter;
                        }
                    }
                    node.send(msg);
                }
            );
        }
        
        // Respond to inputs...
        this.on('input', function (msg) {
            if (typeof msg.payload === 'string') {
                parseCsv(msg);
            }
            else {
                formatCsv(msg);
            }
        });

        // Called when the node is shutdown - eg on redeploy.
        // Allows ports to be closed, connections dropped etc.
        this.on("close", function() {
            node.status({});
        });
    }

    // Register the node
    RED.nodes.registerType("fastcsv",FastCsvNode);

};
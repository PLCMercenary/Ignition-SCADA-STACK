function empty(data)
{
    if(typeof(data) == 'number' || typeof(data) == 'boolean')
    { 
        return false; 
    }
    if(typeof(data) == 'undefined' || data === null)
    {
        return true; 
    }
    if(typeof(data.length) != 'undefined')
    {
        return data.length === 0;
    }
    var count = 0;
    for(var i in data)
    {
        if(data.hasOwnProperty(i))
        {
            count ++;
        }
    }
    return count === 0;
}

function checkForValues(jsonObj) {
    var rowHasValues = false;
    for (var property in jsonObj) {
        if (jsonObj.hasOwnProperty(property)) {
            if (!empty(jsonObj[property])) {
                rowHasValues = true;
            }
        }
    }
    return rowHasValues;
}

module.exports = function(RED) {
    // changed in function - "this." replaced with "node."
    function CsvToJsonNode(config) {
        const csv=require('csvtojson');
        var node = this;
        RED.nodes.createNode(node,config);

        // begin set properties        
        node.source = config.source;
        node.ignoreEmpty = config.ignoreEmpty;
        node.trim = config.trim;
        node.noheader = config.noheader;
        node.checkType = config.checkType;
        node.quote = config.quote;
        node.escape = config.escape;
        node.debug = config.debug;

        node.includeColumns = JSON.parse("["+config.includeColumns+"]");
        
        // an empty object causes the actual column headers to be ignored
        if(!empty(config.headers)) {
            node.headers = JSON.parse("["+config.headers+"]");
        } else {
            node.headers = null;
        }

        if (config.delimiter !== "," && config.delimiter.indexOf(',') > -1) {
            node.delimiter = JSON.parse("[" + config.delimiter + "]");
        } else {
            node.delimiter = config.delimiter;
        }

        var csvproperties = {
            noheader:node.noheader,
            includeColumns:node.includeColumns,
            ignoreEmpty:node.ignoreEmpty,
            trim:node.trim,
            checkType:node.checkType,
            delimiter:node.delimiter,
            quote:node.quote,
            escape:node.escape,
            headers:node.headers
        };
        // end set properties

        node.on('input', function(msg) {

            var debug = "";
            var jsonArray = [];
            var csvfunction = null;

            debug = csvproperties;
            
            // set function state based on filename vs. payload input
            if(node.source === "filename") { 
                csvfunction = csv(csvproperties)
                .fromFile(msg.filename);
            } else { // node.source === "payload"
                if ( !(typeof msg.payload === 'string' || msg.payload instanceof String) ) {
                    // if someone messes up populating the payload with a string, try to make it work
                    msg.payload = JSON.stringify(msg.payload);
                }
                csvfunction = csv(csvproperties)
                .fromString(msg.payload);
            }

            // process function events
            csvfunction.
            on('json',(jsonObj, rowIndex)=>{
                if (checkForValues(jsonObj)) {
                    jsonArray.push(jsonObj);
                }
            })
            .on('done',()=>{
                msg.payload = jsonArray;
                if(node.debug) {
                    msg.debug = debug;
                }
                node.send(msg);
            })
            .on('error',(err)=>{
                node.error("Parser error: " + err,msg);
            });
            
        });
     }
    RED.nodes.registerType("csv to json ext",CsvToJsonNode);
}
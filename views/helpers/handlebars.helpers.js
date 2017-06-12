// for date formats
var moment = require('moment');

var register = function(Handlebars) {

    var helpers = {
        // put all of your helpers inside this object
        pluralize: function(number,single,plural){
            if (parseInt(number) == 1) { return single; }
            else { return plural; }
        },
        ifNegative: function(number,tclassname,fclassname){
            if (parseInt(number) < 0){ 
                //Handlebars.Utils.escapeExpression(isneg);
                //return new Handlebars.SafeString(result); 
                return tclassname;

            } else {
                return fclassname;
            }
        },
        formatDate: function(datetime, format){
            if (moment) {
                // get timezone offset
                var d = new Date();
                offset = d.getTimezoneOffset()/60;

                console.log("Handlebars helper. timezone offset: "+offset);
                console.log(datetime);
                var dt = moment(datetime).subtract(offset,'hours');
                console.log(dt);
                return dt.format(format);
            }
            else {
                return datetime;
            }
        },
        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters")
            if (lvalue != rvalue) {
                return options.inverse(this)
            } else {
                return options.fn(this)
            }
        },
        notequal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper notequal needs 2 parameters")
            if (lvalue == rvalue) {
                return options.inverse(this)
            } else {
                return options.fn(this)
            }
        },
        trimString: function(passedString, numchars,options) {
           var theString = passedString.substring( 0, numchars ) + '...';
           return theString;
        }
    };

    if (Handlebars && typeof Handlebars.registerHelper === "function") {
        // register helpers
        for (var prop in helpers) {
            Handlebars.registerHelper(prop, helpers[prop]);
        }
    } else {
        // just return helpers object if we can't register helpers here
        return helpers;
    }

};

module.exports.register = register;
module.exports.helpers = register(null);


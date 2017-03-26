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
              return moment(datetime).format(format);
            }
            else {
              return datetime;
            }
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


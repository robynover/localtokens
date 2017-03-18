var register = function(Handlebars) {

    var helpers = {
        // put all of your helpers inside this object
        pluralize: function(number,single,plural){
            if (parseInt(number) == 1) { return single; }
            else { return plural; }
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


/*
Handlebars.registerHelper('pluralize', function(number, single, plural) {
  if (number === 1) { return single; }
  else { return plural; }
});
 */
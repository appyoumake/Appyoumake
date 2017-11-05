/**
 * Basic calendar component based 
 * @param {type} el
 * @returns {undefined}
 */
//el = element this is initialising

    this.onCreate = function (el) {
        this.onLoad(el);
    };
    
    this.onLoad = function (el) {
        $(el).find("ul").gCalReader({ calendarId: this.config.custom.calendar, apiKey:this.config.custom.apikey, dateFormat: this.config.custom.date_format });
        /*calendarId: 'en.usa#holiday@group.v.calendar.google.com',
        apiKey: 'Public_API_Key',
        dateFormat: 'LongDate',
        errorMsg: 'No events in calendar',
        maxEvents: 50,
        futureEventsOnly: true,
        sortDescending: true*/
    }

    this.onSave = function (el) {
        return this.config.html;
    }
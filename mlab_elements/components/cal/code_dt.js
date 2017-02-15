/**
 * Basic calendar component based 
 * @param {type} el
 * @returns {undefined}
 */
//el = element this is initialising

    this.onCreate = function (el) {
        this.onLoad(el);
    };
    
    this.onCreate = function (el) {
        $(el).find("[data-mlab-cp-cal-name='cal']").fullCalendar({

			header: {
				left: 'prev,next today',
				center: 'title',
				right: 'month,listYear'
			},

			displayEventTime: false, // don't show the time column in list view

			// THIS KEY WON'T WORK IN PRODUCTION!!!
			// To make your own Google API key, follow the directions here:
			// http://fullcalendar.io/docs/google_calendar/
			googleCalendarApiKey: this.config.custom.apikey,
		
			// US Holidays
			events: this.config.custom.calendar,
			
			eventClick: function(event) {
                console.log(event);
				// opens events in a popup window
				window.open(event.url, 'gcalevent', 'width=700,height=600');
				return false;
			},
			
			loading: function(bool) {
				//$('#loading').toggle(bool);
			}
			
		});
    }
    
    this.custom_dont_click = function (el) {
        alert(this.config.custom.msg);
    }
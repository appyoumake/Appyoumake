/**
 * Basic calendar component based on jQueryGCal
 * https://developers.google.com/google-apps/calendar/v3/reference/events/list
 */

/*

created : "2017-10-23T03:30:20.000Z"
creator : {email: "imdbreleases@gmail.com"}
description : "Una Mujer Fantástica (2017)↵Runtime : 104↵Rating : 7.5 (votes 1296)↵Genre : Drama↵Plot : Marina, a waitress who moonlights as a nightclub singer, is bowled over by the death of her older boyfriend.↵IMDB : http://www.imdb.com/title/tt5639354/"
end : {date: "2017-11-09"}
etag : ""3017458841450000""
htmlLink : "https://www.google.com/calendar/event?eid=dW82YTYwbGFhYWJ1N3RwcjY0dDNwamRkajAgaHZ1OXU0cGtmMXJtZXE5cjc0ZGo0ZGYxbzhAZw"
iCalUID : "uo6a60laaabu7tpr64t3pjddj0@google.com"
id : "uo6a60laaabu7tpr64t3pjddj0"
kind : "calendar#event"
location : "Norway"
organizer : {email: "hvu9u4pkf1rmeq9r74dj4df1o8@group.calendar.google.com", displayName: "Movie Releases for Norway", self: true}
sequence : 0
start : {date: "2017-11-09"}
status : "confirmed"
summary : "Una Mujer Fantástica"
updated : "2017-10-23T03:30:20.725Z"
*/
    this.onCreate = function (el) {
        this.onLoad(el);
    };
    
    
    this.onLoad = function (el) {
        this.readCalendar(el);
    };

    this.getOptionsHtml = function() {
        return $('<div>' +
                 '<label>Calendar to use</label><input class="mlab_dt_input" data-mlab-dt-eventcal-setting="calendarId" >' + 
                 '<label>From date</label><input class="mlab_dt_input" data-mlab-dt-eventcal-setting="fromDate" >' +
                 '<label>To date</label><input class="mlab_dt_input" data-mlab-dt-eventcal-setting="toDate" >' +
                 '<button class="mlab_dt_button_cancel mlab_dt_right" onclick="mlab.dt.api.closeAllPropertyDialogs();">Cancel</button>' +
                 '<button class="mlab_dt_button_ok mlab_dt_right" data-mlab-dt-eventcal-setting="update">OK</button>' +
                 '</div>');
    };
    
    this.custom_set_options = function (el, event) {
        var content = this.getOptionsHtml();
        var settings = mlab.dt.api.getVariable(el, "settings");
        var default_settings = this.config.custom.settings;
        var valid_settings = (typeof settings != "undefined");
        for (name in default_settings) {
            if (valid_settings && typeof settings[name] != "undefined") {
                $(content).find("[data-mlab-dt-eventcal-setting='" + name + "']").val(settings[name]);
            } else {
                $(content).find("[data-mlab-dt-eventcal-setting='" + name + "']").val(default_settings[name]);
            }
        }
        
//when click on OK we want to save the data using the standard Mlab API call, and then display the calendar
        content.on("click", "[data-mlab-dt-eventcal-setting='update']", {component: el, default_settings: default_settings }, function(e){ 
                e.preventDefault(); 
                var settings = {};
                var dlg = $(e.currentTarget).parent();
                for (name in e.data.default_settings) {
                    settings[name] = dlg.find("[data-mlab-dt-eventcal-setting='" + name + "']").val();
                }
                mlab.dt.api.setVariable(e.data.component, "settings", settings);
                mlab.dt.api.closeAllPropertyDialogs();
                mlab.dt.components.eventcal.code.readCalendar.call(mlab.dt.components.eventcal.code, e.data.component);
            });

        this.api.displayPropertyDialog(el, "Calendar details", content, null, null, null, null, false, event);        
        
    };
    
    this.getApiKey = function (el) {
        var temp = this.api.getVariable(el, "credentials");
        if (typeof temp != "undefined" && typeof temp["apikey"] != "undefined") {
            return temp["apikey"];
        } else {
            alert("No Google Calendar API key specified, will not be able to request calendar info. Contact the Mlab administrator to obtain a Google Calendar API key");
        }
    }
        
    this.readCalendar = function (el) {
        var that = this;
        var settings = mlab.dt.api.getVariable(el, "settings");
        var apikey = this.getApiKey(el);
        if (settings && apikey && settings.calendarId && settings.fromDate && settings.toDate) {
            var feedUrl = 'https://www.googleapis.com/calendar/v3/calendars/' +
                          encodeURIComponent(settings.calendarId.trim()) +
                          '/events?key=' + apikey +
                          '&orderBy=startTime&singleEvents=true' +
                          '&timeMin=' + settings.fromDate +
                          '&timeMax=' + settings.toDate ;

            $.ajax({
                url: feedUrl,
                dataType: 'json',
                success: function(data) { that.displayCalendar(el, data); },
                error: function(error) { console.log(error); }
            });
        }
    };
    
//new Date(data.items[0].start.dateTime)
//Thu Nov 09 2017 10:00:00 GMT+0100 (CET)
//new Date(data.items[0].start.dateTime).getMonth()
//10

    this.displayCalendar = function (el, data) {
        var cal_content = '';
        var cal_container = $(el).find("[data-mlab-cp='eventcal']");
        var that = this;
        var template = this.config.custom.html_event;
        $.each( data.items, function(e, item) {
            var summary = item.summary || 'UNKNOWN';
            var time = that.formatDate( item.start.dateTime || item.start.date || '', that.config.custom.time_format ) + " - " + that.formatDate( item.end.dateTime || item.end.date || '', that.config.custom.time_format );
            var description = item.description;
            var location = item.location;
            cal_content += template.replace('%%summary%%', summary).replace('%%time%%', time).replace('%%description%%', description).replace('%%location%%', location) + "\n";
        });
        cal_container.html(cal_content);
    };
    
    this.formatDate = function(strDate, strFormat) {
      var fd, arrDate, am, time;
      var calendar = {
        months: {
          full: ['', 'January', 'February', 'March', 'April', 'May',
            'June', 'July', 'August', 'September', 'October',
            'November', 'December'
          ],
          short: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
            'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
          ]
        },
        days: {
          full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
            'Friday', 'Saturday', 'Sunday'
          ],
          short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
            'Sun'
          ]
        }
      };

      if (strDate.length > 10) {
        arrDate = /(\d+)\-(\d+)\-(\d+)T(\d+)\:(\d+)/.exec(strDate);

        am = (arrDate[4] < 12);
        time = am ? (parseInt(arrDate[4]) + ':' + arrDate[5] + ' AM') : (
          arrDate[4] - 12 + ':' + arrDate[5] + ' PM');

        if (time.indexOf('0') === 0) {
          if (time.indexOf(':00') === 1) {
            if (time.indexOf('AM') === 5) {
              time = 'MIDNIGHT';
            } else {
              time = 'NOON';
            }
          } else {
            time = time.replace('0:', '12:');
          }
        }

      } else {
        arrDate = /(\d+)\-(\d+)\-(\d+)/.exec(strDate);
        time = '';
      }

      var year = parseInt(arrDate[1]);
      var month = parseInt(arrDate[2]);
      var dayNum = parseInt(arrDate[3]);

      var d = new Date(year, month - 1, dayNum);

      switch (strFormat) {
        case 'ShortTime':
          fd = time;
          break;
        case 'ShortDate':
          fd = month + '/' + dayNum + '/' + year;
          break;
        case 'LongDate':
          fd = calendar.days.full[d.getDay()] + ' ' + calendar.months.full[month] + ' ' + dayNum + ', ' + year;
          break;
        case 'LongDate+ShortTime':
          fd = calendar.days.full[d.getDay()] + ' ' + calendar.months.full[month] + ' ' + dayNum + ', ' + year + ' ' + time;
          break;
        case 'ShortDate+ShortTime':
          fd = month + '/' + dayNum + '/' + year + ' ' + time;
          break;
        case 'DayMonth':
          fd = calendar.days.short[d.getDay()] + ', ' + calendar.months.full[month] + ' ' + dayNum;
          break;
        case 'MonthDay':
          fd = calendar.months.full[month] + ' ' + dayNum;
          break;
        case 'YearMonth':
          fd = calendar.months.full[month] + ' ' + year;
          break;
        default:
          fd = calendar.days.full[d.getDay()] + ' ' + calendar.months.short[month] + ' ' + dayNum + ', ' + year + ' ' + time;
      }

      return fd;
  };

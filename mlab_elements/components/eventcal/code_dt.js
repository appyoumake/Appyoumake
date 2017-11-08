/**
 * Basic calendar component based on jQueryGCal
 * https://developers.google.com/google-apps/calendar/v3/reference/events/list
 */

/*
<div data-role="tabs" id="tabs">
  <div data-role="navbar">
    <ul>
      <li><a href="#one" data-ajax="false">one</a></li>
      <li><a href="#two" data-ajax="false">two</a></li>
      <li><a href="ajax-content-ignore.html" data-ajax="false">three</a></li>
    </ul>
  </div>
  <div id="one" class="ui-body-d ui-content">
    <h1>First tab contents</h1>
  </div>
  <div id="two">
    <ul data-role="listview" data-inset="true">
        <li><a href="#">Acura</a></li>
        <li><a href="#">Audi</a></li>
        <li><a href="#">BMW</a></li>
        <li><a href="#">Cadillac</a></li>
        <li><a href="#">Ferrari</a></li>
    </ul>
  </div>
</div>
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
        debugger;
        var that = this;
        var settings = mlab.dt.api.getVariable(el, "settings");
        var apikey = this.getApiKey(el);
        var feedUrl = 'https://www.googleapis.com/calendar/v3/calendars/' +
                      encodeURIComponent(settings.calendarId.trim()) +
                      '/events?key=' + apikey +
                      '&orderBy=startTime&singleEvents=true' +
                      '&timeMin=' + settings.fromDate +
                      '&timeMax=' + settings.toDate ;
              
        $.ajax({
            url: feedUrl,
            dataType: 'json',
            success: function(data) {
//              data.items = data.items.reverse();
//              data.items = data.items.slice(0, defaults.maxEvents);
              that.displayCalendar(el, data);

            },
            error: function(error) {
              console.log(error);
            }
        });
    };
    
    this.displayCalendar = function (el, data) {
        var cal_content = '';
        var cal_container = $(el).find("table");
        var that = this;
        $.each(data.items, function(e, item) {
              var eventdate = item.start.dateTime || item.start.date ||'';
              var summary = item.summary || '';
                        var description = item.description;
                        var location = item.location;
                        cal_content +='<tr><td class="mlab_ct_cal_eventtitle">' + summary + '</td>';
                        cal_content +='<td class="mlab_ct_cal_eventdate">'+ that.formatDate(eventdate, 'ShortDate+ShortTime') +'</td></tr>';
                        if(location) {
                            cal_content +='<tr><td class="mlab_ct_cal_location">' + location + '</td></tr>';
                        }
                        if(description) {
                            cal_content +='<tr><td class="mlab_ct_cal_description">' + description + '</td></tr>';
                        }
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

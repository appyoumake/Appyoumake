/**
 * Basic calendar component based on jQueryGCal
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
    };

    this.onSave = function (el) {
        return this.config.html;
    };
    
    this.getOptionsHtml = function() {
        var apikey_html = "";
        if (!this.config.apikey) {
            apikey_html = '<label>API Key</label><input class="mlab_dt_input" data-mlab-dt-eventcal-setting="apiKey" />';
        }
        return $('<div/>' +
                 apikey_html +
                 '<label>Calendar to use</label><input class="mlab_dt_input" data-mlab-dt-eventcal-setting="calenderId" />' + 
                 '<label>From date</label><input class="mlab_dt_input" data-mlab-dt-eventcal-setting="fromDate" />' +
                 '<label>To date</label><input class="mlab_dt_input" data-mlab-dt-eventcal-setting="toDate" />' +
                 '<button class="mlab_dt_button_cancel mlab_dt_right" onclick="mlab.dt.api.closeAllPropertyDialogs();">Cancel</button>' +
                 '<button class="mlab_dt_button_ok mlab_dt_right" data-mlab-dt-eventcal-setting="update">OK</button>');
    };
    
    this.custom_set_options = function (el, event) {

        var content = this.getOptionsHtml();
        var settings = mlab.dt.api.getVariable(el, "settings");
        if (typeof settings != "undefined") {
            var setting_keys = ["apiKey", "calenderId", "fromDate", "toDate"];
            for (name in setting_keys) {
                if (typeof settings[setting_keys[name]] != "undefined") {
                    $(content).find("[data-mlab-dt-eventcal-property='" + setting_keys[name] + "']").val(settings[setting_keys[name]]);
                } else {
                    $(content).find("[data-mlab-dt-eventcal-property='" + setting_keys[name] + "']").val(this.config.custom[setting_keys[name]]);
                }
            }
        }

        $(content).on("click", "[data-mlab-dt-eventcal-setting='update']", function() {
            var settings = {};
            var settings_div = $(this).parent();
            for (name in setting_keys) {
                settings[setting_keys[name]] = settings_div.find("[data-mlab-dt-eventcal-property='" + setting_keys[name] + "']").val();
            }
            mlab.dt.api.setVariable(el, "settings", settings);
            mlab.dt.api.closeAllPropertyDialogs();
        }); 

        this.api.displayPropertyDialog(el, "Calendar details", content, null, null, null, null, false, event);        
        
    };
        
    this.display_calendar = function (el){
        $.each(data.items, function(e, item) {
              var eventdate = item.start.dateTime || item.start.date ||'';
              var summary = item.summary || '';
                        var description = item.description;
                        var location = item.location;
                        s ='<span class="mlab_ct_cal_eventtitle">' + summary + '</span>';
                        s +='<span class="mlab_ct_cal_eventdate">'+ formatDate(eventdate, defaults.dateFormat.trim()) +'</span>';
                        if(location) {
                            s +='<span class="mlab_ct_cal_location">' + location + '</span>';
                        }
                        if(description) {
                            s +='<span class="mlab_ct_cal_description">'+ description +'</span>';
                        }
                        $($div).append('<li>' + s + '</li>');
            });
    };
    
    this.read_calendar = function (el){
        var $div = $(el);
        var that = this;
        var s = '';
        var feedUrl = 'https://www.googleapis.com/calendar/v3/calendars/' +
          encodeURIComponent(this.config.calendarId.trim()) +'/events?key=' + this.config.apikey +
          '&orderBy=startTime&singleEvents=true';
          if(defaults.futureEventsOnly) {
            feedUrl+='&timeMin='+ new Date().toISOString();
        }

        $.ajax({
          url: feedUrl,
          dataType: 'json',
          success: function(data) {
//            data.items = data.items.reverse();
            data.items = data.items.slice(0, defaults.maxEvents);
            that.display_calendar(el);
            
          },
          error: function(error) {
            $($div).append('<p>' + defaults.errorMsg + ' | ' + error + '</p>');
          }
        });


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
          fd = calendar.days.full[d.getDay()] + ' ' + calendar.months.full[
            month] + ' ' + dayNum + ', ' + year;
          break;
        case 'LongDate+ShortTime':
          fd = calendar.days.full[d.getDay()] + ' ' + calendar.months.full[
            month] + ' ' + dayNum + ', ' + year + ' ' + time;
          break;
        case 'ShortDate+ShortTime':
          fd = month + '/' + dayNum + '/' + year + ' ' + time;
          break;
        case 'DayMonth':
          fd = calendar.days.short[d.getDay()] + ', ' + calendar.months.full[
            month] + ' ' + dayNum;
          break;
        case 'MonthDay':
          fd = calendar.months.full[month] + ' ' + dayNum;
          break;
        case 'YearMonth':
          fd = calendar.months.full[month] + ' ' + year;
          break;
        default:
          fd = calendar.days.full[d.getDay()] + ' ' + calendar.months.short[
            month] + ' ' + dayNum + ', ' + year + ' ' + time;
      }

      return fd;
  };

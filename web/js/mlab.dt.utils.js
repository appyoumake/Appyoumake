function Mlab_dt_utils(){this.parent=null;this.timer_save=null}Mlab_dt_utils.prototype={update_status:function(c,b,a){if(c=="permanent"){$("#mlab_statusbar_permanent").text(b);return}else{if(c=="temporary"){$("#mlab_statusbar_temporary").text(b);window.setTimeout(this.clear_status.bind(this),3000)}else{if(c=="callback"){$("#mlab_statusbar_temporary").text(b)}else{if(c=="completed"){$("#mlab_statusbar_temporary").text("");$("#mlab_statusbar_progress_spin").spin(false);$("#mlab_statusbar_progress_spin").hide();return}}}}if(typeof a!="undefined"&&a==true){$("#mlab_statusbar_progress_spin").show();$("#mlab_statusbar_progress_spin").spin("small","#fff")}else{if(typeof a!="undefined"&&a==false){$("#mlab_statusbar_progress_spin").spin(false);$("#mlab_statusbar_progress_spin").hide()}}},clear_status:function(){this.update_status("completed")},timer_start:function(){var a=parseInt(this.parent.config.save_interval);if(a<60){a=60}this.timer_save=window.setTimeout(this.parent.management.page_save.bind(this.parent.management),a*1000)},timer_stop:function(){window.clearTimeout(this.timer_save)},merge_objects:function(b,a){for(var c in b){if(typeof b[c]=="object"){if(typeof a[c]=="undefined"){a[c]=new Object()}a[c]=this.merge_objects(b[c],a[c])}else{if(typeof a[c]=="undefined"){a[c]=b[c]}}}return a},process_inheritance_helper:function(b,a){if(typeof b[a].conf.inherit!="undefined"){var c=b[a].conf.inherit;if(typeof b[c]!="undefined"){if(!b[c].inheritance_processed&&b[c].conf.inherit!="undefined"){this.process_inheritance_helper(b,c)}b[a]=this.merge_objects(b[c],b[a]);b[a].inheritance_processed=true}else{console.log("Parent object for "+a+" does not exist:"+c)}}},process_inheritance:function(a){for(index in a){this.process_inheritance_helper(a,index)}},getCookie:function(d){var b=d+"=";var a=document.cookie.split(";");for(var e=0;e<a.length;e++){var f=a[e];while(f.charAt(0)==" "){f=f.substring(1)}if(f.indexOf(b)==0){return f.substring(b.length,f.length)}}return 1}};
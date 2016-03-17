function Mlab_dt_design(){this.parent=null}Mlab_dt_design.prototype={domParserWrapper:function(){var a=DOMParser.prototype;var b=a.parseFromString;try{if((new DOMParser).parseFromString("","text/html")){return}}catch(c){}a.parseFromString=function(d,e){if(/^\s*text\/html\s*(?:;|$)/i.test(e)){var f=document.implementation.createHTMLDocument("");if(d.toLowerCase().indexOf("<!doctype")>-1){f.documentElement.innerHTML=d}else{f.body.innerHTML=d}return f}else{return b.apply(this,arguments)}}},component_add:function(b){if(this.parent.app.locked){return}if(this.parent.components[b].conf.unique&&$("#"+this.parent.config.app["content_id"]).find("[data-mlab-type='"+b+"']").length>0){alert(_tr["mlab.dt.design.js.alert.only.one.comp"]);return}this.parent.flag_dirty=true;var c=(typeof this.parent.components[b].conf.resizeable!="undefined"&&this.parent.components[b].conf.resizeable==true)?"data-mlab-aspectratio='4:3' data-mlab-size='medium'":"";var d=(typeof this.parent.components[b].conf.display_dependent!="undefined"&&this.parent.components[b].conf.display_dependent==true)?"data-mlab-displaydependent='true'":"";if(c!=""){var i=$("<div data-mlab-type='"+b+"' "+d+" style='display: block;'><div data-mlab-sizer='1' "+c+" >"+this.parent.components[b].html+"</div></div>")}else{var i=$("<div data-mlab-type='"+b+"' "+d+" style='display: block;'>"+this.parent.components[b].html+"</div>")}$("#"+this.parent.config.app["content_id"]).append(i);i.on("click",function(){var k=mlab.dt.api.display.componentHighlightSelected($(this));if(k){mlab.dt.design.component_menu_prepare()}});i.on("input",function(){mlab.dt.flag_dirty=true});if(typeof this.parent.components[b].conf.process_keypress!="undefined"&&this.parent.components[b].conf.process_keypress){$(i).keydown(function(k){mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(k)})}$(".mlab_current_component").qtip("hide");if(this.parent.api.display.componentHighlightSelected(i)){this.component_menu_prepare()}window.scrollTo(0,document.body.scrollHeight);this.parent.api.getLibraries(b);if(this.parent.components[b].hasOwnProperty("conf")&&this.parent.components[b].conf.hasOwnProperty("dependencies")){for(component in this.parent.components[b].conf.dependencies){this.feature_add(this.parent.components[b].conf.dependencies[0],true)}}var a=this.parent.urls.component_added.replace("_APPID_",this.parent.app.id);a=a.replace("_COMPID_",b);var g=this;var j=b;var e=$.ajax({type:"GET",url:a,dataType:"json"});this.parent.drag_origin="sortable";if(c!=""){this.parent.api.display.updateDisplay($(i).children("[data-mlab-sizer]"))}var h=i;var f=j;if(Object.prototype.toString.call(this.parent.components[j].conf.credentials)==="[object Array]"){this.parent.api.getCredentials(this.parent.components[j].conf.credentials,function(k,l){mlab.dt.design.component_store_credentials(k,l);g.component_run_code(h,f,true)},{component:i})}else{this.component_run_code(h,f,true)}e.done(function(k){if(k.result=="success"){}else{alert(k.msg+"'\n\n"+_tr["mlab.dt.design.js.alert.add.comp"]);$(i).remove()}});e.fail(function(k,l){alert(_tr["mlab.dt.design.js.alert.error.occurred"]+": '"+k.responseText+"'\n\n"+_tr["mlab.dt.design.js.alert.add.comp"]);$(i).remove();this.parent.flag_dirty=false})},component_run_code:function(el,comp_id,created){if(typeof this.parent.components[comp_id]=="undefined"||typeof this.parent.components[comp_id].code=="undefined"){return}if(created){if(typeof this.parent.components[comp_id].code.onCreate!="undefined"){this.parent.components[comp_id].code.onCreate(el)}if(typeof this.parent.components[comp_id].conf.autorun_on_create=="string"){var func=this.parent.components[comp_id].conf.autorun_on_create;eval("this.parent.components[comp_id].code."+func+"(el, {currentTarget: mlab.dt.qtip_tools.qtip().tooltip.find('[data-mlab-comp-tool-id=\""+func+"\"]')[0]});")}}else{if(typeof this.parent.components[comp_id].code.onLoad!="undefined"){this.parent.components[comp_id].code.onLoad(el)}}},component_moveup:function(a){if(typeof a=="undefined"){var a=$(".mlab_current_component")}if(a.length==0){return}a.fadeOut(500,function(){a.insertBefore(a.prev());var b=a;a.fadeIn(500,function(){b.qtip("api").reposition(null,false);if(mlab.dt.api.properties_tooltip){$(mlab.dt.api.properties_tooltip).qtip("api").reposition(null,false)}})});this.parent.flag_dirty=true},component_movedown:function(){if(typeof a=="undefined"){var a=$(".mlab_current_component")}if(a.length==0){return}a.fadeOut(500,function(){a.insertAfter(a.next());var b=a;a.fadeIn(500,function(){b.qtip("api").reposition(null,false);if(mlab.dt.api.properties_tooltip){$(mlab.dt.api.properties_tooltip).qtip("api").reposition(null,false)}})});this.parent.flag_dirty=true},invert_color:function(a){a=[].slice.call(arguments).join(",").replace(/rgb\(|\)|rgba\(|\)|\s/gi,"").split(",");for(var b=0;b<a.length;b++){a[b]=(b===3?1:255)-a[b]}return a.join(", ")},component_delete:function(b){if(b){mlab.dt.api.closeAllPropertyDialogs();var a=$(".mlab_current_component").prev();if(a.length==0){a=$(".mlab_current_component").next()}$(".mlab_current_component").qtip("hide");$(".mlab_current_component").remove();if(a.length>0){if(this.parent.api.display.componentHighlightSelected(a)){this.component_menu_prepare()}}this.parent.flag_dirty=true;return true}$("#mlab_dialog_delete").dialog({title:_tr["build_app.dialog.delete.title"],dialogClass:"no-close",modal:true,buttons:[{text:_tr["mlab.dt.api.js.getLink.ok"],click:function(){$(this).dialog("destroy");mlab.dt.api.closeAllPropertyDialogs();var c=$(".mlab_current_component").prev();if(c.length==0){c=$(".mlab_current_component").next()}$(".mlab_current_component").qtip("hide");$(".mlab_current_component").remove();if(c.length>0){if(this.parent.api.display.componentHighlightSelected(c)){this.component_menu_prepare()}}this.parent.flag_dirty=true}},{text:_tr["mlab.dt.api.js.getLink.cancel"],click:function(){$(this).dialog("destroy");return false}}]})},component_help:function(){var e=$(".mlab_current_component").data("mlab-type");var a=this.parent.api.getLocaleComponentMessage(e,["extended_name"]);var c=$(".mlab_help_icon");var b="mlab_comp_help_qTip";var d=_tr["mlab.dt.design.js.qtip.help.title"]+a;this.parent.api.displayExternalHelpfile(e,d,c,b)},component_cut:function(){var a=true;mlab.dt.clipboard=$(".mlab_current_component").clone();this.component_delete(a)},component_copy:function(){mlab.dt.clipboard=$(".mlab_current_component").clone()},component_paste:function(){var a=mlab.dt.clipboard.data("mlab-type");if(this.parent.components[a].conf.unique&&$("#"+this.parent.config.app["content_id"]).find("[data-mlab-type='"+a+"']").length>0){alert(_tr["mlab.dt.design.js.alert.only.one.comp"]);return}$(".mlab_current_component").removeClass("mlab_current_component");$("#"+this.parent.config.app["content_id"]).append(mlab.dt.clipboard);if(this.parent.api.display.componentHighlightSelected(mlab.dt.clipboard)){this.component_menu_prepare()}window.scrollTo(0,document.body.scrollHeight);mlab.dt.clipboard.on("click",function(){var b=mlab.dt.api.display.componentHighlightSelected($(this));if(b){mlab.dt.design.component_menu_prepare()}});mlab.dt.clipboard.on("input",function(){mlab.dt.flag_dirty=true});if(typeof this.parent.components[a].conf.process_keypress!="undefined"&&this.parent.components[a].conf.process_keypress){$(mlab.dt.clipboard).keydown(function(b){mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(b)})}this.parent.flag_dirty=true},component_edit_credentials:function(){var a=$(".mlab_current_component");var b=a.data("mlab-type");if(Object.prototype.toString.call(this.parent.components[b].conf.credentials)==="[object Array]"){this.parent.api.getCredentials(this.parent.components[b].conf.credentials,this.component_store_credentials,{component:a})}},feature_add:function(h,a){if($(this.parent.app.curr_indexpage_html).find("#mlab_features_content").length==0){$(this.parent.app.curr_indexpage_html).find("body").append("<div id='mlab_features_content' style='display: none;'></div>")}else{if($(this.parent.app.curr_indexpage_html).find("#mlab_features_content [data-mlab-type='"+h+"']").length>0){if(!a){this.parent.utils.update_status("temporary",_tr["mlab.dt.design.js.update_status.feature.already.added"],false)}return}}var i=this.parent.components[h].conf;var f=(typeof i.resizeable!="undefined"&&i.resizeable==true)?"data-mlab-aspectratio='1:1' data-mlab-size='medium'":"";var g=((typeof i.display_dependent!="undefined"&&i.display_dependent==true)||(typeof i.resizeable!="undefined"&&i.resizeable==true))?"data-mlab-displaydependent='true'":"";$(this.parent.app.curr_indexpage_html).find("#mlab_features_content").append("<div data-mlab-type='"+h+"' "+f+" "+g+" >"+this.parent.components[h].html+"</div>");var e=$(this.parent.app.curr_indexpage_html).find("#mlab_features_content [data-mlab-type='"+h+"']");if(e.length>0){this.parent.components[h].code.onCreate(e[0])}if(this.parent.app.curr_page_num!="0"&&this.parent.app.curr_page_num!="index"){var b=this.parent.urls.feature_add.replace("_APPID_",this.parent.app.id);b=b.replace("_COMPID_",h);if(!a){this.parent.utils.update_status("callback",_tr["mlab.dt.design.js.update_status.adding.feature"],true)}var d=this;$.get(b,function(c){if(c.result=="success"){d.parent.utils.update_status("temporary",_tr["mlab.dt.design.js.update_status.feature.added"],false);$("#mlab_features_list [data-mlab-feature-type='"+c.component_id+"']").addClass("mlab_item_applied")}else{d.parent.utils.update_status("temporary",c.msg,false)}})}},storage_plugin_add:function(c,b){var a=this.parent.urls.storage_plugin_add.replace("_APPID_",this.parent.app.id);a=a.replace("_STORAGE_PLUGIN_ID_",c);this.parent.utils.update_status("callback",_tr["mlab.dt.design.js.update_status.adding.storage.plugin"],true);var d=this;$.get(a,function(e){if(e.result=="success"){d.parent.utils.update_status("temporary",_tr["mlab.dt.design.js.update_status.storage.plugin.added"],false);$("#mlab_storage_plugin_list [data-mlab-storage-plugin-type='"+e.storage_plugin_id+"']").addClass("mlab_item_applied");if(Object.prototype.toString.call(d.parent.components[c].conf.credentials)==="[object Array]"){d.parent.api.getStorageCredentials(d.parent.components[c].conf.credentials,d.storage_plugin_store_credentials,{storage_plugin_id:c,component:b})}else{mlab.dt.api.setVariable(b,"storage_plugin",{name:c});$(mlab.dt.qtip_tools).qtip().elements.content.find("[data-mlab-storage-plugin-type='storage_plugins']").slideUp()}}else{d.parent.utils.update_status("temporary",e.msg,false)}})},component_store_credentials:function(a,b){mlab.dt.api.setVariable(b.component,"credentials",a)},storage_plugin_store_credentials:function(a,b){mlab.dt.api.setVariable(b.component,"storage_plugin",{name:b.storage_plugin_id,credentials:a})},prepare_editable_area:function(){var a=this;$("#"+a.parent.config.app["content_id"]+"> div").each(function(b){$(this).droppable(a.parent.droppable_options).sortable(a.parent.sortable_options).on("click",function(){var c=mlab.dt.api.display.componentHighlightSelected($(this));if(c){mlab.dt.design.component_menu_prepare()}}).on("input",function(){mlab.dt.flag_dirty=true});comp_id=$(this).data("mlab-type");a.component_run_code($(this),comp_id);if(typeof a.parent.components[comp_id].conf.process_keypress!="undefined"&&a.parent.components[comp_id].conf.process_keypress){$(this).keydown(function(c){mlab.dt.components[$(this).data("mlab-type")].code.onKeyPress(c)})}});$("#"+a.parent.config.app["content_id"]).droppable(a.parent.droppable_options).sortable(a.parent.sortable_options)},component_menu_prepare:function(){var p=$(".mlab_current_component");if(p.length<1){return}var j=this.parent.components[p.data("mlab-type")].conf;var c=p.data("mlab-type");var k=new Object();var n="";var a=$("#mlab_toolbar_for_components .mlab_component_context_menu");var d=[];var h=mlab.dt.api.getLocale();$("#mlab_toolbar_for_components .mlab_component_toolbar_heading").text(this.parent.api.getLocaleComponentMessage(c,["extended_name"]));a.html("");if(typeof j.custom!="undefined"){for(var g in this.parent.components[c].code){if(g.substr(0,7)=="custom_"){n=g.slice(7);if(typeof j.custom[n]!="undefined"){var m=(typeof j.custom[n]["icon"]!="undefined")?"src='"+j.custom[n]["icon"]+"'":"class='missing_icon'";var i=this.parent.api.getLocaleComponentMessage(c,["custom",n,"tooltip"]);var b=(typeof j.custom[n]["order"]!="undefined")?j.custom[n]["order"]:0;if(typeof j.custom[n]["newline"]!="undefined"&&j.custom[n]["newline"]===true){var o="mlab_newline"}else{var o=""}d[b]="<img onclick='(function(e){ mlab.dt.components."+c+".code."+g+"($(\".mlab_current_component\"), e);})(event)' title='"+i+"' class='"+o+"' data-mlab-comp-tool-id='"+g+"' "+m+" >"}}}a.append(d.join(""));a.append("<div class='clear'>&nbsp;</div>")}if(typeof j.credentials!="undefined"&&Object.prototype.toString.call(j.credentials)==="[object Array]"){$("#mlab_button_get_credentials").removeClass("mlab_hidden")}else{$("#mlab_button_get_credentials").addClass("mlab_hidden")}if(typeof j.storage_plugin!="undefined"&&j.storage_plugin==true){$("#mlab_button_select_storage_plugin").removeClass("mlab_hidden");$("#mlab_storage_plugin_list li").removeClass("mlab_item_applied");var f=this.parent.api.getVariable(p[0],"storage_plugin");if(typeof f!="undefined"&&typeof f.name!="undefined"){$("#mlab_storage_plugin_list [data-mlab-storage-plugin-type='"+f.name+"']").addClass("mlab_item_applied")}}else{$("#mlab_button_select_storage_plugin").addClass("mlab_hidden")}if(typeof j.resizeable!="undefined"&&j.resizeable==true){$("#mlab_button_component_size").removeClass("mlab_hidden");$("#mlab_button_component_aspect").removeClass("mlab_hidden");$("#mlab_component_size_list li").removeClass("mlab_item_applied");$("#mlab_component_aspect_list li").removeClass("mlab_item_applied");$("#mlab_component_size_list [data-data-mlab-comp-size='"+p.data("mlab-comp-size")+"']").addClass("mlab_item_applied");$("#mlab_component_aspect_list [data-data-mlab-comp-aspect='"+p.data("mlab-comp-aspect")+"']").addClass("mlab_item_applied")}else{$("#mlab_button_component_size").addClass("mlab_hidden");$("#mlab_button_component_aspect").addClass("mlab_hidden")}var l="leftTop";var e=p.offset().top;e=e-$(window).scrollTop();if(e>450){l="leftBottom"}this.parent.qtip_tools=$(p).qtip({solo:false,content:{text:function(){return $("#mlab_toolbar_for_components").clone(true)}},position:{my:l,at:"rightTop",adjust:{screen:true}},show:{ready:true,modal:{on:false,blur:false}},hide:false,events:{hide:function(r,q){$(mlab.dt.api.properties_tooltip).qtip("hide");q.destroy()},visible:function(r,q){$(mlab.dt.qtip_tools).qtip().elements.content.find("*").removeAttr("id")}},style:{classes:"qtip-light mlab_zindex_regular_tooltip"}});$(p).qtip("show")},toggle_footer:function(){var b=$(".mlab_editor_footer");var a=$(".mlab_editor_footer_help");if(b.hasClass("mlab_transparent")){b.removeClass("mlab_transparent");a.removeClass("mlab_hidden")}else{b.addClass("mlab_transparent");a.addClass("mlab_hidden")}}};
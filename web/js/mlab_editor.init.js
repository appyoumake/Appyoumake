$.mobile.autoInitializePage=false;$(document).ready(function(){if(bowser.gecko||bowser.chrome){}else{alert(_tr["mlab_editor.init.js.alert.browser.support"]);$("body").append('<div id="mlab_editor_disabled" style="background-color: gray; position: absolute;top:0;left:0;width: 100%;height:100%;z-index:2;opacity:0.4;filter: alpha(opacity = 50)"></div>')}Mlab=function(){var self=this;this.locale=document.mlab_temp_vars.locale;this.api=new Mlab_api();this.api.parent=self;this.dt={uid:0,config:new Object(),paths:new Object(),app:new Object(),page:new Object(),flag_dirty:false,counter_saving_page:0,drag_origin:"sortable",mlab_component_cur_tooltip:null,droppable_options:{drop:function(event,ui){mlab.dt.flag_dirty=true}},sortable_options:{placeholder:"mlab_component_placeholder",revert:false,helper:"clone",cancel:"[contenteditable]",stop:function(event,ui){if(mlab.dt.drag_origin=="sortable"&&ui.item.data("contenteditable")=="true"){ui.item.attr("contenteditable","true")}mlab.dt.flag_dirty=true}},api:new Mlab_dt_api(),bestpractice:new Mlab_dt_bestpractice(),design:new Mlab_dt_design(),management:new Mlab_dt_management(),utils:new Mlab_dt_utils()},this.initialise_dt_parents=function(){self.dt.parent=self;self.dt.api.parent=self.dt;self.dt.api.display.parent=self.dt.api;self.dt.bestpractice.parent=self.dt;self.dt.design.parent=self.dt;self.dt.management.parent=self.dt;self.dt.utils.parent=self.dt}};mlab=new Mlab();mlab.initialise_dt_parents();$.get(document.mlab_temp_vars.appbuilder_root_url+document.mlab_temp_vars.app_id+"/"+document.mlab_temp_vars.page_num+"/load_variables",function(data){if(data.result==="success"){mlab.dt.uid=data.mlab_uid;mlab.dt.user_email=data.mlab_current_user_email;mlab.dt.app=data.mlab_app;mlab.dt.app.curr_page_num=data.mlab_app_page_num;mlab.dt.app.app_checksum=data.mlab_app_checksum;mlab.dt.app.compiled_files=data.mlab_compiled_files;mlab.dt.config=data.mlab_config;mlab.dt.urls=data.mlab_urls;window.onbeforeunload=function(){var url=mlab.dt.urls.editor_closed.replace("_UID_",mlab.dt.uid);$.ajax({url:url,async:false});if(mlab.dt.flag_dirty){return _tr["mlab_editor.init.js.alert.unsaved"]}var compcat=$("#mlab_toolbar_components h3");if(typeof compcat!="undefined"){compcat.each(function(){var cat=$(this).data("mlab-category");if($(this).hasClass("ui-state-active")){document.cookie="mlabCompCat"+cat+"=0; expires=Thu, 18 Dec 2053 12:00:00 UTC; path=/"}else{document.cookie="mlabCompCat"+cat+"=1; expires=Thu, 18 Dec 2053 12:00:00 UTC; path=/"}})}};$.get(document.mlab_temp_vars.appbuilder_root_url+document.mlab_temp_vars.app_id+"/load_components",function(data){if(data.result==="success"){var loc=mlab.dt.api.getLocale();mlab.dt.components=data.mlab_components;mlab.dt.storage_plugins={};var components_html={};var features_html=[];var additional_html="";for(type in mlab.dt.components){if(mlab.dt.components[type].code!==false){eval("mlab.dt.components['"+type+"'].code = new function() { "+mlab.dt.components[type].code+"};");mlab.dt.components[type].code.config=mlab.dt.components[type].conf}var c=mlab.dt.components[type];if(c.accessible&&!(c.is_feature||c.is_storage_plugin)){var tt=mlab.dt.api.getLocaleComponentMessage(type,["tooltip"]);var tte=mlab.dt.api.getLocaleComponentMessage(type,["footer_tip"]);var eName=mlab.dt.api.getLocaleComponentMessage(type,["extended_name"]);if(typeof components_html[c.conf.category]=="undefined"){components_html[c.conf.category]=[]}components_html[c.conf.category][parseInt(c.order_by)]="<div data-mlab-type='"+type+"' onclick='mlab.dt.design.component_add(\""+type+"\");' title='"+tt+"' class='mlab_button_components' style='background-image: url(\""+mlab.dt.config.urls.component+type+"/"+mlab.dt.config.component_files.ICON+"\");'></div><div class='mlab_component_footer_tip'>"+tte+"</div>"}else{if(c.accessible&&c.is_feature){features_html[parseInt(c.data.statusorder_by)]="<div data-mlab-type='"+type+"' onclick='mlab.dt.design.feature_add(\""+type+"\");' title='"+tt+"' class='mlab_button_components' style='background-image: url(\""+mlab.dt.config.urls.component+type+"/"+mlab.dt.config.component_files.ICON+"\");'></div><div class='mlab_component_footer_tip'>"+tte+"</div>"}else{if(c.accessible&&c.is_storage_plugin){mlab.dt.storage_plugins[type]=eName}}}}function getCookie(cname){var name=cname+"=";var ca=document.cookie.split(";");for(var i=0;i<ca.length;i++){var c=ca[i];while(c.charAt(0)==" "){c=c.substring(1)}if(c.indexOf(name)==0){return c.substring(name.length,c.length)}}return 1}var cookieExsists=getCookie("mlabCompCattext");if(cookieExsists===1){document.cookie="mlabCompCattext=0; expires=Thu, 18 Dec 2053 12:00:00 UTC; path=/"}for(category in components_html){var activeCat=Number(getCookie("mlabCompCat"+category));$("<div><h3 data-mlab-category='"+category+"'>"+category+"</h3><div>"+components_html[category].join("")+"</div></div>").appendTo("#mlab_toolbar_components").accordion({heightStyle:"content",active:activeCat,collapsible:true})}if(features_html.length!=0){var activeCat=Number(getCookie("mlabCompCatFeatures"));$("<div><h3 data-mlab-category='Features'>Features</h3><div>"+features_html.join("")+"</div></div>").appendTo("#mlab_toolbar_components").accordion({heightStyle:"content",active:activeCat,collapsible:true})}mlab.dt.utils.process_inheritance(mlab.dt.components);for(index in mlab.dt.components){if(typeof mlab.dt.components[index].code!="undefined"&&mlab.dt.components[index].code!==false){mlab.dt.components[index].code.api=mlab.dt.api}}$(".mlab_button_components").mouseover(function(e){$(".mlab_editor_footer_help").text(e.currentTarget.nextSibling.textContent)});$(".mlab_button_components").mouseout(function(e){$(".mlab_editor_footer_help").text("")});mlab.dt.management.app_open(document.mlab_temp_vars.app_id,document.mlab_temp_vars.page_num);delete document.mlab_temp_vars;$("#mlab_statusbar_progress_spin").spin("small","#fff");$("[data-mlab-comp-tool='move_up']").on("click",function(){mlab.dt.design.component_moveup()});$("[data-mlab-comp-tool='move_down']").on("click",function(){mlab.dt.design.component_movedown()});$("[data-mlab-comp-tool='delete']").on("click",function(){mlab.dt.design.component_delete()});$("[data-mlab-comp-tool='help']").on("click",function(){mlab.dt.design.component_help()});$("[data-mlab-comp-tool='cut']").on("click",function(){mlab.dt.design.component_cut()});$("[data-mlab-comp-tool='copy']").on("click",function(){mlab.dt.design.component_copy()});$("[data-mlab-comp-tool='paste']").on("click",function(){mlab.dt.design.component_paste()});$("[data-mlab-comp-tool='redo']").on("click",function(){document.execCommand("redo")});$("[data-mlab-comp-tool='undo']").on("click",function(){document.execCommand("undo")});$("#mlab_page_control_title").on("click",function(){mlab.dt.api.editContent(this);$("#mlab_page_control_title_actions").show();$("#mlab_page_control_title").attr("title",_tr["app.builder.page.tooltip.page.name.edit"])});$("#mlab_page_control_save_title").on("click",function(){$("#mlab_page_control_title_actions").hide();$("#mlab_page_control_title").attr("title",_tr["app.builder.page.tooltip.page.name"]);mlab.dt.management.page_update_title()});$("#mlab_page_control_cancel_title").on("click",function(){$("#mlab_page_control_title_actions").hide();$("#mlab_page_control_title").attr("title",_tr["app.builder.page.tooltip.page.name"]);$("#mlab_page_control_title").text(mlab.dt.app.curr_pagetitle)});$("#mlab_page_control_new").on("click",function(){mlab.dt.management.page_new()});$("#mlab_page_control_delete").on("click",function(){mlab.dt.management.page_delete()});$("#mlab_page_help").on("click",function(){page_help(event)});$("#mlab_button_help").on("click",function(){mlab.dt.design.toggle_footer()});$("#mlab_editor_menu_dropdown").on("click",function(event){if($("#mlab_user_menu_dropdown_content").hasClass("mlab_show_user_dropdown")){$("#mlab_user_menu_dropdown_content").toggleClass("mlab_show_user_dropdown");$("#mlab_user_menu_dropdown").toggleClass("mlab_show_user_dropdown_tab_selected")}$("#mlab_editor_menu_dropdown_content").toggleClass("mlab_show_editor_dropdown");$("#mlab_editor_menu_dropdown").toggleClass("mlab_show_editor_dropdown_tab_selected");event.stopPropagation()});$("#mlab_user_menu_dropdown").on("click",function(event){if($("#mlab_editor_menu_dropdown_content").hasClass("mlab_show_editor_dropdown")){$("#mlab_editor_menu_dropdown_content").toggleClass("mlab_show_editor_dropdown");$("#mlab_editor_menu_dropdown").toggleClass("mlab_show_editor_dropdown_tab_selected")}$("#mlab_user_menu_dropdown_content").toggleClass("mlab_show_user_dropdown");$("#mlab_user_menu_dropdown").toggleClass("mlab_show_user_dropdown_tab_selected");event.stopPropagation()});$("#mlab_page_control_pagelist").on("click",function(event){$("#mlab_page_management").toggleClass("mlab_show");event.stopPropagation()});$(document).on("click",function(event){if($("#mlab_editor_menu_dropdown_content").hasClass("mlab_show_editor_dropdown")){$("#mlab_editor_menu_dropdown_content").toggleClass("mlab_show_editor_dropdown");$("#mlab_editor_menu_dropdown").toggleClass("mlab_show_editor_dropdown_tab_selected")}if($("#mlab_user_menu_dropdown_content").hasClass("mlab_show_user_dropdown")){$("#mlab_user_menu_dropdown_content").toggleClass("mlab_show_user_dropdown");$("#mlab_user_menu_dropdown").toggleClass("mlab_show_user_dropdown_tab_selected")}if($("#mlab_page_management").hasClass("mlab_show")){$("#mlab_page_management").toggleClass("mlab_show")}});$("#mlab_page_save_all").on("click",function(){var temp;mlab.dt.management.page_save(temp,true);$("#mlab_editor_menu_dropdown_content").toggleClass("mlab_show_editor_dropdown");$("#mlab_editor_menu_dropdown").toggleClass("mlab_show_editor_dropdown_tab_selected");return false});$("#mlab_button_select_storage_plugin").on("click",function(){var el=$(this).siblings("[data-mlab-get-info='storage_plugins']");if(!el.is(":visible")){el.html(mlab.dt.api.getStoragePluginList(mlab.dt.api.getSelectedComponent()))}el.slideToggle()});$("#mlab_button_get_credentials").on("click",function(){mlab.dt.design.component_edit_credentials()});$("#mlab_button_component_size").click(function(event){mlab.dt.api.closeAllPropertyDialogs();var owner_element=event.currentTarget;mlab.dt.api.properties_tooltip=$(owner_element).qtip({solo:false,content:{text:$("#mlab_component_size_list").clone(),title:_tr["mlab_editor.init.js.qtip.comp.size.title"],button:true},position:{my:"leftMiddle",at:"rightMiddle",adjust:{screen:true}},show:{ready:true,modal:{on:true,blur:false}},hide:false,events:{hide:function(event,api){api.destroy();mlab.dt.api.properties_tooltip=false}},style:{classes:"mlab_zindex_top_tooltip"}})});$("#mlab_button_component_aspect").click(function(event){mlab.dt.api.closeAllPropertyDialogs();var owner_element=event.currentTarget;mlab.dt.api.properties_tooltip=$(owner_element).qtip({solo:false,content:{text:$("#mlab_component_aspect_list").clone(),title:_tr["mlab_editor.init.js.qtip.comp.aspect.title"],button:true},position:{my:"leftMiddle",at:"rightMiddle",adjust:{screen:true}},show:{ready:true,modal:{on:true,blur:false}},hide:false,events:{hide:function(event,api){api.destroy();mlab.dt.api.properties_tooltip=false}},style:{classes:"mlab_zindex_top_tooltip"}})});$.each(mlab.dt.config.compiler_service.supported_platforms,function(index,platform){$("#mlab_download_"+platform+"_icon").qtip({hide:{delay:500,fixed:true},content:{text:function(){return $("[data-mlab-download-link-info='"+platform+"']").html()},title:{text:_tr["mlab_editor.init.js.qtip.download.app.title"]+" "+platform}},style:{classes:"mlab_qtip_tooltip mlab_qtip_menu_tooltip"}})});var host=window.document.location.host.replace(/:.*/,"");mlab.dt.services_web_socket=new WebSocket(mlab.dt.config.ws_socket.url_client+mlab.dt.config.ws_socket.path_client+"/"+mlab.dt.uid);mlab.dt.services_web_socket.onmessage=function(event){data=JSON.parse(event.data);switch(data.status){case"connected":$("#mlab_progressbar").val(5);$("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.connected"]);break;case"creating":$("#mlab_progressbar").val(10);$("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.creating"]);break;case"created":$("#mlab_progressbar").val(15);$("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.created"]);break;case"precompilation":$("#mlab_progressbar").val(20);$("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.precompilation"]);break;case"uploading":$("#mlab_progressbar").val(25);$("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.uploading"]);break;case"verifying":$("#mlab_progressbar").val(30);$("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.verifying"]);break;case"verification_ok":$("#mlab_progressbar").val(35);$("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.verification_ok"]);break;case"compiling":$("#mlab_progressbar").val(40);$("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.compiling"]);break;case"compilation_ok":$("#mlab_progressbar").val(80);$("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.compilation_ok"]);break;case"failed":case"precompilation_failed":case"compilation_failed":case"verification_failed":case"create_failed":$("#mlab_statusbar_compiler").text("");$("#mlab_download_"+data.platform+"_icon").removeClass("mlab_download_"+data.platform+"_icon_grey");$("#mlab_download_"+data.platform+"_icon").find("img").hide();$("#mlab_progressbar").hide();mlab.dt.utils.update_status("temporary",data.fail_text,false);break;case"receiving":$("#mlab_progressbar").val(90);$("#mlab_statusbar_compiler").text(_tr["mlab_editor.init.js.compiling.receiving"]);break;case"ready":$("#mlab_progressbar").val(100);$("#mlab_statusbar_compiler").text("");$("#mlab_download_"+data.platform+"_icon").removeClass("mlab_download_"+data.platform+"_icon_grey");$("#mlab_download_"+data.platform+"_icon").find("img").hide();$("#mlab_progressbar").hide();if(typeof data.filename!="undefined"&&data.filename!=null&&data.filename!=""){mlab.dt.app.compiled_files[data.platform]=data.filename;var text=document.getElementsByTagName("base")[0].href.slice(0,-1)+"_compiled/"+data.filename;$("#mlab_download_qr_link_"+data.platform).empty().qrcode({text:text,size:150,background:"#ffffff",foreground:"#000000",render:"table"});$("#mlab_download_link_"+data.platform).html("<b>URL</b>:</br>"+text);mlab.dt.utils.update_status("temporary",_tr["mlab_editor.init.js.compiling.ready"],false)}else{mlab.dt.utils.update_status("temporary",_tr["mlab_editor.init.js.compiling.failed"],false)}break;break}}}else{alert(_tr["mlab_editor.init.js.compiling.failed.loading.comps"]);document.location.href=document.mlab_temp_vars.appbuilder_root_url}})}else{alert(_tr["mlab_editor.init.js.compiling.failed.loading.var"]);document.location.href=document.mlab_temp_vars.appbuilder_root_url}})});
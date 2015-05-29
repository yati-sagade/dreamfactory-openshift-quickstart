var currentpath = null;

// setup

$(document).ready(function() {

    $(document).ajaxStart($.blockUI).ajaxStop($.unblockUI);

    $('#dndPanel').bind('dragover',handleDragOver).bind('drop',handleFileSelect);

    resizeUi();

    $('#editPanel').hide();
    $('#fileControl').hide();

    $("#errorDialog").dialog({
        resizable: false,
        modal: true,
        autoOpen: false,
        closeOnEscape: true,
        buttons: {	}
    });

    $("#mkdir").click(function() {
        if ($(this).hasClass("disabled")) {
            return false;
        }
        var name = prompt("Enter name for new folder");
        if(name) {
            createFolder(currentpath, name);
        }
    });

    $("#importfile").click(function() {
        if ($(this).hasClass("disabled")) {
            return false;
        }
        $('#fileModal').modal('toggle');
    });

    $("#exportzip").click(function() {
        if ($(this).hasClass("disabled")) {
            return false;
        }
        $("#fileIframe").attr("src","/rest" + currentpath + "?zip=true&app_name=admin");
    });

    $("#rm").click(function() {

        if ($(this).hasClass("disabled")) {
            return false;
        }
        deleteSelected();
    });

    $("#exitEditor").button({icons:{primary:"ui-icon-close"}}).click(function(){
        $('#editPanel').hide();
        $('#fileControl').hide();
        $('#browserControl').show();
        $('#dndPanel').show();
    });

    $("#importExtract").click(function() {
        if ($(this).prop("checked")) {
            $("#importReplace").removeAttr("disabled");
        } else {
            $("#importReplace").attr("disabled", "disabled");
        }
    });

    $("#home").click(function() {
        loadRootFolder();
    });

    loadRootFolder();
});

// UI Building

function printLocation(path) {
    var display = '';
    if (path && path != '') {
        var builder = '/';
        display = '/';
        var allowroot = CommonUtilities.getQueryParameter('allowroot');
        var tmp = path.split('/');
        for(var i in tmp) {
            if (tmp[i].length > 0) {
                if (builder == '/') {
                    if (allowroot == 'false') {
                        builder += tmp[i]+'/';
                        continue;
                    }
                }
                builder += tmp[i]+'/';
                display += '<a href="javascript: loadFolder(\''+builder+'\')">'+tmp[i]+'</a>/';
            }
        }
    }
    // remove trailing slashes
    if (display != '/') {
        display = display.replace(/\/+$/, "");
    }
    $('#breadcrumbs').html(display);
}

function getIcon(file) {

    switch (file.contentType) {

        case "image/x-ms-bmp":
            return "gfx/file-bmp.png";
        case "text/html":
            return "gfx/file-htm.png";
        case "text/css":
            return "gfx/file-css.png";
        case "text/javascript":
            return "gfx/file-js.png";
        case "application/javascript":
            return "gfx/file-js.png";
        case "text/js":
            return "gfx/file-js.png";
        case "image/jpeg":
            return "gfx/file-jpg.png";
        case "image/gif":
            return "gfx/file-gif.png";
        case "text/plain":
        case "image/x-icon":
        case "application/octet-stream":
        default:
            return "gfx/file.png";
    }
}

function buildItem(path,icon,name,type,editor,extra) {

    return '<div class="fmObject" data-target="'+path+'" data-type="'+type+'">' +
        (editor ? editor : '') +
        '<div class="cLeft fm_icon" align="center"><img src="'+icon+'" border="0"/></div>' +
        '<div class="cLeft cW30"><span class="fm_label">'+name+'</span></div>' +
        (extra ? extra : '') +
        '<div class="cClear"><!-- --></div>' +
        '</div>';
}

function allowEdit(mime) {

    return true;
}

function buildEditor(mime,path) {


    if (allowEdit(mime)) {
        return '<a href="#" class="btn btn-small fmSquareButton cRight download_file" data-mime="' + mime + '" data-path="' + path + '"><i class="fa fa-download"></i></a><a href="#" class="btn btn-small fmSquareButton cRight editor" data-mime="' + mime + '" data-path="' + path + '"><i class="fa fa-pencil"></i></a>';
    }
    return '';
}

function buildFolderControl(path) {

    return '<a href="#" class="btn btn-small fmSquareButton cRight" data-path="' + path + '"><i class="fa fa-folder-open"></i></a>';
}

function buildListingUI(json, svc) {
    window.Container = json.container;
//    var container;
//    if(!json.container){
//        $("mkdir").unbind('click');
//        $("#mkdir").bind('click', function() {
//            if ($(this).hasClass("disabled")) {
//                return false;
//            }
//            var name = prompt("Enter name for new container");
//            if(name) {
//                createContainer(currentpath, name);
//            }
//        });
//    }else{
//        $("mkdir").off('click');
//        $("#mkdir").click(function() {
//            if ($(this).hasClass("disabled")) {
//                return false;
//            }
//            var name = prompt("Enter name for new folder");
//            if(name) {
//                createFolder(currentpath, name);
//            }
//        });
//    }

    var html = '';
    if (json.resource) {
        for (var i in json.resource) {
            var name = json.resource[i].name;
            if (name != '.') {
                //var path = json.folder[i].path;
                if (svc != '') {
                    path = svc + '/' +  name + '/';
                }
                path = '/' + path;
                var ctrl = buildFolderControl(path);
                if (currentpath == '/') {
                    var icon = 'gfx/service.png';
                } else {
                    var icon = 'gfx/folder-horizontal-open.png';
                }
                html += buildItem(path, icon, name, 'folder',ctrl);
            }
        }
    }
    if (json.folder) {
        for (var i in json.folder) {
            var name = json.folder[i].name;
            if (name != '.') {
                var path = json.folder[i].path;
                if (svc != '') {
                    path = svc + '/' + path;
                }
                path = '/' + path;
                var ctrl = buildFolderControl(path);
                if (currentpath == '/') {
                    var icon = 'gfx/service.png';
                } else {
                    var icon = 'gfx/folder-horizontal-open.png';
                }
                html += buildItem(path, icon, name, 'folder',ctrl);
            }
        }
    }
    if (json.file) {
        for(var i in json.file) {
            var path = json.file[i].path;
            if (svc != '') {
                path = svc  + '/' + path;
            }
            path = '/' + path;
            var editor = buildEditor(json.file[i].contentType, path);
            var extra = '<div class="cLeft cW5">&nbsp;</div>';
            if(json.file[i].lastModified) {
                extra += '<div class="cLeft cW20 fm_label">'+json.file[i].lastModified+'</div>';
            }
            if(json.file[i].contentType) {
                extra += '<div class="cLeft cW15 fm_label">'+json.file[i].contentType+'</div>';
            }
            if(json.file[i].size) {
                extra += '<div class="cLeft cW10 fm_label">'+json.file[i].size+' bytes</div>';
            }
            html += buildItem(path,getIcon(json.file[i]),json.file[i].name,'file', editor, extra);
        }
    }
    $('#listing').html(html);

    $('.editor').click(function(){
        var path = $(this).data('path');
        var mime = $(this).data('mime');
        var w = window.open('editor.html?path='+path+'&mime='+mime+'&',path+" "+mime,'width=800,height=400,toolbars=no,statusbar=no,resizable=no');
        w.focus();
        return false;
    });
    $('.download_file').click(function(){
        var target = $(this).data('path');

            window.location.href = CurrentServer + '/rest'+ target +"?app_name=admin&download=true";

    });
    $('.folder_open').click(function() {
        loadFolder($(this).data('path'));
        return false;
    });

    $('.fmObject').click(function(e){
        var t = $(this);
        var unselect = t.hasClass('highlighted');
        if (!e.ctrlKey) {
            $('.fmObject').each(function(){
                $(this).removeClass('highlighted');
            });
        }
        if(t.hasClass('highlighted')) {
            t.removeClass('highlighted');
        } else if(!unselect) {
            t.addClass('ui-corner-all');
            t.addClass('highlighted');
        }
        document.getSelection().removeAllRanges();
        updateButtons();
    }).dblclick(function(){


        var target = $(this).data('target');
        var type = $(this).data('type');
        if(type == 'folder') {
            loadFolder(target);
        } else {

        var path = target;
            var mime = null;
        //var mime = $(this).data('mime');

        var w = window.open('editor.html?path='+path+'&mime='+mime+'&',path+" "+mime,'width=800,height=400,toolbars=no,statusbar=no,resizable=no');
        w.focus();
        return false;
        }});

    $('.fmObject').bind('dragover',handleDragOver).bind('drop',handleFileSelect);
}

function updateButtons() {

    if (currentpath == '/') {
        $('#mkdir').addClass("disabled");
        $('#importfile').addClass("disabled");
        $('#exportzip').addClass("disabled");
    }else if(typeof window.Container == 'undefined'){
        $('#mkdir').removeClass("disabled");
        $('#importfile').addClass("disabled");
        $('#exportzip').addClass("disabled");
        $('#rm').addClass("disabled");
    }else{
        $('#mkdir').removeClass("disabled");
        $('#importfile').removeClass("disabled");
        $('#exportzip').removeClass("disabled");
    }
    if (currentpath == '/' || countSelectedItems() == 0) {
        $('#rm').addClass("disabled");
    } else {
        $('#rm').removeClass("disabled");
    }

}

// drag and drop

// May be a better way to do this...

function processEvent(e) {

    e.originalEvent.stopPropagation();
    e.originalEvent.preventDefault();
    return e.originalEvent;
}

function handleDragOver(evt) {

    var e = processEvent(evt);
    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

function handleFileSelect(evt) {

    var e = processEvent(evt);
    var target = $(e.currentTarget).data('target');
    var type = $(e.currentTarget).data('type');
    if(target == '') {
        target = currentpath;
    }
    if (target == '/' || target == '/app/') {
        alert("This location is not writable.");
        return;
    }
    var dropFiles = e.dataTransfer.files;
    if (dropFiles === undefined) {
        alert("Drag and drop of files is not yet supported by this browser.");
        return;
    }
    var skipped = 0;
    for(var i = 0; i < dropFiles.length; i++) {
        // try to skip folders
        if (dropFiles[i].size == 0) {
            skipped++;
            continue;
        }
        createFile(target, dropFiles[i]);
    }
    if (skipped) {
        alert("Drag and drop is currently for files only. Folders and empty files are not uploaded.");
    }
}

// API calls

function loadRootFolder() {

    var path = CommonUtilities.getQueryParameter('path');
    loadFolder(path);
}

function reloadFolder() {

    loadFolder(currentpath);
}

function loadFolder(path) {

    if (path == '/') {
        $.ajax({
            dataType:'json',
            url:CurrentServer + '/rest/system/service',
            data:"app_name=admin&method=GET&fields=api_name&filter=" + escape("type='Local File Storage' or type='Remote File Storage'"),
            cache:false,
            success:function (response) {
                try {document.getSelection().removeAllRanges();} catch(e) {/* silent! */};
                currentpath = path;
                printLocation(path);
                var json = {"folder":[],"file":[]};
                if (response.record) {
                    for (var i in response.record) {
                        json.folder.push({"name":response.record[i].api_name, "path":response.record[i].api_name + '/'});
                    }
                }
                buildListingUI(json, '');
                updateButtons();
            },
            error:function (response) {
                alertErr(response);
            }
        });
    } else {
        $.ajax({
            dataType:'json',
            url:CurrentServer + '/rest' + path,
            data:'app_name=admin&method=GET',
            cache:false,
            success:function (response) {
                try {document.getSelection().removeAllRanges();} catch(e) {/* silent! */};
                currentpath = path;
                printLocation(path);
                var tmp = path.split('/');
                buildListingUI(response, tmp[1]);
                updateButtons();
            },
            error:function (response) {
                alertErr(response);
            }
        });
    }
}

function createFile(target, file) {

    var extra = '';
    if(file.name.substr(file.name.length - 4) == '.zip') {
        if(confirm("Do you want to expand " + file.name + " on upload?")) {
            extra = '&extract=true';
        }
    } else {
        var exists = false;
        $(".fmObject").each(function(){
            if($(this).data("target") == currentpath + file.name) {
                exists = true;
            }
        });
        if (exists) {
            if(!confirm("Do you want to overwrite " + file.name + " on upload?")) {
                return;
            }
        }
    }
    var data = null;
    if(file.raw) {
        data = file.raw;
    } else {
        data = file;
    }
    $.ajax({
        beforeSend: function(request) {
            request.setRequestHeader("X-File-Name", file.name);
            request.setRequestHeader("Content-Type", file.type);
        },
        dataType:'json',
        type :'POST',
        url:CurrentServer + '/rest' + target + '?app_name=admin' + extra,
        data: data,
        cache:false,
        processData: false,
        success:function (response) {
            loadFolder(target);
        },
        error:function (response) {
            alertErr(response);
            loadFolder(target);
        }
    });
}

function createFolder(target, name) {
    if(typeof window.Container != 'undefined'){


        $.ajax({
            beforeSend: function(request) {
                request.setRequestHeader("X-Folder-Name", name);
            },
            dataType:'json',
            type :'POST',
            url:CurrentServer + '/rest' + target + '?app_name=admin',
            data: '',
            cache:false,
            processData: false,
            success:function (response) {
                loadFolder(target);
            },
            error:function (response) {
                alertErr(response);
                loadFolder(target);
            }
        });
    }else{
        createContainer(target, name);


    }
}
function createContainer(target, name) {

    $.ajax({

        dataType:'json',
        type :'POST',
        url:CurrentServer + '/rest' + target + '?app_name=admin',
        data:JSON.stringify({name: name}),
        cache:false,
        success:function (response) {
            loadFolder(target);
        },
        error:function (response) {
            alertErr(response);
            loadFolder(target);
        }
    });
}
function deleteSelected() {

    var sel = getSelectedItems();
    var folders = sel.folder;
    var files = sel.file;
    if ((folders && folders.length > 0) || (files && files.length > 0)) {
        var msg = "You are about to permanently delete the following;\n\n";
        if (folders.length > 0) {
            msg += "\t" + folders.length + " folders\n";
        }
        if (files.length > 0) {
            msg += "\t" + files.length + " files\n";
        }
        msg += "\nAre you sure you want to delete these selected items?";
        if (confirm(msg)) {
            var data = {};
            if (folders.length > 0) {
                data.folder = folders;
            }

            if (files.length > 0) {
                data.file = files;
            }
            if(typeof window.Container == 'undefined'){
                data = {};
                data.container = folders;
            }
            data = JSON.stringify(data);
            $.ajax({
                dataType:'json',
                type : 'POST',
                url:CurrentServer + '/rest' + currentpath + '?app_name=admin&method=DELETE&force=true',
                data: data,
                cache:false,
                processData: false,
                success:function (response) {
                    loadFolder(currentpath);
                },
                error:function (response) {
                    alertErr(response);
                    loadFolder(currentpath);
                }
            });
        }
    }
}

function errorHandler(errs,data){
    var str = '';
    if(errs.length > 1) {
        'The following errors occured;\n';
        for(var i in errs) {
            str += '\n\t'+(i+1)+'. '+errs[i];
        }
    } else {
        str += 'The following error occured; '+errs[0];
    }
    alert(str+="\n\n");
}

function getSelectedItems() {

    var folders = [];
    var files = [];
    $('.highlighted').each(function() {
        var target = $(this).data('target');
        // remove /app/, /doc/, etc.
        var tmp = target.split('/');
        target = target.substring(2 + tmp[1].length);
        if ($(this).data('type') == 'folder') {
            folders[folders.length] = {path:target};
        } else {
            files[files.length] = {path:target};
        }
    });
    return {
        "folder": folders,
        "file": files
    };
}

function countSelectedItems() {

    var total = 0;
    var sel = getSelectedItems();
    var folders = sel.folder;
    var files = sel.file;
    if (folders) {
        total += folders.length;
    }
    if (files) {
        total += files.length;
    }
    return total;
}

// misc

function resizeUi() {
    var h = $(window).height();
    $("#main_content").css('height', h );
    $("#fileManagerPanel").css('height', h-10);
}

var resizeTimer = null;

$(window).bind('resize', function() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeUi, 100);
});

function setMode(mode) {

    if (mode == 'url') {
        $('#urlImportText').show();
        $('#fileImportForm').hide();
        $('#url-btn').attr('class','btn btn-primary');
        $('#file-btn').attr('class','btn');
    } else {
        $('#urlImportText').hide();
        $('#fileImportForm').show();
        $('#url-btn').attr('class','btn');
        $('#file-btn').attr('class','btn btn-primary');
    }
}

function getMode() {

    var sel = $('.btn-group .btn-primary');
    if (sel) {
        return sel.text();
    }
    return '';
}

function getFileName() {

    var filename;
    switch (getMode()) {
        case "URL":
            filename = $('#urlImportText').val();
            break;
        case "File":
            filename = $('#fileInput').val();
            break;
        default:
            filename = '';
            break;
    }
    return filename;
}

function importFile() {

    var params = 'app_name=admin';
    var filename = getFileName();
    if (filename == '') {
        alert("Please specify a file to import.");
        return;
    }
    if(filename.substr(filename.length - 4) == '.zip') {
        if ($('#importExtract').prop('checked')) {
            params += '&extract=true';
            if ($('#importReplace').prop('checked')) {
                params += '&clean=true';
            }
        }
    }
    switch (getMode()) {
        case 'URL':
            params += '&url=' + escape(filename);
            $.ajax({
                dataType:'json',
                type :'POST',
                url:CurrentServer + "/rest" + currentpath + "?" + params,
                data: '',
                cache:false,
                processData: false,
                success:function (response) {
                    reloadFolder();
                    $('#fileModal').modal('toggle');
                },
                error:function (response) {
                    alertErr(response);
                }
            });
            break;
        case 'File':
            $("#fileImportForm").attr("action","/rest" + currentpath + "?" + params);
            $("#fileImportForm").submit();
            break;
    }
}

function checkResults(iframe) {

    var str = $(iframe).contents().text();
    if(str && str.length > 0) {
        if (isErrorString(str)) {
            var response = {};
            response.responseText = str;
            alertErr(response);
        } else {
            reloadFolder();
            $('#fileModal').modal('toggle');
        }
    }
}

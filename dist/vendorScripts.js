jQuery.extend({highlight:function(node,re,nodeName,className){if(3===node.nodeType){var match=node.data.match(re);if(match){var highlight=document.createElement(nodeName||"span");highlight.className=className||"highlight";var wordNode=node.splitText(match.index);wordNode.splitText(match[0].length);var wordClone=wordNode.cloneNode(!0);return highlight.appendChild(wordClone),wordNode.parentNode.replaceChild(highlight,wordNode),1}}else if(1===node.nodeType&&node.childNodes&&!/(script|style)/i.test(node.tagName)&&(node.tagName!==nodeName.toUpperCase()||node.className!==className))for(var i=0;i<node.childNodes.length;i++)i+=jQuery.highlight(node.childNodes[i],re,nodeName,className);return 0}}),jQuery.fn.unhighlight=function(options){var settings={className:"highlight",element:"span"};return jQuery.extend(settings,options),this.find(settings.element+"."+settings.className).each(function(){var parent=this.parentNode;parent.replaceChild(this.firstChild,this),parent.normalize()}).end()},jQuery.fn.highlight=function(words,options){var settings={className:"highlight",element:"span",caseSensitive:!1,wordsOnly:!1};if(jQuery.extend(settings,options),words.constructor===String&&(words=[words]),words=jQuery.grep(words,function(word,i){return""!=word}),words=jQuery.map(words,function(word,i){return word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&")}),0==words.length)return this;var flag=settings.caseSensitive?"":"i",pattern="("+words.join("|")+")";settings.wordsOnly&&(pattern="\\b"+pattern+"\\b");var re=new RegExp(pattern,flag);return this.each(function(){jQuery.highlight(this,re,settings.element,settings.className)})},function(angular,factory){return"function"==typeof define&&define.amd?void define("angular-file-upload",["angular"],function(angular){return factory(angular)}):factory(angular)}("undefined"==typeof angular?null:angular,function(angular){var module=angular.module("angularFileUpload",[]);return module.value("fileUploaderOptions",{url:"/",alias:"file",headers:{},queue:[],progress:0,autoUpload:!1,removeAfterUpload:!1,method:"POST",filters:[],formData:[],queueLimit:Number.MAX_VALUE,withCredentials:!1}).factory("FileUploader",["fileUploaderOptions","$rootScope","$http","$window","$compile",function(fileUploaderOptions,$rootScope,$http,$window,$compile){function FileUploader(options){var settings=angular.copy(fileUploaderOptions);angular.extend(this,settings,options,{isUploading:!1,_nextIndex:0,_failFilterIndex:-1,_directives:{select:[],drop:[],over:[]}}),this.filters.unshift({name:"queueLimit",fn:this._queueLimitFilter}),this.filters.unshift({name:"folder",fn:this._folderFilter})}function FileLikeObject(fileOrInput){var isInput=angular.isElement(fileOrInput),fakePathOrObject=isInput?fileOrInput.value:fileOrInput,postfix=angular.isString(fakePathOrObject)?"FakePath":"Object",method="_createFrom"+postfix;this[method](fakePathOrObject)}function FileItem(uploader,some,options){var isInput=angular.isElement(some),input=isInput?angular.element(some):null,file=isInput?null:some;angular.extend(this,{url:uploader.url,alias:uploader.alias,headers:angular.copy(uploader.headers),formData:angular.copy(uploader.formData),removeAfterUpload:uploader.removeAfterUpload,withCredentials:uploader.withCredentials,method:uploader.method},options,{uploader:uploader,file:new FileUploader.FileLikeObject(some),isReady:!1,isUploading:!1,isUploaded:!1,isSuccess:!1,isCancel:!1,isError:!1,progress:0,index:null,_file:file,_input:input}),input&&this._replaceNode(input)}function FileDirective(options){angular.extend(this,options),this.uploader._directives[this.prop].push(this),this._saveLinks(),this.bind()}function FileSelect(options){FileSelect.super_.apply(this,arguments),this.uploader.isHTML5||this.element.removeAttr("multiple"),this.element.prop("value",null)}function FileDrop(options){FileDrop.super_.apply(this,arguments)}function FileOver(options){FileOver.super_.apply(this,arguments)}return FileUploader.prototype.isHTML5=!(!$window.File||!$window.FormData),FileUploader.prototype.addToQueue=function(files,options,filters){var list=this.isArrayLikeObject(files)?files:[files],arrayOfFilters=this._getFilters(filters),count=this.queue.length,addedFileItems=[];angular.forEach(list,function(some){var temp=new FileUploader.FileLikeObject(some);if(this._isValidFile(temp,arrayOfFilters,options)){var fileItem=new FileUploader.FileItem(this,some,options);addedFileItems.push(fileItem),this.queue.push(fileItem),this._onAfterAddingFile(fileItem)}else{var filter=this.filters[this._failFilterIndex];this._onWhenAddingFileFailed(temp,filter,options)}},this),this.queue.length!==count&&(this._onAfterAddingAll(addedFileItems),this.progress=this._getTotalProgress()),this._render(),this.autoUpload&&this.uploadAll()},FileUploader.prototype.removeFromQueue=function(value){var index=this.getIndexOfItem(value),item=this.queue[index];item.isUploading&&item.cancel(),this.queue.splice(index,1),item._destroy(),this.progress=this._getTotalProgress()},FileUploader.prototype.clearQueue=function(){for(;this.queue.length;)this.queue[0].remove();this.progress=0},FileUploader.prototype.uploadItem=function(value){var index=this.getIndexOfItem(value),item=this.queue[index],transport=this.isHTML5?"_xhrTransport":"_iframeTransport";item._prepareToUploading(),this.isUploading||(this.isUploading=!0,this[transport](item))},FileUploader.prototype.cancelItem=function(value){var index=this.getIndexOfItem(value),item=this.queue[index],prop=this.isHTML5?"_xhr":"_form";item&&item.isUploading&&item[prop].abort()},FileUploader.prototype.uploadAll=function(){var items=this.getNotUploadedItems().filter(function(item){return!item.isUploading});items.length&&(angular.forEach(items,function(item){item._prepareToUploading()}),items[0].upload())},FileUploader.prototype.cancelAll=function(){var items=this.getNotUploadedItems();angular.forEach(items,function(item){item.cancel()})},FileUploader.prototype.isFile=function(value){var fn=$window.File;return fn&&value instanceof fn},FileUploader.prototype.isFileLikeObject=function(value){return value instanceof FileUploader.FileLikeObject},FileUploader.prototype.isArrayLikeObject=function(value){return angular.isObject(value)&&"length"in value},FileUploader.prototype.getIndexOfItem=function(value){return angular.isNumber(value)?value:this.queue.indexOf(value)},FileUploader.prototype.getNotUploadedItems=function(){return this.queue.filter(function(item){return!item.isUploaded})},FileUploader.prototype.getReadyItems=function(){return this.queue.filter(function(item){return item.isReady&&!item.isUploading}).sort(function(item1,item2){return item1.index-item2.index})},FileUploader.prototype.destroy=function(){angular.forEach(this._directives,function(key){angular.forEach(this._directives[key],function(object){object.destroy()},this)},this)},FileUploader.prototype.onAfterAddingAll=function(fileItems){},FileUploader.prototype.onAfterAddingFile=function(fileItem){},FileUploader.prototype.onWhenAddingFileFailed=function(item,filter,options){},FileUploader.prototype.onBeforeUploadItem=function(fileItem){},FileUploader.prototype.onProgressItem=function(fileItem,progress){},FileUploader.prototype.onProgressAll=function(progress){},FileUploader.prototype.onSuccessItem=function(item,response,status,headers){},FileUploader.prototype.onErrorItem=function(item,response,status,headers){},FileUploader.prototype.onCancelItem=function(item,response,status,headers){},FileUploader.prototype.onCompleteItem=function(item,response,status,headers){},FileUploader.prototype.onCompleteAll=function(){},FileUploader.prototype._getTotalProgress=function(value){if(this.removeAfterUpload)return value||0;var notUploaded=this.getNotUploadedItems().length,uploaded=notUploaded?this.queue.length-notUploaded:this.queue.length,ratio=100/this.queue.length,current=(value||0)*ratio/100;return Math.round(uploaded*ratio+current)},FileUploader.prototype._getFilters=function(filters){if(angular.isUndefined(filters))return this.filters;if(angular.isArray(filters))return filters;var names=filters.match(/[^\s,]+/g);return this.filters.filter(function(filter){return names.indexOf(filter.name)!==-1},this)},FileUploader.prototype._render=function(){$rootScope.$$phase||$rootScope.$apply()},FileUploader.prototype._folderFilter=function(item){return!(!item.size&&!item.type)},FileUploader.prototype._queueLimitFilter=function(){return this.queue.length<this.queueLimit},FileUploader.prototype._isValidFile=function(file,filters,options){return this._failFilterIndex=-1,!filters.length||filters.every(function(filter){return this._failFilterIndex++,filter.fn.call(this,file,options)},this)},FileUploader.prototype._isSuccessCode=function(status){return status>=200&&status<300||304===status},FileUploader.prototype._transformResponse=function(response,headers){var headersGetter=this._headersGetter(headers);return angular.forEach($http.defaults.transformResponse,function(transformFn){response=transformFn(response,headersGetter)}),response},FileUploader.prototype._parseHeaders=function(headers){var key,val,i,parsed={};return headers?(angular.forEach(headers.split("\n"),function(line){i=line.indexOf(":"),key=line.slice(0,i).trim().toLowerCase(),val=line.slice(i+1).trim(),key&&(parsed[key]=parsed[key]?parsed[key]+", "+val:val)}),parsed):parsed},FileUploader.prototype._headersGetter=function(parsedHeaders){return function(name){return name?parsedHeaders[name.toLowerCase()]||null:parsedHeaders}},FileUploader.prototype._xhrTransport=function(item){var xhr=item._xhr=new XMLHttpRequest,form=new FormData,that=this;that._onBeforeUploadItem(item),angular.forEach(item.formData,function(obj){angular.forEach(obj,function(value,key){form.append(key,value)})}),form.append(item.alias,item._file,item.file.name),xhr.upload.onprogress=function(event){var progress=Math.round(event.lengthComputable?100*event.loaded/event.total:0);that._onProgressItem(item,progress)},xhr.onload=function(){var headers=that._parseHeaders(xhr.getAllResponseHeaders()),response=that._transformResponse(xhr.response,headers),gist=that._isSuccessCode(xhr.status)?"Success":"Error",method="_on"+gist+"Item";that[method](item,response,xhr.status,headers),that._onCompleteItem(item,response,xhr.status,headers)},xhr.onerror=function(){var headers=that._parseHeaders(xhr.getAllResponseHeaders()),response=that._transformResponse(xhr.response,headers);that._onErrorItem(item,response,xhr.status,headers),that._onCompleteItem(item,response,xhr.status,headers)},xhr.onabort=function(){var headers=that._parseHeaders(xhr.getAllResponseHeaders()),response=that._transformResponse(xhr.response,headers);that._onCancelItem(item,response,xhr.status,headers),that._onCompleteItem(item,response,xhr.status,headers)},xhr.open(item.method,item.url,!0),xhr.withCredentials=item.withCredentials,angular.forEach(item.headers,function(value,name){xhr.setRequestHeader(name,value)}),xhr.send(form),this._render()},FileUploader.prototype._iframeTransport=function(item){var form=angular.element('<form style="display: none;" />'),iframe=angular.element('<iframe name="iframeTransport'+Date.now()+'">'),input=item._input,that=this;item._form&&item._form.replaceWith(input),item._form=form,that._onBeforeUploadItem(item),input.prop("name",item.alias),angular.forEach(item.formData,function(obj){angular.forEach(obj,function(value,key){var element=angular.element('<input type="hidden" name="'+key+'" />');element.val(value),form.append(element)})}),form.prop({action:item.url,method:"POST",target:iframe.prop("name"),enctype:"multipart/form-data",encoding:"multipart/form-data"}),iframe.bind("load",function(){try{var html=iframe[0].contentDocument.body.innerHTML}catch(e){}var xhr={response:html,status:200,dummy:!0},headers={},response=that._transformResponse(xhr.response,headers);that._onSuccessItem(item,response,xhr.status,headers),that._onCompleteItem(item,response,xhr.status,headers)}),form.abort=function(){var response,xhr={status:0,dummy:!0},headers={};iframe.unbind("load").prop("src","javascript:false;"),form.replaceWith(input),that._onCancelItem(item,response,xhr.status,headers),that._onCompleteItem(item,response,xhr.status,headers)},input.after(form),form.append(input).append(iframe),form[0].submit(),this._render()},FileUploader.prototype._onWhenAddingFileFailed=function(item,filter,options){this.onWhenAddingFileFailed(item,filter,options)},FileUploader.prototype._onAfterAddingFile=function(item){this.onAfterAddingFile(item)},FileUploader.prototype._onAfterAddingAll=function(items){this.onAfterAddingAll(items)},FileUploader.prototype._onBeforeUploadItem=function(item){item._onBeforeUpload(),this.onBeforeUploadItem(item)},FileUploader.prototype._onProgressItem=function(item,progress){var total=this._getTotalProgress(progress);this.progress=total,item._onProgress(progress),this.onProgressItem(item,progress),this.onProgressAll(total),this._render()},FileUploader.prototype._onSuccessItem=function(item,response,status,headers){item._onSuccess(response,status,headers),this.onSuccessItem(item,response,status,headers)},FileUploader.prototype._onErrorItem=function(item,response,status,headers){item._onError(response,status,headers),this.onErrorItem(item,response,status,headers)},FileUploader.prototype._onCancelItem=function(item,response,status,headers){item._onCancel(response,status,headers),this.onCancelItem(item,response,status,headers)},FileUploader.prototype._onCompleteItem=function(item,response,status,headers){item._onComplete(response,status,headers),this.onCompleteItem(item,response,status,headers);var nextItem=this.getReadyItems()[0];return this.isUploading=!1,angular.isDefined(nextItem)?void nextItem.upload():(this.onCompleteAll(),this.progress=this._getTotalProgress(),void this._render())},FileUploader.isFile=FileUploader.prototype.isFile,FileUploader.isFileLikeObject=FileUploader.prototype.isFileLikeObject,FileUploader.isArrayLikeObject=FileUploader.prototype.isArrayLikeObject,FileUploader.isHTML5=FileUploader.prototype.isHTML5,FileUploader.inherit=function(target,source){target.prototype=Object.create(source.prototype),target.prototype.constructor=target,target.super_=source},FileUploader.FileLikeObject=FileLikeObject,FileUploader.FileItem=FileItem,FileUploader.FileDirective=FileDirective,FileUploader.FileSelect=FileSelect,FileUploader.FileDrop=FileDrop,FileUploader.FileOver=FileOver,FileLikeObject.prototype._createFromFakePath=function(path){this.lastModifiedDate=null,this.size=null,this.type="like/"+path.slice(path.lastIndexOf(".")+1).toLowerCase(),this.name=path.slice(path.lastIndexOf("/")+path.lastIndexOf("\\")+2)},FileLikeObject.prototype._createFromObject=function(object){this.lastModifiedDate=angular.copy(object.lastModifiedDate),this.size=object.size,this.type=object.type,this.name=object.name},FileItem.prototype.upload=function(){this.uploader.uploadItem(this)},FileItem.prototype.cancel=function(){this.uploader.cancelItem(this)},FileItem.prototype.remove=function(){this.uploader.removeFromQueue(this)},FileItem.prototype.onBeforeUpload=function(){},FileItem.prototype.onProgress=function(progress){},FileItem.prototype.onSuccess=function(response,status,headers){},FileItem.prototype.onError=function(response,status,headers){},FileItem.prototype.onCancel=function(response,status,headers){},FileItem.prototype.onComplete=function(response,status,headers){},FileItem.prototype._onBeforeUpload=function(){this.isReady=!0,this.isUploading=!0,this.isUploaded=!1,this.isSuccess=!1,this.isCancel=!1,this.isError=!1,this.progress=0,this.onBeforeUpload()},FileItem.prototype._onProgress=function(progress){this.progress=progress,this.onProgress(progress)},FileItem.prototype._onSuccess=function(response,status,headers){this.isReady=!1,this.isUploading=!1,this.isUploaded=!0,this.isSuccess=!0,this.isCancel=!1,this.isError=!1,this.progress=100,this.index=null,this.onSuccess(response,status,headers)},FileItem.prototype._onError=function(response,status,headers){this.isReady=!1,this.isUploading=!1,this.isUploaded=!0,this.isSuccess=!1,this.isCancel=!1,this.isError=!0,this.progress=0,this.index=null,this.onError(response,status,headers)},FileItem.prototype._onCancel=function(response,status,headers){this.isReady=!1,this.isUploading=!1,this.isUploaded=!1,this.isSuccess=!1,this.isCancel=!0,this.isError=!1,this.progress=0,this.index=null,this.onCancel(response,status,headers)},FileItem.prototype._onComplete=function(response,status,headers){this.onComplete(response,status,headers),this.removeAfterUpload&&this.remove()},FileItem.prototype._destroy=function(){this._input&&this._input.remove(),this._form&&this._form.remove(),delete this._form,delete this._input},FileItem.prototype._prepareToUploading=function(){this.index=this.index||++this.uploader._nextIndex,this.isReady=!0},FileItem.prototype._replaceNode=function(input){var clone=$compile(input.clone())(input.scope());clone.prop("value",null),input.css("display","none"),input.after(clone)},FileDirective.prototype.events={},FileDirective.prototype.bind=function(){for(var key in this.events){var prop=this.events[key];this.element.bind(key,this[prop])}},FileDirective.prototype.unbind=function(){for(var key in this.events)this.element.unbind(key,this.events[key])},FileDirective.prototype.destroy=function(){var index=this.uploader._directives[this.prop].indexOf(this);this.uploader._directives[this.prop].splice(index,1),this.unbind()},FileDirective.prototype._saveLinks=function(){for(var key in this.events){var prop=this.events[key];this[prop]=this[prop].bind(this)}},FileUploader.inherit(FileSelect,FileDirective),FileSelect.prototype.events={$destroy:"destroy",change:"onChange"},FileSelect.prototype.prop="select",FileSelect.prototype.getOptions=function(){},FileSelect.prototype.getFilters=function(){},FileSelect.prototype.isEmptyAfterSelection=function(){return!!this.element.attr("multiple")},FileSelect.prototype.onChange=function(){var files=this.uploader.isHTML5?this.element[0].files:this.element[0],options=this.getOptions(),filters=this.getFilters();this.uploader.isHTML5||this.destroy(),this.uploader.addToQueue(files,options,filters),this.isEmptyAfterSelection()&&this.element.prop("value",null)},FileUploader.inherit(FileDrop,FileDirective),FileDrop.prototype.events={$destroy:"destroy",drop:"onDrop",dragover:"onDragOver",dragleave:"onDragLeave"},FileDrop.prototype.prop="drop",FileDrop.prototype.getOptions=function(){},FileDrop.prototype.getFilters=function(){},FileDrop.prototype.onDrop=function(event){var transfer=this._getTransfer(event);if(transfer){var options=this.getOptions(),filters=this.getFilters();this._preventAndStop(event),angular.forEach(this.uploader._directives.over,this._removeOverClass,this),this.uploader.addToQueue(transfer.files,options,filters)}},FileDrop.prototype.onDragOver=function(event){var transfer=this._getTransfer(event);this._haveFiles(transfer.types)&&(transfer.dropEffect="copy",this._preventAndStop(event),angular.forEach(this.uploader._directives.over,this._addOverClass,this))},FileDrop.prototype.onDragLeave=function(event){event.currentTarget===this.element[0]&&(this._preventAndStop(event),angular.forEach(this.uploader._directives.over,this._removeOverClass,this))},FileDrop.prototype._getTransfer=function(event){return event.dataTransfer?event.dataTransfer:event.originalEvent.dataTransfer},FileDrop.prototype._preventAndStop=function(event){event.preventDefault(),event.stopPropagation()},FileDrop.prototype._haveFiles=function(types){return!!types&&(types.indexOf?types.indexOf("Files")!==-1:!!types.contains&&types.contains("Files"))},FileDrop.prototype._addOverClass=function(item){item.addOverClass()},FileDrop.prototype._removeOverClass=function(item){item.removeOverClass()},FileUploader.inherit(FileOver,FileDirective),FileOver.prototype.events={$destroy:"destroy"},FileOver.prototype.prop="over",FileOver.prototype.overClass="nv-file-over",FileOver.prototype.addOverClass=function(){this.element.addClass(this.getOverClass())},FileOver.prototype.removeOverClass=function(){this.element.removeClass(this.getOverClass())},FileOver.prototype.getOverClass=function(){return this.overClass},FileUploader}]).directive("nvFileSelect",["$parse","FileUploader",function($parse,FileUploader){return{link:function(scope,element,attributes){var uploader=scope.$eval(attributes.uploader);if(!(uploader instanceof FileUploader))throw new TypeError('"Uploader" must be an instance of FileUploader');var object=new FileUploader.FileSelect({uploader:uploader,element:element});object.getOptions=$parse(attributes.options).bind(object,scope),object.getFilters=function(){return attributes.filters}}}}]).directive("nvFileDrop",["$parse","FileUploader",function($parse,FileUploader){return{link:function(scope,element,attributes){var uploader=scope.$eval(attributes.uploader);if(!(uploader instanceof FileUploader))throw new TypeError('"Uploader" must be an instance of FileUploader');if(uploader.isHTML5){var object=new FileUploader.FileDrop({uploader:uploader,element:element});object.getOptions=$parse(attributes.options).bind(object,scope),object.getFilters=function(){return attributes.filters}}}}}]).directive("nvFileOver",["FileUploader",function(FileUploader){return{link:function(scope,element,attributes){var uploader=scope.$eval(attributes.uploader);if(!(uploader instanceof FileUploader))throw new TypeError('"Uploader" must be an instance of FileUploader');var object=new FileUploader.FileOver({uploader:uploader,element:element});object.getOverClass=function(){return attributes.overClass||this.overClass}}}}]),module}),function(){"use strict";angular.module("ui.grid.draggable-rows",["ui.grid"]).constant("uiGridDraggableRowsConstants",{featureName:"draggableRows",ROW_OVER_CLASS:"ui-grid-draggable-row-over",ROW_OVER_ABOVE_CLASS:"ui-grid-draggable-row-over--above",ROW_OVER_BELOW_CLASS:"ui-grid-draggable-row-over--below",POSITION_ABOVE:"above",POSITION_BELOW:"below",publicEvents:{draggableRows:{rowDragged:function(scope,info,rowElement){},rowDropped:function(scope,info,targetElement){},rowOverRow:function(scope,info,rowElement){},rowEnterRow:function(scope,info,rowElement){},rowLeavesRow:function(scope,info,rowElement){},rowFinishDrag:function(scope){}}}}).factory("uiGridDraggableRowsCommon",[function(){return{draggedRow:null,draggedRowEntity:null,position:null,fromIndex:null,toIndex:null}}]).service("uiGridDraggableRowsService",["uiGridDraggableRowsConstants",function(uiGridDraggableRowsConstants){this.initializeGrid=function(grid,$scope,$element){grid.api.registerEventsFromObject(uiGridDraggableRowsConstants.publicEvents),grid.api.draggableRows.on.rowFinishDrag($scope,function(){angular.forEach($element[0].querySelectorAll("."+uiGridDraggableRowsConstants.ROW_OVER_CLASS),function(row){row.classList.remove(uiGridDraggableRowsConstants.ROW_OVER_CLASS),row.classList.remove(uiGridDraggableRowsConstants.ROW_OVER_ABOVE_CLASS),row.classList.remove(uiGridDraggableRowsConstants.ROW_OVER_BELOW_CLASS)})})}}]).service("uiGridDraggableRowService",["uiGridDraggableRowsConstants","uiGridDraggableRowsCommon","$parse",function(uiGridDraggableRowsConstants,uiGridDraggableRowsCommon,$parse){var move=function(from,to){this.splice(to,0,this.splice(from,1)[0])};this.prepareDraggableRow=function($scope,$element){var grid=$scope.grid,row=$element[0],data=function(){return angular.isString(grid.options.data)?$parse(grid.options.data)(grid.appScope):grid.options.data},listeners={onDragOverEventListener:function(e){e.preventDefault&&e.preventDefault();var dataTransfer=e.dataTransfer||e.originalEvent.dataTransfer;dataTransfer.effectAllowed="copyMove",dataTransfer.dropEffect="move";var offset=e.offsetY||e.layerY||(e.originalEvent?e.originalEvent.offsetY:0);offset<this.offsetHeight/2?(uiGridDraggableRowsCommon.position=uiGridDraggableRowsConstants.POSITION_ABOVE,$element.removeClass(uiGridDraggableRowsConstants.ROW_OVER_BELOW_CLASS),$element.addClass(uiGridDraggableRowsConstants.ROW_OVER_ABOVE_CLASS)):(uiGridDraggableRowsCommon.position=uiGridDraggableRowsConstants.POSITION_BELOW,$element.removeClass(uiGridDraggableRowsConstants.ROW_OVER_ABOVE_CLASS),$element.addClass(uiGridDraggableRowsConstants.ROW_OVER_BELOW_CLASS)),grid.api.draggableRows.raise.rowOverRow(uiGridDraggableRowsCommon,this)},onDragStartEventListener:function(e){e.dataTransfer.setData("Text","move"),uiGridDraggableRowsCommon.draggedRow=this,uiGridDraggableRowsCommon.draggedRowEntity=$scope.$parent.$parent.row.entity,uiGridDraggableRowsCommon.position=null,uiGridDraggableRowsCommon.fromIndex=data().indexOf(uiGridDraggableRowsCommon.draggedRowEntity),uiGridDraggableRowsCommon.toIndex=null,grid.api.draggableRows.raise.rowDragged(uiGridDraggableRowsCommon,this)},onDragLeaveEventListener:function(e){grid.api.draggableRows.raise.rowLeavesRow(uiGridDraggableRowsCommon,this)},onDragEnterEventListener:function(e){e.offsetY||e.layerY||(e.originalEvent?e.originalEvent.offsetY:0);$("."+uiGridDraggableRowsConstants.ROW_OVER_CLASS).removeClass(uiGridDraggableRowsConstants.ROW_OVER_CLASS),$element.addClass(uiGridDraggableRowsConstants.ROW_OVER_CLASS),grid.api.draggableRows.raise.rowEnterRow(uiGridDraggableRowsCommon,this)},onDragEndEventListener:function(){grid.api.draggableRows.raise.rowFinishDrag()},onDropEventListener:function(e){var draggedRow=uiGridDraggableRowsCommon.draggedRow;return e.stopPropagation&&e.stopPropagation(),e.preventDefault&&e.preventDefault(),draggedRow!==this&&(uiGridDraggableRowsCommon.toIndex=data().indexOf($scope.$parent.$parent.row.entity),uiGridDraggableRowsCommon.position===uiGridDraggableRowsConstants.POSITION_ABOVE?uiGridDraggableRowsCommon.fromIndex<uiGridDraggableRowsCommon.toIndex&&(uiGridDraggableRowsCommon.toIndex-=1):uiGridDraggableRowsCommon.fromIndex>=uiGridDraggableRowsCommon.toIndex&&(uiGridDraggableRowsCommon.toIndex+=1),$scope.$apply(function(){move.apply(data(),[uiGridDraggableRowsCommon.fromIndex,uiGridDraggableRowsCommon.toIndex])}),grid.api.draggableRows.raise.rowDropped(uiGridDraggableRowsCommon,this),void e.preventDefault())}};row.addEventListener("dragover",listeners.onDragOverEventListener,!1),row.addEventListener("dragstart",listeners.onDragStartEventListener,!1),row.addEventListener("dragleave",listeners.onDragLeaveEventListener,!1),row.addEventListener("dragenter",listeners.onDragEnterEventListener,!1),row.addEventListener("dragend",listeners.onDragEndEventListener,!1),row.addEventListener("drop",listeners.onDropEventListener)}}]).directive("uiGridDraggableRow",["uiGridDraggableRowService",function(uiGridDraggableRowService){return{restrict:"ACE",scope:{grid:"="},compile:function(){return{pre:function($scope,$element){uiGridDraggableRowService.prepareDraggableRow($scope,$element)}}}}}]).directive("uiGridDraggableRows",["uiGridDraggableRowsService",function(uiGridDraggableRowsService){return{restrict:"A",replace:!0,priority:0,require:"uiGrid",scope:!1,compile:function(){return{pre:function($scope,$element,$attrs,uiGridCtrl){uiGridDraggableRowsService.initializeGrid(uiGridCtrl.grid,$scope,$element)}}}}}])}();
(function(){
  "use strict";
  angular.module("imageupload", [])
    .factory("getResizeArea", function(){
      return function (resizeAreaId) {
        var resizeArea = document.getElementById(resizeAreaId);

        if (!resizeArea) {
          resizeArea = document.createElement("canvas");
          resizeArea.id = resizeAreaId;
          resizeArea.style.visibility = "hidden";
          document.body.appendChild(resizeArea);
        }
        return resizeArea;
      };
    })
    .factory("resizeImage", function(getResizeArea){
      return function (origImage, options) {
        var maxHeight = options.resizeMaxHeight || 320;
        var maxWidth = options.resizeMaxWidth || 480;
        var quality = options.resizeQuality || 0.7;
        var cover = options.cover || options.cover === "" || false;
        var coverHeight = options.coverHeight || 320;
        var coverWidth = options.coverWidth || 480;
        var coverX = options.coverX || "left";
        var coverY = options.coverY || "top";
        var type = options.resizeType || "image/jpeg";
        var thumbnail = options.thumbnail || options.thumbnail === "" || false;
        var thumbnailHeight = options.thumbnailHeight || 80;
        var thumbnailWidth = options.thumbnailWidth || 120;

        // TGB: custom resize mode
        var crop = options.crop || options.crop === "" || false;
        // Most common smart phone image size is 480:320.
        var cropHeight = options.cropHeight || 320;
        var cropWidth = options.cropWidth || 480;
        
        var resizeAreaId = "fileupload-resize-area";
        var canvas = getResizeArea(resizeAreaId);

        var height = origImage.height;
        var width = origImage.width;

        var imgX = 0;
        var imgY = 0;
        
        var resizedDataURL;
          
        if(cover){
          // Logic for calculating size when in cover-mode
          canvas.width = coverHeight;
          canvas.height = coverWidth;
          // Resize image to fit canvas and keep original proportions
          var ratio = 1;
          if(height < canvas.height)
          {
            ratio = canvas.height / height;
            height = height * ratio;
            width = width * ratio;
          }
          if(width < canvas.width)
          {
            ratio = canvas.width / width;
            height = height * ratio;
            width = width * ratio;
          }

          // Check if both are too big -> downsize
          if(width > canvas.width && height > canvas.height)
          {
            ratio = Math.max(canvas.width/width, canvas.height/height);
            height = height * ratio;
            width = width * ratio;
          }

          // place img according to coverX and coverY values
          if(width > canvas.width){
            if(coverX === "right"){ imgX = canvas.width - width; }
            else if (coverX === "center"){ imgX = (canvas.width - width) / 2; }
          }else if(height > canvas.height){
            if(coverY === "bottom"){ imgY = canvas.height - height; }
            else if (coverY === "center"){ imgY = (canvas.height - height) / 2; }
          }

        } else if (crop) {
            var ratio = cropWidth / cropHeight;
            var sx, sy, sw, sh;
            if (width > height *　ratio) {
                sw = height * ratio;
                sx = (width - sw) / 2;
                sy = 0;
                sh = height;
            } else {
                sw = width;
                sx = 0;
                sh = width / ratio;
                sy = (height - sh) / 2;
            }
            
            canvas.height = cropHeight;
            canvas.width = cropWidth;
            
            var ctx = canvas.getContext("2d");
            ctx.drawImage(origImage, sx, sy, sw, sh, 0, 0, cropWidth, cropHeight);

            // get the data from canvas as 70% jpg (or specified type).
            resizedDataURL = canvas.toDataURL(type, quality);

            if (thumbnail) {
                var thumbnailAreaId = "thumbnail-area";
                var thumbnailCanvas = getResizeArea(thumbnailAreaId);
          
                thumbnailCanvas.height = thumbnailHeight;
                thumbnailCanvas.width = thumbnailWidth;
                var thumbnailCtx = thumbnailCanvas.getContext("2d");
                thumbnailCtx.drawImage(canvas, 0, 0, thumbnailWidth, thumbnailHeight);
                var thumbnailDataURL = thumbnailCanvas.toDataURL(type, quality);
            }
            
            return {
                resized: resizedDataURL,
                thumbnail: thumbnailDataURL,
            };
        } else {
          // calculate the width and height, constraining the proportions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height *= maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width *= maxHeight / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
        }

        //draw image on canvas
        var ctx = canvas.getContext("2d");
        ctx.drawImage(origImage, imgX, imgY, width, height);

        // get the data from canvas as 70% jpg (or specified type).
//        return canvas.toDataURL(type, quality);
          var resizedDataURL = canvas.toDataURL(type, quality);
          
          return {
            resized: resizedDataURL,
          };
      };
    })
    .factory("fileToDataURL", function($q) {
      return function (file) {
        var deferred = $q.defer();
        var reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function (e) {
          deferred.resolve(e.target.result);
        };
        reader.onerror = function(e){
          deferred.reject(e);
        };
        reader.onabort = function(e){
          deferred.reject(e);
        };

        return deferred.promise;
      };
    })
    .factory("createImage",function($q){
      return function(url) {
        var deferred = $q.defer();
        var image = new Image();
        image.src = url;
        image.onload = function() {
          deferred.resolve(image);
        };
        image.onerror = function(e){
          deferred.reject(e);
        };
        return deferred.promise;
      };
    })
    .factory("map", function(){
      return function(list, fn){
        return Array.prototype.map.call(list, fn);
      };
    })
    .factory("appendDataUri",  function(fileToDataURL, map, $q) {

      function appendDataUri(model){
        return fileToDataURL(model.file)
          .then(function (dataURL) {
            model.dataURL = dataURL;
            return model;
          });
      }

      return function(model) {
        // If the viewValue is invalid (say required but empty) it will be `undefined`
        if (angular.isUndefined(model)){
          return;
        }

        if(angular.isArray(model)){
          var model_update_promises = map(model, appendDataUri);
          return $q.all(model_update_promises);
        }
        else{
          return appendDataUri(model);
        }
      };
    })
    .factory("create_model_from_files", function(map){
      return function(files){
        var model = map(files, function(imageFile){
          var file_obj = {
            file: imageFile
          };
          return file_obj;
        });
        return model;
      };
    })
    .factory("add_data_uris", function(map, appendDataUri, $q){
      return function(options){
        var should_append_data_uris = angular.isDefined(options.appendDataUri);
        return function(model){
          if(should_append_data_uris){
            return $q.all(map(model, appendDataUri));
          }
          else{
            return model;
          }
        };
      };
    })
    .factory("doResizing", function($q, createImage, resizeImage){
      return function(options){
        return function(model) {
          model.url = URL.createObjectURL(model.file); //this is used to generate images/resize
          return createImage(model.url)
            .then(function(image) {
//              var dataURL = resizeImage(image, options);
//              var imageType = dataURL.substring(5, dataURL.indexOf(";"));
//              model.resized = {
//                dataURL: dataURL,
//                type: imageType
//              };
//              return model;
              // TGB
              var dataURLs = resizeImage(image, options);
              model.resized = {
                dataURL: dataURLs.resized,
                type: dataURLs.resized.substring(5, dataURLs.resized.indexOf(";")),
              };
              
              if (dataURLs.thumbnail) {
                model.thumbnail = {
                    dataURL: dataURLs.thumbnail,
                    type: dataURLs.thumbnail.substring(5, dataURLs.thumbnail.indexOf(";")),
                }
              }
              return model;
            });
        };
      };
    })
    .factory("resize", function($q, doResizing, map){
      return function(options){
        // TGB: Looks like a bug. Cover mode will not be supported with original implementation. 
//        var should_do_resizing = angular.isDefined(options.resize) &&
//          angular.isDefined(options.resizeMaxHeight) &&
//          angular.isDefined(options.resizeMaxWidth);
        var should_do_resizing = (angular.isDefined(options.resize) &&
          angular.isDefined(options.resizeMaxHeight) &&
          angular.isDefined(options.resizeMaxWidth)) ||
          angular.isDefined(options.cover) ||
          angular.isDefined(options.crop);

        return function(model){
          if(should_do_resizing){
            return $q.all(map(model, doResizing(options)));
          }
          else{
            return model;
          }
        };
      };
    })
    .factory("generic_image_processing_functions", function($q, create_model_from_files, add_data_uris, resize){
      return function(files, options){
        return $q.when(create_model_from_files(files))
          .then(add_data_uris(options))
          .then(resize(options));
      };
    })

    .factory("multi_image_model_updater", function(){
      return function update_model(ngModel, options){
        return function(model){
          var old_model = ngModel.$modelValue;
          var model_to_update;
          if(angular.isDefined(options.append) && angular.isArray(old_model)){
            model_to_update = old_model.concat(model);
          }
          else{
            model_to_update = model;
          }
          ngModel.$setViewValue(model_to_update);

        };
      };
    })
    .directive("inputImages",  function(generic_image_processing_functions,
                                 multi_image_model_updater) {

      return {
        require: "ngModel",
        link: function (scope, element, attrs, ngModel) {

          var file_upload_element = new angular.element("<input type='file' accept='image/*' multiple>");

          element.on("click", function(){
            file_upload_element[0].click();
          });

          file_upload_element.bind("change", function (evt) {
            var files = evt.target.files;

            generic_image_processing_functions(files, attrs)
              .then(multi_image_model_updater(ngModel, attrs));
          });
        }
      };
    })
    .directive("inputImage",  function(generic_image_processing_functions) {
      return {
        require: "ngModel",
        link: function (scope, element, attrs, ngModel) {

          var file_upload_element = new angular.element("<input type='file' accept='image/*'>");

          element.on("click", function(){
            file_upload_element[0].click();
          });

          file_upload_element.bind("change", function (evt) {
            var files = evt.target.files;

            generic_image_processing_functions(files, attrs)
              .then(update_model)
              // TGB: set the file list to null, so that selecting the same file will trigger change event.
              // This fixes a bug where after the image is cleared externally, if the same file is selected again,
              // the change event is not fired, hence the angular model won't be updated and UI will not change.
              .then(this.value = null);

          });

          function update_model(model){
            ngModel.$setViewValue(model[0]);
          }


        }
      };
    })
    .factory("image_drop_linker_common", function($document, $log){
      return function (scope, element, attrs) {

        var decoration = attrs.decoration || "drag-over";

        function decorate_dragged_element(element){
          element.addClass(decoration);
        }
        function undecorate_dragged_element(element){
          element.removeClass(decoration);
        }

        //When an item is dragged over the document, add .dragOver to the body
        function onDragOver(e) {
          e.preventDefault();
          decorate_dragged_element(element);
        }

        //When the user leaves the window, cancels the drag or drops the item
        function onDragLeave(e) {
          e.preventDefault();
          undecorate_dragged_element(element);
        }

        function onDragOverDoc(e){
          e.preventDefault();
        }
        function onDragLeaveDoc(e){
          e.preventDefault();
        }
        function onDropDoc(e){
          e.preventDefault();
        }

        $document.bind("dragover", onDragOverDoc);
        $document.bind("dragleave", onDragLeaveDoc);
        $document.bind("drop", onDropDoc);

        //Dragging begins on the document (shows the overlay)
        element.bind("dragover", onDragOver);

        //Dragging ends on the overlay, which takes the whole window
        element.bind("dragleave", onDragLeave);

        element.bind("drop", function (e) {
          e.preventDefault();
          $log.debug("drop", e);
          undecorate_dragged_element(element);
        });
      };
    })
    .factory("find_data_transfer", function(){
      return function (e){
        if(e.dataTransfer){
          return e.dataTransfer;
        }
        if(e.originalEvent && e.originalEvent.dataTransfer){
          return e.originalEvent.dataTransfer;
        }
        return undefined;
      };
    })
    .directive("imageDrop", function (
      find_data_transfer,
      image_drop_linker_common,
      generic_image_processing_functions){
      return {
        restrict: "EA",
        require: "ngModel",
        link: function(scope, element, attrs, ngModel){
          image_drop_linker_common(scope, element, attrs, ngModel);

          function update_model(model){
            ngModel.$setViewValue(model[0]);
          }

          element.bind("drop", function (e) {
            var files = find_data_transfer(e).files;

            generic_image_processing_functions(files, attrs)
              .then(update_model);
          });
        }
      };
    })
    .directive("imagesDrop", function (
      find_data_transfer,
      image_drop_linker_common,
      generic_image_processing_functions,
      multi_image_model_updater){
      return {
        restrict: "EA",
        require: "ngModel",
        link: function (scope, element, attrs, ngModel) {

          image_drop_linker_common(scope, element, attrs, ngModel);

          element.bind("drop", function (e) {
            var files = find_data_transfer(e).files;

            generic_image_processing_functions(files, attrs)
              .then(multi_image_model_updater(ngModel, attrs));
          });
        }
      };
    });
})();

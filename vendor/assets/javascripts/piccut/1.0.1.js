
var PictureCut = function(image_target, crop_btn, callback) {
  // Some variable and settings
  var $container,
      orig_src = new Image(),
      image_target = image_target,
      event_state = {},
      constrain = true, //Set true keep rate
      min_width = 60, // Change as required
      min_height = 60,
      max_width = 4096 , // Change as required :4K
      max_height = 3112,
      resize_canvas = document.createElement('canvas');
  var callback_function = callback;

  init = function(){

    // When resizing, we will always use this copy of the original as the base
    orig_src.src=image_target.src;

    // Wrap the image with the container and add resize handles
    $(image_target).wrap('<div class="resize-container"></div>')
    .before('<span class="resize-handle resize-handle-nw"></span>')
    .before('<span class="resize-handle resize-handle-ne"></span>')
    .after('<span class="resize-handle resize-handle-se"></span>')
    .after('<span class="resize-handle resize-handle-sw"></span>');

    // Assign the container to a variable
    $container =  $(image_target).parent('.resize-container');
    $container.on('mousedown touchstart', '.resize-handle', startResize);
    $container.on('mousedown touchstart', 'img', startMoving);
    crop_btn.onclick = crop;
  };

  startResize = function(e){
    e.preventDefault();
    e.stopPropagation();
    saveEventState(e);
    $(document).on('mousemove touchmove', resizing);
    $(document).on('mouseup touchend', endResize);
  };

  endResize = function(e){
    e.preventDefault();
    $(document).off('mouseup touchend', endResize);
    $(document).off('mousemove touchmove', resizing);
    realy_resize($(image_target).data('width'), $(image_target).data('height'));
  };

  saveEventState = function(e){
    // Save the initial event details and container state
    event_state.container_width = $container.width();
    event_state.container_height = $container.height();
    event_state.container_left = $container.offset().left;
    event_state.container_top = $container.offset().top;
    event_state.mouse_x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft();
    event_state.mouse_y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();

  // This is a fix for mobile safari
  // For some reason it does not allow a direct copy of the touches property
  if(typeof e.originalEvent.touches !== 'undefined'){
    event_state.touches = [];
    $.each(e.originalEvent.touches, function(i, ob){
      event_state.touches[i] = {};
      event_state.touches[i].clientX = 0+ob.clientX;
      event_state.touches[i].clientY = 0+ob.clientY;
    });
  }
    event_state.evnt = e;
  };

  resizing = function(e){
    var mouse={},width,height,left,top,offset=$container.offset();
    mouse.x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft();
    mouse.y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();

    // Position image differently depending on the corner dragged and constraints
    if( $(event_state.evnt.target).hasClass('resize-handle-se') ){
      width = mouse.x - event_state.container_left;
      height = mouse.y  - event_state.container_top;
      left = event_state.container_left;
      top = event_state.container_top;
    } else if($(event_state.evnt.target).hasClass('resize-handle-sw') ){
      width = event_state.container_width - (mouse.x - event_state.container_left);
      height = mouse.y  - event_state.container_top;
      left = mouse.x;
      top = event_state.container_top;
    } else if($(event_state.evnt.target).hasClass('resize-handle-nw') ){
      width = event_state.container_width - (mouse.x - event_state.container_left);
      height = event_state.container_height - (mouse.y - event_state.container_top);
      left = mouse.x;
      top = mouse.y;
      if(constrain || e.shiftKey){
        top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
      }
    } else if($(event_state.evnt.target).hasClass('resize-handle-ne') ){
      width = mouse.x - event_state.container_left;
      height = event_state.container_height - (mouse.y - event_state.container_top);
      left = event_state.container_left;
      top = mouse.y;
      if(constrain || e.shiftKey){
        top = mouse.y - ((width / orig_src.width * orig_src.height) - height);
      }
    }

    // Optionally maintain aspect ratio
    if(constrain || e.shiftKey){
      height = width / orig_src.width * orig_src.height;
    }

    if(width > min_width && height > min_height && width < max_width && height < max_height){
      // To improve performance you might limit how often resizeImage() is called
      resizeImage(width, height);
      // Without this Firefox will not re-calculate the the image dimensions until drag end
      $container.offset({'left': left, 'top': top});
    }
  }

  resizeImage = function(width, height){
    $(image_target).css({width: width});
    $(image_target).data('width', width);
    $(image_target).data('height', height);
  };

  realy_resize = function(width, height){
    resize_canvas.width = width;
    resize_canvas.height = height;
    resize_canvas.getContext('2d').drawImage(orig_src, 0, 0, width, height);
    $(image_target).attr('src', resize_canvas.toDataURL("image/png"));
  }

  startMoving = function(e){
    e.preventDefault();
    e.stopPropagation();
    saveEventState(e);
    $(document).on('mousemove touchmove', moving);
    $(document).on('mouseup touchend', endMoving);
  };

  endMoving = function(e){
    e.preventDefault();
    $(document).off('mouseup touchend', endMoving);
    $(document).off('mousemove touchmove', moving);
  };

  moving = function(e){
    var  mouse={}, touches;
    e.preventDefault();
    e.stopPropagation();

    touches = e.originalEvent.touches;

    mouse.x = (e.clientX || e.pageX || touches[0].clientX) + $(window).scrollLeft();
    mouse.y = (e.clientY || e.pageY || touches[0].clientY) + $(window).scrollTop();
    $container.offset({
      'left': mouse.x - ( event_state.mouse_x - event_state.container_left ),
      'top': mouse.y - ( event_state.mouse_y - event_state.container_top )
    });
    // Watch for pinch zoom gesture while moving
    if(event_state.touches && event_state.touches.length > 1 && touches.length > 1){
      var width = event_state.container_width, height = event_state.container_height;
      var a = event_state.touches[0].clientX - event_state.touches[1].clientX;
      a = a * a;
      var b = event_state.touches[0].clientY - event_state.touches[1].clientY;
      b = b * b;
      var dist1 = Math.sqrt( a + b );

      a = e.originalEvent.touches[0].clientX - touches[1].clientX;
      a = a * a;
      b = e.originalEvent.touches[0].clientY - touches[1].clientY;
      b = b * b;
      var dist2 = Math.sqrt( a + b );

      var ratio = dist2 /dist1;

      width = width * ratio;
      height = height * ratio;
      // To improve performance you might limit how often resizeImage() is called
      //resizeImage(width, height);
    }
  };

  crop = function(e){
    //Find the part of the image that is inside the crop box
    var crop_canvas,
        canvas_width = $('.capture').width(),
        canvas_height = $('.capture').height();

    var img_to_container_left = $('.capture').offset().left - $container.offset().left,
        img_to_container_top =  $('.capture').offset().top - $container.offset().top;

    var image_width = parseFloat($(image_target).data('width')),
        image_height = parseFloat($(image_target).data('height'));

    var sx = img_to_container_left, sy = img_to_container_top, swidth = canvas_width, sheight = canvas_height,
        x = 0, y = 0, width = canvas_width, height = canvas_height;

    if(sx < 0){sx = 0; swidth= canvas_width + img_to_container_left; x=img_to_container_left * (-1);}
    if(sy < 0){sy = 0; sheight = canvas_height + img_to_container_top; y = img_to_container_top * (-1);}
    if(swidth < width){width = swidth;}
    if(sheight < height){height = sheight;}
    var crop_canvas = document.createElement('canvas');
    crop_canvas.width = canvas_width;
    crop_canvas.height = canvas_height;
    crop_canvas.getContext('2d').drawImage(image_target, sx, sy, swidth, sheight, x, y, width, height);
    var img = new Image();
    img.src = crop_canvas.toDataURL("image/png");
    crop_canvas = null;
    callback.apply(img);
  }

  init();
};

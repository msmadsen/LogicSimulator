var CPU_SIM_WINDOW_RESIZE_TIMER;
var CPU_SIM_WINDOW_RESIZE_DELAY = 100;

var cpuSimEditorCoordinates = null;
var cpuSimEditor = null;



function cpuSimWindowResize()
{
    var w, h, twH;
    
    w = $(window).width();
    h = $(window).height();
    
    $('#top-widgets').width(w);
    twH = $('#top-widgets').height();
    
    $('#sim-window-div').width(w);
    $('#sim-window-div').css('top', twH+'px');
    $('#sim-window-div').height(h-twH);
    
    $('#sim-window-canvas').width(w);
    $('#sim-window-canvas').css('top', twH+'px');
    $('#sim-window-canvas').height(h-twH);
    
    $('#sim-window-canvas').attr('width', w);
    $('#sim-window-canvas').attr('height', h-twH);
    
    if (cpuSimEditorCoordinates!==null)
        cpuSimEditorCoordinates.updateCanvasDim();
}

function setupCpuSimWindowResizeEvent()
{
    $(window).resize(function () {
        clearTimeout(CPU_SIM_WINDOW_RESIZE_TIMER);
        CPU_SIM_WINDOW_RESIZE_TIMER = setTimeout('cpuSimWindowResize();', CPU_SIM_WINDOW_RESIZE_DELAY);
    });
    cpuSimWindowResize();
}

function setupCpuSimWindowMouseEvents()
{
    var dragStartX = 0;
    var dragStartY = 0;
    var dragLeftStartX = 0;
    var dragLeftStartY = 0;
    var dragRightStartX = 0;
    var dragRightStartY = 0;
    var dragLeft = false;
    var dragRight = false;
    
    $('#sim-window-canvas').mousemove(function(e) {
        var x = e.pageX - $(this).offset().left;
        var y = e.pageY - $(this).offset().top;
        var canvasPixel = new Vector2d(x, y);
        var deltaX;
        var deltaY;
        var internalDelta = new Vector2d();
        var internalPixel = new Vector2d();
        
        internalPixel = cpuSimEditorCoordinates.toInternal(canvasPixel);
        $('#status-mouse-x').html(internalPixel.getFormatedX());
        $('#status-mouse-y').html(internalPixel.getFormatedY());
        
        cpuSimEditor.mouseMove(internalPixel);
        
        if (dragLeft) {
            deltaX = x - dragLeftStartX;
            deltaY = y - dragLeftStartY;
            
            internalDelta.setX( cpuSimEditorCoordinates.toInternalUnit(deltaX) );
            internalDelta.setY( cpuSimEditorCoordinates.toInternalUnit(deltaY) );

            if (deltaX!=0 || deltaY!=0) {
                dragLeftStartX = x;
                dragLeftStartY = y;
                cpuSimEditor.mouseDragLeft(internalDelta);
            }
        }
        if (dragRight) {
            deltaX = x - dragRightStartX;
            deltaY = y - dragRightStartY;
            
            internalDelta.setX( cpuSimEditorCoordinates.toInternalUnit(deltaX) );
            internalDelta.setY( cpuSimEditorCoordinates.toInternalUnit(deltaY) );

            if (deltaX!=0 || deltaY!=0) {
                dragRightStartX = x;
                dragRightStartY = y;
                cpuSimEditor.mouseDragRight(internalDelta);
            }
        }
       
        e.preventDefault();
    });
    
    $('#sim-window-canvas').mousedown(function(e) {
        var x = e.pageX - $(this).offset().left;
        var y = e.pageY - $(this).offset().top;

        dragStartX = x;
        dragStartY = y;
        switch (e.which) {
            case 1: dragLeft = true;
                    dragLeftStartX = x;
                    dragLeftStartY = y;
                    break;
            case 3: dragRight = true;
                    dragRightStartX = x;
                    dragRightStartY = y;
                    break;
        }
        
        e.preventDefault();
    });

    $('#sim-window-canvas').mouseup(function(e) {
        var x = e.pageX - $(this).offset().left;
        var y = e.pageY - $(this).offset().top;
        var canvasPixel = new Vector2d(x, y);
        var internalPixel = new Vector2d();
        var deltaX = x - dragStartX;
        var deltaY = y - dragStartY;
        
        internalPixel = cpuSimEditorCoordinates.toInternal(canvasPixel);        
        switch (e.which) {
            case 1: dragLeft = false;
                    if (Math.abs(deltaX)<2 && Math.abs(deltaY)<2) {
                        cpuSimEditor.mouseLeftClick(internalPixel);
                    }
                    break;
            case 3: dragRight = false;
                    if (Math.abs(deltaX)<2 && Math.abs(deltaY)<2) {
                        cpuSimEditor.mouseRightClick(internalPixel);
                    }
                    break;
        }
        
        e.preventDefault();
    });
    
    $('#sim-window-canvas').mousewheel(function(event, delta, deltaX, deltaY) {
        if (deltaY>0)
            cpuSimEditorCoordinates.zoomIn(); else
            cpuSimEditorCoordinates.zoomOut();
        $('#status-view-zoom').html( helperNumberFormat(cpuSimEditorCoordinates.getZoom(), 2, '.', ' ') );
        cpuSimEditor.zoomChanged();
        event.preventDefault();
    });
}




$(document).ready(function () {

    $(document).bind("contextmenu", function(e) {
        return false;
    }); 

    setupCpuSimWindowResizeEvent();
    setupCpuSimWindowMouseEvents();
    
    cpuSimEditorCoordinates = new CpuSimEditorCoordinates();
    cpuSimEditor = new CpuSimEditor();
    
    cpuSimEditorCoordinates.updateCanvasDim();
    $('#status-view-zoom').html( helperNumberFormat(cpuSimEditorCoordinates.getZoom(), 2, '.', ' ') );
    
    cpuSimEditor.redrawStart();
});

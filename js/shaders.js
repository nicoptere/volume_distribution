var shaders = function( exports ){

    var xhr, queue, callback;
    exports.load = function( list, cb ){

        queue = list;
        callback = cb;

        xhr = new XMLHttpRequest();
        xhr.onload = onLoad;
        loadNext();

    };

    function loadNext(){

        if( queue.length == 0 ){
            if( callback )callback();
            return;
        }

        xhr.open( "GET", queue[0].url );
        xhr.send();

    }

    function onLoad( e ){

        exports[ queue[0].name ] = e.target.responseText;
        queue.shift();
        loadNext();

    }

    return exports;

}({});
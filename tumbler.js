// ==UserScript==
// @name		tumblE(nhanced)r
// @version		0.1.10
// @include		*www.tumblr.com/dashboard*
// @grant		none
// @author      Colibri Shin
// @run-at		document-idle
// @require		https://ajax.googleapis.com/ajax/libs/jquery/1.4.0/jquery.min.js
// @require		https://raw.githubusercontent.com/gilmoreorless/jquery-nearest/master/src/jquery.nearest.min.js
// @require     http://danml.com/js/download.js
// @noframes
// ==/UserScript==

X = 0;
Y = 0;

isRightClicked = false;

// TODO : flexible menu edit

function loadXHR(url) {
    //from https://stackoverflow.com/questions/42471755/convert-image-into-blob-using-javascript
    return new Promise(function(resolve, reject) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.responseType = "blob";
            xhr.onerror = function() {reject("Network error.");};
            xhr.onload = function() {
                if (xhr.status === 200) {resolve(xhr.response);}
                else {reject("Loading error:" + xhr.statusText);}
            };
            xhr.send();
        }
        catch(err) {reject(err.message);}
    });
}

jQuery.fn.closestToOffset = function(offset) {
    // From https://stackoverflow.com/questions/2337630/find-html-element-nearest-to-position-relative-or-absolute
    var el = null, elOffset, x = offset.left, y = offset.top, distance, dx, dy, minDistance;
    this.each(function() {
        elOffset = $(this).offset();

        if (
        (x >= elOffset.left)  && (x <= elOffset.right) &&
        (y >= elOffset.top)   && (y <= elOffset.bottom)
        ) {
            el = $(this);
            return false;
        }

        var offsets = [[elOffset.left, elOffset.top], [elOffset.right, elOffset.top], [elOffset.left, elOffset.bottom], [elOffset.right, elOffset.bottom]];
        for (var off in offsets) {
            dx = offsets[off][0] - x;
            dy = offsets[off][1] - y;
            distance = Math.sqrt((dx*dx) + (dy*dy));
            if (minDistance === undefined || distance < minDistance) {
                minDistance = distance;
                el = $(this);
            }
        }
    });
    return el;
};

function get_image_link(){
    var isDefault = true;
	var lnk = $('.post_wrapper').closestToOffset({left: X, top: Y});
	
	var isPhotoSet = $(lnk).find('.photoset');
	if(isPhotoSet.length !== 0) {
		lnk = $(isPhotoSet).find('a').closestToOffset({left: X, top: Y});
		lnk = $(lnk[0]).attr('href');
		isDefault = false;
	}
	
	var isHighRes = $(lnk).find('.high_res_link');
	if(isHighRes.length !== 0) {
		lnk = $(isHighRes[0]).attr('data-big-photo');
		isDefault = false;
	}
	
	if(isDefault === true) {
		lnk = $('img').closestToOffset({left: X, top: Y})[0];
		lnk = $(lnk).attr('src');
    }
	
    return lnk;
}
	
function get_source(){
	if(isRightClicked) {
        var source = near_post[0].getElementsByClassName('post-source-link')[0];
		var postid = near_post[0].getElementsByClassName('post_permalink')[0];
        var written = near_post[0].getElementsByClassName('post_info_link')[0];
        
        if(source === undefined) source = "NA";
		
        else {
			var tmp = $(source).attr('data-peepr');
            if(tmp === undefined) {
                tmp = $(near_post[0].getElementsByClassName('post-source-link')[0]).attr('href').match(/\w+/g)[1];
                source = tmp;
            }
            else {
                tmp = JSON.parse(tmp);
                source = tmp.tumblelog;
            }
        }
		
		postid = $(postid).attr('id').match(/\d\w+/g)[0];
		written = JSON.parse($(written).attr('data-peepr')).tumblelog;
		
		return {
                source: source,
				postid: postid,
                written: written
        };
    }
}

function naming_center(cat, target){
    if(isRightClicked){
        var ret = "";
		
        var owner = target.src.source;
        var writtenby = target.src.written;
        var post_number = target.src.postid;
        var ext = target.link.match(/\w+/g).reverse()[0];
        
        
        ret = [cat, "_", owner, "_", writtenby, "_", post_number, ".",ext].join('');

        return ret;
    }
}

function img_download(cat) {
    if(isRightClicked){
         var tgt = post_naker();
         var name = naming_center(cat, tgt);
         var type = name.split('.').reverse()[0];
        
        loadXHR(tgt.link).then(function(blob){
            download(blob, name, type);
        });
        
    }
}


function post_naker() {
    near_post = $('.post_wrapper').closestToOffset({left: X, top: Y});

	var src = get_source();
 	var img = get_image_link();

	return {
		src: src,
		link: img
	};
}

function create_context(){
	var ndiv = document.createElement('div');
    ndiv.id = "cntnr";
    ndiv.style.display = "none";
    ndiv.style.position = "fixed";
    ndiv.style.border = "solid 1px #B2B2B2";
    ndiv.style.witdh = "150px";
    ndiv.style.background = "#F9F9F9";
    ndiv.style.boxShadow = "2px 2px 3px #E9E9E9";
    ndiv.style.borderRadius = "4px";
    
    var nul = document.createElement('ul');
    nul.id = "t_items";
    nul.style.listStyle = "none";
    nul.style.margin = "0px";
    nul.style.marginTop = "4px";
    nul.style.paddingLeft = "10px";
    nul.style.paddingRight = "10px";
    nul.style.paddingBotton = "3px";
    nul.style.fontSize = "17px";
    nul.style.color = "#333333";
    
    var nli = document.createElement('li');
    nli.textContent = "pony";
    
    nul.appendChild(nli);
    ndiv.appendChild(nul);
	
	document.body.appendChild(ndiv);
}

create_context();

$(document).bind("contextmenu", function(e){
    isRightClicked = true;
	e.preventDefault();
	X = e.pageX;
	Y = e.pageY;
	$("#cntnr").css("left", e.clientX);
	$("#cntnr").css("top",e.clientY);
	$("#cntnr").fadeIn(200, focusout());
	}
);

$("#t_items > li").click(function(){
    img_download($(this).text());
    isRightClicked = false;
});

function focusout(){
	$(document).bind("click", function(){
		$("#cntnr").hide();
		$(document).unbind("click");
	});
}
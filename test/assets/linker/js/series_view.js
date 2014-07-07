var startSimpleSlideshow = function (el) {
	var $parent = $(el).find(".thumbnails");
	clearInterval(window.slideshow);
	window.slideshow = setInterval(function () {
		var $shown = $parent.find(".video-thumbnail:not(.hidden)");
		var $next = $shown.next();
		console.log($shown.length, $next.length);
		if (!$next.length) {
			$next = $parent.find(".video-thumbnail").first();
		}
		$shown.addClass("hidden");
		$next.removeClass("hidden");
	}, 1500);
};
var stopSimpleSlideshow = function () {
	clearInterval(window.slideshow);
}

$(document).on("ready", function () {
	$(document).on("focus", ".video", function (e) {
		startSimpleSlideshow(e.currentTarget);
	});
	$(document).on("blur", ".video", function (e) {
		stopSimpleSlideshow();
	});
	$(document).on("mouseenter", ".video", function (e) {
		startSimpleSlideshow(e.currentTarget);
	});
	$(document).on("mouseleave", ".video", function (e) {
		stopSimpleSlideshow();
	});
});
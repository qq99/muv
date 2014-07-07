var startSimpleSlideshow = function (el) {
	var $parent = $(el).find(".thumbnails");
	console.log($parent, $parent[0])
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
		console.log("focused", e);
	});
	$(document).on("blur", ".video", function (e) {
		console.log("blur", e);
		stopSimpleSlideshow();
	});
	$(document).on("mouseenter", ".video", function (e) {
		console.log(e.target, e.currentTarget);
		startSimpleSlideshow(e.currentTarget);
		console.log("mouseenter", e);
	});
	$(document).on("mouseleave", ".video", function (e) {
		console.log("mouseleave", e);
		stopSimpleSlideshow();
	});
});
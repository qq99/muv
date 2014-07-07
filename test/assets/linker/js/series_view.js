var startSimpleSlideshow = function (el) {
	var $parent = $(el).find(".thumbnails");
	clearInterval(window.slideshow);
	window.slideshow = setInterval(function () {
		var $shown = $parent.find(".video-thumbnail:not(.hidden)");
		var $next = $shown.next();
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
	$(document).on("click", ".js-favourite-toggle", function (e) {
		$link = $(e.currentTarget);
		$icon = $link.find("i");
		if ($icon.hasClass('is-favourite')) {
			socket.delete($link.data("href"), function () {
				$icon.removeClass("is-favourite");
			});
		} else {
			socket.post($link.data("href"), function () {
				$icon.addClass("is-favourite");
			});
		}
	});
	$(".video:not(.has-thumbnails)").one("mouseenter", function (e) {
		var videoId = $(e.currentTarget).data("id");
		var $container = $(e.currentTarget).find(".thumbnails");

		socket.get("/videos/getThumbnails/" + videoId, function (response) {
			console.log('got ', response);
			for (var i = 0; i < response.length; i++) {
				var filename = response[i];
				var $img = $(".video-thumbnail").first().clone().attr("src", "/images/thumbs/" + filename).addClass("hidden");
				$container.append($img);
			}
		});
	});
});
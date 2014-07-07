$(document).on("ready", function() {
	var $video = $("video").first();
	var videoId = $video.attr("id");
	var url = "/videos/setLeftOffAt/" + videoId;
	var last_time = parseInt($video.data("resume-from"), 10);

	var setLeftOffAt = function (e) {
		socket.post(url, {
			left_off_at: e.currentTarget.currentTime
		});		
	}

	$video.on("timeupdate", _.debounce(setLeftOffAt, 250));

	$video.one("canplay", function (e) {
		console.log(e);
		if (last_time) {
			$video[0].currentTime = last_time;
		}
	});

	setTimeout(function () {
		$(".meta").addClass("hidden");
	}, 2000);
});
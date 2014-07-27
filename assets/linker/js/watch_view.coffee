$document = $(document)
$document.on "ready", ->
	$video = $("video").first()
	videoId = $video.attr("id")
	url = "/videos/setLeftOffAt/" + videoId
	last_time = parseInt($video.data("resume-from"), 10)

	setLeftOffAt = (e) ->
		socket.post url, left_off_at: e.currentTarget.currentTime

	$video.on "timeupdate", _.throttle(setLeftOffAt, 250)

	$video.one "canplay", (e) ->
		console.log(e);
		if last_time
			$video[0].currentTime = last_time;

	hideMeta = (ms = 2000) ->
		setTimeout ->
			$(".meta").addClass("hidden");
		, ms

	hideMeta()

	$document.on "keydown", ->
		$(".meta").removeClass("hidden");
		hideMeta(8000)

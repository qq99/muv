$document = $(document)
$document.on "ready", ->
	$video = $("video").first()
	videoId = $video.attr("id")
	url = "/videos/setLeftOffAt/" + videoId
	last_time = parseInt($video.data("resume-from"), 10)

	setLeftOffAt = (e) ->
		socket.post url, left_off_at: e.currentTarget.currentTime

	$video.on "timeupdate", _.debounce(setLeftOffAt, 250)

	$video.one "canplay", (e) ->
		console.log(e);
		if last_time
			$video[0].currentTime = last_time;

	setTimeout ->
		$(".meta").addClass("hidden");
	, 2000
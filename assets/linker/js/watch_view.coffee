$document = $(document)
$document.on "ready", ->
	$video = $("video").first()
	video = $video[0]
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

	showMeta = ->
		$(".meta").removeClass("hidden")
		hideMeta(8000)

	hideMeta()

	$document.on "keydown", (ev) ->
		console.log ev.keyCode
		switch ev.keyCode
			when 32 # space
				if video.paused
					video.play()
				else
					video.pause()

	$document.on "mousemove keydown", ->
		showMeta()
		return

	return

startSimpleSlideshow = (el) ->
  $parent = $(el).find(".thumbnails")
  clearInterval window.slideshow
  window.slideshow = setInterval ->
    $shown = $parent.find(".video-thumbnail:not(.hidden)")
    $next = $shown.next()
    if !$next.length
      $next = $parent.find(".video-thumbnail").first();
    $shown.addClass("hidden");
    $next.removeClass("hidden");
  , 1500

stopSimpleSlideshow = ->
  clearInterval(window.slideshow);

$document = $(document)

$document.on "ready", ->
  $document.on "focus", ".video", (e) ->
    startSimpleSlideshow(e.currentTarget)

  $document.on "blur", ".video", (e) ->
    stopSimpleSlideshow()

  $document.on "mouseenter", ".video", (e) ->
    startSimpleSlideshow(e.currentTarget)

  $document.on "mouseleave", ".video", (e) ->
    stopSimpleSlideshow();

  $document.on "click", ".js-favourite-toggle", (e) ->
    e.preventDefault()
    $link = $(e.currentTarget)
    $icon = $link.find("i")
    if $icon.hasClass 'is-favourite'
      io.socket.delete $link.data("href"), ->
        $icon.removeClass("is-favourite")
        $icon.removeClass("fa-heart").addClass("fa-heart-o")
    else
      io.socket.post $link.data("href"), ->
        $icon.addClass("is-favourite")
        $icon.removeClass("fa-heart-o").addClass("fa-heart")

  $(".video:not(.has-thumbnails)").one "mouseenter", (e) ->
    videoId = $(e.currentTarget).data("id")
    $container = $(e.currentTarget).find(".thumbnails")

    io.socket.get "/videos/getThumbnails/#{videoId}", (response) ->
      for filename in response
        $img = $(".video-thumbnail").first().clone()
          .attr("src", "/videos/thumb/#{filename}")
          .addClass("hidden")
        $container.append $img

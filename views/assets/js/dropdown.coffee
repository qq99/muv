$(document).ready ->
  $(".dropdown-trigger").click (ev) ->
    $(ev.currentTarget).parents(".dropdown").find(".dropdown-options").toggle()

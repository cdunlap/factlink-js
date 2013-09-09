class FACTLINK.Balloon
  constructor: (fact) ->
    @_fact = fact

    @$el = $(FACTLINK.templates.indicator)
    @$el.appendTo(FACTLINK.el)
    @$el.bind "mouseenter", => @_fact.focus()
    @$el.bind "mouseleave", => @_fact.blur()
    @$el.bind "click", => @_fact.click()

  _hideAll: ->
    @$el.closest("#fl").find(".fl-popup").hide()

  show: (top, left, fast) ->
    window.clearTimeout @_mouseOutTimeoutID
    if fast
      @_hideAll()
      @$el.show()
    else
      @_mouseOutTimeoutID = window.setTimeout (=> @_hideAll(); @$el.fadeIn "fast"), 200

    FACTLINK.set_position_of_element top, left, window, @$el

  hide: (callback) ->
    window.clearTimeout @_mouseOutTimeoutID
    @$el.fadeOut "fast", callback
    @_fact.stopHighlighting()

  isVisible: ->
    @$el.is ":visible"

  destroy: ->
    @$el.remove()

  startLoading: ->
    @_loading = true
    @_loadingTimeoutID = setTimeout (=> @stopLoading()), 17000
    @$el.addClass "fl-loading"

  stopLoading: ->
    window.clearTimeout @_loadingTimeoutID
    @_loading = false
    @hide => @$el.removeClass "fl-loading"

  loading: -> !!@_loading

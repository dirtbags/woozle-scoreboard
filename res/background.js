chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('res/scoreboard.html', {
		"bounds": {
			"height": 100,
			"width": 450
		}
	})
})

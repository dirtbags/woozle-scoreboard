chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('res/scoreboard.html', {
		'state': 'fullscreen'
	})
})

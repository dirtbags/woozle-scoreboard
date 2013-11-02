chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('../scoreboard.html', {
		//'state': 'fullscreen'
	})
})

var advert_num = 100
var advert_itimer

function adverterror() {
	if (advert_num > 1) {
		advert_num = 1
		rotate_advert()
	} else {
		var e = document.getElementById("advert")
		clearInterval(advert_itimer)
		e.style.visibility = "hidden"
	}
}

function rotate_advert() {
	var e = document.getElementById("advert")
	var sn
	
	if (advert_num < 10) {
		sn = "0" + advert_num
	} else {
		sn = advert_num
	}
	
	e.src = "ads/ad" + sn + ".jpg"
	
	advert_num = advert_num + 1
}

advert_itimer = setInterval(rotate_advert, 15000)

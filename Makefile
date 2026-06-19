.PHONY: apk
apk:
	npx cap sync android
	cd android && ./gradlew assembleDebug

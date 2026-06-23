.PHONY: apk windows macos
apk:
	npx cap sync android
	cd android && ./gradlew assembleDebug

macos:
	bun run tauri build

windows:
	bun run tauri build --target x86_64-pc-windows-msvc

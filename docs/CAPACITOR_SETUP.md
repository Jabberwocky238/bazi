# Capacitor 移动端打包指南

## 前置要求

- Node.js 18+
- Xcode 15+ (iOS, 需要 macOS)
- Android Studio Hedgehog | 2023.1.1+ (Android)

## 首次配置

1. 安装依赖：
```bash
bun install
```

2. 构建项目并同步到原生平台：
```bash
# iOS
npm run cap:build:ios

# Android
npm run cap:build:android
```

## 常用命令

```bash
# 同步 Web 代码到原生平台（每次 build 后运行）
npm run cap:sync

# 打开 Xcode
npm run cap:open:ios

# 打开 Android Studio
npm run cap:open:android

# 完整构建流程 - iOS
npm run build && npm run cap:sync ios && npm run cap:open:ios

# 完整构建流程 - Android
npm run build && npm run cap:sync android && npm run cap:open:android
```

## 项目配置

- **App ID**: `com.ultimatebazi.app`
- **App 名称**: 八字补完计划
- **Web 资源目录**: `dist/`

## 注意事项

1. **首次运行**：需要先运行 `bun install` 安装依赖
2. **iOS 开发**：需要配置开发者账号才能真机调试和发布
3. **Android 开发**：需要配置签名密钥才能构建 release 版本
4. **热更新**：开发时可以继续用 `npm run react:dev`，原生 App 需要重新 build

## 添加原生插件

```bash
npm install @capacitor/plugin-name
npx cap sync
```

## 文档

- [Capacitor 官方文档](https://capacitorjs.com/docs)

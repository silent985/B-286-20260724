# Monaco Editor App

这是一个基于 **Electron**、**Vue 3**、**Vite** 和 **Monaco Editor** 开发的轻量级代码编辑器。

采用了 **Element Plus** 的暗黑主题，设计风格参考 VSCode，追求紧凑、现代和高性能。

## ✨ 特性

- **Electron & Vite**: 极速的开发体验和构建流程。
- **Monaco Editor**: 提供 VSCode 同款的强大编辑体验（语法高亮、IntelliSense 等）。
- **Element Plus**: 现代化 UI 组件库，已深度定制为紧凑的暗黑风格。
- **TypeScript**: 全栈 TypeScript 支持。

## 🛠️ 安装与运行

### 环境要求

- Node.js (推荐 v16+)

### 开发

1.  安装依赖：
    ```bash
    npm install
    ```

2.  启动开发服务器（包含 Electron 窗口）：
    ```bash
    npm run dev
    ```

### 构建

打包生产环境应用（支持 Windows, macOS, Linux）：

```bash
npm run build
```

构建产物将位于 `release` 目录中。

## 📁 目录结构

```
monaco-editor-app/
├── electron/
│   ├── main.ts             # Electron 主进程入口
│   └── preload.ts          # 预加载脚本 (ContextBridge)
├── src/
│   ├── components/
│   │   └── CodeEditor.vue  # Monaco Editor 封装组件
│   ├── App.vue             # 应用主组件 (布局、文件树、标签页)
│   ├── main.ts             # Vue 入口 (Element Plus 引入)
│   ├── monaco-workers.ts   # Monaco Worker 配置文件
│   ├── style.css           # 全局样式 & Element Plus 样式覆盖
│   └── vite-env.d.ts       # TypeScript 类型定义
├── dist-electron/          # Electron 编译产物 (自动生成)
├── release/                # 应用打包产物 (自动生成)
├── index.html              # Vue 应用 HTML 入口
├── package.json            # 项目依赖与脚本
├── tsconfig.json           # TypeScript 配置
└── vite.config.ts          # Vite 配置 (含 Electron 插件)
```

## 📝 待办事项

- [ ] 实现文件系统读写 (Node.js fs)
- [ ] 自定义标题栏
- [ ] 更多编辑器扩展功能

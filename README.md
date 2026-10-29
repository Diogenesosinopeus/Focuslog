# Focuslog

Focuslog 是一个本地优先的专注计时与时间记录工具。它使用自由正计时，不限制专注时长，并将记录、每日备注和待办清单保存在电脑本地。

## 功能

- 自由正计时，结束后自动保存时间段
- Windows 锁屏时中断并保存，最小化时继续计时
- 日、周、月与累计专注统计
- 活动热力图和完整历史记录
- 修改或二次确认删除时间段
- 待办清单、完成归档和按完成日期分组
- Obsidian Markdown 导出
- 同一台电脑上的多浏览器数据同步
- 写入前自动生成本地数据备份

## 运行要求

- Windows 10/11
- Node.js 18 或更高版本

## 启动

在 Windows 中双击：

```text
启动专注度计时.cmd
```

或在项目目录运行：

```bash
npm start
```

然后访问：

```text
http://127.0.0.1:4173
```

请保持服务窗口运行。直接打开 `index.html` 只能使用浏览器自己的本地存储，无法使用完整的跨浏览器同步和 Windows 锁屏检测。

## 本地数据

运行后，Focuslog 会在项目目录创建以下文件：

- `focuslog-data.json`：记录、备注和待办
- `focuslog-data.backup.json`：最近一次写入前的自动备份
- `focuslog-status.json`：Windows 锁屏状态

这些文件已加入 `.gitignore`，不会被提交到 GitHub。仓库中的 `focuslog-data.example.json` 仅用于展示数据结构。

## 项目结构

```text
Focuslog/
├─ index.html                 # 页面结构
├─ styles.css                # 界面样式
├─ app.js                    # 计时、统计和交互逻辑
├─ server.js                 # 本地服务与数据同步
├─ lock-monitor.ps1          # Windows 锁屏监听
├─ 启动专注度计时.cmd        # Windows 启动入口
├─ focuslog-data.example.json
└─ package.json
```

## 隐私

Focuslog 不需要账号，也不会将专注数据上传到第三方服务器。所有数据默认保存在本机。

## License

[MIT](LICENSE)


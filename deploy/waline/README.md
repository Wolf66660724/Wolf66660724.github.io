# Waline 评论系统自建说明

## 组成

| 项 | 值 |
|---|---|
| 容器 | `waline`（镜像 `waline-patched:1.41.6`） |
| 存储 | SQLite，`/opt/security-platform/waline/data/waline.sqlite` |
| 数据目录 | `/opt/security-platform/waline/data` |
| 访问入口 | `https://worldpeace.top/comment/`（nginx `^~ /comment/` 反代到 `waline:8360`） |
| 管理后台 | `https://worldpeace.top/comment/ui` |
| 备份 | `/opt/security-platform/waline/backup.sh`，cron 每天 04:20，保留 14 天 |

## 为什么要自己构建镜像

官方镜像（`lizheming/waline`）基于 Node 24，但其依赖 `think-model-sqlite`
自带一份**嵌套的** `better-sqlite3 11.10.0`。该版本在 Node 24 下会在销毁
Statement 时触发原生断言崩溃：

```
Assertion failed: (env) != nullptr
node::RemoveEnvironmentCleanupHook(...)
Statement::~Statement() [/app/node_modules/think-model-sqlite/node_modules/better-sqlite3/...]
```

症状：**只有在该页面存在评论时接口才返回 502**（因为只有在有评论时
才会执行「查询回复」的语句），日志里能看到 worker 崩溃重启。

`Dockerfile` 的处理：升级到支持 Node 24 的 `better-sqlite3@12`，
并删除嵌套副本，让模块解析到顶层那份。构建时会自检版本。

## 重建步骤

```bash
cd /opt/security-platform/waline/build
sudo docker build -t waline-patched:1.41.6 .
cd /opt/security-platform
sudo docker compose up -d --force-recreate waline
```

## 数据库表结构

Waline **不会自动建表**。SQLite 用的是官方预建库文件
`walinejs/waline` 仓库的 `assets/waline.sqlite`，包含三张表：
`wl_Comment` / `wl_Counter` / `wl_Users`。

## 迁移历史评论

原 LiveRe 评论已迁入（脚本思路：调用 `api.livere.org/api/v2/comments`
并带 `X-livere-client` 头，再映射到 `wl_Comment`）。迁移前建议先备份数据库。
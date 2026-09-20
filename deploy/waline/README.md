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
## nginx 需要两条代理（重要）

Waline 挂在子路径 `/comment/`，但**它的管理后台不会识别子路径** ——
在 `/ui` 里做任何操作（注册、登录、改设置）时，请求会发到站点根路径
`/api/...`，而不是 `/comment/api/...`，结果是 404。

所以 nginx 里必须同时配两条：

```nginx
# 管理后台用的根路径 API
location ^~ /api/ {
    proxy_pass http://waline:8360/api/;
    # ... 代理头
}

# 前台评论 + 管理界面本体
location ^~ /comment/ {
    proxy_pass http://waline:8360/;
    # ... 代理头
}
```

用 `^~` 是为了优先于博客的静态资源正则 location（`\.(css|js|...)$`）。

## 管理员账号

第一个注册的用户会被提升为管理员。**注意**：如果直接向 `/api/user`
发空请求测试，也会创建一个没有邮箱的「管理员」占位账号，导致
真正注册的用户变成普通用户（guest）。遇到这种情况：

```js
// 删除无邮箱账号
DELETE FROM wl_Users WHERE email IS NULL OR email = '';
// 把有邮箱的账号提为管理员
UPDATE wl_Users SET type = 'administrator' WHERE email != '';
```

# 内容服务（拾光集 / 灵感集 后台）

给博客加的一个轻量内容后台。在网页上填表就能增删「拾光集」的照片和「灵感集」的条目，
不用改代码、不用重新构建部署。

## 用起来是怎样的

1. 打开 https://worldpeace.top/manage/
2. 输入管理密码登录
3. 选「📸 拾光集」或「✨ 灵感集」→ 点「+ 新增」→ 填表 → 保存
4. 刷新 https://worldpeace.top/photos/ 或 /shares/ 就能看到

照片支持拖拽上传图片（jpg / png / webp / gif / avif，单张 ≤ 8MB）。
灵感集支持填分类、日期、标题、描述、外链。

## 结构

| 文件 | 作用 |
| --- | --- |
| `server.js` | 服务本体。零 npm 依赖，只用 Node 内置模块 |
| `admin.html` | 管理页（单文件，含样式和逻辑） |
| `Dockerfile` | 镜像定义（node:22-alpine） |
| `seed.json` | 初始数据，第一次部署时导入 |

## 数据放在哪

服务器上 `/opt/security-platform/content-data/`：

```
photos.json     拾光集数据
shares.json     灵感集数据
uploads/        上传的图片（按内容哈希命名，同图不会重复占空间）
```

写入用「临时文件 + rename」，避免写一半断电导致 JSON 损坏。

## 接口

公开（只读，允许跨域，博客前端用）：

```
GET /content-api/photos       # nginx → /api/public/photos
GET /content-api/shares
GET /content-img/<file>       # nginx → /uploads/<file>
```

后台（需要 `Authorization: Bearer <token>`）：

```
POST   /manage/api/login                  {"password":"..."} → {token}
GET    /manage/api/items/photos|shares
POST   /manage/api/items/photos|shares
PUT    /manage/api/items/photos|shares/<id>
DELETE /manage/api/items/photos|shares/<id>
POST   /manage/api/upload                 {"filename":"x.jpg","data":"data:image/jpeg;base64,..."}
```

## 安全措施

- 密码登录；token 用 HMAC 签名、7 天过期，服务端不存会话
- 登录失败限流：同一 IP 10 分钟内失败 8 次后拒绝
- 上传校验 MIME + 文件魔数，只允许 5 种图片格式
- 上传文件名按内容哈希生成，不接受客户端指定的路径
- 字段全部做长度截断和 URL 协议白名单，避免被注入奇怪内容
- 写接口不开 CORS，只能从同源后台调用
- 容器 `no-new-privileges`，内存 200m / CPU 0.3 限额

## 重新部署

改完 `server.js` 或 `admin.html` 之后：

```powershell
# 上传 + 重建镜像 + 重启容器
scp -i $key deploy/content-service/server.js `
    deploy/content-service/admin.html `
    deploy/content-service/Dockerfile `
    ubuntu@43.153.19.168:/opt/security-platform/content-service/

ssh -i $key ubuntu@43.153.19.168 `
  "cd /opt/security-platform/content-service && sudo docker build -t content-service:1.0 . && cd /opt/security-platform && sudo docker compose up -d content-service"
```

## 两个坑（部署时踩过）

1. **改 nginx 配置不能用 `mv`。** `blog.conf` 是**按文件**挂载进容器的，
   `mv` 会换掉 inode，容器里的还是旧文件。要么 `cat 新文件 > 老文件`，要么改完
   重启 `blog-nginx` 容器让它重新解析挂载。
2. **密码和 token 密钥在 `compose.yaml` 的 `content-service.environment` 里**，
   改完要 `docker compose up -d content-service` 才会生效。

## 备份

数据都在 `/opt/security-platform/content-data/`，直接打包这个目录即可：

```bash
sudo tar czf ~/content-data-$(date +%F).tar.gz -C /opt/security-platform content-data
```
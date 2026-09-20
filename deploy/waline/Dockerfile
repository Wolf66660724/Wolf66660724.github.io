FROM lizheming/waline:1.41.6

# 为什么需要这个补丁：
#   官方 Waline 镜像基于 Node 24，但 think-model-sqlite 自带了嵌套的
#   better-sqlite3 11.10.0。该版本在 Node 24 下存在原生层缺陷——
#   销毁 Statement 时会触发 node::RemoveEnvironmentCleanupHook 断言，
#   导致整个 worker 进程崩溃（表现为接口 502，且只在「有评论」时触发，
#   因为那时才会执行查回复的语句）。
#
#   处理办法：升级到支持 Node 24 的 better-sqlite3 12.x，
#   并删掉嵌套副本，让 require 沿着目录向上解析到顶层那份。
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

RUN rm -rf /app/node_modules/better-sqlite3 \
           /app/node_modules/think-model-sqlite/node_modules/better-sqlite3

RUN cd /app && npm install better-sqlite3@12.4.1 --no-save --no-audit --no-fund

# 关键一步：npm 会把嵌套副本装回来，必须再删一次
RUN rm -rf /app/node_modules/think-model-sqlite/node_modules/better-sqlite3

# 构建期自检：确认解析到的是 12.x
RUN node -e "const p=require.resolve('better-sqlite3/package.json',{paths:['/app/node_modules/think-model-sqlite']}); console.log('解析到 =', p); console.log('版本 =', require(p).version)"
# 博客内容服务：零 npm 依赖，直接跑单文件 Node 服务
FROM node:22-alpine

WORKDIR /app
COPY server.js admin.html ./

ENV PORT=8790 \
    DATA_DIR=/data

RUN mkdir -p /data/uploads && chown -R node:node /data /app

USER node
EXPOSE 8790

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=5s \
  CMD node -e "require('http').get('http://127.0.0.1:8790/api/public/photos',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
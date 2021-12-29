FROM node:12 as base
# 设置工作目录，对RUN,CMD,ENTRYPOINT,COPY,ADD生效。如果不存在则会创建，也可以设置多次。
# 在一台机器中，用这个镜像创建一个容器时，相对于这台机器的根目录下面的src文件夹
WORKDIR /mri-backend
# 需要package.json 告诉程序运行需要安装的依赖。所以拷贝了package.json和package-lock.json到工作目录
COPY package*.json ./
# EXPOSE用来指定端口，使容器内的应用可以通过端口和外界交互
# 但是EXPOSE并不会使容器访问主机的端口
# 如果想使得容器与主机的端口有映射关系，必须在容器启动的时候加上 -P参数 
# 语法：EXPOSE <port>/<tcp/udp>
EXPOSE 4000

# 这一步和第一步很像，从base镜像创建一个开发环境的镜像
FROM base as dev
# ENV命令用于设置环境变量。这些变量以”key=value”的形式存在，并可以在容器内被脚本或者程序调用。
# 设置development 环境
ENV NODE_ENV=development
# RUN指令在构建时将会生成一个新的镜像层，并且执行RUN指令后面的内容
RUN npm install
# COPY 命令 指从外部往容器内添加文件。但是COPY指令只支持基本的文件和文件夹拷贝功能
COPY . .
# 和RUN命令相似，CMD可以用于执行特定的命令。
# 和RUN不同的是，这些命令不是在镜像构建的过程中执行的，而是在用镜像构建容器后被调用
CMD ["npm", "run", "dev"]

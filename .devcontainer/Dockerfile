FROM mcr.microsoft.com/devcontainers/javascript-node:22

# Create vscode user for DevPod
RUN useradd -m -u 1001 -s /bin/bash vscode \
    && echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Install pnpm globally
RUN npm install -g pnpm --prefix=/usr/local
# RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

# Install build tools for esbuild
RUN apt-get update && apt-get install -y build-essential git

# Set workspace folder permissions
RUN mkdir -p /workspaces && chown -R vscode:vscode /workspaces

USER vscode
WORKDIR /workspaces

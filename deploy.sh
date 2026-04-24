#!/bin/sh
set -e
ssh deploy@95.217.14.50 "cd ~/blocks-app && git pull && ~/.local/share/pnpm/pnpm install && ~/.local/share/pnpm/pnpm build && pm2 reload ecosystem.config.cjs --update-env"

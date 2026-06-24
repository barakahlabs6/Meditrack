#!/bin/bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use v22.20.0
cd /home/alexis/portfolio-app/apps/api
export $(grep -v '^#' .env | xargs)
exec /home/alexis/.nvm/versions/node/v22.20.0/bin/tsx watch src/index.ts

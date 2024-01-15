FROM apify/actor-node-playwright-chrome:16

# copy only necessary files
COPY ./package*.json ./
COPY ./dist ./dist
COPY ./.actor ./.actor

# install only prod deps
RUN npm --quiet set progress=false \
    && npm install --only=prod --no-optional \
    && echo "Installed NPM packages:" \
    && (npm list --only=prod --no-optional --all || true) \
    && echo "Node.js version:" \
    && node --version \
    && echo "NPM version:" \
    && npm --version

# run compiled code
#CMD npm run start:prod --silent
CMD ./start_xvfb_and_run_cmd.sh && npm run start:prod --silent

FROM node:18-alpine

RUN apk add --no-cache aws-cli

RUN aws --version   


# Install Terraform
ENV TERRAFORM_VERSION=1.7.2
RUN wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip && \
    unzip terraform_${TERRAFORM_VERSION}_linux_amd64.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform_${TERRAFORM_VERSION}_linux_amd64.zip && \
    terraform -version

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available) for reproducible builds
COPY package*.json ./

RUN npm install --legacy-peer-deps 
RUN npm install -g @nestjs/cli --legacy-peer-deps 



# Install production dependencies and clean npm cache to reduce image size
RUN npm ci --production  --legacy-peer-deps  && npm cache clean --force

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Run as non-root user for security
#RUN addgroup -S appgroup && adduser -S appuser -G appgroup
#USER appuser

# Expose port
EXPOSE 3034

# Start the application
CMD ["node", "dist/main.js"]

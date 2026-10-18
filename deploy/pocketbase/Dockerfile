FROM alpine:3.21

# Official v0.40.4 checksums.txt line for pocketbase_0.40.4_linux_amd64.zip.
ARG PB_VERSION=0.40.4
ARG PB_SHA256=9042ec818570e79c3628dadcd0a756c1496d9e1173918ec409d133c02f82e5fa

RUN apk add --no-cache ca-certificates curl unzip tzdata \
  && curl -fsSL -o /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
  && printf '%s  %s\n' "${PB_SHA256}" /tmp/pb.zip | sha256sum -c - \
  && unzip /tmp/pb.zip -d /pb \
  && chmod +x /pb/pocketbase \
  && rm /tmp/pb.zip

WORKDIR /pb

EXPOSE 8090

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--hooksDir=/pb/pb_hooks", "--migrationsDir=/pb/pb_migrations"]

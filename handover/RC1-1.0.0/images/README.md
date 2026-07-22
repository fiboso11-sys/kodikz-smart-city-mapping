# Offline / registry images

Place the offline bundle here after building on a Docker build host:

```text
images/kodikz-rc1-1.0.0-rc1-images.tar
images/kodikz-rc1-1.0.0-rc1-images.tar.sha256
images/IMAGE-IDENTITY.txt
images/DEPLOYED-DIGESTS.txt   # written by deploy.sh
images/known-good/            # retained across updates
```

**Status on packaging host without Docker:** image creation is  
**REQUIRES DOCKER BUILD HOST**.

Do not use `:latest` tags for app or worker images.

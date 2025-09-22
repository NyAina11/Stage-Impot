# Application de Suivi des Contributions Fiscales (ASCF)

This is an internal web application to register, track, and archive the tax payment process.

## Deployment with Docker

This application is configured to run inside a Docker container using Nginx to serve the static files.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine.
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop).

### How to Run

1.  **Build and run the container using Docker Compose:**

    Open your terminal in the project's root directory (where `docker-compose.yml` is located) and run the following command:

    ```bash
    docker-compose up -d
    ```

    This command will:
    - Build the Docker image based on the `Dockerfile`.
    - Create and start a container in detached mode (`-d`).

2.  **Access the application:**

    Once the container is running, open your web browser and navigate to:
    [http://localhost:8080](http://localhost:8080)

### How to Stop

To stop the application, run the following command in the same directory:

```bash
docker-compose down
```

This will stop and remove the container.

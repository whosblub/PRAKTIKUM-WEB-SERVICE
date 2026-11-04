# Diagram Arsitektur Toko (Lab 10: ditambah RabbitMQ)

```mermaid
flowchart LR
    K[Klien] --> G[gateway :8080]
    G -->|/product-service/*| P[product-service :3000<br/>data: products]
    G -->|/order-service/*| O[order-service :3001<br/>data: orders]
    O -->|HTTP POST /products/:id/reserve<br/>sinkron, timeout 2 detik| P
    O -.->|publish order.created<br/>asinkron, persistent| X{{exchange orders<br/>fanout, durable}}
    subgraph MQ["RabbitMQ :5672"]
      X --> Q1[notification-queue]
      X --> Q2[audit-queue<br/>opsional]
    end
    Q1 -.->|consume + ack| N[notification-service<br/>kirim email]
    Q2 -.->|consume + ack| A[audit-service<br/>opsional]
```

Garis penuh = panggilan sinkron (HTTP). Garis putus-putus = komunikasi asinkron lewat RabbitMQ. order-service tidak tahu siapa yang mendengarkan dan tidak menunggu consumer.

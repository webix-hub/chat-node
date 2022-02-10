const config = {
  server: {
    port: 8042,
    public: "http://localhost:8042",
    data: "./storage",
    jwtsecret: "asdfl9cqdfafds4a3ds29878f2",
  },
  db: {
    database: "users",
    path: "./db.sqlite",
    seed: true,
    reset: true,
  },
  features: {
    reactions: true,
    files: true,
  },
};

module.exports = config;

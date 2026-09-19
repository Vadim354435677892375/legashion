// Минимальная in-memory имитация PrismaClient — ровно те методы, что вызывает код под тестом.
// Нужна, чтобы гонять HTTP-тесты без настоящей БД.
export function createFakePrisma() {
  const db = { admins: [], attempts: [], products: [], orders: [], nextId: 1 };
  const id = () => db.nextId++;

  return {
    _db: db,

    admin: {
      findUnique: async ({ where }) => db.admins.find((a) => a.id === where.id) ?? null,
      findFirst: async ({ where }) => {
        const wanted = where.email.equals.toLowerCase();
        return db.admins.find((a) => a.email.toLowerCase() === wanted) ?? null;
      },
    },

    loginAttempt: {
      count: async ({ where }) =>
        db.attempts.filter(
          (a) =>
            (where.ip === undefined || a.ip === where.ip) &&
            (where.email === undefined || a.email === where.email) &&
            (!where.createdAt?.gte || a.createdAt >= where.createdAt.gte)
        ).length,
      create: async ({ data }) => {
        db.attempts.push({ id: id(), createdAt: new Date(), ...data });
      },
      deleteMany: async ({ where }) => {
        db.attempts = db.attempts.filter((a) => {
          if (where.email !== undefined) return a.email !== where.email;
          if (where.createdAt?.lt) return !(a.createdAt < where.createdAt.lt);
          return true;
        });
      },
    },

    product: {
      findMany: async ({ where }) =>
        db.products.filter(
          (p) => where.id.in.includes(p.id) && (where.isActive === undefined || p.isActive === where.isActive)
        ),
    },

    order: {
      create: async ({ data }) => {
        const order = {
          id: id(),
          ...data,
          status: 'NEW',
          createdAt: new Date(),
          items: data.items.create.map((i) => ({ id: id(), ...i })),
        };
        db.orders.push(order);
        return order;
      },
    },
  };
}
